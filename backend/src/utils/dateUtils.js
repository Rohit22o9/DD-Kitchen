const { PERTH_TIMEZONE } = require('../config/constants');

/**
 * Standardize any date or string strictly into Perth YYYY-MM-DD
 */
const normalizeDate = (val) => {
  if (!val) return '';
  const s = String(val).trim();
  if (!s) return '';

  const cleanMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (cleanMatch) return s;

  try {
    const d = val instanceof Date ? val : new Date(s);
    if (!isNaN(d.getTime())) {
      const formatter = new Intl.DateTimeFormat('en-AU', {
        timeZone: PERTH_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const parts = formatter.formatToParts(d);
      const year = parts.find((p) => p.type === 'year')?.value;
      const month = parts.find((p) => p.type === 'month')?.value;
      const day = parts.find((p) => p.type === 'day')?.value;
      if (year && month && day) return `${year}-${month}-${day}`;
    }
  } catch {}

  return s.split('T')[0];
};

/**
 * Standardize time string into HH:mm (Perth AWST)
 */
const normalizeTime = (val) => {
  if (!val) return '09:00';
  const s = String(val).trim();
  if (!s) return '09:00';

  const match = s.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }
  return s;
};

/**
 * Calculate end time given start time HH:mm and duration in hours
 */
const calculateEndTime = (startTime, durationHours = 4) => {
  const [h, m] = normalizeTime(startTime).split(':').map(Number);
  const endHour = (h + durationHours) % 24;
  return `${String(endHour).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
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
 * Check if a booking date is today or within the next 24 hours in Perth time
 */
const isShiftWithin24Hours = (bookingDate) => {
  const today = normalizeDate(new Date());
  if (!bookingDate) return false;
  return normalizeDate(bookingDate) === today;
};

module.exports = {
  normalizeDate,
  normalizeTime,
  calculateEndTime,
  getPerthNow,
  isShiftWithin24Hours,
};
