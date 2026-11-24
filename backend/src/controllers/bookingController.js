const Booking = require('../models/Booking');
const KitchenConfig = require('../models/KitchenConfig');
const BlockedSlot = require('../models/BlockedSlot');
const { postToGoogleSheet } = require('../services/googleSheetService');
const {
  DEFAULT_HOURLY_RATE,
  MIN_RENTAL_HOURS,
  GST_RATE,
  KITCHEN_SECURITY_DEPOSIT,
} = require('../config/constants');
const {
  normalizeDate,
  normalizeTime,
  calculateEndTime,
} = require('../utils/dateUtils');

/**
 * Helper to calculate pricing
 */
const calculateTierCost = (durationHours = 4, hourlyRate = DEFAULT_HOURLY_RATE) => {
  const duration = Math.max(durationHours, MIN_RENTAL_HOURS);
  const subtotal = duration * hourlyRate;
  const gst = Number((subtotal * GST_RATE).toFixed(2));
  const total = Number((subtotal + gst).toFixed(2));
  return { subtotal, gst, total, duration };
};

/**
 * @desc    Get current commercial kitchen configuration
 * @route   GET /api/config
 */
const getConfig = async (req, res, next) => {
  try {
    let config = await KitchenConfig.findOne();
    if (!config) {
      config = await KitchenConfig.create({});
    }
    return res.json(config);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Check hourly availability for a given date
 * @route   GET /api/availability?date=YYYY-MM-DD
 */
const getAvailability = async (req, res, next) => {
  try {
    const rawDate = req.query.date || normalizeDate(new Date());
    const date = normalizeDate(rawDate);

    // Find active bookings on that date
    const bookings = await Booking.find({
      booking_date: date,
      status: { $in: ['pending', 'approved', 'confirmed'] },
    });

    // Find blocked slots
    const blockedSlots = await BlockedSlot.find({ block_date: date });

    const bookedHours = [];
    bookings.forEach((b) => {
      const startH = parseInt(b.start_time.split(':')[0], 10);
      const endH = parseInt(b.end_time.split(':')[0], 10);
      for (let h = startH; h < (endH <= startH ? endH + 24 : endH); h++) {
        bookedHours.push(h % 24);
      }
    });

    const config = (await KitchenConfig.findOne()) || {};
    const slots = [];
    bookings.forEach((b) => {
      slots.push({
        start_time: b.start_time,
        end_time: b.end_time,
        status: 'booked',
        reference: b.reference_code,
        reason: b.intended_use || `Reserved (${b.status})`,
        equipment: b.equipment_requirements || '',
        full_name: b.full_name || '',
      });
    });
    blockedSlots.forEach((blk) => {
      slots.push({
        start_time: blk.start_time,
        end_time: blk.end_time,
        status: 'blocked',
        reference: null,
        reason: blk.reason || 'Maintenance Block',
        equipment: '',
        full_name: '',
      });
    });

    const isAvailable = bookings.length === 0 && blockedSlots.length === 0;

    return res.json({
      date,
      available: isAvailable,
      operating_hours: {
        start: config.operating_hours_start || '00:00',
        end: config.operating_hours_end || '23:59',
      },
      hourly_rate: config.hourly_rental_rate || DEFAULT_HOURLY_RATE,
      min_hours: config.min_rental_hours || MIN_RENTAL_HOURS,
      slots,
      existing_bookings_count: bookings.length,
      total_booked_hours: bookings.reduce((sum, b) => sum + (Number(b.duration_hours) || 0), 0),
      booked_slots: bookings.map((b) => ({
        start_time: b.start_time,
        end_time: b.end_time,
        reference_code: b.reference_code,
      })),
      blocked_slots: blockedSlots,
      booked_hours: bookedHours,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get monthly availability breakdown
 * @route   GET /api/month-availability?year=YYYY&month=MM
 */
const getMonthAvailability = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const month = parseInt(req.query.month, 10) || (new Date().getMonth() + 1);

    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const daysInMonth = new Date(year, month, 0).getDate();

    const bookings = await Booking.find({
      booking_date: new RegExp(`^${monthStr}`),
      status: { $in: ['pending', 'approved', 'confirmed'] },
    });

    const blocked = await BlockedSlot.find({
      block_date: new RegExp(`^${monthStr}`),
    });

    const result = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const dStr = `${monthStr}-${String(day).padStart(2, '0')}`;
      const dayBookings = bookings.filter((b) => b.booking_date === dStr);
      const dayBlocked = blocked.filter((b) => b.block_date === dStr);

      const slots = [];
      const equipmentSet = new Set();
      let totalBookedHours = 0;

      dayBookings.forEach((b) => {
        slots.push({
          start_time: b.start_time,
          end_time: b.end_time,
          status: 'booked',
          reference: b.reference_code,
          reason: `Reserved (${b.status})`,
        });
        totalBookedHours += Number(b.duration_hours || 0);
        if (b.equipment_requirements) {
          b.equipment_requirements.split(',').forEach((eq) => {
            const clean = eq.trim();
            if (clean) equipmentSet.add(clean);
          });
        }
      });

      dayBlocked.forEach((blk) => {
        slots.push({
          start_time: blk.start_time,
          end_time: blk.end_time,
          status: 'blocked',
          reference: null,
          reason: blk.reason || 'Maintenance Block',
        });
      });

      const isAllDayBlocked = dayBlocked.some(
        (blk) => blk.start_time === '00:00' && (blk.end_time === '24:00' || blk.end_time === '23:59')
      );
      let statusVal = 'available';
      if (isAllDayBlocked || totalBookedHours >= 22) {
        statusVal = isAllDayBlocked ? 'blocked' : 'fully_booked';
      } else if (totalBookedHours > 0 || dayBlocked.length > 0) {
        statusVal = 'partially_booked';
      }

      result[dStr] = {
        date: dStr,
        total_booked_hours: totalBookedHours,
        status: statusVal,
        bookings_count: dayBookings.length,
        slots,
        equipment_used: Array.from(equipmentSet),
      };
    }

    return res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create a commercial kitchen reservation
 * @route   POST /api/bookings
 */
const createBooking = async (req, res, next) => {
  try {
    const {
      full_name,
      business_name,
      abn,
      email,
      phone,
      booking_date,
      start_time,
      duration_hours,
      intended_use,
      team_size,
      equipment_requirements,
      additional_notes,
    } = req.body;

    const date = normalizeDate(booking_date);
    const time = normalizeTime(start_time || '09:00');
    const duration = Math.max(Number(duration_hours) || 4, MIN_RENTAL_HOURS);
    const endTime = calculateEndTime(time, duration);

    const { subtotal, gst, total } = calculateTierCost(duration, DEFAULT_HOURLY_RATE);
    const refCode = `DD-BK-${Math.floor(10000 + Math.random() * 90000)}`;

    const booking = await Booking.create({
      reference_code: refCode,
      full_name: full_name.trim(),
      business_name: business_name || '',
      abn: abn || '',
      email: String(email).trim().toLowerCase(),
      phone: phone ? String(phone).trim() : '',
      booking_date: date,
      start_time: time,
      end_time: endTime,
      duration_hours: duration,
      hourly_rate: DEFAULT_HOURLY_RATE,
      base_price: subtotal,
      cleaning_fee: 0.0,
      security_deposit: KITCHEN_SECURITY_DEPOSIT,
      total_price: total,
      intended_use: intended_use || 'Commercial Food Production / Catering',
      team_size: team_size || 1,
      equipment_requirements: equipment_requirements || 'All-Inclusive Commercial Facility Access',
      additional_notes: additional_notes || '',
      status: 'pending',
      payment_status: 'unpaid',
      door_pin_code: '4892#',
    });

    // 1. Two-way Google Sheets Webhook Dispatch
    await postToGoogleSheet({
      action: 'create_booking',
      reference_code: refCode,
      full_name: booking.full_name,
      business_name: booking.business_name || '',
      abn: booking.abn || '',
      email: booking.email,
      phone: booking.phone,
      booking_date: booking.booking_date,
      start_time: booking.start_time,
      duration_hours: booking.duration_hours,
      base_cost: subtotal,
      gst_amount: gst,
      total_cost: total,
      security_deposit: KITCHEN_SECURITY_DEPOSIT,
      intended_use: booking.intended_use,
      team_size: booking.team_size,
      equipment_requirements: booking.equipment_requirements,
      additional_notes: booking.additional_notes,
      status: 'pending_approval',
    });

    return res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get booking by reference code
 * @route   GET /api/bookings/:referenceCode
 */
const getBookingByRef = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ reference_code: req.params.referenceCode });
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    return res.json(booking);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getConfig,
  getAvailability,
  getMonthAvailability,
  createBooking,
  getBookingByRef,
};
