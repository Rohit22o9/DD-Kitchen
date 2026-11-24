const express = require('express');
const router = express.Router();
const {
  getStorageBookings,
  createStorageBooking,
  updateStorageStatus,
} = require('../controllers/storageController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

router.get('/storage-bookings', verifyToken, getStorageBookings);
router.post('/storage-bookings', verifyToken, createStorageBooking);
router.patch('/storage-bookings/:refCode/status', verifyToken, requireAdmin, updateStorageStatus);

module.exports = router;
