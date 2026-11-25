/**
 * Refunds (with ATO adjustment notes) and security-bond settlement.
 */
const mongoose = require('mongoose');
const env = require('../config/env');
const Invoice = require('../models/Invoice');
const AdjustmentNote = require('../models/AdjustmentNote');
const Counter = require('../models/Counter');
const Booking = require('../models/Booking');
const StorageBooking = require('../models/StorageBooking');
const outbox = require('./outboxService');
const { bookingRow, storageRow, email } = require('./syncPayloads');
const { releaseAndVoid } = require('./bookingService');
const { toCents, toDollars } = require('../utils/money');
const { perthToday } = require('../utils/perthTime');
const { badRequest, conflict, notFound } = require('../utils/httpError');

const withTxn = (fn) => mongoose.connection.transaction(fn);

const nextNoteNumber = async (session) => {
  const seq = await Counter.next('adjustment', session);
  return `ADJ-${perthToday().slice(0, 4)}-${String(seq).padStart(5, '0')}`;
};

const refundInvoice = (admin, invoiceNumber, { amount, reason, method, reference, cancel_booking }) =>
  withTxn(async (session) => {
    const inv = await Invoice.findOne({ invoice_number: invoiceNumber }).session(session);
    if (!inv) throw notFound('Invoice not found.');
    if (inv.status !== 'paid') throw conflict('Only paid invoices can be refunded. Void unpaid invoices instead.');

    const refundable = inv.total_inc_gst_cents - (inv.refunded_cents || 0);
    const cents = toCents(amount);
    if (cents <= 0) throw badRequest('Refund amount must be more than $0.');
    if (cents > refundable) throw badRequest(`At most $${toDollars(refundable).toFixed(2)} can still be refunded on this invoice.`);

    // GST is reduced in the same proportion as the price.
    const gst = inv.total_inc_gst_cents ? Math.round((cents * inv.gst_cents) / inv.total_inc_gst_cents) : 0;
    const [note] = await AdjustmentNote.create(
      [
        {
          note_number: await nextNoteNumber(session),
          invoice: inv._id,
          invoice_number: inv.invoice_number,
          booking_reference: inv.booking_reference,
          user: inv.user,
          seller: { ...env.seller },
          buyer: { name: inv.buyer.name, business_name: inv.buyer.business_name, abn: inv.buyer.abn, email: inv.buyer.email },
          issue_date: perthToday(),
          reason,
          amount_inc_gst_cents: cents,
          gst_cents: gst,
          amount_ex_gst_cents: cents - gst,
          method: method || 'Bank transfer',
          reference: reference || '',
          issued_by: admin._id,
        },
      ],
      { session }
    );
    inv.refunded_cents = (inv.refunded_cents || 0) + cents;
    inv.refunded_gst_cents = (inv.refunded_gst_cents || 0) + gst;
    await inv.save({ session });
    const fullyRefunded = inv.refunded_cents >= inv.total_inc_gst_cents;

    const Model = inv.booking ? Booking : inv.storage_booking ? StorageBooking : null;
    const linked = Model ? await Model.findById(inv.booking || inv.storage_booking).session(session) : null;
    if (linked) {
      if (fullyRefunded) linked.payment_status = 'refunded';
      if (cancel_booking && ['pending', 'approved', 'confirmed'].includes(linked.status)) {
        linked.status = 'cancelled';
        linked.hold_expires_at = undefined;
        if (inv.booking) await releaseAndVoid(linked, 'Cancelled with refund', session);
      }
      linked.admin_notes = `${linked.admin_notes ? `${linked.admin_notes}\n` : ''}Refund ${note.note_number}: $${toDollars(cents).toFixed(2)} — ${reason}`;
      await linked.save({ session });
      await outbox.enqueue(inv.booking ? 'upsert_booking' : 'upsert_storage', { row: inv.booking ? bookingRow(linked) : storageRow(linked) }, session);
    }
    await outbox.enqueue(
      'send_email',
      email(inv.buyer.email, 'refund_issued', {
        full_name: inv.buyer.name,
        reference_code: inv.booking_reference,
        invoice_number: inv.invoice_number,
        note_number: note.note_number,
        amount: toDollars(cents),
        gst: toDollars(gst),
        reason,
      }),
      session
    );
    return { note, invoice: inv };
  });

const settleBond = (admin, invoiceNumber, { refund_amount, forfeit_amount, reason, reference }) =>
  withTxn(async (session) => {
    const inv = await Invoice.findOne({ invoice_number: invoiceNumber }).session(session);
    if (!inv) throw notFound('Invoice not found.');
    if (inv.status !== 'paid') throw conflict('The bond can only be settled once the invoice is paid.');
    if (!inv.security_deposit_cents) throw conflict('This invoice has no security bond.');
    if (inv.bond?.status && inv.bond.status !== 'held') throw conflict('This bond has already been settled.');

    const refund = toCents(refund_amount || 0);
    const forfeit = toCents(forfeit_amount || 0);
    if (refund < 0 || forfeit < 0 || refund + forfeit !== inv.security_deposit_cents) {
      throw badRequest(`Refunded + retained must equal the bond of $${toDollars(inv.security_deposit_cents).toFixed(2)}.`);
    }
    if (forfeit > 0 && !reason) throw badRequest('Give a reason for retaining part of the bond.');

    inv.bond = {
      status: forfeit === 0 ? 'refunded' : refund === 0 ? 'forfeited' : 'partly_forfeited',
      refunded_cents: refund,
      forfeited_cents: forfeit,
      forfeit_gst_cents: Math.round(forfeit / 11),
      reason: reason || '',
      reference: reference || '',
      settled_at: new Date(),
    };
    await inv.save({ session });
    await outbox.enqueue(
      'send_email',
      email(inv.buyer.email, 'bond_settled', {
        full_name: inv.buyer.name,
        reference_code: inv.booking_reference,
        invoice_number: inv.invoice_number,
        bond: toDollars(inv.security_deposit_cents),
        refunded: toDollars(refund),
        forfeited: toDollars(forfeit),
        reason,
      }),
      session
    );
    return inv;
  });

module.exports = { refundInvoice, settleBond };
