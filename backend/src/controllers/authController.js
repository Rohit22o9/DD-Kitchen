const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { getJwtSecret } = require('../config/constants');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
};

/**
 * @desc    Register a new commercial kitchen hirer
 * @route   POST /api/auth/signup
 */
const signup = async (req, res, next) => {
  try {
    const {
      full_name,
      email,
      password,
      business_name,
      abn,
      phone,
      food_safety_cert_name,
      liability_insurance_name,
      terms_accepted,
    } = req.body;

    if (!full_name || !String(full_name).trim()) {
      return res.status(400).json({ success: false, error: 'Full name is required.' });
    }

    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }

    if (!password || String(password).length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
    }

    if (terms_accepted !== true) {
      return res.status(400).json({ success: false, error: 'You must accept the Commercial Kitchen Terms & Conditions.' });
    }

    // Check if user already exists
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email address already exists. Please log in.',
      });
    }

    const user = await User.create({
      full_name: String(full_name).trim(),
      email: cleanEmail,
      password,
      business_name: business_name || '',
      abn: abn || '',
      phone: phone || '',
      role: 'hirer',
      food_safety_cert_name: food_safety_cert_name || '',
      liability_insurance_name: liability_insurance_name || '',
      terms_accepted: true,
      terms_accepted_at: new Date(),
    });

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      access_token: token,
      token_type: 'bearer',
      user: user.toSafeJSON(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!cleanEmail || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password. Please verify your credentials.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password. Please verify your credentials.',
      });
    }

    const token = generateToken(user._id, user.role);

    return res.json({
      access_token: token,
      token_type: 'bearer',
      user: user.toSafeJSON(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get user's own bookings by email (authenticated & ownership-checked)
 * @route   GET /api/auth/bookings-by-email
 */
const getBookingsByEmail = async (req, res, next) => {
  try {
    const requestedEmail = String(req.query.email || req.user?.email || '').trim().toLowerCase();
    const isAdmin = req.user && (req.user.role === 'staff_admin' || req.user.role === 'super_admin');

    if (!isAdmin && requestedEmail !== String(req.user?.email || '').toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view your own bookings.',
      });
    }

    if (!requestedEmail) {
      return res.json([]);
    }

    const bookings = await Booking.find({ email: requestedEmail }).sort({ booking_date: 1, start_time: 1 });
    // Redact door_access_pin unless booking is both paid and confirmed
    const safeBookings = bookings.map((b) => {
      const obj = b.toObject();
      if (!(obj.payment_status === 'paid' && obj.status === 'confirmed')) {
        delete obj.door_access_pin;
      }
      return obj;
    });

    return res.json(safeBookings);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const allowed = ['full_name', 'business_name', 'abn', 'phone', 'food_safety_cert_name', 'liability_insurance_name'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        user[key] = req.body[key];
      }
    }

    await user.save();
    return res.json({ success: true, user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  signup,
  login,
  getBookingsByEmail,
  updateProfile,
};
