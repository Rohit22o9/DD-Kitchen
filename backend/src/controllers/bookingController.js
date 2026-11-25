const env = require('../config/env');
const { STORAGE_PRICING, SLOT_MINUTES } = require('../config/constants');
const KitchenConfig = require('../models/KitchenConfig');
const Booking = require('../models/Booking');
const bookingService = require('../services/bookingService');
const { isAdmin } = require('../middlewares/auth');
const { asyncHandler, notFound } = require('../utils/httpError');

/** Public configuration: pricing, hours, contact and payment details from one place. */
const getConfig = asyncHandler(async (req, res) => {
  const c = await KitchenConfig.get();
  res.json({
    hourly_rental_rate: c.hourly_rental_rate,
    min_rental_hours: c.min_rental_hours,
    packages: c.packages,
    operating_hours_start: c.operating_hours_start,
    operating_hours_end: c.operating_hours_end,
    cleaning_fee: c.cleaning_fee,
    security_deposit: c.security_deposit,
    kitchen_name: c.kitchen_name,
    kitchen_address: c.kitchen_address,
    kitchen_phone: c.kitchen_phone,
    kitchen_email: c.kitchen_email,
    kitchen_whatsapp: c.kitchen_whatsapp,
    currency_symbol: c.currency_symbol,
    gst_rate: 0.1,
    prices_include_gst: false,
    slot_minutes: SLOT_MINUTES,
    booking_hold_hours: env.BOOKING_HOLD_HOURS,
    storage_pricing: { ...STORAGE_PRICING, prices_include_gst: true },
    storage_bay_count: env.STORAGE_BAY_COUNT,
    terms_version: env.TERMS_VERSION,
    seller: { legal_name: env.seller.legal_name, trading_name: env.seller.trading_name, abn: env.seller.abn },
    payment_details: env.paymentDetails,
  });
});

const getAvailability = asyncHandler(async (req, res) => res.json(await bookingService.dayAvailability(req.validatedQuery.date)));

const getMonthAvailability = asyncHandler(async (req, res) => {
  const { year, month } = req.validatedQuery;
  res.json(await bookingService.monthAvailability(year, month));
});

const checkSlot = asyncHandler(async (req, res) => res.json(await bookingService.checkSlot(req.validatedQuery)));

const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createKitchenBooking(req.user, req.body, { ip: req.ip });
  res.status(201).json(booking.toPublicShape());
});

/** Owner or admin only. The door code is shown only once the booking is paid and confirmed. */
const getBookingByRef = asyncHandler(async (req, res) => {
  const b = await Booking.findOne({ reference_code: req.params.referenceCode }).select('+access_code');
  if (!b) throw notFound('Booking not found.');
  const admin = isAdmin(req.user);
  bookingService.assertOwnerOrAdmin(req.user, b, admin);
  res.json(b.toPublicShape({ admin, includeAccessCode: admin || (b.status === 'confirmed' && b.payment_status === 'paid') }));
});

const createRecurring = asyncHandler(async (req, res) => {
  const out = await bookingService.createRecurringSeries(req.user, req.body, { ip: req.ip });
  res.status(out.created.length ? 201 : 409).json({
    series_id: out.series_id,
    created: out.created.map((b) => b.toPublicShape()),
    skipped: out.skipped,
  });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const b = await bookingService.cancelByCustomer(req.user, req.params.referenceCode);
  res.json(b.toPublicShape());
});

module.exports = { getConfig, getAvailability, getMonthAvailability, checkSlot, createBooking, createRecurring, getBookingByRef, cancelBooking };
