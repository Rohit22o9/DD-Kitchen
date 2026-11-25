const mongoose = require('mongoose');
const env = require('../config/env');
const { ACTIVE_BOOKING_STATUSES, STATUS_TRANSITIONS } = require('../config/constants');
const StorageBooking = require('../models/StorageBooking');
const StorageBay = require('../models/StorageBay');
const Invoice = require('../models/Invoice');
const { quoteStorage } = require('./pricingService');
const invoiceService = require('./invoiceService');
const outbox = require('./outboxService');
const { storageRow, email } = require('./syncPayloads');
const { perthToday, addDays, perthToUtc } = require('../utils/perthTime');
const { storageRef, accessCode } = require('../utils/refCode');
const { badRequest, conflict, notFound } = require('../utils/httpError');
const { toDollars } = require('../utils/money');

const withTxn = (fn) => mongoose.connection.transaction(fn);

const bayNumbers = () => Array.from({ length: env.STORAGE_BAY_COUNT }, (_, i) => i + 1);

const ensureBays = async () => {
  await Promise.all(
    bayNumbers().map((n) => StorageBay.updateOne({ bay_number: n }, { $setOnInsert: { bay_number: n } }, { upsert: true }))
  );
};

const overlapQuery = (bay, start, until) => ({
  bay_number: bay,
  status: { $in: ACTIVE_BOOKING_STATUSES },
  start_date: { $lt: until },
  occupied_until: { $gt: start },
});

const assertDates = ({ start_date }) => {
  const today = perthToday();
  if (start_date < today) throw badRequest('Storage cannot start in the past (Perth time).');
  if (start_date > addDays(today, env.BOOKING_MAX_ADVANCE_DAYS)) {
    throw badRequest(`Storage can be booked up to ${env.BOOKING_MAX_ADVANCE_DAYS} days ahead.`);
  }
};

/** Public availability + price. Reveals bay counts only — never other tenants' details. */
const availability = async (input) => {
  const quote = quoteStorage(input);
  const free = [];
  for (const bay of bayNumbers()) {
    if (!(await StorageBooking.exists(overlapQuery(bay, input.start_date, quote.occupied_until)))) free.push(bay);
  }
  const max = env.STORAGE_BAY_COUNT;
  return {
    available: free.length > 0,
    occupied_bays_count: max - free.length,
    max_bays: max,
    available_bays_count: free.length,
    available_bay_numbers: free,
    overlapping_bookings: [],
    quote: {
      days: quote.days,
      total_price: toDollars(quote.total_cents),
      gst: toDollars(quote.gst_cents),
      daily_rate: toDollars(Math.round(quote.total_cents / quote.days)),
      security_deposit: toDollars(quote.deposit_cents),
      amount_payable: toDollars(quote.total_cents + quote.deposit_cents),
    },
  };
};

const holdUntil = (startDate, now = new Date()) => {
  if (!env.BOOKING_HOLD_HOURS) return undefined;
  const hold = new Date(now.getTime() + env.BOOKING_HOLD_HOURS * 3600000);
  const start = perthToUtc(startDate, '00:00');
  return hold < start || start <= now ? hold : start;
};

const createStorageBooking = async (user, input) => {
  assertDates(input);
  const quote = quoteStorage(input);
  await expireStorageHolds();
  await ensureBays();
  const now = new Date();

  return withTxn(async (session) => {
    for (const bay of bayNumbers()) {
      // Write to the bay first: concurrent transactions on this bay now conflict.
      await StorageBay.updateOne({ bay_number: bay }, { $inc: { lock_version: 1 } }, { session });
      const taken = await StorageBooking.exists(overlapQuery(bay, input.start_date, quote.occupied_until)).session(session);
      if (taken) continue;

      const [s] = await StorageBooking.create(
        [
          {
            reference_code: storageRef(),
            user: user._id,
            full_name: input.full_name || user.full_name,
            business_name: input.business_name ?? user.business_name ?? '',
            abn: input.abn ?? user.abn ?? '',
            email: user.email,
            phone: input.phone || user.phone,
            storage_type: input.storage_type,
            bay_number: bay,
            duration_type: input.duration_type,
            start_date: input.start_date,
            end_date: input.end_date < input.start_date ? input.start_date : input.end_date,
            occupied_until: quote.occupied_until,
            duration_days: quote.days,
            total_cents: quote.total_cents,
            gst_cents: quote.gst_cents,
            security_deposit_cents: quote.deposit_cents,
            special_requirements: input.special_requirements || '',
            hold_expires_at: holdUntil(input.start_date, now),
            terms_version: env.TERMS_VERSION,
            terms_accepted_at: now,
          },
        ],
        { session }
      );
      await outbox.enqueue(
        'upsert_storage',
        {
          row: storageRow(s),
          email: email(s.email, 'storage_received', {
            reference_code: s.reference_code,
            full_name: s.full_name,
            bay_number: s.bay_number,
            start_date: s.start_date,
            end_date: s.end_date,
            total: toDollars(s.total_cents),
            bond: toDollars(s.security_deposit_cents),
          }),
        },
        session
      );
      return s;
    }
    throw conflict(`All ${env.STORAGE_BAY_COUNT} storage bays are taken for those dates. Please choose different dates.`);
  });
};

const voidInvoice = (s, reason, session) =>
  s.invoice
    ? Invoice.updateOne({ _id: s.invoice, status: 'pending' }, { status: 'void', void_reason: reason, voided_at: new Date() }, { session })
    : null;

const applyStoragePayment = async (s, { method, reference }, admin, session) => {
  if (!ACTIVE_BOOKING_STATUSES.includes(s.status)) throw conflict(`Cannot record payment on a ${s.status} storage booking.`);
  if (s.payment_status === 'paid') return null;
  const invoice = await invoiceService.issueForStorage(s, { session, issuedBy: admin });
  const now = new Date();
  if (invoice.status === 'pending') {
    invoice.status = 'paid';
    invoice.paid_at = now;
    invoice.payments.push({
      amount_cents: invoice.amount_payable_cents,
      method: method || 'Bank transfer / PayID',
      reference: reference || '',
      received_at: now,
      recorded_by: admin?._id,
    });
    await invoice.save({ session });
  }
  s.payment_status = 'paid';
  s.paid_at = now;
  s.payment_method = method || 'Bank transfer / PayID';
  s.payment_reference = reference || '';
  s.hold_expires_at = undefined;
  if (s.status === 'pending' || s.status === 'approved') s.status = 'confirmed';
  if (!s.access_code) s.access_code = accessCode();
  return invoice;
};

const findStorage = (idOrRef, session) => {
  const q = mongoose.isValidObjectId(idOrRef) ? { _id: idOrRef } : { reference_code: String(idOrRef) };
  return StorageBooking.findOne(q).select('+access_code').session(session || null);
};

const adminUpdateStorage = async (admin, idOrRef, changes) =>
  withTxn(async (session) => {
    const s = await findStorage(idOrRef, session);
    if (!s) throw notFound('Storage booking not found.');
    const before = s.status;
    if (changes.admin_notes !== undefined) s.admin_notes = changes.admin_notes;
    if (changes.access_code) s.access_code = changes.access_code;

    if (changes.payment_status && changes.payment_status !== s.payment_status) {
      if (changes.payment_status === 'paid') {
        await applyStoragePayment(s, { method: changes.payment_method, reference: changes.payment_reference }, admin, session);
      } else if (changes.payment_status === 'refunded') {
        if (s.payment_status !== 'paid') throw conflict('Only a paid booking can be marked refunded.');
        s.payment_status = 'refunded';
      } else {
        throw conflict('A recorded payment cannot be reverted to unpaid. Mark it refunded instead.');
      }
    }

    const target = changes.status;
    if (target && target !== s.status) {
      if (!(STATUS_TRANSITIONS[s.status] || []).includes(target)) {
        throw conflict(`Cannot change a ${s.status} storage booking to ${target}.`);
      }
      if (target === 'confirmed' && s.payment_status !== 'paid') throw conflict('Record the payment before confirming.');
      if (target === 'approved') {
        await invoiceService.issueForStorage(s, { session, issuedBy: admin });
        s.hold_expires_at = holdUntil(s.start_date);
      }
      if (target === 'rejected' || target === 'cancelled') {
        await voidInvoice(s, `Storage booking ${target}`, session);
        s.hold_expires_at = undefined;
      }
      if (target === 'confirmed' && !s.access_code) s.access_code = accessCode();
      s.status = target;
    }
    await s.save({ session });
    await outbox.enqueue(
      'upsert_storage',
      {
        row: storageRow(s),
        email:
          before !== s.status && ['approved', 'confirmed', 'rejected', 'cancelled'].includes(s.status)
            ? email(s.email, `storage_${s.status}`, {
                reference_code: s.reference_code,
                full_name: s.full_name,
                bay_number: s.bay_number,
                start_date: s.start_date,
                end_date: s.end_date,
                total: toDollars(s.total_cents),
                bond: toDollars(s.security_deposit_cents),
              })
            : undefined,
      },
      session
    );
    return s;
  });

const expireStorageHolds = async (now = new Date()) => {
  const due = await StorageBooking.find({
    status: { $in: ['pending', 'approved'] },
    payment_status: 'unpaid',
    hold_expires_at: { $lte: now },
  })
    .select('_id')
    .limit(200)
    .lean();
  let n = 0;
  for (const { _id } of due) {
    await withTxn(async (session) => {
      const s = await StorageBooking.findById(_id).session(session);
      if (!s || !['pending', 'approved'].includes(s.status) || s.payment_status !== 'unpaid') return;
      if (!s.hold_expires_at || s.hold_expires_at > now) return;
      s.status = 'expired';
      await voidInvoice(s, 'Unpaid hold expired', session);
      await s.save({ session });
      await outbox.enqueue('upsert_storage', { row: storageRow(s) }, session);
      n += 1;
    });
  }
  return n;
};

module.exports = {
  availability,
  createStorageBooking,
  adminUpdateStorage,
  applyStoragePayment,
  expireStorageHolds,
  ensureBays,
  findStorage,
  voidInvoice,
};
