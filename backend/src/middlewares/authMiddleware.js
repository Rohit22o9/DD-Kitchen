const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dailydrop_commercial_kitchen_jwt_secret_perth_2026_super_secure_key';

/**
 * Middleware to verify JWT token
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No authentication token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Support mock dev tokens if needed
    if (token.startsWith('dd_usr_') || token.startsWith('dd_adm_')) {
      req.user = { id: 'mock-user', role: token.startsWith('dd_adm_') ? 'staff_admin' : 'hirer' };
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'User no longer exists.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired authentication token.' });
  }
};

/**
 * Middleware requiring Staff Admin or Super Admin
 */
const requireAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user && (req.user.role === 'staff_admin' || req.user.role === 'super_admin')) {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: 'Permission denied. Requires administrative privileges.',
    });
  });
};

/**
 * Middleware requiring Super Admin (Executive Director)
 */
const requireSuperAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user && req.user.role === 'super_admin') {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: 'Permission denied. Requires Super Admin Executive privileges.',
    });
  });
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireSuperAdmin,
};
