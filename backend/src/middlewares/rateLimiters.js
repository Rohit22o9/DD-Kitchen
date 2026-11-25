const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const env = require('../config/env');
const MongoRateLimitStore = require('./mongoRateLimitStore');

/**
 * Production uses a MongoDB-backed store so limits hold across several API
 * instances (RATE_LIMIT_STORE=mongo, the default when NODE_ENV=production).
 * If the store is unreachable, requests are allowed rather than blocked.
 */
let n = 0;
const make = (windowMs, limit, message, keyGenerator) =>
  rateLimit({
    ...(env.rateLimitStore === 'mongo' ? { store: new MongoRateLimitStore(`rl${(n += 1)}`), passOnStoreError: true } : {}),
    windowMs,
    limit: env.isTest ? 10000 : limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, error: message },
    ...(keyGenerator ? { keyGenerator } : {}),
  });

const loginKey = (req) => `${ipKeyGenerator(req.ip)}:${String(req.body?.email || req.body?.username || '').toLowerCase()}`;

module.exports = {
  globalLimiter: make(60 * 1000, 300, 'Too many requests. Please slow down.'),
  loginLimiter: make(15 * 60 * 1000, 10, 'Too many login attempts. Try again in 15 minutes.', loginKey),
  signupLimiter: make(60 * 60 * 1000, 10, 'Too many sign-ups from this network. Try again later.'),
  bookingLimiter: make(60 * 60 * 1000, 30, 'Too many booking requests. Try again later.'),
  enquiryLimiter: make(60 * 60 * 1000, 10, 'Too many enquiries. Try again later.'),
  aiLimiter: make(60 * 60 * 1000, 30, 'AI assistant limit reached. Try again later.'),
};
