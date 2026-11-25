const env = require('../config/env');
const Invoice = require('../models/Invoice');
const Counter = require('../models/Counter');
const { addGst, splitGstInclusive, toCents } = require('../utils/money');
const { perthToday, addDays, formatPerth } = require('../utils/perthTime');
const { isValidAbn, formatAbn } = require('../utils/abn');
const { HttpError } = require('../utils/httpError');

const requireSeller = () => {
  if (!env.seller.abn) {
    throw new HttpError(503, 'Invoicing is not configured: set SELLER_ABN on the server.');
  }
  return { ...env.seller };
};

const nextInvoiceNumber = async (session) => {
  const seq = await Counter.next('invoice', session);
  return `INV-${perthToday().slice(0, 4)}-${String(seq).padStart(5, '0')}`;
};

const buyerAbn = (abn) => (abn && isValidAbn(abn) ? formatAbn(abn) : '');

/** Due date: N days after issue, but never after the service starts and never before today. */
const dueDate = (serviceStartDate) => {
  const today = perthToday();
  let due = addDays(today, env.INVOICE_DUE_DAYS);
  if (serviceStartDate && serviceStartDate < due) due = serviceStartDate;
  return due < today ? today : due;
};

const exLine = (description, quantity, unitExCents) => {
  const amountEx = Math.round(unitExCents * quantity);
  const { gst, inc_gst } = addGst(amountEx);
  return {
    description,
    quantity,
    unit_price_cents: unitExCents,
    amount_ex_gst_cents: amountEx,
    gst_cents: gst,
    amount_inc_gst_cents: inc_gst,
    taxable: true,
  };
};

const totals = (lines, depositCents) => {
  const subtotal = lines.reduce((s, l) => s + l.amount_ex_gst_cents, 0);
  const gst = lines.reduce((s, l) => s + l.gst_cents, 0);
  const inc = lines.reduce((s, l) => s + l.amount_inc_gst_cents, 0);
  return {
    subtotal_ex_gst_cents: subtotal,
    gst_cents: gst,
    total_inc_gst_cents: inc,
    security_deposit_cents: depositCents,
    amount_payable_cents: inc + depositCents,
  };
};

const issueForBooking = async (booking, { session, issuedBy } = {}) => {
  if (booking.invoice) return Invoice.findById(booking.invoice).session(session || null);
  const seller = requireSeller();
  const lines = [
    exLine(
      `Commercial kitchen hire — ${booking.package_label || `${booking.duration_hours} hours`}, ` +
        `${booking.booking_date} ${booking.start_time} to ${booking.end_date} ${booking.end_time} AWST`,
      1,
      booking.base_price_cents
    ),
  ];
  if (booking.cleaning_fee_cents > 0) lines.push(exLine('Cleaning fee', 1, booking.cleaning_fee_cents));

  const [invoice] = await Invoice.create(
    [
      {
        invoice_number: await nextInvoiceNumber(session),
        kind: 'kitchen_rental',
        booking: booking._id,
        booking_reference: booking.reference_code,
        user: booking.user,
        seller,
        buyer: {
          name: booking.full_name,
          business_name: booking.business_name || '',
          abn: buyerAbn(booking.abn),
          email: booking.email,
          phone: booking.phone,
        },
        issue_date: perthToday(),
        due_date: dueDate(booking.booking_date),
        supply_description: `${formatPerth(booking.start_at)} – ${formatPerth(booking.end_at)} (${booking.duration_hours} hrs)`,
        line_items: lines,
        ...totals(lines, booking.security_deposit_cents),
        issued_by: issuedBy?._id,
      },
    ],
    { session }
  );
  booking.invoice = invoice._id;
  return invoice;
};

const issueForStorage = async (storage, { session, issuedBy } = {}) => {
  if (storage.invoice) return Invoice.findById(storage.invoice).session(session || null);
  const seller = requireSeller();
  const split = splitGstInclusive(storage.total_cents);
  const lines = [
    {
      description: `Storage bay ${storage.bay_number} (${storage.storage_type.replace('_', ' ')}), ` +
        `${storage.start_date} to ${storage.end_date} (${storage.duration_days} days)`,
      quantity: 1,
      unit_price_cents: split.ex_gst,
      amount_ex_gst_cents: split.ex_gst,
      gst_cents: split.gst,
      amount_inc_gst_cents: split.inc_gst,
      taxable: true,
    },
  ];
  const [invoice] = await Invoice.create(
    [
      {
        invoice_number: await nextInvoiceNumber(session),
        kind: 'storage_lease',
        storage_booking: storage._id,
        booking_reference: storage.reference_code,
        user: storage.user,
        seller,
        buyer: {
          name: storage.full_name,
          business_name: storage.business_name || '',
          abn: buyerAbn(storage.abn),
          email: storage.email,
          phone: storage.phone,
        },
        issue_date: perthToday(),
        due_date: dueDate(storage.start_date),
        supply_description: `${storage.start_date} to ${storage.end_date}`,
        line_items: lines,
        ...totals(lines, storage.security_deposit_cents),
        issued_by: issuedBy?._id,
      },
    ],
    { session }
  );
  storage.invoice = invoice._id;
  return invoice;
};

/** Manual invoice. Line item unit prices are ex-GST; untaxed lines are allowed (e.g. reimbursements). */
const issueCustom = async (input, { session, issuedBy } = {}) => {
  const seller = requireSeller();
  const lines = input.line_items.map((li) => {
    const line = exLine(li.description, li.quantity, toCents(li.unit_price));
    if (li.taxable === false) {
      line.gst_cents = 0;
      line.amount_inc_gst_cents = line.amount_ex_gst_cents;
      line.taxable = false;
    }
    return line;
  });
  const [invoice] = await Invoice.create(
    [
      {
        invoice_number: await nextInvoiceNumber(session),
        kind: 'custom',
        booking_reference: input.booking_reference || '',
        seller,
        buyer: {
          name: input.customer_name,
          business_name: input.business_name || '',
          abn: buyerAbn(input.abn),
          email: input.email || '',
          phone: input.phone || '',
        },
        issue_date: perthToday(),
        due_date: input.due_date || dueDate(),
        supply_description: input.service_date_range || '',
        line_items: lines,
        ...totals(lines, toCents(input.security_deposit || 0)),
        notes: input.notes || '',
        issued_by: issuedBy?._id,
      },
    ],
    { session }
  );
  return invoice;
};

/**
 * Rule-based payment risk. (The old code labelled hard-coded demo values as
 * "AI"; these are plain, explainable rules.)
 */
const assessRisk = (invoice, serviceStartAt, now = new Date()) => {
  const status = invoice.effectiveStatus();
  if (status === 'paid') return { level: 'low', reason: 'Paid.', action: 'No action needed.' };
  if (status === 'void') return { level: 'low', reason: `Void: ${invoice.void_reason || 'cancelled'}.`, action: 'No action needed.' };
  const hoursToStart = serviceStartAt ? (new Date(serviceStartAt).getTime() - now.getTime()) / 3600000 : null;
  if (hoursToStart !== null && hoursToStart <= 24) {
    return {
      level: 'critical',
      reason: 'Service starts within 24 hours and payment has not been recorded.',
      action: 'Contact the customer now, or cancel to release the slot.',
    };
  }
  if (status === 'overdue') {
    return { level: 'high', reason: `Payment was due ${invoice.due_date}.`, action: 'Send a payment reminder.' };
  }
  return { level: 'medium', reason: `Awaiting payment (due ${invoice.due_date}).`, action: 'Monitor; send payment details if needed.' };
};

module.exports = { issueForBooking, issueForStorage, issueCustom, assessRisk };
