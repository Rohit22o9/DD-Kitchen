/**
 * Business defaults. Kitchen pricing and hours are seeded into KitchenConfig
 * (editable by admins); the server always prices bookings from that record,
 * and the website renders the same table from GET /api/config.
 */
module.exports = {
  ROLES: {
    HIRER: 'hirer',
    STAFF_ADMIN: 'staff_admin',
    SUPER_ADMIN: 'super_admin',
  },
  ADMIN_ROLES: ['staff_admin', 'super_admin'],

  // Kitchen bookings are tracked in 30-minute slots (unique index per slot).
  SLOT_MINUTES: 30,
  MAX_BOOKING_HOURS: 24,

  // Kitchen pricing, AUD ex-GST (matches the public pricing page).
  DEFAULT_KITCHEN_CONFIG: {
    hourly_rental_rate: 38.0,
    min_rental_hours: 2,
    packages: [
      { hours: 2, price: 100.0, label: '2-Hour Quick Prep' },
      { hours: 4, price: 152.0, label: '4-Hour Half-Shift' },
      { hours: 8, price: 256.0, label: '8-Hour Full Production' },
      { hours: 12, price: 360.0, label: '12-Hour Commercial Run' },
    ],
    operating_hours_start: '00:00',
    operating_hours_end: '24:00',
    cleaning_fee: 0,
    security_deposit: 750.0,
    kitchen_name: 'Daily Drop Commercial Kitchens (Victoria Park)',
    kitchen_address: 'Unit 1, 1 Lichfield St, Victoria Park WA 6101',
    kitchen_phone: '0479 175 705',
    kitchen_email: 'hello@dailydrop.today',
    kitchen_whatsapp: '+61479175705',
    currency_symbol: '$',
  },

  // Storage pricing, AUD GST-inclusive (matches the storage booking page).
  STORAGE_PRICING: {
    daily: 15.0, // per day
    weekly: 70.0, // per 7 days
    monthly: 220.0, // per 30 days
    long_term_daily: 8.0, // per day for custom terms over 31 days
    security_deposit: 200.0,
  },
  STORAGE_TYPES: ['dry_storage', 'cool_room', 'freezer'],
  STORAGE_DURATION_TYPES: ['daily', 'weekly', 'monthly', 'custom'],

  // Statuses that hold capacity (slots / bays).
  ACTIVE_BOOKING_STATUSES: ['pending', 'approved', 'confirmed'],
  BOOKING_STATUSES: ['pending', 'approved', 'confirmed', 'rejected', 'cancelled', 'completed', 'expired'],

  // Allowed admin transitions. Anything not listed is rejected.
  STATUS_TRANSITIONS: {
    pending: ['approved', 'rejected', 'cancelled'],
    approved: ['confirmed', 'rejected', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    rejected: [],
    cancelled: [],
    completed: [],
    expired: [],
  },
};
