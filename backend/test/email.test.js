const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { SMTPServer } = require('smtp-server');

// Capture outgoing mail with a local SMTP server.
const PORT = 43000 + Math.floor(Math.random() * 2000);
process.env.SMTP_URL = `smtp://127.0.0.1:${PORT}`;
process.env.REQUIRE_EMAIL_VERIFICATION = 'true';
process.env.APP_URL = 'https://book.example.test';
const helpers = require('./helpers');
const { reset, makeUser, api, bookingBody } = helpers;
const outbox = require('../src/services/outboxService');

const inbox = [];
const smtp = new SMTPServer({
  authOptional: true,
  disabledCommands: ['STARTTLS'],
  onData(stream, session, cb) {
    let raw = '';
    stream.on('data', (c) => (raw += c));
    stream.on('end', () => {
      inbox.push({ to: session.envelope.rcptTo.map((r) => r.address), raw: raw.replace(/=\r?\n/g, '').replace(/=3D/g, '=') });
      cb();
    });
  },
});

before(async () => {
  await new Promise((r) => smtp.listen(PORT, '127.0.0.1', r));
  await helpers.setup();
});
after(async () => {
  await helpers.teardown();
  await new Promise((r) => smtp.close(r));
});
beforeEach(async () => {
  await reset();
  inbox.length = 0;
});

const lastLink = (kind) => {
  const m = inbox[inbox.length - 1].raw.match(new RegExp(`#${kind}\\?token=([a-f0-9]{64})`));
  return m && m[1];
};

test('signup sends a verification email; bookings wait for verification', async () => {
  const s = await api().post('/api/auth/signup').send({ full_name: 'Ana <script>x</script>', email: 'ana@example.test', password: 'long password 1', terms_accepted: true });
  assert.equal(s.status, 201);
  assert.equal(s.body.user.email_verified, false);
  await outbox.processDueJobs();
  assert.equal(inbox.length, 1);
  assert.deepEqual(inbox[0].to, ['ana@example.test']);
  // HTML part escapes user input (the plain-text part legitimately shows it as text).
  assert.ok(inbox[0].raw.includes('&lt;script&gt;'), 'user input must be escaped in HTML');
  assert.ok(!/<p>Hi Ana <script>/.test(inbox[0].raw));
  const token = lastLink('verify-email');
  assert.ok(token);

  const auth = { Authorization: `Bearer ${s.body.access_token}` };
  const blocked = await api().post('/api/bookings').set(auth).send(bookingBody());
  assert.equal(blocked.status, 403);
  assert.equal(blocked.body.details.email_verification_required, true);

  const v = await api().post('/api/auth/verify-email').send({ token });
  assert.equal(v.status, 200);
  assert.equal(v.body.user.email_verified, true);
  assert.equal((await api().post('/api/auth/verify-email').send({ token })).status, 400); // one use
  assert.equal((await api().post('/api/bookings').set(auth).send(bookingBody())).status, 201);
});

test('forgot password: same answer for unknown emails; reset link works once and signs out old sessions', async () => {
  const { user, auth } = await makeUser('hirer');
  const unknown = await api().post('/api/auth/forgot-password').send({ email: 'nobody@example.test' });
  const known = await api().post('/api/auth/forgot-password').send({ email: user.email });
  assert.equal(unknown.status, 200);
  assert.deepEqual(unknown.body, known.body);
  await outbox.processDueJobs();
  assert.equal(inbox.length, 1);
  const token = lastLink('reset-password');
  assert.match(inbox[0].raw, /https:\/\/book\.example\.test\/#reset-password/);

  assert.equal((await api().post('/api/auth/reset-password').send({ token, new_password: 'short' })).status, 400);
  const ok = await api().post('/api/auth/reset-password').send({ token, new_password: 'a brand new password' });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.access_token);
  assert.equal((await api().post('/api/auth/reset-password').send({ token, new_password: 'another password 2' })).status, 400);
  assert.equal((await api().get('/api/auth/me').set(auth)).status, 401); // old session ended
  assert.equal((await api().post('/api/auth/login').send({ email: user.email, password: 'correct horse battery' })).status, 401);
  assert.equal((await api().post('/api/auth/login').send({ email: user.email, password: 'a brand new password' })).status, 200);
});

test('a booking sends the customer a confirmation email over SMTP', async () => {
  const { user, auth } = await makeUser('hirer', { email_verified_at: new Date() });
  const b = await api().post('/api/bookings').set(auth).send(bookingBody());
  assert.equal(b.status, 201);
  await outbox.processDueJobs();
  assert.equal(inbox.length, 1);
  assert.deepEqual(inbox[0].to, [user.email]);
  assert.match(inbox[0].raw, new RegExp(b.body.reference_code));
});
