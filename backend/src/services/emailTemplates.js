/**
 * Customer email templates, rendered on the server. Every value is
 * HTML-escaped. Payment details always come from server configuration.
 */
const env = require('../config/env');

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const money = (n) => `$${Number(n || 0).toFixed(2)} AUD`;

const SUBJECTS = {
  booking_received: 'We received your kitchen booking request',
  booking_approved: 'Your kitchen booking is approved — payment details inside',
  booking_confirmed: 'Your kitchen booking is confirmed',
  booking_rejected: 'Update on your kitchen booking request',
  booking_cancelled: 'Your kitchen booking was cancelled',
  booking_expired: 'Your unpaid kitchen hold has expired',
  storage_received: 'We received your storage booking request',
  storage_approved: 'Your storage booking is approved — payment details inside',
  storage_confirmed: 'Your storage booking is confirmed',
  storage_rejected: 'Update on your storage booking request',
  storage_cancelled: 'Your storage booking was cancelled',
  password_reset: 'Reset your Daily Drop password',
  verify_email: 'Confirm your email address for Daily Drop',
  refund_issued: 'Your Daily Drop refund',
  bond_settled: 'Your Daily Drop security bond',
};

const row = (label, value) =>
  `<tr><td style="padding:6px 12px 6px 0;color:#6B7280">${esc(label)}</td><td style="padding:6px 0;font-weight:bold">${esc(value)}</td></tr>`;

const button = (href, label) =>
  `<p style="margin:20px 0"><a href="${esc(href)}" style="background:#112F21;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">${esc(label)}</a></p>` +
  `<p style="font-size:12px;color:#6B7280">If the button doesn't work, paste this link into your browser:<br>${esc(href)}</p>`;

const paymentBlock = (d) => {
  const p = env.paymentDetails;
  if (!p) return '<p>Payment details are on your tax invoice.</p>';
  return (
    '<h4 style="margin:16px 0 6px">How to pay</h4><table style="font-size:14px">' +
    (p.account_name ? row('Account name', p.account_name) : '') +
    (p.bank_name ? row('Bank', p.bank_name) : '') +
    (p.bsb ? row('BSB', p.bsb) : '') +
    (p.account_number ? row('Account', p.account_number) : '') +
    (p.payid ? row('PayID', p.payid) : '') +
    row('Reference to quote', d.reference_code) +
    '</table><p style="font-size:12px;color:#6B7280">Unpaid holds are released automatically. Your door access code appears in your Daily Drop dashboard once payment is confirmed.</p>'
  );
};

const bookingDetails = (d) => {
  let rows = '';
  if (d.reference_code) rows += row('Reference', d.reference_code);
  if (d.booking_date) rows += row('Starts', `${d.booking_date} ${d.start_time || ''} AWST`);
  if (d.end_date) rows += row('Ends', `${d.end_date} ${d.end_time || ''} AWST`);
  if (d.start_date) rows += row('Storage', `${d.start_date} to ${d.end_date}${d.bay_number ? ` (bay ${d.bay_number})` : ''}`);
  if (d.total !== undefined) rows += row('Total (inc GST)', money(d.total));
  if (d.bond !== undefined) rows += row('Refundable bond', money(d.bond));
  if (d.invoice_number) rows += row('Tax invoice', `${d.invoice_number} (due ${d.due_date})`);
  return rows ? `<table style="font-size:14px">${rows}</table>` : '';
};

const bodies = {
  password_reset: (d) =>
    `<p>We received a request to reset your password. This link works once and expires in 1 hour.</p>${button(d.link, 'Choose a new password')}` +
    '<p>If you didn\'t ask for this, you can ignore this email — your password won\'t change.</p>',
  verify_email: (d) => `<p>Please confirm this is your email address.</p>${button(d.link, 'Confirm my email')}`,
  refund_issued: (d) =>
    `<p>We've issued a refund for ${esc(d.reference_code || d.invoice_number)}.</p><table style="font-size:14px">` +
    row('Adjustment note', d.note_number) +
    row('Refund (inc GST)', money(d.amount)) +
    row('GST included', money(d.gst)) +
    row('Reason', d.reason) +
    '</table><p>Please allow 1–3 business days for the transfer to arrive.</p>',
  bond_settled: (d) =>
    `<p>Your security bond for ${esc(d.reference_code || d.invoice_number)} has been settled.</p><table style="font-size:14px">` +
    row('Bond held', money(d.bond)) +
    row('Refunded to you', money(d.refunded)) +
    (d.forfeited > 0 ? row('Retained', money(d.forfeited)) + row('Reason', d.reason) : '') +
    '</table>',
};

const render = (template, data = {}) => {
  const subject = SUBJECTS[template];
  if (!subject) throw new Error(`Unknown email template: ${template}`);
  let main = bodies[template] ? bodies[template](data) : `<p>${esc(subject)}.</p>${bookingDetails(data)}`;
  if (/_(received|approved)$/.test(template)) main += paymentBlock(data);
  if (/_confirmed$/.test(template)) {
    main += '<p>Payment received — thank you. Log in to your Daily Drop dashboard to see your door access code.</p>';
  }
  const html =
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;color:#1F2937;line-height:1.5">' +
    `<h2 style="color:#112F21">${esc(env.SELLER_TRADING_NAME)}</h2>` +
    `<p>Hi ${esc(data.full_name || 'there')},</p>${main}` +
    `<p style="font-size:12px;color:#6B7280;margin-top:24px">${esc(env.SELLER_ADDRESS)} · ${esc(env.SELLER_PHONE)} · ${esc(env.SELLER_EMAIL)}</p></div>`;
  const text = html
    .replace(/<br>/g, '\n')
    .replace(/<\/(p|tr|h2|h4)>/g, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim();
  return { subject, html, text };
};

module.exports = { render, SUBJECTS, esc };
