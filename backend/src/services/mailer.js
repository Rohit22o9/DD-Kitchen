const nodemailer = require('nodemailer');
const env = require('../config/env');

let transport = null;

const getTransport = () => {
  if (!env.SMTP_URL) return null;
  if (!transport) transport = nodemailer.createTransport(env.SMTP_URL, { from: env.EMAIL_FROM });
  return transport;
};

/** Send a rendered email over SMTP. Throws on failure so the outbox retries. */
const sendSmtp = async ({ to, subject, html, text }) => {
  const t = getTransport();
  if (!t) throw new Error('SMTP is not configured');
  await t.sendMail({ from: env.EMAIL_FROM, to, subject, html, text });
};

module.exports = { sendSmtp, getTransport };
