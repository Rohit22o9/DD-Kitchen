const crypto = require('crypto');

// Crockford-style alphabet without ambiguous characters (no 0/O, 1/I/L).
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/** Unguessable reference: 8 chars from a 31-symbol alphabet (~8.5e11 combinations). */
const randomCode = (len = 8) => {
  let out = '';
  for (let i = 0; i < len; i++) out += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return out;
};

const bookingRef = () => `DD-BK-${randomCode()}`;
const storageRef = () => `DD-ST-${randomCode()}`;
const enquiryRef = () => `DD-ENQ-${randomCode(6)}`;

/** 6-digit door access code. */
const accessCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');

module.exports = { bookingRef, storageRef, enquiryRef, accessCode };
