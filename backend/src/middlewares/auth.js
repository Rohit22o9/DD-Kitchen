const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const { unauthorized, forbidden, HttpError } = require('../utils/httpError');

const JWT_OPTS = { issuer: 'dailydrop-api', audience: 'dailydrop-web' };

const signToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role, tv: user.token_version || 0 }, env.JWT_SECRET, {
    ...JWT_OPTS,
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN,
  });

/**
 * Resolve the bearer token to a live user record. Role and token version are
 * always read from the database, so demoting a user or changing a password
 * takes effect immediately.
 */
const resolveUser = async (req) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  if (!token) return null;

  let claims;
  try {
    claims = jwt.verify(token, env.JWT_SECRET, { ...JWT_OPTS, algorithms: ['HS256'] });
  } catch {
    throw unauthorized('Your session is invalid or has expired. Please log in again.');
  }
  if (!claims.sub || !mongoose.isValidObjectId(claims.sub)) {
    throw unauthorized('Your session is invalid. Please log in again.');
  }
  const user = await User.findById(claims.sub);
  if (!user || (user.token_version || 0) !== (claims.tv || 0)) {
    throw unauthorized('Your session is no longer valid. Please log in again.');
  }
  return user;
};

const requireAuth = async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    if (!user) throw unauthorized();
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

const requireRole =
  (...roles) =>
  async (req, res, next) => {
    try {
      const user = req.user || (await resolveUser(req));
      if (!user) throw unauthorized();
      req.user = user;
      if (!roles.includes(user.role)) throw forbidden();
      if (env.REQUIRE_ADMIN_2FA && isAdmin(user) && !user.totp_enabled) {
        throw new HttpError(403, 'Set up two-factor authentication to use the staff portals.', { two_factor_setup_required: true });
      }
      next();
    } catch (err) {
      next(err);
    }
  };

const requireAdmin = requireRole('staff_admin', 'super_admin');
const requireSuperAdmin = requireRole('super_admin');

function isAdmin(user) {
  return Boolean(user && ['staff_admin', 'super_admin'].includes(user.role));
}

/** Bookings need a confirmed email address when REQUIRE_EMAIL_VERIFICATION is on. */
const requireVerifiedEmail = (req, res, next) => {
  if (env.REQUIRE_EMAIL_VERIFICATION && req.user && !req.user.email_verified_at && !isAdmin(req.user)) {
    return next(new HttpError(403, 'Please confirm your email address first — check your inbox for the link.', { email_verification_required: true }));
  }
  return next();
};

module.exports = { signToken, requireAuth, requireRole, requireAdmin, requireSuperAdmin, requireVerifiedEmail, isAdmin };
