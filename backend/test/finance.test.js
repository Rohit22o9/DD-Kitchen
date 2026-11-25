const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { setup, teardown, reset, makeUser, api, day, bookingBody } = require('./helpers');
const BookingSlot = require('../src/models/BookingSlot');
const MongoRateLimitStore = require('../src/middlewares/mongoRateLimitStore');

before(setup);
after(teardown);
beforeEach(reset);

const paidBooking = async (director, customer, over = {}) => {
  const ref = (await api().post('/api/bookings').set(customer.auth).send(bookingBody(over))).body.reference_code;
  await api().patch(`/api/admin/bookings/${ref}/status`).set(director.auth).send({ payment_status: 'paid', payment_reference: 'TEST' });
  const inv = (await api().get('/api/invoices').set(director.auth)).body.find((i) => i.booking_reference === ref);
  return { ref, inv };
};

test('partial refund issues an adjustment note with proportional GST', async () => {
  const director = await makeUser('super_admin');
  const c = await makeUser();
  const { inv } = await paidBooking(director, c);
  const r = await api().post(`/api/invoices/${inv.invoice_number}/refund`).set(director.auth).send({ amount: 50, reason: 'Oven fault, 1 hour lost' });
  assert.equal(r.status, 201);
  assert.match(r.body.adjustment_note.note_number, /^ADJ-\d{4}-00001$/);
  assert.equal(r.body.adjustment_note.document_title, 'Adjustment Note');
  assert.equal(r.body.adjustment_note.gst, 4.55); // 50 x 15.20 / 167.20
  assert.equal(r.body.invoice.refunded_amount, 50);
  assert.equal(r.body.invoice.adjustments.length, 1);

  const stats = (await api().get('/api/admin/dashboard-stats').set(director.auth)).body;
  assert.equal(stats.total_revenue, 117.2);
  assert.equal(stats.gst_collected, 10.65);

  assert.equal((await api().post(`/api/invoices/${inv.invoice_number}/refund`).set(director.auth).send({ amount: 200, reason: 'Too much' })).status, 400);
  assert.equal((await api().get('/api/auth/invoices').set(c.auth)).body[0].adjustments[0].amount, 50);
});

test('full refund with cancellation frees the slot and marks the booking refunded', async () => {
  const director = await makeUser('super_admin');
  const c = await makeUser();
  const { ref, inv } = await paidBooking(director, c);
  const r = await api().post(`/api/invoices/${inv.invoice_number}/refund`).set(director.auth).send({ amount: 167.2, reason: 'Facility closed', cancel_booking: true });
  assert.equal(r.status, 201);
  const b = (await api().get(`/api/bookings/${ref}`).set(c.auth)).body;
  assert.equal(b.status, 'cancelled');
  assert.equal(b.payment_status, 'refunded');
  assert.equal(await BookingSlot.countDocuments(), 0);
});

test('refunds need a paid invoice', async () => {
  const director = await makeUser('super_admin');
  const c = await makeUser();
  const ref = (await api().post('/api/bookings').set(c.auth).send(bookingBody())).body.reference_code;
  await api().patch(`/api/admin/bookings/${ref}/status`).set(director.auth).send({ status: 'approved' });
  const inv = (await api().get('/api/invoices').set(director.auth)).body[0];
  assert.equal((await api().post(`/api/invoices/${inv.invoice_number}/refund`).set(director.auth).send({ amount: 10, reason: 'x test' })).status, 409);
});

test('bond settlement: partial retention carries GST, and a bond settles only once', async () => {
  const director = await makeUser('super_admin');
  const c = await makeUser();
  const { inv } = await paidBooking(director, c);
  assert.equal(inv.bond_status, 'held');
  assert.equal((await api().get('/api/admin/dashboard-stats').set(director.auth)).body.bonds_held, 750);

  assert.equal((await api().post(`/api/invoices/${inv.invoice_number}/bond`).set(director.auth).send({ refund_amount: 700, forfeit_amount: 10, reason: 'x' })).status, 400);
  assert.equal((await api().post(`/api/invoices/${inv.invoice_number}/bond`).set(director.auth).send({ refund_amount: 700, forfeit_amount: 50 })).status, 400);
  const ok = await api().post(`/api/invoices/${inv.invoice_number}/bond`).set(director.auth).send({ refund_amount: 700, forfeit_amount: 50, reason: 'Deep clean required', reference: 'NAB 991' });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.invoice.bond_status, 'partly_forfeited');
  assert.equal(ok.body.invoice.bond_forfeit_gst, 4.55);
  assert.equal((await api().post(`/api/invoices/${inv.invoice_number}/bond`).set(director.auth).send({ refund_amount: 750 })).status, 409);

  const stats = (await api().get('/api/admin/dashboard-stats').set(director.auth)).body;
  assert.equal(stats.bonds_held, 0);
  assert.equal(stats.total_revenue, 217.2); // 167.20 hire + 50 retained bond
  assert.equal(stats.gst_collected, 19.75); // 15.20 + 4.55
});

test('bank CSV import matches references and records exact payments', async () => {
  const director = await makeUser('super_admin');
  const c = await makeUser();
  const a = (await api().post('/api/bookings').set(c.auth).send(bookingBody({ start_time: '06:00' }))).body; // pending, no invoice yet
  const b = (await api().post('/api/bookings').set(c.auth).send(bookingBody({ start_time: '12:00' }))).body;
  await api().patch(`/api/admin/bookings/${b.reference_code}/status`).set(director.auth).send({ status: 'approved' });
  const s = (await api().post('/api/storage-bookings').set(c.auth).send({ phone: '+61 400 000 000', storage_type: 'cool_room', start_date: day(2), end_date: day(32), duration_type: 'monthly', terms_accepted: true })).body;

  const csv = [
    'Date,Amount,Account Number,,Transaction Type,Transaction Details,Balance,Category,Merchant Name',
    `24 Nov 26,917.20,123,,INTER-BANK CREDIT,"PAYID TRANSFER ${a.reference_code.toLowerCase()} ANA",1000,,`,
    `24/11/2026,917.20,123,,INTER-BANK CREDIT,OSKO ${b.reference_code},1917.20,,`,
    `2026-11-24,"$420.00",123,,INTER-BANK CREDIT,Storage ${s.reference_code},2337.20,,`,
    `24/11/2026,100.00,123,,INTER-BANK CREDIT,Payment for DD-BK-ZZZZZZZZ,2437.20,,`,
    `24/11/2026,-50.00,123,,DEBIT,Supplies,2387.20,,`,
    `24/11/2026,900.00,123,,INTER-BANK CREDIT,${a.reference_code} part payment,3287.20,,`,
  ].join('\n');

  const preview = await api().post('/api/invoices/reconcile').set(director.auth).send({ csv });
  assert.equal(preview.status, 200);
  assert.equal(preview.body.summary.credits, 5); // the debit is ignored
  const st = Object.fromEntries(preview.body.results.map((r) => [`${r.line}`, r.status]));
  assert.deepEqual(Object.values(st), ['match', 'match', 'match', 'unknown_reference', 'amount_mismatch']);
  assert.equal(preview.body.results[0].date, '2026-11-24');

  const applied = await api().post('/api/invoices/reconcile').set(director.auth).send({ csv, apply: true });
  assert.equal(applied.body.summary.recorded, 3);
  for (const ref of [a.reference_code, b.reference_code]) {
    const bk = (await api().get(`/api/bookings/${ref}`).set(c.auth)).body;
    assert.equal(bk.status, 'confirmed');
    assert.equal(bk.payment_status, 'paid');
    assert.match(bk.access_code, /^\d{6}$/);
  }
  const again = await api().post('/api/invoices/reconcile').set(director.auth).send({ csv, apply: true });
  assert.equal(again.body.summary.recorded, 0);
  assert.equal(again.body.summary.already_paid, 4);

  // Header-less CBA-style export: date, amount, description, balance
  const cba = `25/11/2026,"+917.20","Transfer from ANA ${a.reference_code}","+5000.00"`;
  const r2 = await api().post('/api/invoices/reconcile').set(director.auth).send({ csv: cba });
  assert.equal(r2.body.results[0].status, 'already_paid');
  assert.equal(r2.body.results[0].amount, 917.2);
});

test('recurring series books each free date and reports clashes', async () => {
  const c = await makeUser();
  const other = await makeUser();
  await api().post('/api/bookings').set(other.auth).send(bookingBody({ booking_date: day(17), start_time: '10:00' }));
  const r = await api()
    .post('/api/bookings/recurring')
    .set(c.auth)
    .send({ ...bookingBody({ booking_date: day(3), start_time: '09:00' }), frequency: 'weekly', occurrences: 4 });
  assert.equal(r.status, 201);
  assert.equal(r.body.created.length, 3);
  assert.deepEqual(r.body.skipped.map((x) => x.booking_date), [day(17)]);
  assert.ok(r.body.created.every((b) => b.series_id === r.body.series_id));
  assert.deepEqual(r.body.created.map((b) => b.booking_date), [day(3), day(10), day(24)]);
});

test('staff directory lists customers with document status (admin only)', async () => {
  const admin = await makeUser('staff_admin');
  const c = await makeUser('hirer', { full_name: 'Zed Baker' });
  assert.equal((await api().get('/api/admin/users').set(c.auth)).status, 403);
  const list = (await api().get('/api/admin/users?search=zed').set(admin.auth)).body;
  assert.equal(list.length, 1);
  assert.equal(list[0].full_name, 'Zed Baker');
  assert.equal(list[0].password, undefined);
});

test('MongoDB rate-limit store counts atomically across concurrent requests and resets per window', async () => {
  const store = new MongoRateLimitStore('t');
  store.init({ windowMs: 1500 });
  const results = await Promise.all(Array.from({ length: 25 }, () => store.increment('k')));
  assert.deepEqual(results.map((r) => r.totalHits).sort((x, y) => x - y), Array.from({ length: 25 }, (_, i) => i + 1));
  await new Promise((r) => setTimeout(r, 1600));
  assert.equal((await store.increment('k')).totalHits, 1);
  await store.resetKey('k');
  assert.equal(await mongoose.connection.collection('ratelimits').countDocuments({ _id: 't:k' }), 0);
});
