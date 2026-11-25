const { STORAGE_PRICING, MAX_BOOKING_HOURS } = require('../config/constants');
const { toCents, addGst, splitGstInclusive } = require('../utils/money');
const { diffDays, addDays } = require('../utils/perthTime');
const { badRequest } = require('../utils/httpError');

/**
 * Kitchen hire is priced ex-GST from KitchenConfig: a package price when the
 * duration matches a package, otherwise hourly rate x hours.
 */
const quoteKitchen = (config, durationHours) => {
  const hours = Number(durationHours);
  if (!Number.isFinite(hours) || hours <= 0 || hours > MAX_BOOKING_HOURS || (hours * 2) % 1 !== 0) {
    throw badRequest(`Duration must be between 0.5 and ${MAX_BOOKING_HOURS} hours, in half-hour steps.`);
  }
  if (hours < config.min_rental_hours) {
    throw badRequest(`Minimum booking is ${config.min_rental_hours} hours.`);
  }
  const pkg = (config.packages || []).find((p) => Number(p.hours) === hours);
  const baseCents = pkg ? toCents(pkg.price) : toCents(config.hourly_rental_rate * hours);
  const cleaningCents = toCents(config.cleaning_fee || 0);
  const { gst, inc_gst } = addGst(baseCents + cleaningCents);
  return {
    hours,
    label: pkg?.label || `${hours}-hour shift`,
    base_cents: baseCents,
    cleaning_cents: cleaningCents,
    gst_cents: gst,
    total_cents: inc_gst,
    deposit_cents: toCents(config.security_deposit || 0),
  };
};

/**
 * Storage is priced GST-inclusive. end_date is the move-out date (exclusive);
 * a same-day end counts as one day. This fixes the old client-side maths
 * that counted days inclusively and charged two months for a 30-day lease.
 */
const quoteStorage = ({ start_date, end_date, duration_type }) => {
  const rawDays = diffDays(start_date, end_date);
  if (rawDays < 0) throw badRequest('End date must be on or after the start date.');
  if (rawDays > 366) throw badRequest('Storage terms are limited to 12 months per booking.');
  const days = Math.max(1, rawDays);
  const P = STORAGE_PRICING;

  let totalDollars;
  switch (duration_type) {
    case 'daily':
      totalDollars = P.daily * days;
      break;
    case 'weekly':
      totalDollars = P.weekly * Math.ceil(days / 7);
      break;
    case 'monthly':
      totalDollars = P.monthly * Math.ceil(days / 30);
      break;
    default:
      if (days > 31) totalDollars = P.long_term_daily * days;
      else if (days === 1) totalDollars = P.daily;
      else if (days <= 7) totalDollars = P.weekly * Math.ceil(days / 7);
      else totalDollars = P.monthly * Math.ceil(days / 30);
  }

  const { gst, inc_gst } = splitGstInclusive(toCents(totalDollars));
  return {
    days,
    occupied_until: addDays(start_date, days),
    total_cents: inc_gst,
    gst_cents: gst,
    deposit_cents: toCents(P.security_deposit),
  };
};

module.exports = { quoteKitchen, quoteStorage };
