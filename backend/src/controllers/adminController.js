const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Booking = require('../models/Booking');
const BookingSlot = require('../models/BookingSlot');
const BlockedSlot = require('../models/BlockedSlot');
const KitchenConfig = require('../models/KitchenConfig');
const Enquiry = require('../models/Enquiry');
const StorageBooking = require('../models/StorageBooking');
const Invoice = require('../models/Invoice');
const { postToGoogleSheet } = require('../services/googleSheetService');
const { normalizeDate } = require('../utils/dateUtils');
const { getJwtSecret, generateDoorPin } = require('../config/constants');

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Staff Admin Login (Authenticated strictly against MongoDB User records)
 * @route POST /api/admin/login
 */
const adminLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const rawIdentifier = String(username || '').trim().toLowerCase();

    if (!rawIdentifier || !password) {
      return res.status(400).json({ success: false, error: 'Username/email and password are required.' });
    }

    const emailLookup = rawIdentifier === 'admin' ? 'admin@dailydrop.today' : rawIdentifier;
    const user = await User.findOne({
      email: emailLookup,
      role: { $in: ['staff_admin', 'super_admin'] },
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, getJwtSecret(), { expiresIn: '7d' });
    return res.json({
      access_token: token,
      token_type: 'bearer',
      user: user.toSafeJSON(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Super Admin Director Login (Authenticated strictly against MongoDB User records)
 * @route POST /api/superadmin/login
 */
const superAdminLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const rawIdentifier = String(username || '').trim().toLowerCase();

    if (!rawIdentifier || !password) {
      return res.status(400).json({ success: false, error: 'Username/email and password are required.' });
    }

    const emailLookup =
      rawIdentifier === 'superadmin' || rawIdentifier === 'director'
        ? 'director@dailydrop.today'
        : rawIdentifier;

    const user = await User.findOne({
      email: emailLookup,
      role: 'super_admin',
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, error: 'Invalid Super Admin credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, getJwtSecret(), { expiresIn: '7d' });
    return res.json({
      access_token: token,
      token_type: 'bearer',
      user: user.toSafeJSON(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Dashboard Stats (100% real MongoDB aggregations — zero fabricated numbers)
 * @route GET /api/admin/dashboard-stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const approvedBookings = await Booking.countDocuments({ status: { $in: ['approved', 'confirmed'] } });

    const paidBookings = await Booking.find({ payment_status: 'paid' }).select('total_price').lean();
    const paidStorages = await StorageBooking.find({ payment_status: 'paid' }).select('total_price').lean();

    const bookingRevenue = paidBookings.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
    const storageRevenue = paidStorages.reduce((sum, s) => sum + (Number(s.total_price) || 0), 0);
    const totalRevenue = Number((bookingRevenue + storageRevenue).toFixed(2));

    const todayStr = normalizeDate(new Date());
    const todayBookings = await Booking.countDocuments({ booking_date: todayStr });
    const activeEnquiries = await Enquiry.countDocuments({ status: 'new' });
    const storageOccupied = await StorageBooking.countDocuments({ status: { $in: ['confirmed', 'approved'] } });

    return res.json({
      total_bookings: totalBookings,
      pending_approvals: pendingBookings,
      confirmed_bookings: approvedBookings,
      total_revenue: totalRevenue,
      today_shifts: todayBookings,
      active_enquiries: activeEnquiries,
      storage_bays_occupied: storageOccupied,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Filtered Bookings for Admin
 * @route GET /api/admin/bookings
 */
const getAdminBookings = async (req, res, next) => {
  try {
    const { status, search, limit = 50 } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = String(status);
    }

    if (search) {
      const q = escapeRegex(String(search).trim());
      if (q) {
        const regex = new RegExp(q, 'i');
        filter.$or = [
          { full_name: regex },
          { email: regex },
          { reference_code: regex },
          { business_name: regex },
        ];
      }
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const bookings = await Booking.find(filter)
      .sort({ booking_date: -1, createdAt: -1 })
      .limit(parsedLimit);

    return res.json(bookings);
  } catch (err) {
    next(err);
  }
};

/**
 * Update Booking Status (Approve, Reject, Confirm, Complete)
 * Releases BookingSlot locks when cancelled/rejected; issues unique PIN when paid & confirmed.
 * @route PATCH /api/admin/bookings/:id/status
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, admin_notes, payment_status } = req.body;

    const query = id.startsWith('DD-BK-') ? { reference_code: id } : { _id: id };
    const booking = await Booking.findOne(query);

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (status) booking.status = status;
    if (admin_notes !== undefined) booking.admin_notes = admin_notes;
    if (payment_status) {
      booking.payment_status = payment_status;
      if (payment_status === 'paid' && !booking.paid_at) {
        booking.paid_at = new Date();
      }
    }

    // Issue unique per-booking PIN only when both confirmed and paid
    if (booking.status === 'confirmed' && booking.payment_status === 'paid' && !booking.door_access_pin) {
      const pin = generateDoorPin();
      booking.door_access_pin = pin;
      booking.door_pin_code = pin;
    }

    await booking.save();

    // Release slot locks if cancelled or rejected
    if (booking.status === 'cancelled' || booking.status === 'rejected') {
      await BookingSlot.deleteMany({ booking_id: booking._id });
      await Invoice.updateOne(
        { booking_reference: booking.reference_code },
        { $set: { status: 'void' } }
      );
    } else if (booking.payment_status === 'paid') {
      await Invoice.updateOne(
        { booking_reference: booking.reference_code },
        { $set: { status: 'paid', paid_at: booking.paid_at || new Date() } }
      );
    }

    postToGoogleSheet({
      action: 'update_booking_status',
      reference_code: booking.reference_code,
      status: booking.status,
      admin_notes: booking.admin_notes,
    }).catch(() => {});

    return res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete Booking & Release its Slot Locks
 * @route DELETE /api/admin/bookings/:id
 */
const deleteBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = id.startsWith('DD-BK-') ? { reference_code: id } : { _id: id };
    const booking = await Booking.findOneAndDelete(query);
    if (booking) {
      await BookingSlot.deleteMany({ booking_id: booking._id });
      await Invoice.updateOne(
        { booking_reference: booking.reference_code },
        { $set: { status: 'void' } }
      );
    }
    return res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * Blocked Slots Management
 */
const getBlockedSlots = async (req, res, next) => {
  try {
    const slots = await BlockedSlot.find().sort({ block_date: 1 });
    return res.json(slots);
  } catch (err) {
    next(err);
  }
};

const createBlockedSlot = async (req, res, next) => {
  try {
    const { block_date, start_time, end_time, reason } = req.body;
    const cleanDate = normalizeDate(block_date);
    if (!cleanDate) {
      return res.status(400).json({ success: false, error: 'Valid block_date (YYYY-MM-DD) is required.' });
    }
    const slot = await BlockedSlot.create({
      block_date: cleanDate,
      start_time: start_time || '00:00',
      end_time: end_time || '23:59',
      reason: reason || 'Facility Sanitization & Deep Clean',
    });
    return res.status(201).json(slot);
  } catch (err) {
    next(err);
  }
};

const deleteBlockedSlot = async (req, res, next) => {
  try {
    await BlockedSlot.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Blocked slot deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * Update Kitchen Config (strictly whitelisted fields)
 */
const updateConfig = async (req, res, next) => {
  try {
    const allowedFields = [
      'hourly_rental_rate',
      'min_rental_hours',
      'operating_hours_start',
      'operating_hours_end',
      'cleaning_fee',
      'security_deposit',
      'facility_name',
      'facility_address',
      'kitchen_phone',
      'kitchen_email',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    let config = await KitchenConfig.findOne();
    if (!config) {
      config = new KitchenConfig(updates);
    } else {
      Object.assign(config, updates);
    }
    await config.save();
    return res.json(config);
  } catch (err) {
    next(err);
  }
};

/**
 * Enquiries Management
 */
const getEnquiries = async (req, res, next) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    return res.json(enquiries);
  } catch (err) {
    next(err);
  }
};

const updateEnquiryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const status = req.query.status_val || req.body.status;
    const enquiry = await Enquiry.findByIdAndUpdate(id, { status }, { new: true });
    return res.json({ success: true, enquiry });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  adminLogin,
  superAdminLogin,
  getDashboardStats,
  getAdminBookings,
  updateBookingStatus,
  deleteBooking,
  getBlockedSlots,
  createBlockedSlot,
  deleteBlockedSlot,
  updateConfig,
  getEnquiries,
  updateEnquiryStatus,
};
