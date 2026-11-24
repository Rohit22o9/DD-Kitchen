const Booking = require('../models/Booking');
const BookingSlot = require('../models/BookingSlot');
const StorageBooking = require('../models/StorageBooking');
const Invoice = require('../models/Invoice');
const { queryGeminiWatchdog } = require('../services/geminiService');
const { createInvoiceForBooking, createInvoiceForStorage } = require('../services/invoiceService');
const { calculateBookingPricing } = require('../services/pricingService');
const { isShiftWithin24Hours } = require('../utils/dateUtils');
const { generateDoorPin } = require('../config/constants');

/**
 * @desc    Get persisted ATO invoices (Admins see all; Hirers see strictly their own)
 * @route   GET /api/invoices
 */
const getInvoices = async (req, res, next) => {
  try {
    const isAdmin = req.user && (req.user.role === 'staff_admin' || req.user.role === 'super_admin');

    // Backfill any legacy seeded bookings/storages that don't yet have a persisted Invoice document
    if (isAdmin) {
      const existingRefs = new Set((await Invoice.find().select('booking_reference').lean()).map((i) => i.booking_reference));
      const bookings = await Booking.find().lean();
      for (const b of bookings) {
        if (!existingRefs.has(b.reference_code)) {
          const pricing = calculateBookingPricing(b.duration_hours || 4, {
            hourly_rental_rate: b.hourly_rate || 38,
            min_rental_hours: 4,
            cleaning_fee: b.cleaning_fee || 0,
            security_deposit: b.security_deposit || 750,
          });
          const inv = await createInvoiceForBooking(b, pricing);
          if (b.payment_status === 'paid') {
            inv.status = 'paid';
            inv.paid_at = b.paid_at || new Date();
            await inv.save();
          } else if (b.status === 'rejected' || b.status === 'cancelled') {
            inv.status = 'void';
            await inv.save();
          }
        }
      }

      const storages = await StorageBooking.find().lean();
      for (const s of storages) {
        if (!existingRefs.has(s.reference_code)) {
          const inv = await createInvoiceForStorage(s);
          if (s.payment_status === 'paid') {
            inv.status = 'paid';
            inv.paid_at = new Date();
            await inv.save();
          }
        }
      }
    }

    const filter = isAdmin ? {} : { email: String(req.user?.email || '').toLowerCase() };
    const invoices = await Invoice.find(filter).sort({ createdAt: -1 });
    return res.json(invoices);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update persisted invoice status (Mark paid, void/release slot)
 * @route   PATCH /api/invoices/:invoiceId/status
 */
const updateInvoiceStatus = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;
    const { status, payment_method, notes } = req.body;

    const invoice = await Invoice.findOne({
      $or: [
        { invoice_number: invoiceId },
        ...(invoiceId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: invoiceId }] : []),
      ],
    });

    if (!invoice) {
      return res.status(404).json({ success: false, error: `Invoice ${invoiceId} not found.` });
    }

    if (status) invoice.status = status;
    if (payment_method) invoice.payment_method = payment_method;
    if (notes !== undefined) invoice.notes = notes;
    if (status === 'paid') {
      invoice.paid_at = new Date();
    }
    await invoice.save();

    // Sync linked Booking or StorageBooking
    if (invoice.booking_type === 'kitchen_rental') {
      const booking = await Booking.findOne({ reference_code: invoice.booking_reference });
      if (booking) {
        if (status === 'paid') {
          booking.payment_status = 'paid';
          booking.paid_at = invoice.paid_at;
          booking.payment_method = payment_method || 'PayID Direct Bank Transfer';
          booking.status = 'confirmed';
          if (!booking.door_access_pin) {
            const pin = generateDoorPin();
            booking.door_access_pin = pin;
            booking.door_pin_code = pin;
          }
        } else if (status === 'void') {
          booking.status = 'cancelled';
          booking.admin_notes = notes || 'Voided by Super Admin';
          await BookingSlot.deleteMany({ booking_id: booking._id });
        }
        await booking.save();
      }
    } else if (invoice.booking_type === 'storage_lease') {
      const storage = await StorageBooking.findOne({ reference_code: invoice.booking_reference });
      if (storage) {
        if (status === 'paid') {
          storage.payment_status = 'paid';
          storage.status = 'confirmed';
        } else if (status === 'void') {
          storage.status = 'cancelled';
        }
        await storage.save();
      }
    }

    return res.json({ success: true, invoice, message: `Invoice ${invoice.invoice_number} updated to ${status}` });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Ask Agentic AI Copilot (Gemini / Watchdog) — Admin Only, Real Ledger Data
 * @route   POST /api/invoices/ai-query
 */
const askAiCopilot = async (req, res, next) => {
  try {
    const { query } = req.body;
    const invoices = await Invoice.find({ status: { $ne: 'void' } }).lean();
    const bookings = await Booking.find().lean();

    const totalInvoiced = invoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
    const paidRevenue = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
    const pendingAmount = Math.max(0, totalInvoiced - paidRevenue);
    const bondsHeld = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + (Number(inv.security_deposit) || 0), 0);

    const urgent = bookings.filter(
      (b) =>
        b.status !== 'cancelled' &&
        b.status !== 'rejected' &&
        b.payment_status !== 'paid' &&
        isShiftWithin24Hours(b.booking_date, b.start_time)
    );

    const ctx = {
      totalInvoicedAUD: totalInvoiced.toFixed(2),
      paidRevenueAUD: paidRevenue.toFixed(2),
      pendingRevenueAUD: pendingAmount.toFixed(2),
      bondsHeldAUD: bondsHeld.toFixed(2),
      totalInvoicesCount: invoices.length,
      urgentAttentionCount: urgent.length,
      urgentTenants: urgent.map((u) => ({
        tenant: u.full_name,
        business: u.business_name,
        amount: u.total_price,
      })),
    };

    const aiRes = await queryGeminiWatchdog(query || 'Financial summary', ctx);
    return res.json(aiRes);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getInvoices,
  updateInvoiceStatus,
  askAiCopilot,
};
