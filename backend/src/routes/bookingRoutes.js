const express = require('express');
const router = express.Router();
const {
  getConfig,
  getAvailability,
  getMonthAvailability,
  createBooking,
  getBookingByRef,
} = require('../controllers/bookingController');

router.get('/config', getConfig);
router.get('/availability', getAvailability);
router.get('/month-availability', getMonthAvailability);
router.post('/bookings', createBooking);
router.get('/bookings/:referenceCode', getBookingByRef);

module.exports = router;
