const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { setup, teardown, reset, makeUser, api, day, bookingBody } = require('./helpers');
const BookingSlot = require('../src/models/BookingSlot');
const { perthToday } = require('../src/utils/perthTime');

before(setup);
after(teardown);
beforeEach(reset);

const approve = (admin, ref) => api().patch(`/api/admin/bookings/${ref}/status`).set(admin.auth).send({ status: 'approved' });

test('approving a booking issues a correct ATO tax invoice', async () => {
  const director = await makeUser('super_admin');
  const u = await makeUser('hirer', { business_name: 'Ana Catering', abn: '' });
  const ref = (await api().post('/api/bookings').set(u.auth).send(bookingBody())).body.reference_code;
  assert.equal((await approve(director, ref)).status, 200);

  const [inv] = (await api().get('/api/invoices').set(director.auth)).body;
  assert.equal(inv.document_title, 'Tax Invoice');
  assert.equal(inv.seller.abn, '51 824 753 556');
  assert.equal(inv.issue_date, perthToday()); // date of issue, not the service date
  assert.ok(inv.due_date <= day(3));
  assert.equal(inv.subtotal, 152);
  assert.equal(inv.gst, 15.2); // 10% of the ex-GST price (1/11 of 167.20), not 16.72
  assert.equal(inv.total_amount, 167.2);
  assert.equal(Math.round((inv.subtotal + inv.gst) * 100), Math.round(inv.total_amount * 100));
  assert.equal(inv.security_deposit, 750);
  assert.equal(inv.amount_payable, 917.2);
  // Bond is not a line item: it is shown separately and carries no GST.
  assert.equal(inv.line_items.length, 1);
  assert.ok(!inv.line_items.some((li) => /bond|deposit/i.test(li.description)));
  // Buyer ABN is blank when the customer has none — never the seller's ABN.
  assert.equal(inv.abn, '');
  assert.equal(inv.ai_risk_level, 'medium');
  assert.equal(inv.risk_source, 'rules');
});

test('invoice numbers are sequential and never change', async () => {
  const director = await makeUser('super_admin');
  const u = await makeUser();
  const refs = [];
  for (const start of ['06:00', '12:00', '18:00']) {
    refs.push((await api().post('/api/bookings').set(u.auth).send(bookingBody({ start_time: start }))).body.reference_code);
  }
  await approve(director, refs[0]);
  await approve(director, refs[1]);
  const before = (await api().get('/api/invoices').set(director.auth)).body.map((i) => [i.booking_reference, i.invoice_number]);
  // A new booking on an earlier date used to renumber every invoice.
  const early = (await api().post('/api/bookings').set(u.auth).send(bookingBody({ booking_date: day(1), start_time: '08:00' }))).body.reference_code;
  await approve(director, early);
  const after = (await api().get('/api/invoices').set(director.auth)).body.map((i) => [i.booking_reference, i.invoice_number]);
  for (const pair of before) assert.ok(after.some((p) => p[0] === pair[0] && p[1] === pair[1]));
  const nums = after.map((p) => Number(p[1].slice(-5))).sort((a, b) => a - b);
  assert.deepEqual(nums, [1, 2, 3]);
  assert.match(after[0][1], /^INV-\d{4}-\d{5}$/);
});

test('a valid customer ABN is printed; an invalid one is not', async () => {
  const director = await makeUser('super_admin');
  const u = await makeUser('hirer');
  const good = (await api().post('/api/bookings').set(u.auth).send(bookingBody({ abn: '51824753556' }))).body.reference_code;
  await approve(director, good);
  const [inv] = (await api().get('/api/invoices').set(director.auth)).body;
  assert.equal(inv.abn, '51 824 753 556');
  const bad = await api().post('/api/bookings').set(u.auth).send(bookingBody({ start_time: '15:00', abn: '12 312 312 312' }));
  assert.equal(bad.status, 400);
});

test('marking an invoice paid confirms the booking and issues a door code', async () => {
  const director = await makeUser('super_admin');
  const u = await makeUser();
  const ref = (await api().post('/api/bookings').set(u.auth).send(bookingBody())).body.reference_code;
  await approve(director, ref);
  const [inv] = (await api().get('/api/invoices').set(director.auth)).body;
  const paid = await api().patch(`/api/invoices/${inv.invoice_number}/status`).set(director.auth).send({ status: 'paid', payment_reference: 'PayID 998' });
  assert.equal(paid.status, 200);
  assert.equal(paid.body.invoice.status, 'paid');
  assert.equal(paid.body.invoice.ai_risk_level, 'low');
  const mine = await api().get(`/api/bookings/${ref}`).set(u.auth);
  assert.equal(mine.body.status, 'confirmed');
  assert.equal(mine.body.payment_status, 'paid');
  assert.match(mine.body.access_code, /^\d{6}$/);

  const voidPaid = await api().patch(`/api/invoices/${inv.invoice_number}/status`).set(director.auth).send({ status: 'void' });
  assert.equal(voidPaid.status, 409);
});

test('voiding an unpaid invoice cancels the booking and frees the slot', async () => {
  const director = await makeUser('super_admin');
  const u = await makeUser();
  const ref = (await api().post('/api/bookings').set(u.auth).send(bookingBody())).body.reference_code;
  await approve(director, ref);
  const [inv] = (await api().get('/api/invoices').set(director.auth)).body;
  const res = await api().patch(`/api/invoices/${inv.invoice_number}/status`).set(director.auth).send({ status: 'void', notes: 'Customer withdrew' });
  assert.equal(res.body.invoice.status, 'void');
  assert.equal(await BookingSlot.countDocuments(), 0);
  assert.equal((await api().get(`/api/bookings/${ref}`).set(u.auth)).body.status, 'cancelled');
});

test('custom invoices calculate GST per line and keep the bond untaxed', async () => {
  const director = await makeUser('super_admin');
  const res = await api()
    .post('/api/invoices')
    .set(director.auth)
    .send({
      customer_name: 'Bob',
      business_name: 'Bob Bakes',
      line_items: [
        { description: 'Equipment hire', quantity: 3, unit_price: 25 },
        { description: 'Pass-through (no GST)', quantity: 1, unit_price: 10, taxable: false },
      ],
      security_deposit: 100,
    });
  assert.equal(res.status, 201);
  assert.equal(res.body.subtotal, 85);
  assert.equal(res.body.gst, 7.5);
  assert.equal(res.body.total_amount, 92.5);
  assert.equal(res.body.amount_payable, 192.5);
});

test('customers see their own invoices only', async () => {
  const director = await makeUser('super_admin');
  const a = await makeUser();
  const b = await makeUser();
  const ref = (await api().post('/api/bookings').set(a.auth).send(bookingBody())).body.reference_code;
  await approve(director, ref);
  assert.equal((await api().get('/api/auth/invoices').set(a.auth)).body.length, 1);
  assert.equal((await api().get('/api/auth/invoices').set(b.auth)).body.length, 0);
});

test('finance assistant works without an AI key and uses real figures', async () => {
  const director = await makeUser('super_admin');
  const u = await makeUser();
  const ref = (await api().post('/api/bookings').set(u.auth).send(bookingBody())).body.reference_code;
  await approve(director, ref);
  const res = await api().post('/api/invoices/ai-query').set(director.auth).send({ query: 'Who owes us money?' });
  assert.equal(res.status, 200);
  assert.equal(res.body.isLiveGemini, false);
  assert.match(res.body.answer, /917\.20/);
});

test('dashboard stats are computed from real data', async () => {
  const admin = await makeUser('super_admin');
  const u = await makeUser();
  const ref = (await api().post('/api/bookings').set(u.auth).send(bookingBody())).body.reference_code;
  let stats = (await api().get('/api/admin/dashboard-stats').set(admin.auth)).body;
  assert.equal(stats.total_revenue, 0);
  assert.equal(stats.pending_requests, 1);
  await api().patch(`/api/admin/bookings/${ref}/status`).set(admin.auth).send({ payment_status: 'paid' });
  stats = (await api().get('/api/admin/dashboard-stats').set(admin.auth)).body;
  assert.equal(stats.total_revenue, 167.2);
  assert.equal(stats.gst_collected, 15.2);
  assert.equal(stats.storage_bays_occupied, 0);
});
