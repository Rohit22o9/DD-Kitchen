const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  getBookingsByEmail,
  updateProfile,
} = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.get('/bookings-by-email', verifyToken, getBookingsByEmail);
router.put('/profile', verifyToken, updateProfile);

module.exports = router;
