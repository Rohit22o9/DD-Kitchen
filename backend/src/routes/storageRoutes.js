const express = require('express');
const router = express.Router();
const {
  getStorageBookings,
  createStorageBooking,
  updateStorageStatus,
} = require('../controllers/storageController');

router.get('/storage-bookings', getStorageBookings);
router.post('/storage-bookings', createStorageBooking);
router.patch('/storage-bookings/:refCode/status', updateStorageStatus);

module.exports = router;
