/**
 * One-off migration from the v1 schema (bookings with only date/time strings,
 * no slot documents, hard-coded door PIN) to v2.
 *
 *   DRY_RUN=true npm run migrate:v2   # report only
 *   npm run migrate:v2                # apply
 *
 * For every v1 booking it: derives start_at/end_at in Perth time, converts
 * prices to cents, removes the shared '4892#' PIN, and claims slots for
 * active bookings. Overlapping v1 bookings (double-bookings) are reported and
 * left for staff to resolve — the later one is not given slots.
 * v1 bookings had no user link: they are attached to an existing account with
 * the same email when one exists, otherwise reported.
 */
const mongoose = require('mongoose');
const { connectDB, closeDB } = require('../config/db');
const Booking = require('../models/Booking');
const BookingSlot = require('../models/BookingSlot');
const User = require('../models/User');
const { enumerateSlots, buildInterval } = require('../services/bookingService');
const { ACTIVE_BOOKING_STATUSES } = require('../config/constants');
const { toCents } = require('../utils/money');

const DRY = process.env.DRY_RUN === 'true';

(async () => {
  await connectDB();
  const raw = await mongoose.connection.db.collection('bookings').find({ start_at: { $exists: false } }).toArray();
  console.log(`${raw.length} v1 booking(s) to migrate${DRY ? ' (dry run)' : ''}`);
  const report = { migrated: 0, conflicts: [], orphans: [], invalid: [] };

  for (const b of raw.sort((x, y) => String(x.createdAt).localeCompare(String(y.createdAt)))) {
    let interval;
    try {
      interval = buildInterval(String(b.booking_date), String(b.start_time).slice(0, 5), Number(b.duration_hours) || 4);
    } catch {
      report.invalid.push(b.reference_code);
      continue;
    }
    const user = await User.findOne({ email: String(b.email || '').toLowerCase() });
    if (!user) report.orphans.push(`${b.reference_code} <${b.email}>`);

    const update = {
      start_at: interval.start_at,
      end_at: interval.end_at,
      end_date: interval.end_date,
      end_time: interval.end_time,
      base_price_cents: toCents(b.base_price || 0),
      gst_cents: toCents((b.total_price || 0) - (b.base_price || 0)),
      total_cents: toCents(b.total_price || 0),
      security_deposit_cents: toCents(b.security_deposit || 0),
      cleaning_fee_cents: toCents(b.cleaning_fee || 0),
      ...(user ? { user: user._id } : {}),
    };
    const unset = { door_pin_code: '', base_price: '', total_price: '', security_deposit: '', cleaning_fee: '', hourly_rate: '' };

    if (!DRY) {
      await mongoose.connection.db.collection('bookings').updateOne({ _id: b._id }, { $set: update, $unset: unset });
      if (ACTIVE_BOOKING_STATUSES.includes(b.status)) {
        try {
          await BookingSlot.insertMany(
            enumerateSlots(interval.start_at, interval.end_at).map((slot_start) => ({ slot_start, kind: 'booking', booking: b._id })),
            { ordered: true }
          );
        } catch (err) {
          if (err.code !== 11000) throw err;
          await BookingSlot.deleteMany({ booking: b._id });
          report.conflicts.push(b.reference_code);
        }
      }
    }
    report.migrated += 1;
  }

  // v1 storage leases: old field names, and payment_status defaulted to "paid" without any payment.
  const db = mongoose.connection.db;
  const oldStorage = await db.collection('storagebookings').find({ occupied_until: { $exists: false } }).toArray();
  for (const s of oldStorage) {
    const start = String(s.start_date);
    const end = String(s.end_date || s.start_date);
    const days = Math.max(1, Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000));
    const until = new Date(Date.parse(`${start}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
    const totalCents = toCents(s.total_price || s.monthly_rate || 0);
    const user = await User.findOne({ email: String(s.email || '').toLowerCase() });
    if (!DRY) {
      await db.collection('storagebookings').updateOne(
        { _id: s._id },
        {
          $set: {
            storage_type: s.storage_type === 'cold_storage' ? 'cool_room' : s.storage_type || 'dry_storage',
            duration_type: 'custom',
            occupied_until: until,
            duration_days: days,
            total_cents: totalCents,
            gst_cents: Math.round(totalCents / 11),
            security_deposit_cents: toCents(s.security_deposit || 0),
            payment_status: 'unpaid',
            admin_notes: `${s.notes || ''} [Migrated from v1: payment status was auto-set to "paid" by the old system — verify against the bank.]`.trim(),
            ...(user ? { user: user._id } : {}),
          },
          $unset: { bay_name: '', monthly_rate: '', total_price: '', security_deposit: '' },
        }
      );
    }
  }
  report.storage_migrated = oldStorage.length;

  // v1 invoices had a different shape (and were mostly generated on the fly). Archive them.
  const oldInvoices = await db.collection('invoices').countDocuments({ seller: { $exists: false } });
  if (oldInvoices && !DRY) {
    const docs = await db.collection('invoices').find({ seller: { $exists: false } }).toArray();
    await db.collection('invoices_v1_archive').insertMany(docs);
    await db.collection('invoices').deleteMany({ seller: { $exists: false } });
  }
  report.v1_invoices_archived = oldInvoices;

  // v1 seeded these accounts on every fresh database with passwords published in the
  // public repo. Lock them with a random password; reset real ones with create-admin.
  const seeded = ['demo@dailydrop.today', 'rratnaparkhi3@gmail.com', 'admin@dailydrop.today', 'director@dailydrop.today'];
  report.locked_seed_accounts = [];
  for (const email of seeded) {
    const u = await User.findOne({ email });
    if (!u) continue;
    if (!DRY) {
      u.password = require('crypto').randomBytes(32).toString('hex');
      u.token_version = (u.token_version || 0) + 1;
      await u.save();
    }
    report.locked_seed_accounts.push(`${email} (${u.role})`);
  }

  console.log(JSON.stringify(report, null, 2));
  if (report.conflicts.length) console.log('Resolve the conflicting bookings above in the admin panel.');
  if (report.orphans.length) console.log('Orphaned bookings need an account with the same email before customers can see them.');
  await Booking.init();
  await closeDB();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
