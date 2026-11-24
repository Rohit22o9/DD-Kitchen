const { PERTH_TIMEZONE } = require('../config/constants');

/**
 * Add days to a YYYY-MM-DD string safely in UTC calendar arithmetic
 */
const addDays = (dateStr, days) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
};

/**
 * Standardize any date or string strictly into Perth YYYY-MM-DD.
 * Returns '' for invalid dates instead of passing garbage through.
 */
const normalizeDate = (val) => {
  if (!val) return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: PERTH_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(val);
  }

  const s = String(val).trim();
  if (!s) return '';

  // Strict YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch.map(Number);
    const check = new Date(Date.UTC(y, m - 1, d));
    if (check.getUTCFullYear() === y && check.getUTCMonth() === m - 1 && check.getUTCDate() === d) {
      return s;
    }
    return '';
  }

  // Australian DD/MM/YYYY or DD-MM-YYYY
  const auMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (auMatch) {
    const d = Number(auMatch[1]);
    const m = Number(auMatch[2]);
    const y = Number(auMatch[3]);
    const check = new Date(Date.UTC(y, m - 1, d));
    if (check.getUTCFullYear() === y && check.getUTCMonth() === m - 1 && check.getUTCDate() === d) {
      return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    return '';
  }

  // Full ISO timestamp
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return normalizeDate(d);
    }
  }

  return '';
};

/**
 * Standardize time string into HH:mm (00:00 .. 23:59)
 */
const normalizeTime = (val) => {
  if (!val) return '';
  const s = String(val).trim();
  const match = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return '';
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return '';
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Calculate end time given start time HH:mm and duration in hours (supports fractional hours)
 */
const calculateEndTime = (startTime, durationHours = 4) => {
  const clean = normalizeTime(startTime);
  if (!clean) return '13:00';
  const [h, m] = clean.split(':').map(Number);
  const startMinutes = h * 60 + m;
  const endMinutesTotal = startMinutes + Math.round(Number(durationHours) * 60);
  const endMinutesMod = ((endMinutesTotal % 1440) + 1440) % 1440;
  const endH = Math.floor(endMinutesMod / 60);
  const endM = endMinutesMod % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
};

/**
 * Expand a shift into hourly slot locks { slot_date, slot_hour }, properly handling overnight shifts
 */
const expandShiftSlots = (startDate, startTime, durationHours = 4) => {
  const cleanDate = normalizeDate(startDate);
  const cleanTime = normalizeTime(startTime);
  if (!cleanDate || !cleanTime) return [];

  const [startH, startM] = cleanTime.split(':').map(Number);
  const totalSlots = Math.ceil(Number(durationHours) + (startM > 0 ? 0.5 : 0));
  const slots = [];

  for (let i = 0; i < totalSlots; i++) {
    const absoluteHour = startH + i;
    const dayOffset = Math.floor(absoluteHour / 24);
    const slotHour = absoluteHour % 24;
    const slotDate = dayOffset === 0 ? cleanDate : addDays(cleanDate, dayOffset);
    slots.push({ slot_date: slotDate, slot_hour: slotHour });
  }

  return slots;
};

/**
 * Get current Perth timestamp string
 */
const getPerthNow = () => {
  const d = new Date();
  const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: PERTH_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return formatter.format(d);
};

/**
 * Get current Perth date YYYY-MM-DD and hour
 */
const getPerthTodayAndHour = () => {
  const now = new Date();
  const dateStr = normalizeDate(now);
  const hourStr = new Intl.DateTimeFormat('en-AU', {
    timeZone: PERTH_TIMEZONE,
    hour: '2-digit',
    hour12: false,
  }).format(now);
  return { today: dateStr, hour: Number(hourStr) % 24 };
};

/**
 * Check if a booking date/time is within the next 24 hours in Perth AWST
 */
const isShiftWithin24Hours = (bookingDate, startTime = '00:00') => {
  const cleanDate = normalizeDate(bookingDate);
  if (!cleanDate) return false;
  const { today, hour } = getPerthTodayAndHour();
  const tomorrow = addDays(today, 1);

  if (cleanDate === today) return true;
  if (cleanDate === tomorrow) {
    const cleanTime = normalizeTime(startTime) || '00:00';
    const shiftHour = Number(cleanTime.split(':')[0]);
    return shiftHour <= hour;
  }
  return false;
};

module.exports = {
  addDays,
  normalizeDate,
  normalizeTime,
  calculateEndTime,
  expandShiftSlots,
  getPerthNow,
  getPerthTodayAndHour,
  isShiftWithin24Hours,
};
