/**
 * Perth (Australia/Perth, AWST) date and time helpers.
 *
 * Western Australia has no daylight saving, so Perth is always UTC+08:00.
 * Business dates are stored as Perth wall-clock strings (YYYY-MM-DD, HH:mm)
 * for display, and every booking also stores real UTC instants (start_at,
 * end_at) so overlaps, overnight shifts and "is this in the past" checks are
 * done on absolute time, never on strings.
 */
const PERTH_TZ = 'Australia/Perth';
const PERTH_OFFSET = '+08:00';
const PERTH_OFFSET_MS = 8 * 60 * 60 * 1000;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Strict YYYY-MM-DD that is a real calendar date. */
const isValidDateStr = (s) => {
  const m = DATE_RE.exec(String(s || ''));
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
};

const isValidTimeStr = (s) => TIME_RE.test(String(s || ''));

/** Perth wall clock (date + time) -> UTC Date. */
const perthToUtc = (dateStr, timeStr = '00:00') => new Date(`${dateStr}T${timeStr}:00.000${PERTH_OFFSET}`);

/** UTC Date -> { date: 'YYYY-MM-DD', time: 'HH:mm' } in Perth. */
const utcToPerth = (d) => {
  const shifted = new Date(new Date(d).getTime() + PERTH_OFFSET_MS).toISOString();
  return { date: shifted.slice(0, 10), time: shifted.slice(11, 16) };
};

const perthToday = (now = new Date()) => utcToPerth(now).date;

const addDays = (dateStr, n) => {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Whole days between two YYYY-MM-DD strings (b - a). */
const diffDays = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

const startOfPerthDay = (dateStr) => perthToUtc(dateStr, '00:00');
const endOfPerthDay = (dateStr) => perthToUtc(addDays(dateStr, 1), '00:00');

/** Minutes since Perth midnight for a UTC instant within [dayStart, dayEnd]. */
const minutesIntoPerthDay = (instant, dateStr) =>
  Math.round((new Date(instant).getTime() - startOfPerthDay(dateStr).getTime()) / 60000);

const minutesToHHMM = (mins) => {
  if (mins >= 1440) return '24:00';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const formatPerth = (d) =>
  new Intl.DateTimeFormat('en-AU', {
    timeZone: PERTH_TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(d));

module.exports = {
  PERTH_TZ,
  PERTH_OFFSET,
  isValidDateStr,
  isValidTimeStr,
  perthToUtc,
  utcToPerth,
  perthToday,
  addDays,
  diffDays,
  startOfPerthDay,
  endOfPerthDay,
  minutesIntoPerthDay,
  minutesToHHMM,
  formatPerth,
};
