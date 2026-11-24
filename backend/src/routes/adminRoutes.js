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
const { verifyToken, requireAdmin, requireSuperAdmin } = require('../middlewares/authMiddleware');

// Staff Admin Auth (public login)
router.post('/admin/login', adminLogin);

// Super Admin Auth (public login)
router.post('/superadmin/login', superAdminLogin);

// Protected Admin Operations (require valid Staff Admin or Super Admin JWT)
router.get('/admin/dashboard-stats', verifyToken, requireAdmin, getDashboardStats);
router.get('/admin/bookings', verifyToken, requireAdmin, getAdminBookings);
router.patch('/admin/bookings/:id/status', verifyToken, requireAdmin, updateBookingStatus);
router.delete('/admin/bookings/:id', verifyToken, requireAdmin, deleteBooking);

// Blocked Maintenance Slots
router.get('/admin/blocked-slots', verifyToken, requireAdmin, getBlockedSlots);
router.post('/admin/blocked-slots', verifyToken, requireAdmin, createBlockedSlot);
router.delete('/admin/blocked-slots/:id', verifyToken, requireAdmin, deleteBlockedSlot);

// Pricing and Settings (Super Admin or Staff Admin)
router.put('/admin/config', verifyToken, requireAdmin, updateConfig);

// Enquiries
router.get('/admin/enquiries', verifyToken, requireAdmin, getEnquiries);
router.patch('/admin/enquiries/:id/status', verifyToken, requireAdmin, updateEnquiryStatus);

module.exports = router;
