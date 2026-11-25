const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { setup, teardown, reset, makeUser, api, bookingBody } = require('./helpers');
const router = require('../src/routes');
const User = require('../src/models/User');

before(setup);
after(teardown);
beforeEach(reset);

const routeTable = () =>
  router.stack
    .filter((l) => l.route)
    .map((l) => ({
      path: `/api${l.route.path}`,
      method: Object.keys(l.route.methods)[0].toUpperCase(),
      handlers: l.route.stack.length,
    }));

const ADMIN_PATHS = (p) => (p.startsWith('/api/admin') && !p.endsWith('/login')) || p.startsWith('/api/invoices');

test('every admin and finance route has a guard in front of its controller', () => {
  const routes = routeTable().filter((r) => ADMIN_PATHS(r.path));
  assert.ok(routes.length >= 15);
  for (const r of routes) assert.ok(r.handlers >= 2, `${r.method} ${r.path} has no middleware`);
});

test('unauthenticated requests to admin and finance routes get 401', async () => {
  const targets = routeTable().filter((r) => ADMIN_PATHS(r.path));
  assert.ok(targets.length >= 15, `expected many admin routes, found ${targets.length}`);
  for (const r of targets) {
    const path = r.path.replace(/:[a-zA-Z]+/g, 'x');
    const res = await api()[r.method.toLowerCase()](path).send({});
    assert.equal(res.status, 401, `${r.method} ${r.path} returned ${res.status}`);
  }
});

test('the old mock-token bypass (dd_adm_*) is rejected', async () => {
  const res = await api().get('/api/admin/bookings').set('Authorization', 'Bearer dd_adm_anything');
  assert.equal(res.status, 401);
});

test('a token signed with the old hard-coded secret is rejected', async () => {
  const { user } = await makeUser('super_admin');
  const forged = jwt.sign({ sub: user._id.toString(), role: 'super_admin', tv: 0 }, 'dailydrop_commercial_kitchen_jwt_secret_perth_2026_super_secure_key', {
    issuer: 'dailydrop-api',
    audience: 'dailydrop-web',
  });
  const res = await api().get('/api/invoices').set('Authorization', `Bearer ${forged}`);
  assert.equal(res.status, 401);
});

test('a hirer cannot reach admin routes; staff cannot reach finance routes', async () => {
  const hirer = await makeUser('hirer');
  const staff = await makeUser('staff_admin');
  assert.equal((await api().get('/api/admin/bookings').set(hirer.auth)).status, 403);
  assert.equal((await api().get('/api/admin/bookings').set(staff.auth)).status, 200);
  assert.equal((await api().get('/api/invoices').set(staff.auth)).status, 403);
  assert.equal((await api().put('/api/admin/config').set(hirer.auth).send({ hourly_rental_rate: 1 })).status, 403);
});

test('role is read from the database, not the token', async () => {
  const { user, auth } = await makeUser('staff_admin');
  await User.updateOne({ _id: user._id }, { role: 'hirer' });
  assert.equal((await api().get('/api/admin/bookings').set(auth)).status, 403);
});

test('the v1 hard-coded admin passwords no longer work', async () => {
  for (const [username, password] of [
    ['admin', 'admin123'],
    ['admin', 'kitchen2026'],
    ['superadmin', 'admin123'],
    ['director', 'director2026'],
  ]) {
    const a = await api().post('/api/admin/login').send({ username, password });
    const s = await api().post('/api/superadmin/login').send({ username, password });
    assert.equal(a.status, 401);
    assert.equal(s.status, 401);
  }
});

test('admin login works for a real staff account and refuses hirers', async () => {
  const { user } = await makeUser('staff_admin');
  const ok = await api().post('/api/admin/login').send({ username: user.email, password: 'correct horse battery' });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.access_token);
  const supr = await api().post('/api/superadmin/login').send({ username: user.email, password: 'correct horse battery' });
  assert.equal(supr.status, 403);
  const hirer = await makeUser('hirer');
  const no = await api().post('/api/admin/login').send({ username: hirer.user.email, password: 'correct horse battery' });
  assert.equal(no.status, 403);
});

test('changing password invalidates existing tokens', async () => {
  const { auth } = await makeUser('hirer');
  const res = await api().post('/api/auth/password').set(auth).send({ current_password: 'correct horse battery', new_password: 'another long password' });
  assert.equal(res.status, 200);
  assert.equal((await api().get('/api/auth/me').set(auth)).status, 401);
  assert.equal((await api().get('/api/auth/me').set('Authorization', `Bearer ${res.body.access_token}`)).status, 200);
});

test('signup enforces terms, password length and ABN checksum, and records acceptance', async () => {
  const base = { full_name: 'Ana', email: 'ana@example.test', password: 'long enough pw', terms_accepted: true };
  assert.equal((await api().post('/api/auth/signup').send({ ...base, terms_accepted: false })).status, 400);
  assert.equal((await api().post('/api/auth/signup').send({ ...base, password: 'short' })).status, 400);
  assert.equal((await api().post('/api/auth/signup').send({ ...base, abn: '12 312 312 312' })).status, 400);
  const ok = await api().post('/api/auth/signup').send({ ...base, abn: '51824753556' });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.user.abn, '51 824 753 556');
  assert.ok(ok.body.user.terms_accepted_at);
  assert.equal(ok.body.user.password, undefined);
  assert.equal((await api().post('/api/auth/signup').send(base)).status, 409);
});

test('login errors do not reveal whether the email exists', async () => {
  const { user } = await makeUser('hirer');
  const wrongPw = await api().post('/api/auth/login').send({ email: user.email, password: 'nope' });
  const noUser = await api().post('/api/auth/login').send({ email: 'ghost@example.test', password: 'nope' });
  assert.equal(wrongPw.status, 401);
  assert.equal(noUser.status, 401);
  assert.equal(wrongPw.body.error, noUser.body.error);
});

test('public availability exposes no customer data', async () => {
  const { auth } = await makeUser('hirer', { full_name: 'Secret Name' });
  const body = bookingBody();
  const created = await api().post('/api/bookings').set(auth).send(body);
  assert.equal(created.status, 201);
  const res = await api().get(`/api/availability?date=${body.booking_date}`);
  assert.equal(res.status, 200);
  const text = JSON.stringify(res.body);
  assert.ok(!text.includes('Secret Name'));
  assert.ok(!text.includes(created.body.reference_code));
  assert.ok(!text.includes('@example.test'));
  assert.equal(res.body.slots.length, 1);
});

test('booking lookup is owner-only, and the door code appears only after payment', async () => {
  const owner = await makeUser('hirer');
  const other = await makeUser('hirer');
  const admin = await makeUser('staff_admin');
  const created = await api().post('/api/bookings').set(owner.auth).send(bookingBody());
  const ref = created.body.reference_code;
  assert.match(ref, /^DD-BK-[2-9A-Z]{8}$/);

  assert.equal((await api().get(`/api/bookings/${ref}`)).status, 401);
  assert.equal((await api().get(`/api/bookings/${ref}`).set(other.auth)).status, 404);
  const mine = await api().get(`/api/bookings/${ref}`).set(owner.auth);
  assert.equal(mine.status, 200);
  assert.equal(mine.body.access_code, undefined);

  await api().patch(`/api/admin/bookings/${ref}/status`).set(admin.auth).send({ payment_status: 'paid' });
  const paid = await api().get(`/api/bookings/${ref}`).set(owner.auth);
  assert.equal(paid.body.status, 'confirmed');
  assert.match(paid.body.access_code, /^\d{6}$/);
  assert.notEqual(paid.body.access_code, '4892#');
});

test('old unauthenticated lookup-by-email route is gone; own bookings need a token', async () => {
  assert.equal((await api().get('/api/auth/bookings-by-email?email=a@b.c')).status, 404);
  assert.equal((await api().get('/api/auth/bookings')).status, 401);
});

test('booking email is the account email, not whatever the client sends', async () => {
  const { user, auth } = await makeUser('hirer');
  const res = await api().post('/api/bookings').set(auth).send(bookingBody({ email: 'victim@example.test' }));
  assert.equal(res.status, 201);
  assert.equal(res.body.email, user.email);
});

test('config updates ignore fields outside the whitelist', async () => {
  const { auth } = await makeUser('staff_admin');
  const res = await api().put('/api/admin/config').set(auth).send({ hourly_rental_rate: 40, singleton: 'evil', _id: 'x', $where: '1' });
  assert.equal(res.status, 200);
  assert.equal(res.body.hourly_rental_rate, 40);
  assert.equal(res.body.singleton, 'kitchen');
});

test('admin search treats input as text, not a regex', async () => {
  const { auth } = await makeUser('staff_admin');
  const res = await api().get('/api/admin/bookings?search=(').set(auth);
  assert.equal(res.status, 200);
});

test('server errors never include stack traces; validation errors are 400', async () => {
  const { auth } = await makeUser('hirer');
  const res = await api().post('/api/bookings').set(auth).send({});
  assert.equal(res.status, 400);
  assert.equal(res.body.stack, undefined);
  assert.ok(res.body.request_id);
  const bad = await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{not json');
  assert.equal(bad.status, 400);
});

test('CORS only allows configured origins; security headers are set', async () => {
  const ok = await api().get('/api/config').set('Origin', 'http://localhost:5173');
  assert.equal(ok.headers['access-control-allow-origin'], 'http://localhost:5173');
  const evil = await api().get('/api/config').set('Origin', 'https://evil.example');
  assert.equal(evil.headers['access-control-allow-origin'], undefined);
  assert.equal(ok.headers['x-powered-by'], undefined);
  assert.ok(ok.headers['x-content-type-options']);
});

test('health reports database state', async () => {
  const res = await api().get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.db, 'up');
});

test('compliance documents: type-checked upload, owner/admin-only download', async () => {
  const owner = await makeUser('hirer');
  const other = await makeUser('hirer');
  const admin = await makeUser('staff_admin');
  const pdf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(100, 1)]);

  const fake = await api().post('/api/auth/documents/food_safety_cert').set(owner.auth).attach('file', Buffer.from('MZ evil exe'), 'cert.pdf');
  assert.equal(fake.status, 400);

  const up = await api().post('/api/auth/documents/food_safety_cert').set(owner.auth).attach('file', pdf, 'cert.pdf');
  assert.equal(up.status, 201);
  assert.equal(up.body.user.food_safety_cert_name, 'cert.pdf');

  const mine = await api().get('/api/auth/documents/food_safety_cert').set(owner.auth);
  assert.equal(mine.status, 200);
  assert.equal(mine.headers['content-type'], 'application/pdf');

  assert.equal((await api().get('/api/auth/documents/food_safety_cert').set(other.auth)).status, 404);
  assert.equal((await api().get(`/api/admin/users/${owner.user._id}/documents/food_safety_cert`).set(other.auth)).status, 403);
  assert.equal((await api().get(`/api/admin/users/${owner.user._id}/documents/food_safety_cert`).set(admin.auth)).status, 200);
});
