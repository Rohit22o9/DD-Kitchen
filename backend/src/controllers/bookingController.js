const Booking = require('../models/Booking');
const BookingSlot = require('../models/BookingSlot');
const KitchenConfig = require('../models/KitchenConfig');
const BlockedSlot = require('../models/BlockedSlot');
const { postToGoogleSheet } = require('../services/googleSheetService');
const { calculateBookingPricing } = require('../services/pricingService');
const { createInvoiceForBooking } = require('../services/invoiceService');
const {
  DEFAULT_HOURLY_RATE,
  MIN_RENTAL_HOURS,
} = require('../config/constants');
const {
  normalizeDate,
  normalizeTime,
  calculateEndTime,
  expandShiftSlots,
  getPerthTodayAndHour,
} = require('../utils/dateUtils');

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
 * @desc    Check hourly availability for a given date (public, zero PII)
 * @route   GET /api/availability?date=YYYY-MM-DD
 */
const getAvailability = async (req, res, next) => {
  try {
    const rawDate = req.query.date || normalizeDate(new Date());
    const date = normalizeDate(rawDate);
    if (!date) {
      return res.status(400).json({ success: false, error: 'Invalid date format. Expected YYYY-MM-DD.' });
    }

    const config = (await KitchenConfig.findOne()) || {};

    // Query atomic hourly slot locks for this date (handles overnight carryovers automatically)
    const slotLocks = await BookingSlot.find({ slot_date: date }).sort({ slot_hour: 1 }).lean();
    const blockedSlots = await BlockedSlot.find({ block_date: date }).lean();

    const bookedHours = slotLocks.map((s) => s.slot_hour);
    const slots = [];

    // Group contiguous booked hours or represent bookings without exposing any PII
    slotLocks.forEach((s) => {
      const startStr = `${String(s.slot_hour).padStart(2, '0')}:00`;
      const endHour = (s.slot_hour + 1) % 24;
      const endStr = `${String(endHour).padStart(2, '0')}:00`;
      slots.push({
        start_time: startStr,
        end_time: endStr,
        status: 'booked',
        reason: 'Reserved Shift',
      });
    });

    blockedSlots.forEach((blk) => {
      slots.push({
        start_time: blk.start_time,
        end_time: blk.end_time,
        status: 'blocked',
        reason: blk.reason || 'Facility Maintenance',
      });
    });

    const isAvailable = bookedHours.length === 0 && blockedSlots.length === 0;

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
      existing_bookings_count: slotLocks.length,
      total_booked_hours: bookedHours.length,
      booked_hours: bookedHours,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get monthly availability breakdown (public, zero PII)
 * @route   GET /api/month-availability?year=YYYY&month=MM
 */
const getMonthAvailability = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const month = parseInt(req.query.month, 10) || (new Date().getMonth() + 1);

    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const daysInMonth = new Date(year, month, 0).getDate();

    const slotLocks = await BookingSlot.find({
      slot_date: new RegExp(`^${monthStr}`),
    }).lean();

    const blocked = await BlockedSlot.find({
      block_date: new RegExp(`^${monthStr}`),
    }).lean();

    const result = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const dStr = `${monthStr}-${String(day).padStart(2, '0')}`;
      const dayLocks = slotLocks.filter((s) => s.slot_date === dStr);
      const dayBlocked = blocked.filter((b) => b.block_date === dStr);

      const slots = [];
      dayLocks.forEach((s) => {
        const startStr = `${String(s.slot_hour).padStart(2, '0')}:00`;
        const endStr = `${String((s.slot_hour + 1) % 24).padStart(2, '0')}:00`;
        slots.push({
          start_time: startStr,
          end_time: endStr,
          status: 'booked',
          reason: 'Reserved',
        });
      });

      dayBlocked.forEach((blk) => {
        slots.push({
          start_time: blk.start_time,
          end_time: blk.end_time,
          status: 'blocked',
          reason: blk.reason || 'Maintenance Block',
        });
      });

      const totalBookedHours = dayLocks.length;
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
        bookings_count: new Set(dayLocks.map((l) => String(l.booking_id))).size,
        slots,
      };
    }

    return res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create a commercial kitchen reservation (Authenticated, Server-Priced, Concurrency-Locked)
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

    // 1. Input Validation
    const cleanName = String(full_name || req.user?.full_name || '').trim();
    const cleanEmail = String(req.user?.email || email || '').trim().toLowerCase();
    const cleanPhone = String(phone || req.user?.phone || '').trim();
    if (!cleanName) {
      return res.status(400).json({ success: false, error: 'Full name is required.' });
    }
    if (!cleanEmail) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }
    if (!cleanPhone) {
      return res.status(400).json({ success: false, error: 'Phone number is required.' });
    }

    const date = normalizeDate(booking_date);
    if (!date) {
      return res.status(400).json({ success: false, error: 'Valid booking date (YYYY-MM-DD) is required.' });
    }

    const time = normalizeTime(start_time || '09:00');
    if (!time) {
      return res.status(400).json({ success: false, error: 'Valid start time (HH:mm) is required.' });
    }

    // Reject past dates/hours in Perth AWST
    const { today, hour: currentPerthHour } = getPerthTodayAndHour();
    const startHour = Number(time.split(':')[0]);
    if (date < today || (date === today && startHour <= currentPerthHour)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot book a shift in the past. Please choose a future date and time.',
      });
    }

    // 2. Load KitchenConfig & Calculate Pricing strictly on Server
    const config = (await KitchenConfig.findOne()) || {};
    const pricing = calculateBookingPricing(duration_hours || config.min_rental_hours || 4, config);
    const endTime = calculateEndTime(time, pricing.duration_hours);

    // 3. Check Operating Hours
    const opStart = Number((config.operating_hours_start || '00:00').split(':')[0]);
    const opEndRaw = config.operating_hours_end || '23:59';
    const opEnd = opEndRaw === '24:00' ? 24 : Number(opEndRaw.split(':')[0]);
    const is24h = opStart === 0 && opEnd >= 23;

    // 4. Expand Shift into Hourly Slots (handles overnight shifts seamlessly)
    const slotCandidates = expandShiftSlots(date, time, pricing.duration_hours);
    if (slotCandidates.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid shift window.' });
    }

    if (!is24h) {
      for (const s of slotCandidates) {
        if (s.slot_hour < opStart || s.slot_hour >= opEnd) {
          return res.status(400).json({
            success: false,
            error: `Requested shift falls outside facility operating hours (${config.operating_hours_start} - ${config.operating_hours_end}).`,
          });
        }
      }
    }

    // 5. Check Blocked Maintenance Slots across all affected dates
    const affectedDates = [...new Set(slotCandidates.map((s) => s.slot_date))];
    const blockedSlots = await BlockedSlot.find({ block_date: { $in: affectedDates } }).lean();
    for (const blk of blockedSlots) {
      const blkStart = Number((blk.start_time || '00:00').split(':')[0]);
      const blkEnd = blk.end_time === '24:00' || blk.end_time === '23:59' ? 24 : Number(blk.end_time.split(':')[0]);
      const conflict = slotCandidates.some(
        (s) => s.slot_date === blk.block_date && s.slot_hour >= blkStart && s.slot_hour < blkEnd
      );
      if (conflict) {
        return res.status(409).json({
          success: false,
          error: `Selected time conflicts with facility maintenance (${blk.reason || 'Blocked'}).`,
        });
      }
    }

    // 6. Create Booking & Atomic Slot Locks
    const refCode = `DD-BK-${Math.floor(10000 + Math.random() * 90000)}`;
    const holdExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const booking = await Booking.create({
      reference_code: refCode,
      user_id: req.user?._id,
      full_name: cleanName,
      business_name: business_name || req.user?.business_name || '',
      abn: abn || req.user?.abn || '',
      email: cleanEmail,
      phone: cleanPhone,
      booking_date: date,
      start_time: time,
      end_time: endTime,
      duration_hours: pricing.duration_hours,
      hourly_rate: pricing.hourly_rate,
      base_price: pricing.base_price,
      cleaning_fee: pricing.cleaning_fee,
      security_deposit: pricing.security_deposit,
      total_price: pricing.total_price,
      intended_use: intended_use || 'Commercial Food Production / Catering',
      team_size: Number(team_size) || 1,
      equipment_requirements: equipment_requirements || 'All-Inclusive Commercial Facility Access',
      additional_notes: additional_notes || '',
      status: 'pending',
      payment_status: 'unpaid',
      hold_expires_at: holdExpiresAt,
      door_access_pin: '', // Issued only after confirmed & paid
    });

    try {
      const lockDocs = slotCandidates.map((s) => ({
        slot_date: s.slot_date,
        slot_hour: s.slot_hour,
        booking_id: booking._id,
        reference_code: refCode,
      }));
      await BookingSlot.insertMany(lockDocs, { ordered: true });
    } catch (lockErr) {
      // Rollback booking if any slot was grabbed concurrently (E11000 duplicate key)
      await Booking.findByIdAndDelete(booking._id);
      if (lockErr.code === 11000) {
        return res.status(409).json({
          success: false,
          error: 'One or more hours in this shift are already reserved. Please select another time.',
        });
      }
      throw lockErr;
    }

    // 7. Create Persisted ATO Tax Invoice
    const invoice = await createInvoiceForBooking(booking, pricing);

    // 8. Non-blocking Two-way Google Sheets Webhook Dispatch (Backend is single writer)
    postToGoogleSheet({
      action: 'create_booking',
      reference_code: refCode,
      invoice_number: invoice.invoice_number,
      full_name: booking.full_name,
      business_name: booking.business_name || '',
      abn: booking.abn || '',
      email: booking.email,
      phone: booking.phone,
      booking_date: booking.booking_date,
      start_time: booking.start_time,
      duration_hours: booking.duration_hours,
      base_cost: pricing.base_price,
      gst_amount: pricing.gst,
      total_cost: pricing.total_price,
      security_deposit: pricing.security_deposit,
      intended_use: booking.intended_use,
      team_size: booking.team_size,
      equipment_requirements: booking.equipment_requirements,
      additional_notes: booking.additional_notes,
      status: 'pending_approval',
    }).catch(() => {});

    return res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get booking by reference code (Owner or Admin only)
 * @route   GET /api/bookings/:referenceCode
 */
const getBookingByRef = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ reference_code: req.params.referenceCode });
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const isAdmin = req.user && (req.user.role === 'staff_admin' || req.user.role === 'super_admin');
    if (!isAdmin && booking.email !== String(req.user?.email || '').toLowerCase()) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    const obj = booking.toObject();
    if (!(obj.payment_status === 'paid' && obj.status === 'confirmed')) {
      delete obj.door_access_pin;
    }

    return res.json(obj);
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
