/**
 * Money is stored and calculated in integer cents. Dollars only appear at the
 * API edge, so totals never drift through floating point.
 */
const GST_RATE = 0.1;

const toCents = (dollars) => Math.round(Number(dollars) * 100);
const toDollars = (cents) => Math.round(Number(cents || 0)) / 100;

/** Price quoted ex-GST: GST is 10% on top. */
const addGst = (exCents) => {
  const gst = Math.round(exCents * GST_RATE);
  return { ex_gst: exCents, gst, inc_gst: exCents + gst };
};

/** Price quoted GST-inclusive: GST is 1/11 of the total. */
const splitGstInclusive = (incCents) => {
  const gst = Math.round(incCents / 11);
  return { ex_gst: incCents - gst, gst, inc_gst: incCents };
};

module.exports = { GST_RATE, toCents, toDollars, addGst, splitGstInclusive };
