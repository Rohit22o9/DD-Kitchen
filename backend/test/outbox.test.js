const http = require('http');
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// Point the webhook at a local fake Apps Script before the app loads.
const PORT = 41000 + Math.floor(Math.random() * 2000);
process.env.GOOGLE_SHEET_WEBHOOK_URL = `http://127.0.0.1:${PORT}/exec`;
process.env.GOOGLE_SHEET_WEBHOOK_SECRET = 'sheet-secret';
const helpers = require('./helpers');

const received = [];
let mode = 'ok';
const fake = http.createServer((req, res) => {
  let data = '';
  req.on('data', (c) => (data += c));
  req.on('end', () => {
    const body = JSON.parse(data);
    received.push(body);
    if (mode === 'slow') return setTimeout(() => res.end(JSON.stringify({ status: 'success' })), 3000);
    if (mode === 'fail') return res.end(JSON.stringify({ status: 'error', message: 'sheet locked' }));
    if (body.secret !== 'sheet-secret') return res.end(JSON.stringify({ status: 'error', message: 'unauthorized' }));
    return res.end(JSON.stringify({ status: 'success' }));
  });
});

before(async () => {
  await new Promise((r) => fake.listen(PORT, '127.0.0.1', r));
  await helpers.setup();
});
after(async () => {
  await helpers.teardown();
  fake.close();
});

const { reset, makeUser, api, bookingBody } = helpers;
const OutboxJob = require('../src/models/OutboxJob');
const outbox = require('../src/services/outboxService');

beforeEach(async () => {
  await reset();
  received.length = 0;
  mode = 'ok';
});

test('a booking queues a sheet row and an email in the same transaction; the worker delivers both with the secret', async () => {
  const u = await makeUser();
  const res = await api().post('/api/bookings').set(u.auth).send(bookingBody());
  assert.equal(res.status, 201);
  assert.equal(await OutboxJob.countDocuments({ status: 'pending' }), 2);
  assert.equal(await outbox.processDueJobs(), 2);
  assert.equal(received.length, 2);
  assert.ok(received.every((r) => r.secret === 'sheet-secret'));
  const row = received.find((r) => r.action === 'upsert_booking');
  const mail = received.find((r) => r.action === 'send_email');
  assert.equal(row.row.reference_code, res.body.reference_code);
  assert.equal(row.email, undefined);
  assert.match(mail.email.subject, /received your kitchen booking/);
  assert.match(mail.email.html, /000-000/); // payment details from server config
  assert.match(mail.email.html, new RegExp(res.body.reference_code));
  assert.equal(await OutboxJob.countDocuments({ status: 'done' }), 2);
});

test('a slow webhook does not delay the booking response', async () => {
  mode = 'slow';
  const u = await makeUser();
  const t0 = Date.now();
  const res = await api().post('/api/bookings').set(u.auth).send(bookingBody());
  assert.equal(res.status, 201);
  assert.ok(Date.now() - t0 < 2000, `booking took ${Date.now() - t0}ms`);
});

test('failed deliveries are retried with backoff, not dropped', async () => {
  mode = 'fail';
  const u = await makeUser();
  await api().post('/api/bookings').set(u.auth).send(bookingBody());
  await outbox.processDueJobs();
  const job = await OutboxJob.findOne({ type: 'upsert_booking' });
  assert.equal(job.status, 'pending');
  assert.equal(job.attempts, 1);
  assert.ok(job.next_attempt_at > new Date());
  assert.match(job.last_error, /sheet locked/);

  mode = 'ok';
  await OutboxJob.updateOne({ _id: job._id }, { next_attempt_at: new Date() });
  await outbox.processDueJobs();
  assert.equal((await OutboxJob.findById(job._id)).status, 'done');
});
