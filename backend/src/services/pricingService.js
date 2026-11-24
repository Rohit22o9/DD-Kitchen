const {
  DEFAULT_HOURLY_RATE,
  MIN_RENTAL_HOURS,
  GST_RATE,
  KITCHEN_SECURITY_DEPOSIT,
} = require('../config/constants');

/**
 * Tiered commercial kitchen rates (ex-GST) when standard $38/hr rate is active
 */
const STANDARD_TIER_SUBTOTALS = {
  4: 152.0,
  6: 204.0,
  8: 256.0,
  10: 310.0,
  12: 360.0,
  24: 696.0,
};

/**
 * Single source of truth for commercial kitchen shift pricing (AUD)
 */
const calculateBookingPricing = (durationHours, config = {}) => {
  const minHours = Number(config.min_rental_hours || MIN_RENTAL_HOURS);
  const hourlyRate = Number(config.hourly_rental_rate || DEFAULT_HOURLY_RATE);
  const cleaningFee = Number(config.cleaning_fee || 0);
  const securityDeposit = Number(config.security_deposit ?? KITCHEN_SECURITY_DEPOSIT);

  const duration = Number(durationHours);
  if (!Number.isFinite(duration) || duration < minHours || duration > 24) {
    const err = new Error(`Duration must be between ${minHours} and 24 hours.`);
    err.statusCode = 400;
    throw err;
  }

  let basePrice;
  if (hourlyRate === 38 && STANDARD_TIER_SUBTOTALS[duration] !== undefined) {
    basePrice = STANDARD_TIER_SUBTOTALS[duration];
  } else {
    basePrice = Number((duration * hourlyRate).toFixed(2));
  }

  const subtotal = Number((basePrice + cleaningFee).toFixed(2));
  const gst = Number((subtotal * GST_RATE).toFixed(2));
  const totalPrice = Number((subtotal + gst).toFixed(2));

  return {
    duration_hours: duration,
    hourly_rate: hourlyRate,
    base_price: basePrice,
    cleaning_fee: cleaningFee,
    subtotal,
    gst,
    total_price: totalPrice,
    security_deposit: securityDeposit, // Non-taxable escrow bond
  };
};

module.exports = {
  STANDARD_TIER_SUBTOTALS,
  calculateBookingPricing,
};
