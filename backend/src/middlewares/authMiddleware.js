const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../config/constants');

/**
 * Middleware to verify JWT token strictly against MongoDB User records
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
    const decoded = jwt.verify(token, getJwtSecret());
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
 * Optional auth middleware: attaches req.user if a valid token is present, otherwise continues
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, getJwtSecret());
      const user = await User.findById(decoded.id).select('-password');
      if (user) req.user = user;
    }
  } catch {
    // Ignore invalid optional token
  }
  next();
};

/**
 * Middleware requiring Staff Admin or Super Admin (assumes verifyToken already ran or runs it)
 */
const requireAdmin = (req, res, next) => {
  const checkRole = () => {
    if (req.user && (req.user.role === 'staff_admin' || req.user.role === 'super_admin')) {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: 'Permission denied. Requires administrative privileges.',
    });
  };

  if (req.user) return checkRole();
  return verifyToken(req, res, checkRole);
};

/**
 * Middleware requiring Super Admin (Executive Director)
 */
const requireSuperAdmin = (req, res, next) => {
  const checkRole = () => {
    if (req.user && req.user.role === 'super_admin') {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: 'Permission denied. Requires Super Admin Executive privileges.',
    });
  };

  if (req.user) return checkRole();
  return verifyToken(req, res, checkRole);
};

module.exports = {
  verifyToken,
  optionalAuth,
  requireAdmin,
  requireSuperAdmin,
};
