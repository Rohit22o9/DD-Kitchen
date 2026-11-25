const mongoose = require('mongoose');
const env = require('../config/env');
const {
  SLOT_MINUTES,
  ACTIVE_BOOKING_STATUSES,
  STATUS_TRANSITIONS,
} = require('../config/constants');
const Booking = require('../models/Booking');
const BookingSlot = require('../models/BookingSlot');
const BlockedSlot = require('../models/BlockedSlot');
const KitchenConfig = require('../models/KitchenConfig');
const Invoice = require('../models/Invoice');
const { quoteKitchen } = require('./pricingService');
const invoiceService = require('./invoiceService');
const outbox = require('./outboxService');
const { bookingRow, email } = require('./syncPayloads');
const {
  perthToUtc,
  utcToPerth,
  perthToday,
  addDays,
  startOfPerthDay,
  endOfPerthDay,
  minutesIntoPerthDay,
  minutesToHHMM,
} = require('../utils/perthTime');
const { bookingRef, accessCode } = require('../utils/refCode');
const { badRequest, conflict, notFound, forbidden } = require('../utils/httpError');
const { toDollars } = require('../utils/money');

const SLOT_MS = SLOT_MINUTES * 60 * 1000;

const withTxn = (fn) => mongoose.connection.transaction(fn);

const enumerateSlots = (startAt, endAt) => {
  const slots = [];
  for (let t = startAt.getTime(); t < endAt.getTime(); t += SLOT_MS) slots.push(new Date(t));
  return slots;
};

/** Build the absolute interval for a Perth date + time + duration. Handles overnight shifts. */
const buildInterval = (date, time, hours) => {
  const startAt = perthToUtc(date, time);
  if (Number.isNaN(startAt.getTime())) throw badRequest('Invalid booking date or start time.');
  if (startAt.getTime() % SLOT_MS !== 0) throw badRequest(`Start time must be on a ${SLOT_MINUTES}-minute boundary.`);
  const endAt = new Date(startAt.getTime() + hours * 3600000);
  const end = utcToPerth(endAt);
  return { start_at: startAt, end_at: endAt, end_date: end.date, end_time: end.time };
};

const hhmmToMinutes = (s) => {
  const [h, m] = String(s).split(':').map(Number);
  return h * 60 + m;
};

/** Reject past, too-far-ahead and out-of-hours requests. */
const assertBookableWindow = (config, date, time, interval, now = new Date()) => {
  if (interval.start_at.getTime() <= now.getTime()) {
    throw badRequest('That start time has already passed (Perth time). Please choose a future time.');
  }
  if (date > addDays(perthToday(now), env.BOOKING_MAX_ADVANCE_DAYS)) {
    throw badRequest(`Bookings can be made up to ${env.BOOKING_MAX_ADVANCE_DAYS} days ahead.`);
  }
  const open = hhmmToMinutes(config.operating_hours_start || '00:00');
  const close = hhmmToMinutes(config.operating_hours_end || '24:00');
  const is24x7 = open === 0 && close >= 1439;
  if (!is24x7) {
    const startMin = hhmmToMinutes(time);
    const endMin = startMin + Math.round((interval.end_at - interval.start_at) / 60000);
    if (startMin < open || endMin > close) {
      throw badRequest(
        `Bookings must fall within operating hours (${config.operating_hours_start}–${config.operating_hours_end} AWST).`
      );
    }
  }
};

const holdUntil = (startAt, now = new Date()) => {
  if (!env.BOOKING_HOLD_HOURS) return undefined;
  const hold = new Date(now.getTime() + env.BOOKING_HOLD_HOURS * 3600000);
  return hold < startAt ? hold : startAt;
};

const releaseSlots = (bookingId, session) => BookingSlot.deleteMany({ booking: bookingId }, { session });

const isSlotConflict = (err) => err && err.code === 11000 && (err.keyPattern?.slot_start || /slot_start/.test(err.message));

/** Existing occupancy that overlaps [startAt, endAt). Returns merged intervals, no customer data. */
const findConflicts = async (startAt, endAt) => {
  const slots = await BookingSlot.find({ slot_start: { $gte: startAt, $lt: endAt } }).sort({ slot_start: 1 }).lean();
  return mergeSlots(slots);
};

const mergeSlots = (slots) => {
  const out = [];
  for (const s of slots) {
    const owner = String(s.booking || s.blocked_slot || '');
    const last = out[out.length - 1];
    if (last && last.owner === owner && last.end.getTime() === s.slot_start.getTime()) {
      last.end = new Date(s.slot_start.getTime() + SLOT_MS);
    } else {
      out.push({ kind: s.kind, owner, start: s.slot_start, end: new Date(s.slot_start.getTime() + SLOT_MS) });
    }
  }
  return out;
};

/** Expire unpaid holds whose deadline has passed and free their slots. */
const expireHolds = async (now = new Date()) => {
  const due = await Booking.find({
    status: { $in: ['pending', 'approved'] },
    payment_status: 'unpaid',
    hold_expires_at: { $lte: now },
  })
    .select('_id')
    .limit(200)
    .lean();

  let expired = 0;
  for (const { _id } of due) {
    await withTxn(async (session) => {
      const b = await Booking.findById(_id).session(session);
      if (!b || !['pending', 'approved'].includes(b.status) || b.payment_status !== 'unpaid') return;
      if (!b.hold_expires_at || b.hold_expires_at > now) return;
      b.status = 'expired';
      await releaseSlots(b._id, session);
      if (b.invoice) {
        await Invoice.updateOne(
          { _id: b.invoice, status: 'pending' },
          { status: 'void', void_reason: 'Unpaid hold expired', voided_at: now },
          { session }
        );
      }
      await b.save({ session });
      await outbox.enqueue(
        'upsert_booking',
        { row: bookingRow(b), email: email(b.email, 'booking_expired', { reference_code: b.reference_code, booking_date: b.booking_date, start_time: b.start_time }) },
        session
      );
      expired += 1;
    });
  }
  return expired;
};

/**
 * Recurring series: one normal booking per occurrence (each priced, held and
 * paid separately). Dates that clash are skipped and reported, not forced.
 */
const createRecurringSeries = async (user, input, meta = {}) => {
  const step = input.frequency === 'fortnightly' ? 14 : 7;
  const seriesId = `SER-${require('crypto').randomBytes(5).toString('hex').toUpperCase()}`;
  const created = [];
  const skipped = [];
  for (let i = 0; i < input.occurrences; i++) {
    const date = addDays(input.booking_date, i * step);
    try {
      created.push(await createKitchenBooking(user, { ...input, booking_date: date }, { ...meta, seriesId }));
    } catch (err) {
      if (!err.expose) throw err;
      skipped.push({ booking_date: date, reason: err.message });
    }
  }
  return { series_id: seriesId, created, skipped };
};

const createKitchenBooking = async (user, input, meta = {}) => {
  const config = await KitchenConfig.get();
  const quote = quoteKitchen(config, input.duration_hours);
  const interval = buildInterval(input.booking_date, input.start_time, quote.hours);
  assertBookableWindow(config, input.booking_date, input.start_time, interval);

  // Free any overlapping holds that have lapsed before we try to claim the slots.
  await expireHolds();

  const now = new Date();
  try {
    return await withTxn(async (session) => {
      const booking = new Booking({
        reference_code: bookingRef(),
        user: user._id,
        full_name: input.full_name || user.full_name,
        business_name: input.business_name ?? user.business_name ?? '',
        abn: input.abn ?? user.abn ?? '',
        // The booking is always tied to the authenticated account's email.
        email: user.email,
        phone: input.phone || user.phone,
        booking_date: input.booking_date,
        start_time: input.start_time,
        end_date: interval.end_date,
        end_time: interval.end_time,
        start_at: interval.start_at,
        end_at: interval.end_at,
        duration_hours: quote.hours,
        package_label: quote.label,
        base_price_cents: quote.base_cents,
        cleaning_fee_cents: quote.cleaning_cents,
        gst_cents: quote.gst_cents,
        total_cents: quote.total_cents,
        security_deposit_cents: quote.deposit_cents,
        intended_use: input.intended_use,
        team_size: input.team_size,
        equipment_requirements: input.equipment_requirements || '',
        additional_notes: input.additional_notes || '',
        status: 'pending',
        payment_status: 'unpaid',
        hold_expires_at: holdUntil(interval.start_at, now),
        terms_version: env.TERMS_VERSION,
        terms_accepted_at: now,
        series_id: meta.seriesId,
      });
      await booking.save({ session });
      await BookingSlot.insertMany(
        enumerateSlots(interval.start_at, interval.end_at).map((slot_start) => ({ slot_start, kind: 'booking', booking: booking._id })),
        { session, ordered: true }
      );
      await outbox.enqueue(
        'upsert_booking',
        {
          row: bookingRow(booking),
          email: email(booking.email, 'booking_received', {
            reference_code: booking.reference_code,
            full_name: booking.full_name,
            booking_date: booking.booking_date,
            start_time: booking.start_time,
            end_date: booking.end_date,
            end_time: booking.end_time,
            duration_hours: booking.duration_hours,
            total: toDollars(booking.total_cents),
            bond: toDollars(booking.security_deposit_cents),
            hold_expires_at: booking.hold_expires_at?.toISOString(),
            ip: meta.ip,
          }),
        },
        session
      );
      return booking;
    });
  } catch (err) {
    if (isSlotConflict(err)) {
      throw conflict('Sorry — that time overlaps an existing booking or maintenance block. Please choose another time.');
    }
    throw err;
  }
};

/** Server-side availability check used by the booking form before submitting. */
const checkSlot = async ({ booking_date, start_time, duration_hours }) => {
  const config = await KitchenConfig.get();
  const quote = quoteKitchen(config, duration_hours);
  const interval = buildInterval(booking_date, start_time, quote.hours);
  try {
    assertBookableWindow(config, booking_date, start_time, interval);
  } catch (err) {
    return { available: false, reason: err.message, quote: publicQuote(quote) };
  }
  await expireHolds();
  const conflicts = await findConflicts(interval.start_at, interval.end_at);
  return {
    available: conflicts.length === 0,
    reason: conflicts.length ? 'Overlaps an existing booking or maintenance block.' : undefined,
    end_date: interval.end_date,
    end_time: interval.end_time,
    conflicts: conflicts.map((c) => ({
      status: c.kind === 'block' ? 'blocked' : 'booked',
      start: utcToPerth(c.start),
      end: utcToPerth(c.end),
    })),
    quote: publicQuote(quote),
  };
};

const publicQuote = (q) => ({
  hours: q.hours,
  label: q.label,
  base_price: toDollars(q.base_cents),
  cleaning_fee: toDollars(q.cleaning_cents),
  gst: toDollars(q.gst_cents),
  total_price: toDollars(q.total_cents),
  security_deposit: toDollars(q.deposit_cents),
  amount_payable: toDollars(q.total_cents + q.deposit_cents),
});

/** Busy intervals inside one Perth day. Contains no names, emails or references. */
const intervalsForDay = async (date) => {
  const dayStart = startOfPerthDay(date);
  const dayEnd = endOfPerthDay(date);
  const slots = await BookingSlot.find({ slot_start: { $gte: dayStart, $lt: dayEnd } }).sort({ slot_start: 1 }).lean();
  const merged = mergeSlots(slots);
  const blockIds = merged.filter((m) => m.kind === 'block').map((m) => m.owner);
  const blocks = blockIds.length ? await BlockedSlot.find({ _id: { $in: blockIds } }).lean() : [];
  const reasons = new Map(blocks.map((b) => [String(b._id), b.reason]));
  return merged.map((m) => ({
    start_time: minutesToHHMM(minutesIntoPerthDay(m.start, date)),
    end_time: minutesToHHMM(minutesIntoPerthDay(m.end, date)),
    status: m.kind === 'block' ? 'blocked' : 'booked',
    reason: m.kind === 'block' ? reasons.get(m.owner) || 'Maintenance' : 'Reserved',
    minutes: Math.round((m.end - m.start) / 60000),
    owner: m.owner,
  }));
};

const dayAvailability = async (date) => {
  const config = await KitchenConfig.get();
  const intervals = await intervalsForDay(date);
  const bookedMinutes = intervals.filter((i) => i.status === 'booked').reduce((s, i) => s + i.minutes, 0);
  const bookingCount = new Set(intervals.filter((i) => i.status === 'booked').map((i) => i.owner)).size;
  return {
    date,
    available: intervals.length === 0,
    operating_hours: { start: config.operating_hours_start, end: config.operating_hours_end },
    hourly_rate: config.hourly_rental_rate,
    min_hours: config.min_rental_hours,
    slots: intervals.map(({ minutes, owner, ...rest }) => rest),
    existing_bookings_count: bookingCount,
    total_booked_hours: bookedMinutes / 60,
  };
};

const monthAvailability = async (year, month) => {
  const config = await KitchenConfig.get();
  const first = `${year}-${String(month).padStart(2, '0')}-01`;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const result = {};
  const slots = await BookingSlot.find({
    slot_start: { $gte: startOfPerthDay(first), $lt: endOfPerthDay(addDays(first, daysInMonth - 1)) },
  })
    .sort({ slot_start: 1 })
    .lean();

  const byDay = new Map();
  for (const s of slots) {
    const d = utcToPerth(s.slot_start).date;
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d).push(s);
  }

  const blockIds = [...new Set(slots.filter((s) => s.kind === 'block').map((s) => String(s.blocked_slot)))];
  const blocks = blockIds.length ? await BlockedSlot.find({ _id: { $in: blockIds } }).lean() : [];
  const reasons = new Map(blocks.map((b) => [String(b._id), b.reason]));
  const minFree = (config.min_rental_hours || 2) * 60;

  for (let i = 0; i < daysInMonth; i++) {
    const date = addDays(first, i);
    const merged = mergeSlots(byDay.get(date) || []);
    const bookedMin = merged.filter((m) => m.kind === 'booking').reduce((s, m) => s + (m.end - m.start) / 60000, 0);
    const blockedMin = merged.filter((m) => m.kind === 'block').reduce((s, m) => s + (m.end - m.start) / 60000, 0);
    const occupied = bookedMin + blockedMin;
    let status = 'available';
    if (blockedMin >= 1440) status = 'blocked';
    else if (1440 - occupied < minFree) status = 'fully_booked';
    else if (occupied > 0) status = 'partially_booked';
    result[date] = {
      date,
      total_booked_hours: bookedMin / 60,
      available_hours: Math.max(0, (1440 - occupied) / 60),
      bookings_count: new Set(merged.filter((m) => m.kind === 'booking').map((m) => m.owner)).size,
      status,
      slots: merged.map((m) => ({
        start_time: minutesToHHMM(minutesIntoPerthDay(m.start, date)),
        end_time: minutesToHHMM(minutesIntoPerthDay(m.end, date)),
        status: m.kind === 'block' ? 'blocked' : 'booked',
        reason: m.kind === 'block' ? reasons.get(m.owner) || 'Maintenance' : 'Reserved',
      })),
      equipment_in_use: [],
    };
  }
  return result;
};

const findBookingByIdOrRef = (idOrRef, session) => {
  const q = mongoose.isValidObjectId(idOrRef) ? { _id: idOrRef } : { reference_code: String(idOrRef) };
  return Booking.findOne(q).select('+access_code').session(session || null);
};

/** Record a payment against a booking (and its invoice) inside a transaction. */
const applyPayment = async (booking, { method, reference }, admin, session) => {
  if (!ACTIVE_BOOKING_STATUSES.includes(booking.status)) {
    throw conflict(`Cannot record payment on a ${booking.status} booking.`);
  }
  if (booking.payment_status === 'paid') return null;
  const invoice = await invoiceService.issueForBooking(booking, { session, issuedBy: admin });
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
  booking.payment_status = 'paid';
  booking.paid_at = now;
  booking.payment_method = method || 'Bank transfer / PayID';
  booking.payment_reference = reference || '';
  booking.hold_expires_at = undefined;
  if (booking.status === 'pending' || booking.status === 'approved') booking.status = 'confirmed';
  if (!booking.access_code) booking.access_code = accessCode();
  return invoice;
};

const releaseAndVoid = async (booking, reason, session) => {
  await releaseSlots(booking._id, session);
  if (booking.invoice) {
    await Invoice.updateOne(
      { _id: booking.invoice, status: 'pending' },
      { status: 'void', void_reason: reason, voided_at: new Date() },
      { session }
    );
  }
};

/** Admin status / payment changes with an explicit state machine. */
const adminUpdateBooking = async (admin, idOrRef, changes) =>
  withTxn(async (session) => {
    const b = await findBookingByIdOrRef(idOrRef, session);
    if (!b) throw notFound('Booking not found.');
    const before = { status: b.status, payment_status: b.payment_status };

    if (changes.admin_notes !== undefined) b.admin_notes = changes.admin_notes;
    if (changes.access_code) b.access_code = changes.access_code;

    if (changes.payment_status && changes.payment_status !== b.payment_status) {
      if (changes.payment_status === 'paid') {
        await applyPayment(b, { method: changes.payment_method, reference: changes.payment_reference }, admin, session);
      } else if (changes.payment_status === 'refunded') {
        if (b.payment_status !== 'paid') throw conflict('Only a paid booking can be marked refunded.');
        b.payment_status = 'refunded';
      } else {
        throw conflict('A recorded payment cannot be reverted to unpaid. Mark it refunded instead.');
      }
    }

    const target = changes.status;
    if (target && target !== b.status) {
      const allowed = STATUS_TRANSITIONS[b.status] || [];
      if (!allowed.includes(target)) throw conflict(`Cannot change a ${b.status} booking to ${target}.`);
      if (target === 'confirmed' && b.payment_status !== 'paid') {
        throw conflict('Record the payment before confirming this booking.');
      }
      if (target === 'approved') {
        await invoiceService.issueForBooking(b, { session, issuedBy: admin });
        b.hold_expires_at = holdUntil(b.start_at);
      }
      if (target === 'rejected' || target === 'cancelled') {
        await releaseAndVoid(b, `Booking ${target}`, session);
        b.hold_expires_at = undefined;
      }
      if (target === 'confirmed' && !b.access_code) b.access_code = accessCode();
      b.status = target;
    }

    await b.save({ session });

    const template =
      before.status !== b.status
        ? { approved: 'booking_approved', confirmed: 'booking_confirmed', rejected: 'booking_rejected', cancelled: 'booking_cancelled' }[b.status]
        : null;
    let invoiceData;
    if (template === 'booking_approved' && b.invoice) {
      const inv = await Invoice.findById(b.invoice).session(session);
      invoiceData = { invoice_number: inv.invoice_number, due_date: inv.due_date, amount_payable: toDollars(inv.amount_payable_cents) };
    }
    await outbox.enqueue(
      'upsert_booking',
      {
        row: bookingRow(b),
        email: template
          ? email(b.email, template, {
              reference_code: b.reference_code,
              full_name: b.full_name,
              booking_date: b.booking_date,
              start_time: b.start_time,
              end_date: b.end_date,
              end_time: b.end_time,
              total: toDollars(b.total_cents),
              bond: toDollars(b.security_deposit_cents),
              ...invoiceData,
            })
          : undefined,
      },
      session
    );
    return b;
  });

const cancelByCustomer = async (user, ref) =>
  withTxn(async (session) => {
    const b = await Booking.findOne({ reference_code: ref, user: user._id }).session(session);
    if (!b) throw notFound('Booking not found.');
    if (!['pending', 'approved'].includes(b.status) || b.payment_status !== 'unpaid') {
      throw conflict('This booking can no longer be cancelled online. Please contact Daily Drop.');
    }
    b.status = 'cancelled';
    b.hold_expires_at = undefined;
    await releaseAndVoid(b, 'Cancelled by customer', session);
    await b.save({ session });
    await outbox.enqueue('upsert_booking', { row: bookingRow(b) }, session);
    return b;
  });

/** Admin maintenance block: claims the same slots, so it can never overlap a booking. */
const createBlock = async (admin, { block_date, start_time, end_time, reason }) => {
  const startAt = perthToUtc(block_date, start_time);
  const endAt = end_time === '24:00' || end_time === '23:59' ? endOfPerthDay(block_date) : perthToUtc(block_date, end_time);
  // Round outwards to slot boundaries so the whole requested window is covered.
  const s = new Date(Math.floor(startAt.getTime() / SLOT_MS) * SLOT_MS);
  const e = new Date(Math.ceil(endAt.getTime() / SLOT_MS) * SLOT_MS);
  if (e <= s) throw badRequest('End time must be after start time.');

  try {
    return await withTxn(async (session) => {
      const [block] = await BlockedSlot.create(
        [
          {
            block_date,
            start_time,
            end_time: end_time === '23:59' ? '24:00' : end_time,
            start_at: s,
            end_at: e,
            reason: reason || 'Maintenance',
            created_by: admin._id,
          },
        ],
        { session }
      );
      await BookingSlot.insertMany(
        enumerateSlots(s, e).map((slot_start) => ({ slot_start, kind: 'block', blocked_slot: block._id })),
        { session, ordered: true }
      );
      return block;
    });
  } catch (err) {
    if (isSlotConflict(err)) {
      const clashes = await BookingSlot.find({ slot_start: { $gte: s, $lt: e }, kind: 'booking' }).distinct('booking');
      const refs = await Booking.find({ _id: { $in: clashes } }).distinct('reference_code');
      throw conflict('That window overlaps existing bookings or blocks. Move or cancel them first.', { bookings: refs });
    }
    throw err;
  }
};

const deleteBlock = async (id) =>
  withTxn(async (session) => {
    const block = await BlockedSlot.findById(id).session(session);
    if (!block) throw notFound('Blocked slot not found.');
    await BookingSlot.deleteMany({ blocked_slot: block._id }, { session });
    await block.deleteOne({ session });
  });

const assertOwnerOrAdmin = (user, booking, isAdminUser) => {
  if (isAdminUser) return;
  if (!booking.user || booking.user.toString() !== user._id.toString()) throw notFound('Booking not found.');
};

module.exports = {
  enumerateSlots,
  buildInterval,
  createKitchenBooking,
  createRecurringSeries,
  checkSlot,
  dayAvailability,
  monthAvailability,
  adminUpdateBooking,
  applyPayment,
  releaseAndVoid,
  cancelByCustomer,
  createBlock,
  deleteBlock,
  expireHolds,
  findBookingByIdOrRef,
  assertOwnerOrAdmin,
  withTxn,
  forbidden,
};
