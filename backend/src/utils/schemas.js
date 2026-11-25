const { z } = require('zod');
const { isValidAbn } = require('./abn');
const { isValidDateStr, isValidTimeStr } = require('./perthTime');
const { BOOKING_STATUSES, STORAGE_TYPES, STORAGE_DURATION_TYPES } = require('../config/constants');

const str = (max) => z.string().trim().max(max);
const optStr = (max) => str(max).optional();
const email = z.string().trim().toLowerCase().email('Enter a valid email address.').max(254);
const date = z.string().refine(isValidDateStr, 'Use a valid date in YYYY-MM-DD format.');
const time = z.string().refine(isValidTimeStr, 'Use a valid time in HH:mm format.');
const abn = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || isValidAbn(v), 'ABN is not valid (it fails the ATO checksum).');
const phone = z
  .string()
  .trim()
  .min(6, 'Enter a phone number.')
  .max(32)
  .regex(/^[+0-9 ()-]+$/, 'Phone number can only contain digits, spaces, +, - and brackets.')
  .refine((v) => v.replace(/\D/g, '').length >= 8, 'Enter a full phone number.');
const termsAccepted = z.literal(true, { error: 'You must accept the Terms & Conditions.' });
const money = z.coerce.number().min(0).max(1_000_000);

const schemas = {
  signup: z.object({
    full_name: str(120).min(1, 'Full name is required.'),
    email,
    password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
    business_name: optStr(160),
    abn,
    phone: phone.optional().or(z.literal('').transform(() => undefined)),
    terms_accepted: termsAccepted,
  }),
  login: z.object({ email, password: z.string().min(1).max(128), otp: z.string().trim().max(10).optional() }),
  adminLogin: z
    .object({
      username: z.string().trim().toLowerCase().max(254).optional(),
      email: email.optional(),
      password: z.string().min(1).max(128),
      otp: z.string().trim().max(10).optional(),
    })
    .transform((v) => ({ email: v.email || v.username || '', password: v.password, otp: v.otp })),
  forgotPassword: z.object({ email }),
  resetPassword: z.object({
    token: z.string().regex(/^[a-f0-9]{64}$/, 'This reset link is invalid.'),
    new_password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
  }),
  verifyEmail: z.object({ token: z.string().regex(/^[a-f0-9]{64}$/, 'This verification link is invalid.') }),
  otpCode: z.object({ code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code from your authenticator app.') }),
  disable2fa: z.object({ password: z.string().min(1).max(128), code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code.') }),
  profile: z.object({
    full_name: optStr(120),
    business_name: optStr(160),
    abn,
    phone: phone.optional(),
  }),
  changePassword: z.object({
    current_password: z.string().min(1).max(128),
    new_password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
  }),

  bookingCreate: z.object({
    full_name: optStr(120),
    business_name: optStr(160),
    abn,
    email: z.string().optional(), // ignored: bookings use the account email
    phone,
    booking_date: date,
    start_time: time,
    duration_hours: z.coerce.number(),
    intended_use: str(200).default('Commercial Food Production'),
    team_size: z.coerce.number().int().min(1).max(50).default(1),
    equipment_requirements: optStr(500),
    additional_notes: optStr(2000),
    terms_accepted: termsAccepted,
  }),
  recurring: z.object({
    full_name: optStr(120),
    business_name: optStr(160),
    abn,
    phone,
    booking_date: date,
    start_time: time,
    duration_hours: z.coerce.number(),
    frequency: z.enum(['weekly', 'fortnightly']),
    occurrences: z.coerce.number().int().min(2).max(12),
    intended_use: str(200).default('Commercial Food Production'),
    team_size: z.coerce.number().int().min(1).max(50).default(1),
    additional_notes: optStr(2000),
    terms_accepted: termsAccepted,
  }),
  refund: z.object({
    amount: z.coerce.number().positive().max(1_000_000),
    reason: str(500).min(3, 'Give a reason for the refund.'),
    method: optStr(80),
    reference: optStr(120),
    cancel_booking: z.boolean().optional(),
  }),
  bondSettle: z.object({
    refund_amount: z.coerce.number().min(0).max(1_000_000),
    forfeit_amount: z.coerce.number().min(0).max(1_000_000).default(0),
    reason: optStr(500),
    reference: optStr(120),
  }),
  reconcile: z.object({ csv: z.string().min(1).max(2_000_000), apply: z.boolean().default(false) }),
  slotCheck: z.object({ booking_date: date, start_time: time, duration_hours: z.coerce.number() }),
  dayQuery: z.object({ date }),
  monthQuery: z.object({ year: z.coerce.number().int().min(2020).max(2100), month: z.coerce.number().int().min(1).max(12) }),

  adminBookingUpdate: z.object({
    status: z.enum(BOOKING_STATUSES).optional(),
    payment_status: z.enum(['unpaid', 'paid', 'refunded']).optional(),
    admin_notes: optStr(2000),
    access_code: z.string().regex(/^\d{4,8}#?$/, 'Access code must be 4-8 digits, optionally ending in #.').optional(),
    payment_method: optStr(80),
    payment_reference: optStr(120),
  }),
  adminBookingList: z.object({
    status: z.string().max(40).optional(),
    search: z.string().max(100).optional(),
    limit: z.coerce.number().int().min(1).max(500).default(200),
  }),
  blockCreate: z.object({
    block_date: date,
    start_time: time.default('00:00'),
    end_time: z.union([time, z.literal('24:00')]).default('24:00'),
    reason: optStr(300),
  }),
  configUpdate: z
    .object({
      hourly_rental_rate: money.optional(),
      min_rental_hours: z.coerce.number().min(0.5).max(24).optional(),
      packages: z
        .array(z.object({ hours: z.coerce.number().min(0.5).max(24), price: money, label: optStr(80) }))
        .max(12)
        .optional(),
      operating_hours_start: time.optional(),
      operating_hours_end: z.union([time, z.literal('24:00')]).optional(),
      cleaning_fee: money.optional(),
      security_deposit: money.optional(),
      kitchen_name: optStr(160),
      kitchen_address: optStr(300),
      kitchen_phone: optStr(40),
      kitchen_email: email.optional(),
      kitchen_whatsapp: optStr(40),
    })
    .strip(),

  enquiryCreate: z
    .object({
      full_name: optStr(120),
      name: optStr(120),
      email,
      phone: optStr(32),
      business_name: optStr(160),
      preferred_contact: optStr(40),
      rental_type: optStr(120),
      preferred_date: optStr(40),
      estimated_hours: optStr(40),
      business_type: optStr(120),
      registered_in_victoria_park: z.union([z.boolean(), z.string()]).optional(),
      message: str(5000).min(1, 'Please include a message.'),
      website: z.string().max(0, 'Spam check failed.').optional(), // honeypot
    })
    .refine((v) => v.full_name || v.name, { message: 'Name is required.', path: ['full_name'] }),
  enquiryStatus: z.object({ status: z.enum(['new', 'contacted', 'quoted', 'closed']) }),

  storageCreate: z.object({
    full_name: optStr(120),
    business_name: optStr(160),
    abn,
    email: z.string().optional(),
    phone,
    storage_type: z.enum(STORAGE_TYPES),
    start_date: date,
    end_date: date,
    duration_type: z.enum(STORAGE_DURATION_TYPES),
    special_requirements: optStr(2000),
    terms_accepted: termsAccepted,
  }),
  storageQuery: z.object({
    start_date: date,
    end_date: date,
    duration_type: z.enum(STORAGE_DURATION_TYPES).default('custom'),
  }),

  invoiceStatus: z.object({
    status: z.enum(['paid', 'void']),
    payment_method: optStr(80),
    payment_reference: optStr(120),
    notes: optStr(500),
  }),
  customInvoice: z.object({
    customer_name: str(160).min(1),
    business_name: optStr(160),
    abn,
    email: z.string().trim().email().optional().or(z.literal('')),
    phone: optStr(32),
    booking_reference: optStr(40),
    service_date_range: optStr(200),
    due_date: date.optional(),
    line_items: z
      .array(
        z.object({
          description: str(300).min(1),
          quantity: z.coerce.number().positive().max(10000),
          unit_price: money,
          taxable: z.boolean().optional(),
        })
      )
      .min(1)
      .max(50),
    security_deposit: money.optional(),
    notes: optStr(2000),
  }),
  aiQuery: z.object({ query: str(1000).min(1) }),
};

module.exports = schemas;
