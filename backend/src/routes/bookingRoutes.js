const express = require('express');
const router = express.Router();
const {
  getConfig,
  getAvailability,
  getMonthAvailability,
  createBooking,
  getBookingByRef,
} = require('../controllers/bookingController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/config', getConfig);
router.get('/availability', getAvailability);
router.get('/month-availability', getMonthAvailability);
router.post('/bookings', verifyToken, createBooking);
router.get('/bookings/:referenceCode', verifyToken, getBookingByRef);

module.exports = router;
