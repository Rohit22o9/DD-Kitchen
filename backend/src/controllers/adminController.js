const Booking = require('../models/Booking');
const BlockedSlot = require('../models/BlockedSlot');
const KitchenConfig = require('../models/KitchenConfig');
const Enquiry = require('../models/Enquiry');
const StorageBooking = require('../models/StorageBooking');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const bookingService = require('../services/bookingService');
const { toDollars } = require('../utils/money');
const { perthToday, startOfPerthDay, endOfPerthDay } = require('../utils/perthTime');
const { asyncHandler, escapeRegExp, notFound, conflict } = require('../utils/httpError');

/** Real numbers from the database (the old dashboard added a hard-coded $400). */
const getDashboardStats = asyncHandler(async (req, res) => {
  const today = perthToday();
  const [byStatus, revenue, hours, todayCount, enquiries, newEnquiries, storageActive, outstanding] = await Promise.all([
    Booking.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    Invoice.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: null,
          // Net of refunds (adjustment notes), plus retained bonds, which become taxable when forfeited.
          inc: { $sum: { $add: [{ $subtract: ['$total_inc_gst_cents', { $ifNull: ['$refunded_cents', 0] }] }, { $ifNull: ['$bond.forfeited_cents', 0] }] } },
          gst: { $sum: { $add: [{ $subtract: ['$gst_cents', { $ifNull: ['$refunded_gst_cents', 0] }] }, { $ifNull: ['$bond.forfeit_gst_cents', 0] }] } },
          bonds_held: {
            $sum: { $cond: [{ $eq: [{ $ifNull: ['$bond.status', 'held'] }, 'held'] }, '$security_deposit_cents', 0] },
          },
        },
      },
    ]),
    Booking.aggregate([
      { $match: { status: { $in: ['pending', 'approved', 'confirmed', 'completed'] } } },
      { $group: { _id: null, h: { $sum: '$duration_hours' }, pipeline: { $sum: '$total_cents' } } },
    ]),
    Booking.countDocuments({
      status: { $in: ['pending', 'approved', 'confirmed'] },
      start_at: { $lt: endOfPerthDay(today) },
      end_at: { $gt: startOfPerthDay(today) },
    }),
    Enquiry.countDocuments(),
    Enquiry.countDocuments({ status: 'new' }),
    StorageBooking.countDocuments({ status: { $in: ['pending', 'approved', 'confirmed'] }, start_date: { $lte: today }, occupied_until: { $gt: today } }),
    Invoice.aggregate([{ $match: { status: 'pending' } }, { $group: { _id: null, c: { $sum: '$amount_payable_cents' } } }]),
  ]);
  const count = (s) => byStatus.find((x) => x._id === s)?.n || 0;
  const total = byStatus.reduce((s, x) => s + x.n, 0);
  const paid = toDollars(revenue[0]?.inc || 0);
  res.json({
    total_bookings: total,
    pending_requests: count('pending'),
    pending_bookings: count('pending'),
    pending_approvals: count('pending'),
    approved_count: count('approved'),
    confirmed_count: count('confirmed'),
    confirmed_bookings: count('confirmed'),
    completed_count: count('completed'),
    cancelled_count: count('cancelled') + count('rejected') + count('expired'),
    total_confirmed_revenue: paid,
    total_revenue: paid,
    total_revenue_aud: paid,
    gst_collected: toDollars(revenue[0]?.gst || 0),
    bonds_held: toDollars(revenue[0]?.bonds_held || 0),
    pipeline_revenue: toDollars(hours[0]?.pipeline || 0),
    total_hours_booked: hours[0]?.h || 0,
    outstanding_amount: toDollars(outstanding[0]?.c || 0),
    today_shifts: todayCount,
    total_enquiries: enquiries,
    new_enquiries: newEnquiries,
    active_enquiries: newEnquiries,
    storage_bays_occupied: storageActive,
  });
});

const getAdminBookings = asyncHandler(async (req, res) => {
  const { status, search, limit } = req.validatedQuery;
  const filter = {};
  if (status && status !== 'all') filter.status = status === 'pending_approval' ? 'pending' : status;
  if (search) {
    const rx = new RegExp(escapeRegExp(search.trim()), 'i');
    filter.$or = [{ full_name: rx }, { email: rx }, { reference_code: rx }, { business_name: rx }];
  }
  const list = await Booking.find(filter).select('+access_code').sort({ start_at: -1 }).limit(limit);
  res.json(list.map((b) => b.toPublicShape({ admin: true, includeAccessCode: true })));
});

const updateBookingStatus = asyncHandler(async (req, res) => {
  const b = await bookingService.adminUpdateBooking(req.user, req.params.id, req.body);
  res.json(b.toPublicShape({ admin: true, includeAccessCode: true }));
});

/**
 * "Delete" from the admin panel cancels the booking and frees its slots.
 * Financial records are never hard-deleted once an invoice exists.
 */
const deleteBooking = asyncHandler(async (req, res) => {
  const b = await bookingService.findBookingByIdOrRef(req.params.id);
  if (!b) throw notFound('Booking not found.');
  if (['pending', 'approved', 'confirmed'].includes(b.status)) {
    const updated = await bookingService.adminUpdateBooking(req.user, req.params.id, { status: 'cancelled' });
    return res.json({ success: true, cancelled: true, booking: updated.toPublicShape({ admin: true }) });
  }
  if (b.invoice) throw conflict('This booking has an invoice and is kept for tax records.');
  await bookingService.withTxn(async (session) => {
    await bookingService.releaseAndVoid(b, 'Deleted', session);
    await Booking.deleteOne({ _id: b._id }, { session });
  });
  return res.json({ success: true, deleted: true });
});

const getBlockedSlots = asyncHandler(async (req, res) => {
  const list = await BlockedSlot.find({ end_at: { $gte: new Date(Date.now() - 90 * 86400000) } }).sort({ start_at: 1 });
  res.json(list.map((b) => b.toPublicShape()));
});

const createBlockedSlot = asyncHandler(async (req, res) => {
  const block = await bookingService.createBlock(req.user, req.body);
  res.status(201).json(block.toPublicShape());
});

const deleteBlockedSlot = asyncHandler(async (req, res) => {
  await bookingService.deleteBlock(req.params.id);
  res.json({ success: true });
});

const updateConfig = asyncHandler(async (req, res) => {
  const config = await KitchenConfig.get();
  // req.body has already been reduced to a whitelist by the validator.
  config.set(req.body);
  await config.save();
  res.json(config.toObject({ versionKey: false }));
});

/** Customer accounts with compliance-document status, for the staff directory. */
const getUsers = asyncHandler(async (req, res) => {
  const filter = { role: 'hirer' };
  const q = String(req.query.search || '').trim().slice(0, 100);
  if (q) {
    const rx = new RegExp(escapeRegExp(q), 'i');
    filter.$or = [{ full_name: rx }, { email: rx }, { business_name: rx }];
  }
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(500);
  res.json(users.map((u) => u.toSafeJSON()));
});

const getEnquiries = asyncHandler(async (req, res) => {
  const list = await Enquiry.find().sort({ createdAt: -1 }).limit(500);
  res.json(list.map((e) => e.toPublicShape()));
});

const updateEnquiryStatus = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
  if (!enquiry) throw notFound('Enquiry not found.');
  res.json({ success: true, enquiry: enquiry.toPublicShape() });
});

module.exports = {
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
  getUsers,
};
