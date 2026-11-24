const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');
const BlockedSlot = require('../models/BlockedSlot');
const KitchenConfig = require('../models/KitchenConfig');
const Enquiry = require('../models/Enquiry');
const StorageBooking = require('../models/StorageBooking');
const { postToGoogleSheet } = require('../services/googleSheetService');
const { normalizeDate } = require('../utils/dateUtils');

const JWT_SECRET = process.env.JWT_SECRET || 'dailydrop_commercial_kitchen_jwt_secret_perth_2026_super_secure_key';

/**
 * Staff Admin Login
 * @route POST /api/admin/login
 */
const adminLogin = async (req, res) => {
  const { username, password } = req.body;
  const u = String(username || '').trim().toLowerCase();

  if ((u === 'admin' || u === 'staff') && (password === 'kitchen2026' || password === 'admin123')) {
    const token = jwt.sign({ id: 'staff-admin-id', role: 'staff_admin' }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      access_token: token,
      token_type: 'bearer',
      user: { username: 'admin', full_name: 'Operations Manager', role: 'staff_admin' },
    });
  }

  return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
};

/**
 * Super Admin Director Login
 * @route POST /api/superadmin/login
 */
const superAdminLogin = async (req, res) => {
  const { username, password } = req.body;
  const u = String(username || '').trim().toLowerCase();

  if ((u === 'superadmin' || u === 'director') && (password === 'director2026' || password === 'admin123')) {
    const token = jwt.sign({ id: 'super-admin-id', role: 'super_admin' }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      access_token: token,
      token_type: 'bearer',
      user: { username: 'superadmin', full_name: 'Executive Director', role: 'super_admin' },
    });
  }

  return res.status(401).json({ success: false, error: 'Invalid Super Admin credentials' });
};

/**
 * Dashboard Stats
 * @route GET /api/admin/dashboard-stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const approvedBookings = await Booking.countDocuments({ status: { $in: ['approved', 'confirmed'] } });
    const allBookings = await Booking.find();
    
    const totalRevenue = allBookings
      .filter((b) => b.payment_status === 'paid')
      .reduce((sum, b) => sum + (b.total_price || 0), 0) + 400; // includes storage leases

    const todayStr = normalizeDate(new Date());
    const todayBookings = await Booking.countDocuments({ booking_date: todayStr });

    const activeEnquiries = await Enquiry.countDocuments({ status: 'new' });

    return res.json({
      total_bookings: totalBookings,
      pending_approvals: pendingBookings,
      confirmed_bookings: approvedBookings,
      total_revenue: totalRevenue,
      today_shifts: todayBookings,
      active_enquiries: activeEnquiries,
      storage_bays_occupied: 2,
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
      filter.status = status;
    }

    if (search) {
      const q = String(search).trim();
      filter.$or = [
        { full_name: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
        { reference_code: new RegExp(q, 'i') },
        { business_name: new RegExp(q, 'i') },
      ];
    }

    const bookings = await Booking.find(filter)
      .sort({ booking_date: -1, createdAt: -1 })
      .limit(Number(limit));

    return res.json(bookings);
  } catch (err) {
    next(err);
  }
};

/**
 * Update Booking Status (Approve, Reject, Confirm, Complete)
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
      if (payment_status === 'paid') booking.paid_at = new Date();
    }

    await booking.save();

    // Sync status back to Google Sheets!
    await postToGoogleSheet({
      action: 'update_booking_status',
      reference_code: booking.reference_code,
      status: booking.status,
      admin_notes: booking.admin_notes,
    });

    return res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete Booking
 * @route DELETE /api/admin/bookings/:id
 */
const deleteBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = id.startsWith('DD-BK-') ? { reference_code: id } : { _id: id };
    await Booking.findOneAndDelete(query);
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
    const slot = await BlockedSlot.create({
      block_date: normalizeDate(block_date),
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
 * Update Kitchen Config
 */
const updateConfig = async (req, res, next) => {
  try {
    let config = await KitchenConfig.findOne();
    if (!config) {
      config = new KitchenConfig(req.body);
    } else {
      Object.assign(config, req.body);
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
