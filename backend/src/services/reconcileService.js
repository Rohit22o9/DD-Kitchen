/**
 * Bank statement import. Staff export transactions from internet banking
 * (CSV — NAB, CBA, Westpac, ANZ and most others) and upload them here. Each
 * credit whose description contains a booking reference (DD-BK-… / DD-ST-…) or
 * invoice number is matched to the open invoice; exact amounts can be recorded
 * as paid in one step. Anything unclear is listed for a human to check.
 */
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const StorageBooking = require('../models/StorageBooking');
const Invoice = require('../models/Invoice');
const bookingService = require('./bookingService');
const storageService = require('./storageService');
const outbox = require('./outboxService');
const { bookingRow, storageRow } = require('./syncPayloads');
const { toCents, toDollars } = require('../utils/money');
const { badRequest } = require('../utils/httpError');

const REF_RE = /DD-(BK|ST)-?([2-9A-HJ-NP-Z]{8})/i;
const INV_RE = /INV-?(\d{4})-?(\d{5})/i;
const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

/** Minimal RFC 4180 CSV parser (quotes, escaped quotes, commas in fields). */
const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((f) => f.trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== '')) rows.push(row);
  return rows.map((r) => r.map((f) => f.trim()));
};

const parseDate = (s) => {
  const v = String(s || '').trim();
  let m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/); // Australian banks: day first
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  m = v.match(/^(\d{1,2})\s+([A-Za-z]{3})[A-Za-z]*\s+(\d{2,4})$/);
  if (m && MONTHS[m[2].toLowerCase()]) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${y}-${String(MONTHS[m[2].toLowerCase()]).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return null;
};

const parseAmount = (s) => {
  const v = String(s || '').replace(/[$,\s]/g, '');
  if (!/^[+-]?\d+(\.\d{1,2})?$/.test(v)) return null;
  return Number(v);
};

/** Turn CSV rows into { date, amount, description } credits. Works with or without a header row. */
const toTransactions = (rows) => {
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.toLowerCase());
  const hasHeader = header.some((h) => /date|amount|credit|description|narrative|details|particulars/.test(h)) && !parseDate(rows[0][0]);
  const find = (re) => header.findIndex((h) => re.test(h));
  const idx = hasHeader
    ? {
        date: find(/date/),
        credit: find(/^credit|deposit|money in|credit amount/),
        amount: find(/^amount$|amount/),
        desc: [find(/description|narrative|details|particulars|transaction details/), find(/reference|merchant/)].filter((i) => i >= 0),
      }
    : null;

  return rows.slice(hasHeader ? 1 : 0).map((r, i) => {
    let date;
    let amount;
    let description;
    if (idx) {
      date = parseDate(r[idx.date]);
      amount = idx.credit >= 0 && parseAmount(r[idx.credit]) !== null ? parseAmount(r[idx.credit]) : parseAmount(r[idx.amount]);
      description = idx.desc.map((d) => r[d]).filter(Boolean).join(' ');
      if (!description) description = r.filter((f) => parseAmount(f) === null && !parseDate(f)).join(' ');
    } else {
      date = r.map(parseDate).find(Boolean) || null;
      amount = r.map(parseAmount).find((a) => a !== null) ?? null;
      description = r.filter((f) => parseAmount(f) === null && !parseDate(f)).join(' ');
    }
    return { line: i + 1 + (hasHeader ? 1 : 0), date, amount, description: description.slice(0, 200) };
  });
};

const reconcile = async (admin, { csv, apply }) => {
  if (!csv || csv.length > 2_000_000) throw badRequest('Upload a CSV export of your bank transactions (max 2 MB).');
  const txns = toTransactions(parseCsv(csv)).filter((t) => t.amount !== null && t.amount > 0);
  if (!txns.length) throw badRequest('No incoming payments found in that file. Export transactions as CSV from internet banking.');

  const results = [];
  for (const t of txns) {
    const r = { ...t, status: 'unmatched', reference: null, invoice_number: null, expected: null };
    const ref = t.description.match(REF_RE);
    const invRef = t.description.match(INV_RE);
    let target = null;
    if (ref) {
      r.reference = `DD-${ref[1].toUpperCase()}-${ref[2].toUpperCase()}`;
      const Model = ref[1].toUpperCase() === 'BK' ? Booking : StorageBooking;
      target = { kind: ref[1].toUpperCase(), doc: await Model.findOne({ reference_code: r.reference }) };
    } else if (invRef) {
      r.invoice_number = `INV-${invRef[1]}-${invRef[2]}`;
      const inv = await Invoice.findOne({ invoice_number: r.invoice_number });
      if (inv?.booking) target = { kind: 'BK', doc: await Booking.findById(inv.booking) };
      else if (inv?.storage_booking) target = { kind: 'ST', doc: await StorageBooking.findById(inv.storage_booking) };
      else if (inv) r.status = inv.status === 'paid' ? 'already_paid' : 'needs_review';
    }

    if (target && !target.doc) r.status = 'unknown_reference';
    if (target?.doc) {
      const d = target.doc;
      r.reference = d.reference_code;
      const expected = d.total_cents + d.security_deposit_cents;
      r.expected = toDollars(expected);
      if (d.payment_status === 'paid') r.status = 'already_paid';
      else if (!['pending', 'approved', 'confirmed'].includes(d.status)) r.status = `booking_${d.status}`;
      else if (toCents(t.amount) !== expected) r.status = 'amount_mismatch';
      else r.status = 'match';

      if (apply && r.status === 'match') {
        const paymentRef = `Bank ${t.date || ''} ${t.description}`.trim().slice(0, 120);
        await mongoose.connection.transaction(async (session) => {
          const Model = target.kind === 'BK' ? Booking : StorageBooking;
          const fresh = await Model.findById(d._id).select('+access_code').session(session);
          if (fresh.payment_status === 'paid') return;
          if (target.kind === 'BK') {
            await bookingService.applyPayment(fresh, { method: 'Bank transfer (statement import)', reference: paymentRef }, admin, session);
            await fresh.save({ session });
            await outbox.enqueue('upsert_booking', { row: bookingRow(fresh) }, session);
          } else {
            await storageService.applyStoragePayment(fresh, { method: 'Bank transfer (statement import)', reference: paymentRef }, admin, session);
            await fresh.save({ session });
            await outbox.enqueue('upsert_storage', { row: storageRow(fresh) }, session);
          }
        });
        r.status = 'recorded';
      }
    }
    results.push(r);
  }

  const count = (s) => results.filter((x) => x.status === s).length;
  return {
    applied: Boolean(apply),
    summary: {
      credits: results.length,
      matched: count('match'),
      recorded: count('recorded'),
      already_paid: count('already_paid'),
      amount_mismatch: count('amount_mismatch'),
      unmatched: results.length - count('match') - count('recorded') - count('already_paid') - count('amount_mismatch'),
    },
    results,
  };
};

module.exports = { reconcile, parseCsv, toTransactions, parseDate };
