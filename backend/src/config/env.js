/**
 * Environment configuration.
 *
 * Every setting is read and validated once, here. The server refuses to start
 * in production when a security-critical value is missing, instead of quietly
 * falling back to a default that ships in the repository.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { z } = require('zod');
const { isValidAbn, formatAbn } = require('../utils/abn');

const bool = (def) =>
  z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => (v === undefined || v === '' ? def : v === true || v === 'true' || v === '1'));

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : undefined));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8000),
  TRUST_PROXY: z.string().optional().default('0'),

  MONGODB_URI: optionalString,
  USE_IN_MEMORY_DB: bool(false),
  DB_CONNECT_RETRIES: z.coerce.number().int().min(1).default(10),

  JWT_SECRET: optionalString,
  JWT_EXPIRES_IN: z.string().default('8h'),

  CORS_ORIGINS: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),

  BOOKING_HOLD_HOURS: z.coerce.number().min(0).default(48),
  BOOKING_MAX_ADVANCE_DAYS: z.coerce.number().int().positive().default(365),
  TERMS_VERSION: z.string().default('2026-11'),

  GOOGLE_SHEET_WEBHOOK_URL: optionalString,
  GOOGLE_SHEET_WEBHOOK_SECRET: optionalString,

  // Public website URL, used in emailed links (password reset, email verification).
  APP_URL: z.string().default('http://localhost:5173'),
  // Transactional email. smtp(s)://user:pass@host:port — e.g. Postmark, SendGrid, SES SMTP.
  // When unset, emails go through the Google Apps Script webhook (if configured).
  SMTP_URL: optionalString,
  EMAIL_FROM: z.string().default('Daily Drop Kitchens <bookings@dailydrop.today>'),
  REQUIRE_EMAIL_VERIFICATION: bool(false),
  REQUIRE_ADMIN_2FA: bool(false),
  // Key for encrypting 2FA secrets at rest (32+ chars). Falls back to a key derived from JWT_SECRET.
  ENCRYPTION_KEY: optionalString,
  RATE_LIMIT_STORE: z.enum(['memory', 'mongo']).optional(),

  GEMINI_API_KEY: optionalString,
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),

  // Seller details printed on every tax invoice (snapshotted at issue time)
  SELLER_LEGAL_NAME: z.string().default('Daily Drop Commercial Kitchens Pty Ltd'),
  SELLER_TRADING_NAME: z.string().default('Daily Drop Commercial Kitchens'),
  SELLER_ABN: optionalString,
  SELLER_ADDRESS: z.string().default('Unit 1, 1 Lichfield St, Victoria Park WA 6101'),
  SELLER_EMAIL: z.string().default('hello@dailydrop.today'),
  SELLER_PHONE: z.string().default('0479 175 705'),
  INVOICE_DUE_DAYS: z.coerce.number().int().min(0).default(2),

  // Payment details shown to customers. Leave blank to hide them entirely.
  PAYMENT_ACCOUNT_NAME: optionalString,
  PAYMENT_BANK_NAME: optionalString,
  PAYMENT_BSB: optionalString,
  PAYMENT_ACCOUNT_NUMBER: optionalString,
  PAYMENT_PAYID: optionalString,

  STORAGE_BAY_COUNT: z.coerce.number().int().min(1).max(20).default(2),
  OUTBOX_POLL_MS: z.coerce.number().int().min(200).default(5000),
  HOLD_SWEEP_MS: z.coerce.number().int().min(1000).default(5 * 60 * 1000),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('[Config] Invalid environment:', parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
  process.exit(1);
}
const env = parsed.data;
const isProd = env.NODE_ENV === 'production';
const isTest = env.NODE_ENV === 'test';

const problems = [];

if (!env.JWT_SECRET) {
  if (isProd) problems.push('JWT_SECRET is required (32+ random characters).');
  else env.JWT_SECRET = require('crypto').randomBytes(48).toString('hex'); // dev/test only: new secret per boot
} else if (env.JWT_SECRET.length < 32) {
  problems.push('JWT_SECRET must be at least 32 characters.');
}

if (isProd && !env.MONGODB_URI) problems.push('MONGODB_URI is required in production.');
if (isProd && env.USE_IN_MEMORY_DB) problems.push('USE_IN_MEMORY_DB cannot be enabled in production.');

if (env.SELLER_ABN) {
  if (!isValidAbn(env.SELLER_ABN)) problems.push('SELLER_ABN fails the ABN checksum.');
  else env.SELLER_ABN = formatAbn(env.SELLER_ABN);
} else if (isProd) {
  problems.push('SELLER_ABN is required in production: tax invoices must show the seller ABN.');
}

if (env.ENCRYPTION_KEY && env.ENCRYPTION_KEY.length < 32) problems.push('ENCRYPTION_KEY must be at least 32 characters.');
if (isProd && !/^https:\/\//.test(env.APP_URL)) problems.push('APP_URL must be the https:// address of the website in production.');
if (env.REQUIRE_EMAIL_VERIFICATION && !env.SMTP_URL && !env.GOOGLE_SHEET_WEBHOOK_URL) {
  problems.push('REQUIRE_EMAIL_VERIFICATION needs an email channel: set SMTP_URL or GOOGLE_SHEET_WEBHOOK_URL.');
}

if (env.GOOGLE_SHEET_WEBHOOK_URL && !env.GOOGLE_SHEET_WEBHOOK_SECRET) {
  problems.push('GOOGLE_SHEET_WEBHOOK_SECRET is required when GOOGLE_SHEET_WEBHOOK_URL is set.');
}

if (problems.length) {
  // eslint-disable-next-line no-console
  console.error(`[Config] Refusing to start:\n - ${problems.join('\n - ')}`);
  process.exit(1);
}

const corsOrigins = env.CORS_ORIGINS.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const paymentDetails =
  env.PAYMENT_BSB || env.PAYMENT_PAYID
    ? {
        account_name: env.PAYMENT_ACCOUNT_NAME || env.SELLER_LEGAL_NAME,
        bank_name: env.PAYMENT_BANK_NAME || null,
        bsb: env.PAYMENT_BSB || null,
        account_number: env.PAYMENT_ACCOUNT_NUMBER || null,
        payid: env.PAYMENT_PAYID || null,
      }
    : null;

env.APP_URL = env.APP_URL.replace(/\/+$/, '');
const rateLimitStore = env.RATE_LIMIT_STORE || (isProd ? 'mongo' : 'memory');

const trustProxy = /^\d+$/.test(env.TRUST_PROXY) ? Number(env.TRUST_PROXY) : env.TRUST_PROXY;

module.exports = {
  ...env,
  isProd,
  isTest,
  corsOrigins,
  paymentDetails,
  rateLimitStore,
  hasEmailChannel: Boolean(env.SMTP_URL || env.GOOGLE_SHEET_WEBHOOK_URL),
  trustProxy,
  seller: {
    legal_name: env.SELLER_LEGAL_NAME,
    trading_name: env.SELLER_TRADING_NAME,
    abn: env.SELLER_ABN || null,
    address: env.SELLER_ADDRESS,
    email: env.SELLER_EMAIL,
    phone: env.SELLER_PHONE,
  },
};
