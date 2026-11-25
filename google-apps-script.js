// @ts-nocheck
/* global SpreadsheetApp, MailApp, ContentService, PropertiesService, LockService, CacheService, Utilities */
/* eslint-disable no-unused-vars, no-undef */
/**
 * DAILY DROP — Google Sheets reporting + customer email webhook (v2)
 *
 * The Node API is the source of truth. It sends each change here from a
 * background queue, with retries. (If SMTP_URL is set on the server, emails go
 * out over SMTP instead and this script only maintains the sheet.) This script:
 *   - rejects any request without the shared secret,
 *   - upserts rows by reference code (retries never create duplicate rows),
 *   - sends customer emails with every value HTML-escaped,
 *   - exposes NO data over GET (the old version returned every booking to anyone).
 *
 * Setup
 *   1. Extensions > Apps Script, paste this file.
 *   2. Project Settings > Script Properties > add WEBHOOK_SECRET = a long random string
 *      (the same value as GOOGLE_SHEET_WEBHOOK_SECRET on the server).
 *   3. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
 *      ("Anyone" is required for the server to call it; the secret is what protects it.)
 *   4. Put the /exec URL in GOOGLE_SHEET_WEBHOOK_URL on the server.
 *   5. Delete the OLD deployment (Deploy > Manage deployments > Archive): its URL is public.
 */

var PERTH_TZ = 'Australia/Perth';

var SHEETS = {
  Bookings: ['Updated (Perth)', 'Reference', 'Name', 'Business', 'ABN', 'Email', 'Phone', 'Start Date', 'Start Time',
    'End Date', 'End Time', 'Hours', 'Base ex GST', 'GST', 'Total inc GST', 'Bond', 'Intended Use', 'Team Size',
    'Status', 'Payment', 'Admin Notes'],
  Storage: ['Updated (Perth)', 'Reference', 'Name', 'Business', 'ABN', 'Email', 'Phone', 'Storage Type', 'Bay',
    'Start Date', 'End Date', 'Days', 'Total inc GST', 'Bond', 'Status', 'Payment'],
  Enquiries: ['Updated (Perth)', 'Reference', 'Name', 'Business', 'Email', 'Phone', 'Preferred Contact', 'Type',
    'Message', 'Status'],
};

var FIELD_MAP = {
  Bookings: ['reference_code', 'full_name', 'business_name', 'abn', 'email', 'phone', 'booking_date', 'start_time',
    'end_date', 'end_time', 'duration_hours', 'base_cost', 'gst_amount', 'total_cost', 'security_deposit',
    'intended_use', 'team_size', 'status', 'payment_status', 'admin_notes'],
  Storage: ['reference_code', 'full_name', 'business_name', 'abn', 'email', 'phone', 'storage_type', 'bay_number',
    'start_date', 'end_date', 'duration_days', 'total_price', 'security_deposit', 'status', 'payment_status'],
  Enquiries: ['reference_code', 'full_name', 'business_name', 'email', 'phone', 'preferred_contact', 'rental_type',
    'message', 'status'],
};

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function safeEquals(a, b) {
  a = String(a || '');
  b = String(b || '');
  if (!a || !b || a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function esc(v) {
  return String(v === undefined || v === null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Prevent spreadsheet formula injection from user-entered text.
function cell(v) {
  var s = v === undefined || v === null ? '' : v;
  if (typeof s === 'string' && /^[=+\-@]/.test(s)) return "'" + s;
  return s;
}

function sheetFor(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(SHEETS[name]);
    sh.getRange(1, 1, 1, SHEETS[name].length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function upsert(name, row) {
  var sh = sheetFor(name);
  var values = [Utilities.formatDate(new Date(), PERTH_TZ, 'yyyy-MM-dd HH:mm:ss')].concat(
    FIELD_MAP[name].map(function (k) { return cell(row[k]); })
  );
  var last = sh.getLastRow();
  if (last > 1) {
    var refs = sh.getRange(2, 2, last - 1, 1).getDisplayValues();
    for (var i = 0; i < refs.length; i++) {
      if (refs[i][0] === row.reference_code) {
        sh.getRange(i + 2, 1, 1, values.length).setValues([values]);
        return;
      }
    }
  }
  sh.appendRow(values);
}

var SUBJECTS = {
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
};

function row(label, value) {
  return '<tr><td style="padding:6px 0;color:#6B7280">' + esc(label) + '</td><td style="padding:6px 0;font-weight:bold">' + esc(value) + '</td></tr>';
}

function sendEmail(email) {
  if (!email || !email.to || !SUBJECTS[email.template]) return;
  var d = email.data || {};
  var p = d.payment;
  var needsPayment = /received|approved/.test(email.template);
  var lines = '';
  lines += row('Reference', d.reference_code);
  if (d.booking_date) lines += row('Starts', d.booking_date + ' ' + (d.start_time || '') + ' AWST');
  if (d.end_date) lines += row('Ends', d.end_date + ' ' + (d.end_time || '') + ' AWST');
  if (d.start_date) lines += row('Storage', d.start_date + ' to ' + d.end_date + (d.bay_number ? ' (bay ' + d.bay_number + ')' : ''));
  if (d.total !== undefined) lines += row('Total (inc GST)', '$' + Number(d.total).toFixed(2) + ' AUD');
  if (d.bond !== undefined) lines += row('Refundable bond', '$' + Number(d.bond).toFixed(2) + ' AUD');
  if (d.invoice_number) lines += row('Tax invoice', d.invoice_number + ' (due ' + d.due_date + ')');

  var payBlock = '';
  if (needsPayment && p) {
    payBlock = '<h4 style="margin:16px 0 6px">How to pay</h4><table style="font-size:13px">' +
      (p.account_name ? row('Account name', p.account_name) : '') +
      (p.bank_name ? row('Bank', p.bank_name) : '') +
      (p.bsb ? row('BSB', p.bsb) : '') +
      (p.account_number ? row('Account', p.account_number) : '') +
      (p.payid ? row('PayID', p.payid) : '') +
      row('Reference to quote', d.reference_code) +
      '</table><p style="font-size:12px;color:#6B7280">Unpaid holds are released automatically. Your door access code appears in your Daily Drop dashboard once payment is confirmed.</p>';
  }
  if (/confirmed/.test(email.template)) {
    payBlock = '<p>Payment received — thank you. Log in to your Daily Drop dashboard to see your door access code.</p>';
  }

  var html = '<div style="font-family:Arial,sans-serif;max-width:560px;color:#1F2937">' +
    '<h2 style="color:#112F21">' + esc(d.seller_name || 'Daily Drop') + '</h2>' +
    '<p>Hi ' + esc(d.full_name || 'there') + ',</p>' +
    '<p>' + esc(SUBJECTS[email.template]) + '.</p>' +
    '<table style="font-size:13px">' + lines + '</table>' + payBlock +
    '<p style="font-size:12px;color:#6B7280">Questions? ' + esc(d.seller_phone) + ' · ' + esc(d.seller_email) + '</p></div>';

  MailApp.sendEmail({ to: String(email.to), subject: SUBJECTS[email.template], htmlBody: html });
}

function doPost(e) {
  var secret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
  var data;
  try {
    data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json({ status: 'error', message: 'bad json' });
  }
  if (!secret || !safeEquals(data.secret, secret)) {
    return json({ status: 'error', message: 'unauthorized' });
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return json({ status: 'error', message: 'busy, retry' });
  try {
    // Emails rendered (and HTML-escaped) by the server; this script only delivers them.
    if (data.action === 'send_email') {
      var cache0 = CacheService.getScriptCache();
      if (data.email && data.email.to && !(data.job_id && cache0.get('sent:' + data.job_id))) {
        MailApp.sendEmail({ to: String(data.email.to), subject: String(data.email.subject), htmlBody: String(data.email.html) });
        if (data.job_id) cache0.put('sent:' + data.job_id, '1', 21600);
      }
      return json({ status: 'success' });
    }

    var target = { upsert_booking: 'Bookings', upsert_storage: 'Storage', upsert_enquiry: 'Enquiries' }[data.action];
    if (!target) return json({ status: 'error', message: 'unknown action' });
    if (data.row && data.row.reference_code) upsert(target, data.row);

    // Idempotent email: a retried job must not email the customer twice.
    var cache = CacheService.getScriptCache();
    if (data.email && data.job_id && !cache.get('sent:' + data.job_id)) {
      sendEmail(data.email);
      cache.put('sent:' + data.job_id, '1', 21600);
    }
    return json({ status: 'success' });
  } catch (err) {
    return json({ status: 'error', message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// No data is served over GET.
function doGet() {
  return json({ status: 'ok' });
}
