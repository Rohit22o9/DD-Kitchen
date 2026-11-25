const Invoice = require('../models/Invoice');
const AdjustmentNote = require('../models/AdjustmentNote');
const refundService = require('../services/refundService');
const reconcileService = require('../services/reconcileService');
const Booking = require('../models/Booking');
const StorageBooking = require('../models/StorageBooking');
const invoiceService = require('../services/invoiceService');
const bookingService = require('../services/bookingService');
const storageService = require('../services/storageService');
const gemini = require('../services/geminiService');
const outbox = require('../services/outboxService');
const { bookingRow, storageRow } = require('../services/syncPayloads');
const { perthToUtc, perthToday } = require('../utils/perthTime');
const { toDollars } = require('../utils/money');
const { asyncHandler, notFound, conflict } = require('../utils/httpError');

const serviceStart = (inv, bookingMap, storageMap) => {
  if (inv.booking && bookingMap.has(String(inv.booking))) return bookingMap.get(String(inv.booking)).start_at;
  if (inv.storage_booking && storageMap.has(String(inv.storage_booking))) {
    return perthToUtc(storageMap.get(String(inv.storage_booking)).start_date, '00:00');
  }
  return null;
};

const withRisk = async (invoices) => {
  const bookingIds = invoices.filter((i) => i.booking).map((i) => i.booking);
  const storageIds = invoices.filter((i) => i.storage_booking).map((i) => i.storage_booking);
  const [bookings, storages] = await Promise.all([
    Booking.find({ _id: { $in: bookingIds } }).select('start_at').lean(),
    StorageBooking.find({ _id: { $in: storageIds } }).select('start_date').lean(),
  ]);
  const bMap = new Map(bookings.map((b) => [String(b._id), b]));
  const sMap = new Map(storages.map((s) => [String(s._id), s]));
  const notes = await AdjustmentNote.find({ invoice: { $in: invoices.map((i) => i._id) } }).sort({ createdAt: 1 });
  return invoices.map((inv) => {
    const risk = invoiceService.assessRisk(inv, serviceStart(inv, bMap, sMap));
    return inv.toPublicShape({
      ai_risk_level: risk.level,
      ai_risk_reason: risk.reason,
      ai_recommended_action: risk.action,
      risk_source: 'rules',
      adjustments: notes.filter((n) => String(n.invoice) === String(inv._id)).map((n) => n.toPublicShape()),
    });
  });
};

const getInvoices = asyncHandler(async (req, res) => {
  const list = await Invoice.find().sort({ createdAt: -1 }).limit(1000);
  res.json(await withRisk(list));
});

/** Mark paid (records the payment on the linked booking too) or void an unpaid invoice. */
const updateInvoiceStatus = asyncHandler(async (req, res) => {
  const { status, payment_method, payment_reference, notes } = req.body;
  const result = await bookingService.withTxn(async (session) => {
    const inv = await Invoice.findOne({ invoice_number: req.params.invoiceId }).session(session);
    if (!inv) throw notFound('Invoice not found.');

    if (status === 'paid') {
      if (inv.status === 'void') throw conflict('A void invoice cannot be paid. Issue a new invoice.');
      if (inv.status === 'paid') return inv;
      if (inv.booking) {
        const b = await Booking.findById(inv.booking).select('+access_code').session(session);
        await bookingService.applyPayment(b, { method: payment_method, reference: payment_reference }, req.user, session);
        await b.save({ session });
        await outbox.enqueue('upsert_booking', { row: bookingRow(b) }, session);
      } else if (inv.storage_booking) {
        const s = await StorageBooking.findById(inv.storage_booking).select('+access_code').session(session);
        await storageService.applyStoragePayment(s, { method: payment_method, reference: payment_reference }, req.user, session);
        await s.save({ session });
        await outbox.enqueue('upsert_storage', { row: storageRow(s) }, session);
      } else {
        inv.status = 'paid';
        inv.paid_at = new Date();
        inv.payments.push({ amount_cents: inv.amount_payable_cents, method: payment_method || 'Bank transfer / PayID', reference: payment_reference || '', recorded_by: req.user._id });
        await inv.save({ session });
      }
      if (notes) await Invoice.updateOne({ _id: inv._id }, { notes }, { session });
      return Invoice.findById(inv._id).session(session);
    }

    // void
    if (inv.status === 'paid') {
      throw conflict('This invoice is paid. Record a refund and issue an adjustment note instead of voiding it.');
    }
    if (inv.status === 'void') return inv;
    inv.status = 'void';
    inv.void_reason = notes || 'Voided by admin';
    inv.voided_at = new Date();
    await inv.save({ session });
    if (inv.booking) {
      const b = await Booking.findById(inv.booking).session(session);
      if (b && ['pending', 'approved', 'confirmed'].includes(b.status)) {
        b.status = 'cancelled';
        b.hold_expires_at = undefined;
        await bookingService.releaseAndVoid(b, inv.void_reason, session);
        await b.save({ session });
        await outbox.enqueue('upsert_booking', { row: bookingRow(b) }, session);
      }
    } else if (inv.storage_booking) {
      const s = await StorageBooking.findById(inv.storage_booking).session(session);
      if (s && ['pending', 'approved', 'confirmed'].includes(s.status)) {
        s.status = 'cancelled';
        s.hold_expires_at = undefined;
        await s.save({ session });
        await outbox.enqueue('upsert_storage', { row: storageRow(s) }, session);
      }
    }
    return inv;
  });
  const [shaped] = await withRisk([result]);
  res.json({ success: true, invoice: shaped });
});

const createCustomInvoice = asyncHandler(async (req, res) => {
  const inv = await bookingService.withTxn((session) => invoiceService.issueCustom(req.body, { session, issuedBy: req.user }));
  const [shaped] = await withRisk([inv]);
  res.status(201).json(shaped);
});

const askAssistant = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({ status: { $in: ['pending', 'paid'] } }).lean();
  const today = perthToday();
  const pending = invoices.filter((i) => i.status === 'pending');
  const paid = invoices.filter((i) => i.status === 'paid');
  const sum = (arr, f) => toDollars(arr.reduce((s, i) => s + (i[f] || 0), 0));
  const ctx = {
    today_perth: today,
    totals: {
      invoiced_inc_gst_aud: sum(invoices, 'total_inc_gst_cents'),
      paid_inc_gst_aud: sum(paid, 'total_inc_gst_cents'),
      gst_paid_aud: sum(paid, 'gst_cents'),
      outstanding_aud: sum(pending, 'amount_payable_cents'),
      bonds_received_aud: sum(paid, 'security_deposit_cents'),
    },
    outstanding: pending
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 25)
      .map((i) => ({
        invoice_number: i.invoice_number,
        customer: i.buyer?.name,
        business: i.buyer?.business_name,
        amount_payable: toDollars(i.amount_payable_cents),
        due_date: i.due_date,
        overdue: i.due_date < today,
      })),
  };
  res.json(await gemini.ask(req.body.query, ctx));
});

const refund = asyncHandler(async (req, res) => {
  const { note, invoice } = await refundService.refundInvoice(req.user, req.params.invoiceId, req.body);
  const [shaped] = await withRisk([invoice]);
  res.status(201).json({ adjustment_note: note.toPublicShape(), invoice: shaped });
});

const settleBond = asyncHandler(async (req, res) => {
  const inv = await refundService.settleBond(req.user, req.params.invoiceId, req.body);
  const [shaped] = await withRisk([inv]);
  res.json({ success: true, invoice: shaped });
});

const listAdjustmentNotes = asyncHandler(async (req, res) => {
  const notes = await AdjustmentNote.find().sort({ createdAt: -1 }).limit(1000);
  res.json(notes.map((n) => n.toPublicShape()));
});

const reconcileBankCsv = asyncHandler(async (req, res) => res.json(await reconcileService.reconcile(req.user, req.body)));

module.exports = { getInvoices, updateInvoiceStatus, createCustomInvoice, askAssistant, refund, settleBond, listAdjustmentNotes, reconcileBankCsv, withRisk };
