const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { setup, teardown, reset, makeUser, api, day, bookingBody } = require('./helpers');
const Booking = require('../src/models/Booking');
const BookingSlot = require('../src/models/BookingSlot');
const { expireHolds } = require('../src/services/bookingService');
const { perthToday, utcToPerth } = require('../src/utils/perthTime');

before(setup);
after(teardown);
beforeEach(reset);

test('a second booking for the same slot is rejected with 409', async () => {
  const a = await makeUser();
  const b = await makeUser();
  assert.equal((await api().post('/api/bookings').set(a.auth).send(bookingBody())).status, 201);
  const second = await api().post('/api/bookings').set(b.auth).send(bookingBody());
  assert.equal(second.status, 409);
});

test('partial overlaps are rejected; adjacent bookings are allowed', async () => {
  const u = await makeUser();
  assert.equal((await api().post('/api/bookings').set(u.auth).send(bookingBody({ start_time: '09:00', duration_hours: 4 }))).status, 201);
  assert.equal((await api().post('/api/bookings').set(u.auth).send(bookingBody({ start_time: '12:00', duration_hours: 2 }))).status, 409);
  assert.equal((await api().post('/api/bookings').set(u.auth).send(bookingBody({ start_time: '08:00', duration_hours: 2 }))).status, 409);
  assert.equal((await api().post('/api/bookings').set(u.auth).send(bookingBody({ start_time: '13:00', duration_hours: 2 }))).status, 201);
  assert.equal((await api().post('/api/bookings').set(u.auth).send(bookingBody({ start_time: '06:00', duration_hours: 2 }))).status, 201);
});

test('20 simultaneous requests for one slot produce exactly one booking', async () => {
  const users = await Promise.all(Array.from({ length: 20 }, () => makeUser()));
  const results = await Promise.all(users.map((u) => api().post('/api/bookings').set(u.auth).send(bookingBody({ start_time: '10:00' }))));
  const statuses = results.map((r) => r.status);
  assert.equal(statuses.filter((s) => s === 201).length, 1, `statuses: ${statuses.join(',')}`);
  assert.equal(statuses.filter((s) => s === 409).length, 19);
  assert.equal(await Booking.countDocuments(), 1);
  assert.equal(await BookingSlot.countDocuments(), 8); // 4h of 30-minute slots
});

test('overlapping simultaneous requests with different start times never double-book', async () => {
  const users = await Promise.all(Array.from({ length: 12 }, () => makeUser()));
  const starts = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00'];
  const results = await Promise.all(
    users.map((u, i) => api().post('/api/bookings').set(u.auth).send(bookingBody({ start_time: starts[i % starts.length], duration_hours: 4 })))
  );
  const ok = results.filter((r) => r.status === 201).map((r) => r.body);
  // No two successful bookings may overlap.
  for (let i = 0; i < ok.length; i++) {
    for (let j = i + 1; j < ok.length; j++) {
      const overlap = Date.parse(ok[i].start_at) < Date.parse(ok[j].end_at) && Date.parse(ok[j].start_at) < Date.parse(ok[i].end_at);
      assert.ok(!overlap, `${ok[i].start_time} and ${ok[j].start_time} overlap`);
    }
  }
  assert.ok(ok.length >= 1);
});

test('overnight shifts block the next morning and show on the next day', async () => {
  const u = await makeUser();
  const d = day(3);
  const night = await api().post('/api/bookings').set(u.auth).send(bookingBody({ booking_date: d, start_time: '22:00', duration_hours: 8 }));
  assert.equal(night.status, 201);
  assert.equal(night.body.end_date, day(4));
  assert.equal(night.body.end_time, '06:00');

  const morning = await api().post('/api/bookings').set(u.auth).send(bookingBody({ booking_date: day(4), start_time: '05:00', duration_hours: 2 }));
  assert.equal(morning.status, 409);

  const nextDay = await api().get(`/api/availability?date=${day(4)}`);
  assert.deepEqual(nextDay.body.slots.map((s) => [s.start_time, s.end_time]), [['00:00', '06:00']]);
  const firstDay = await api().get(`/api/availability?date=${d}`);
  assert.deepEqual(firstDay.body.slots.map((s) => [s.start_time, s.end_time]), [['22:00', '24:00']]);

  const check = await api().get(`/api/availability/check?booking_date=${day(4)}&start_time=06:00&duration_hours=2`);
  assert.equal(check.body.available, true);
});

test('past times, bad dates and bad durations are rejected', async () => {
  const u = await makeUser();
  const yesterday = (await api().post('/api/bookings').set(u.auth).send(bookingBody({ booking_date: day(-1) }))).status;
  assert.equal(yesterday, 400);
  for (const over of [
    { booking_date: '25/12/2026' },
    { booking_date: '2026-02-30' },
    { start_time: '9am' },
    { start_time: '09:15' },
    { duration_hours: 0 },
    { duration_hours: 1 }, // below the 2-hour minimum
    { duration_hours: 30 },
    { duration_hours: 4.25 },
  ]) {
    const res = await api().post('/api/bookings').set(u.auth).send(bookingBody(over));
    assert.equal(res.status, 400, JSON.stringify(over));
  }
});

test('earlier today in Perth is in the past', async () => {
  const u = await makeUser();
  const nowPerth = utcToPerth(new Date());
  const hour = Number(nowPerth.time.slice(0, 2));
  if (hour >= 1) {
    const res = await api().post('/api/bookings').set(u.auth).send(bookingBody({ booking_date: perthToday(), start_time: '00:00', duration_hours: 2 }));
    assert.equal(res.status, 400);
  }
});

test('booking requires login and terms acceptance', async () => {
  assert.equal((await api().post('/api/bookings').send(bookingBody())).status, 401);
  const u = await makeUser();
  assert.equal((await api().post('/api/bookings').set(u.auth).send(bookingBody({ terms_accepted: false }))).status, 400);
});

test('server pricing matches the published packages (ex GST + 10%)', async () => {
  const u = await makeUser();
  const cases = [
    [2, '06:00', 100, 10, 110],
    [4, '09:00', 152, 15.2, 167.2],
    [8, '14:00', 256, 25.6, 281.6],
    [12, '22:00', 360, 36, 396],
  ];
  for (const [hours, start, base, gst, total] of cases) {
    const res = await api().post('/api/bookings').set(u.auth).send(bookingBody({ booking_date: day(10 + hours), start_time: start, duration_hours: hours }));
    assert.equal(res.status, 201);
    assert.equal(res.body.base_price, base);
    assert.equal(res.body.gst, gst);
    assert.equal(res.body.total_price, total);
    assert.equal(res.body.security_deposit, 750);
  }
  const odd = await api().post('/api/bookings').set(u.auth).send(bookingBody({ booking_date: day(40), duration_hours: 3 }));
  assert.equal(odd.body.base_price, 114); // 3h x $38 hourly rate
});

test('maintenance blocks and bookings exclude each other', async () => {
  const admin = await makeUser('staff_admin');
  const u = await makeUser();
  const block = await api().post('/api/admin/blocked-slots').set(admin.auth).send({ block_date: day(5), start_time: '06:00', end_time: '10:00', reason: 'Deep clean' });
  assert.equal(block.status, 201);
  assert.equal((await api().post('/api/bookings').set(u.auth).send(bookingBody({ booking_date: day(5), start_time: '08:00' }))).status, 409);

  const booked = await api().post('/api/bookings').set(u.auth).send(bookingBody({ booking_date: day(6), start_time: '12:00' }));
  const clash = await api().post('/api/admin/blocked-slots').set(admin.auth).send({ block_date: day(6), start_time: '13:00', end_time: '14:00' });
  assert.equal(clash.status, 409);
  assert.deepEqual(clash.body.details.bookings, [booked.body.reference_code]);

  await api().delete(`/api/admin/blocked-slots/${block.body.id}`).set(admin.auth);
  assert.equal((await api().post('/api/bookings').set(u.auth).send(bookingBody({ booking_date: day(5), start_time: '08:00' }))).status, 201);
});

test('unpaid holds expire and release the slot', async () => {
  const a = await makeUser();
  const b = await makeUser();
  const first = await api().post('/api/bookings').set(a.auth).send(bookingBody());
  assert.ok(first.body.hold_expires_at);
  await Booking.updateOne({ reference_code: first.body.reference_code }, { hold_expires_at: new Date(Date.now() - 1000) });
  assert.equal(await expireHolds(), 1);
  const after = await Booking.findOne({ reference_code: first.body.reference_code });
  assert.equal(after.status, 'expired');
  assert.equal((await api().post('/api/bookings').set(b.auth).send(bookingBody())).status, 201);
});

test('customer cancellation releases the slot', async () => {
  const u = await makeUser();
  const created = await api().post('/api/bookings').set(u.auth).send(bookingBody());
  const cancel = await api().post(`/api/bookings/${created.body.reference_code}/cancel`).set(u.auth);
  assert.equal(cancel.status, 200);
  assert.equal(cancel.body.status, 'cancelled');
  assert.equal(await BookingSlot.countDocuments(), 0);
});

test('admin status changes follow the state machine', async () => {
  const admin = await makeUser('staff_admin');
  const u = await makeUser();
  const ref = (await api().post('/api/bookings').set(u.auth).send(bookingBody())).body.reference_code;
  const patch = (body) => api().patch(`/api/admin/bookings/${ref}/status`).set(admin.auth).send(body);

  assert.equal((await patch({ status: 'completed' })).status, 409);
  assert.equal((await patch({ status: 'confirmed' })).status, 409); // unpaid
  assert.equal((await patch({ status: 'approved' })).body.status, 'approved');
  const paid = await patch({ payment_status: 'paid', payment_reference: 'NAB 1234' });
  assert.equal(paid.body.status, 'confirmed');
  assert.equal(paid.body.payment_status, 'paid');
  assert.equal((await patch({ payment_status: 'unpaid' })).status, 409);
  assert.equal((await patch({ status: 'pending' })).status, 409);
  assert.equal((await patch({ status: 'bogus' })).status, 400);
  assert.equal((await patch({ status: 'completed' })).body.status, 'completed');
});

test('rejected bookings free their slots for others', async () => {
  const admin = await makeUser('staff_admin');
  const a = await makeUser();
  const b = await makeUser();
  const ref = (await api().post('/api/bookings').set(a.auth).send(bookingBody())).body.reference_code;
  await api().patch(`/api/admin/bookings/${ref}/status`).set(admin.auth).send({ status: 'rejected' });
  assert.equal((await api().post('/api/bookings').set(b.auth).send(bookingBody())).status, 201);
});

test('month availability summarises days without customer data', async () => {
  const u = await makeUser();
  const d = day(3);
  await api().post('/api/bookings').set(u.auth).send(bookingBody({ booking_date: d }));
  const [y, m] = d.split('-').map(Number);
  const res = await api().get(`/api/month-availability?year=${y}&month=${m}`);
  assert.equal(res.status, 200);
  assert.equal(res.body[d].status, 'partially_booked');
  assert.equal(res.body[d].total_booked_hours, 4);
  assert.ok(!JSON.stringify(res.body).includes('DD-BK-'));
});
