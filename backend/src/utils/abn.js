/**
 * Australian Business Number checksum (ATO algorithm):
 * subtract 1 from the first digit, multiply each digit by its weight,
 * and the sum must be divisible by 89.
 */
const WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

const digitsOf = (abn) => String(abn || '').replace(/\s+/g, '');

const isValidAbn = (abn) => {
  const s = digitsOf(abn);
  if (!/^\d{11}$/.test(s)) return false;
  const d = s.split('').map(Number);
  d[0] -= 1;
  return d.reduce((sum, digit, i) => sum + digit * WEIGHTS[i], 0) % 89 === 0;
};

const formatAbn = (abn) => {
  const s = digitsOf(abn);
  return `${s.slice(0, 2)} ${s.slice(2, 5)} ${s.slice(5, 8)} ${s.slice(8, 11)}`;
};

module.exports = { isValidAbn, formatAbn };
