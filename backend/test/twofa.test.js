const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.REQUIRE_ADMIN_2FA = 'true';
const helpers = require('./helpers');
const { reset, makeUser, api } = helpers;
const totp = require('../src/utils/totp');

before(helpers.setup);
after(helpers.teardown);
beforeEach(reset);

test('TOTP matches the RFC 6238 test vectors', () => {
  const secret = totp.base32Encode(Buffer.from('12345678901234567890'));
  assert.equal(secret, 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
  assert.equal(totp.generate(secret, 59 * 1000), '287082');
  assert.equal(totp.generate(secret, 1111111109 * 1000), '081804');
  assert.equal(totp.generate(secret, 2000000000 * 1000), '279037');
});

test('staff must enrol 2FA before using the portals, then need a code to log in', async () => {
  const { user } = await makeUser('staff_admin');
  const login1 = await api().post('/api/admin/login').send({ username: user.email, password: 'correct horse battery' });
  assert.equal(login1.status, 200);
  assert.equal(login1.body.two_factor_setup_required, true);
  const auth1 = { Authorization: `Bearer ${login1.body.access_token}` };

  const blocked = await api().get('/api/admin/bookings').set(auth1);
  assert.equal(blocked.status, 403);
  assert.equal(blocked.body.details.two_factor_setup_required, true);

  const setup = await api().post('/api/auth/2fa/setup').set(auth1);
  assert.match(setup.body.secret, /^[A-Z2-7]{32}$/);
  assert.match(setup.body.otpauth_url, /^otpauth:\/\/totp\//);
  assert.equal((await api().post('/api/auth/2fa/enable').set(auth1).send({ code: '000000' })).status, 400);
  const enabled = await api().post('/api/auth/2fa/enable').set(auth1).send({ code: totp.generate(setup.body.secret) });
  assert.equal(enabled.status, 200);
  assert.equal(enabled.body.user.two_factor_enabled, true);
  assert.equal((await api().get('/api/admin/bookings').set(auth1)).status, 401); // old token revoked
  assert.equal((await api().get('/api/admin/bookings').set('Authorization', `Bearer ${enabled.body.access_token}`)).status, 200);

  // Logging in now needs a fresh code. (The enrolment code was consumed, so use the next step's code.)
  const noCode = await api().post('/api/admin/login').send({ username: user.email, password: 'correct horse battery' });
  assert.equal(noCode.status, 401);
  assert.equal(noCode.body.details.otp_required, true);
  const wrong = await api().post('/api/admin/login').send({ username: user.email, password: 'correct horse battery', otp: '123456' });
  assert.equal(wrong.status, 401);
  const code = totp.generate(setup.body.secret, Date.now() + 30000);
  const ok = await api().post('/api/admin/login').send({ username: user.email, password: 'correct horse battery', otp: code });
  assert.equal(ok.status, 200);
  const replay = await api().post('/api/admin/login').send({ username: user.email, password: 'correct horse battery', otp: code });
  assert.equal(replay.status, 401);

  const disable = await api().post('/api/auth/2fa/disable').set('Authorization', `Bearer ${ok.body.access_token}`).send({ password: 'correct horse battery', code: '123456' });
  assert.equal(disable.status, 403);
});

test('customers are not affected by the staff 2FA rule', async () => {
  const { user } = await makeUser('hirer');
  const res = await api().post('/api/auth/login').send({ email: user.email, password: 'correct horse battery' });
  assert.equal(res.status, 200);
  assert.equal(res.body.two_factor_setup_required, false);
});
