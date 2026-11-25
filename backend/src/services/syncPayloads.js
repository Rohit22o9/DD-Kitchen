/**
 * Shapes of the rows and emails sent to the Google Apps Script webhook.
 * The sheet is a downstream report; MongoDB is the source of truth.
 */
const { toDollars } = require('../utils/money');

const bookingRow = (b) => ({
  reference_code: b.reference_code,
  full_name: b.full_name,
  business_name: b.business_name || '',
  abn: b.abn || '',
  email: b.email,
  phone: b.phone,
  booking_date: b.booking_date,
  start_time: b.start_time,
  end_date: b.end_date,
  end_time: b.end_time,
  duration_hours: b.duration_hours,
  base_cost: toDollars(b.base_price_cents),
  gst_amount: toDollars(b.gst_cents),
  total_cost: toDollars(b.total_cents),
  security_deposit: toDollars(b.security_deposit_cents),
  intended_use: b.intended_use,
  team_size: b.team_size,
  status: b.status,
  payment_status: b.payment_status,
  admin_notes: b.admin_notes || '',
});

const storageRow = (s) => ({
  reference_code: s.reference_code,
  full_name: s.full_name,
  business_name: s.business_name || '',
  abn: s.abn || '',
  email: s.email,
  phone: s.phone,
  storage_type: s.storage_type,
  bay_number: s.bay_number,
  start_date: s.start_date,
  end_date: s.end_date,
  duration_days: s.duration_days,
  total_price: toDollars(s.total_cents),
  security_deposit: toDollars(s.security_deposit_cents),
  status: s.status,
  payment_status: s.payment_status,
});

const enquiryRow = (e) => ({
  reference_code: e.reference_code,
  full_name: e.full_name,
  business_name: e.business_name,
  email: e.email,
  phone: e.phone,
  preferred_contact: e.preferred_contact,
  rental_type: e.rental_type,
  message: e.message,
  status: e.status,
});

/** Email instruction: rendered by emailTemplates when queued. */
const email = (to, template, data) => ({ to, template, data });

module.exports = { bookingRow, storageRow, enquiryRow, email };
