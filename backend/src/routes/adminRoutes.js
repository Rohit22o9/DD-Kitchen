const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');

// Staff Admin Auth
router.post('/admin/login', adminLogin);

// Super Admin Auth
router.post('/superadmin/login', superAdminLogin);

// Admin Operations
router.get('/admin/dashboard-stats', getDashboardStats);
router.get('/admin/bookings', getAdminBookings);
router.patch('/admin/bookings/:id/status', updateBookingStatus);
router.delete('/admin/bookings/:id', deleteBooking);

// Blocked Maintenance Slots
router.get('/admin/blocked-slots', getBlockedSlots);
router.post('/admin/blocked-slots', createBlockedSlot);
router.delete('/admin/blocked-slots/:id', deleteBlockedSlot);

// Pricing and Settings
router.put('/admin/config', updateConfig);

// Enquiries
router.get('/admin/enquiries', getEnquiries);
router.patch('/admin/enquiries/:id/status', updateEnquiryStatus);

module.exports = router;
