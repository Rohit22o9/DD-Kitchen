const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { setup, teardown, reset, makeUser, api, day } = require('./helpers');
const StorageBooking = require('../src/models/StorageBooking');

before(setup);
after(teardown);
beforeEach(reset);

const body = (over = {}) => ({
  phone: '+61 400 000 000',
  storage_type: 'cool_room',
  start_date: day(2),
  end_date: day(32),
  duration_type: 'monthly',
  terms_accepted: true,
  ...over,
});

test('storage prices: a 30-day month is one month, a 7-day week is one week', async () => {
  const q = (s, e, t) => api().get(`/api/storage/availability?start_date=${s}&end_date=${e}&duration_type=${t}`);
  assert.equal((await q(day(2), day(32), 'monthly')).body.quote.total_price, 220); // was $440 in v1
  assert.equal((await q(day(2), day(9), 'weekly')).body.quote.total_price, 70); // was $140 in v1
  assert.equal((await q(day(2), day(2), 'daily')).body.quote.total_price, 15);
  assert.equal((await q(day(2), day(5), 'daily')).body.quote.total_price, 45);
  assert.equal((await q(day(2), day(62), 'custom')).body.quote.total_price, 480); // 60 days x $8
  const r = (await q(day(2), day(32), 'monthly')).body.quote;
  assert.equal(r.gst, 20); // GST-inclusive: 220 / 11
});

test('storage needs login and terms, and rejects past start dates', async () => {
  assert.equal((await api().post('/api/storage-bookings').send(body())).status, 401);
  const u = await makeUser();
  assert.equal((await api().post('/api/storage-bookings').set(u.auth).send(body({ terms_accepted: false }))).status, 400);
  assert.equal((await api().post('/api/storage-bookings').set(u.auth).send(body({ start_date: day(-2) }))).status, 400);
});

test('only two tenants can overlap; the third gets 409', async () => {
  const users = await Promise.all([makeUser(), makeUser(), makeUser()]);
  const r1 = await api().post('/api/storage-bookings').set(users[0].auth).send(body());
  const r2 = await api().post('/api/storage-bookings').set(users[1].auth).send(body({ start_date: day(10), end_date: day(20), duration_type: 'custom' }));
  const r3 = await api().post('/api/storage-bookings').set(users[2].auth).send(body({ start_date: day(15), end_date: day(16), duration_type: 'daily' }));
  assert.equal(r1.status, 201);
  assert.equal(r2.status, 201);
  assert.notEqual(r1.body.bay_number, r2.body.bay_number);
  assert.equal(r3.status, 409);
  // New bookings are pending and unpaid (v1 auto-marked them "paid").
  assert.equal(r1.body.status, 'pending');
  assert.equal(r1.body.payment_status, 'unpaid');
  // A non-overlapping booking after both leases end gets a bay.
  const r4 = await api().post('/api/storage-bookings').set(users[2].auth).send(body({ start_date: day(32), end_date: day(40), duration_type: 'custom' }));
  assert.equal(r4.status, 201);
});

test('concurrent storage requests never exceed bay capacity', async () => {
  const users = await Promise.all(Array.from({ length: 8 }, () => makeUser()));
  const results = await Promise.all(users.map((u) => api().post('/api/storage-bookings').set(u.auth).send(body())));
  const statuses = results.map((r) => r.status);
  assert.equal(statuses.filter((s) => s === 201).length, 2, statuses.join(','));
  assert.equal(await StorageBooking.countDocuments(), 2);
  const bays = results.filter((r) => r.status === 201).map((r) => r.body.bay_number).sort();
  assert.deepEqual(bays, [1, 2]);
});

test('public storage availability shows counts only', async () => {
  const u = await makeUser('hirer', { full_name: 'Private Person' });
  await api().post('/api/storage-bookings').set(u.auth).send(body());
  const res = await api().get(`/api/storage/availability?start_date=${day(5)}&end_date=${day(6)}`);
  assert.equal(res.body.available_bays_count, 1);
  assert.deepEqual(res.body.overlapping_bookings, []);
  assert.ok(!JSON.stringify(res.body).includes('Private Person'));
});

test('storage payment issues a GST-inclusive invoice and confirms the lease', async () => {
  const director = await makeUser('super_admin');
  const u = await makeUser();
  const ref = (await api().post('/api/storage-bookings').set(u.auth).send(body())).body.reference_code;
  const res = await api().patch(`/api/admin/storage-bookings/${ref}/status`).set(director.auth).send({ payment_status: 'paid' });
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'confirmed');
  const [inv] = (await api().get('/api/invoices').set(director.auth)).body;
  assert.equal(inv.total_amount, 220);
  assert.equal(inv.gst, 20);
  assert.equal(inv.subtotal, 200);
  assert.equal(inv.security_deposit, 200);
  assert.equal(inv.status, 'paid');
  const mine = (await api().get('/api/auth/storage-bookings').set(u.auth)).body[0];
  assert.match(mine.access_code, /^\d{6}$/);
});
