/**
 * Every route declares its guard explicitly. Public routes are listed first;
 * anything under /admin, /superadmin, /invoices and storage management
 * requires an authenticated admin role. test/security.test.js walks this
 * router and fails if an admin route is ever mounted without a guard.
 */
const express = require('express');
const multer = require('multer');
const schemas = require('../utils/schemas');
const validate = require('../middlewares/validate');
const { requireAuth, requireAdmin, requireSuperAdmin, requireVerifiedEmail } = require('../middlewares/auth');
const limit = require('../middlewares/rateLimiters');
const { isDbUp } = require('../config/db');
const documents = require('../services/documentService');

const auth = require('../controllers/authController');
const booking = require('../controllers/bookingController');
const admin = require('../controllers/adminController');
const storage = require('../controllers/storageController');
const enquiry = require('../controllers/enquiryController');
const invoice = require('../controllers/invoiceController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: documents.MAX_BYTES, files: 1 } });

// ---------- Health ----------
router.get('/health', (req, res) => {
  const up = isDbUp();
  res.status(up ? 200 : 503).json({ status: up ? 'healthy' : 'degraded', db: up ? 'up' : 'down', time: new Date().toISOString() });
});

// ---------- Public ----------
router.get('/config', booking.getConfig);
router.get('/availability', validate(schemas.dayQuery, 'query'), booking.getAvailability);
router.get('/availability/check', validate(schemas.slotCheck, 'query'), booking.checkSlot);
router.get('/month-availability', validate(schemas.monthQuery, 'query'), booking.getMonthAvailability);
router.get('/storage/availability', validate(schemas.storageQuery, 'query'), storage.availability);
router.post('/enquiries', limit.enquiryLimiter, validate(schemas.enquiryCreate), enquiry.createEnquiry);

// ---------- Customer auth ----------
router.post('/auth/signup', limit.signupLimiter, validate(schemas.signup), auth.signup);
router.post('/auth/login', limit.loginLimiter, validate(schemas.login), auth.login);
router.post('/auth/forgot-password', limit.signupLimiter, validate(schemas.forgotPassword), auth.forgotPassword);
router.post('/auth/reset-password', limit.loginLimiter, validate(schemas.resetPassword), auth.resetPassword);
router.post('/auth/verify-email', limit.loginLimiter, validate(schemas.verifyEmail), auth.verifyEmail);
router.post('/auth/resend-verification', requireAuth, limit.signupLimiter, auth.resendVerification);
router.post('/auth/2fa/setup', requireAuth, auth.setup2fa);
router.post('/auth/2fa/enable', requireAuth, limit.loginLimiter, validate(schemas.otpCode), auth.enable2fa);
router.post('/auth/2fa/disable', requireAuth, limit.loginLimiter, validate(schemas.disable2fa), auth.disable2fa);
router.get('/auth/me', requireAuth, auth.me);
router.put('/auth/profile', requireAuth, validate(schemas.profile), auth.updateProfile);
router.post('/auth/password', requireAuth, limit.loginLimiter, validate(schemas.changePassword), auth.changePassword);
router.get('/auth/bookings', requireAuth, auth.myBookings);
router.get('/auth/storage-bookings', requireAuth, auth.myStorageBookings);
router.get('/auth/invoices', requireAuth, auth.myInvoices);
router.post('/auth/documents/:kind', requireAuth, upload.single('file'), auth.uploadDocument);
router.get('/auth/documents/:kind', requireAuth, auth.downloadMyDocument);

// ---------- Customer bookings ----------
router.post('/bookings', requireAuth, requireVerifiedEmail, limit.bookingLimiter, validate(schemas.bookingCreate), booking.createBooking);
router.post('/bookings/recurring', requireAuth, requireVerifiedEmail, limit.bookingLimiter, validate(schemas.recurring), booking.createRecurring);
router.get('/bookings/:referenceCode', requireAuth, booking.getBookingByRef);
router.post('/bookings/:referenceCode/cancel', requireAuth, booking.cancelBooking);
router.post('/storage-bookings', requireAuth, requireVerifiedEmail, limit.bookingLimiter, validate(schemas.storageCreate), storage.create);

// ---------- Staff logins ----------
router.post('/admin/login', limit.loginLimiter, validate(schemas.adminLogin), auth.adminLogin);
router.post('/superadmin/login', limit.loginLimiter, validate(schemas.adminLogin), auth.superAdminLogin);

// ---------- Staff admin (staff_admin or super_admin) ----------
router.get('/admin/dashboard-stats', requireAdmin, admin.getDashboardStats);
router.get('/admin/bookings', requireAdmin, validate(schemas.adminBookingList, 'query'), admin.getAdminBookings);
router.patch('/admin/bookings/:id/status', requireAdmin, validate(schemas.adminBookingUpdate), admin.updateBookingStatus);
router.delete('/admin/bookings/:id', requireAdmin, admin.deleteBooking);
router.get('/admin/blocked-slots', requireAdmin, admin.getBlockedSlots);
router.post('/admin/blocked-slots', requireAdmin, validate(schemas.blockCreate), admin.createBlockedSlot);
router.delete('/admin/blocked-slots/:id', requireAdmin, admin.deleteBlockedSlot);
router.put('/admin/config', requireAdmin, validate(schemas.configUpdate), admin.updateConfig);
router.get('/admin/enquiries', requireAdmin, admin.getEnquiries);
router.patch(
  '/admin/enquiries/:id/status',
  requireAdmin,
  (req, res, next) => {
    if (!req.body?.status && req.query.status_val) req.body = { status: req.query.status_val };
    next();
  },
  validate(schemas.enquiryStatus),
  admin.updateEnquiryStatus
);
router.get('/admin/storage-bookings', requireAdmin, storage.listAll);
router.patch('/admin/storage-bookings/:refCode/status', requireAdmin, validate(schemas.adminBookingUpdate), storage.updateStatus);
router.get('/admin/users', requireAdmin, admin.getUsers);
router.get('/admin/users/:userId/documents/:kind', requireAdmin, auth.downloadUserDocument);

// ---------- Super admin (finance) ----------
router.get('/invoices', requireSuperAdmin, invoice.getInvoices);
router.post('/invoices', requireSuperAdmin, validate(schemas.customInvoice), invoice.createCustomInvoice);
router.patch('/invoices/:invoiceId/status', requireSuperAdmin, validate(schemas.invoiceStatus), invoice.updateInvoiceStatus);
router.post('/invoices/ai-query', requireSuperAdmin, limit.aiLimiter, validate(schemas.aiQuery), invoice.askAssistant);
router.get('/invoices/adjustment-notes', requireSuperAdmin, invoice.listAdjustmentNotes);
router.post('/invoices/reconcile', requireSuperAdmin, validate(schemas.reconcile), invoice.reconcileBankCsv);
router.post('/invoices/:invoiceId/refund', requireSuperAdmin, validate(schemas.refund), invoice.refund);
router.post('/invoices/:invoiceId/bond', requireSuperAdmin, validate(schemas.bondSettle), invoice.settleBond);

module.exports = router;
