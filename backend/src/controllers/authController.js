const bcrypt = require('bcryptjs');
const env = require('../config/env');
const User = require('../models/User');
const Booking = require('../models/Booking');
const StorageBooking = require('../models/StorageBooking');
const Invoice = require('../models/Invoice');
const AdjustmentNote = require('../models/AdjustmentNote');
const crypto = require('crypto');
const { signToken, isAdmin } = require('../middlewares/auth');
const outbox = require('../services/outboxService');
const { email: emailJob } = require('../services/syncPayloads');
const totp = require('../utils/totp');
const { seal, open, sha256 } = require('../utils/secretBox');
const { HttpError } = require('../utils/httpError');
const documents = require('../services/documentService');
const { asyncHandler, unauthorized, forbidden, conflict, badRequest, notFound } = require('../utils/httpError');
const { formatAbn } = require('../utils/abn');

// Compared against when the email doesn't exist, so response time doesn't reveal which emails are registered.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 12);

const authResponse = (user) => ({
  access_token: signToken(user),
  token_type: 'bearer',
  user: user.toSafeJSON(),
  two_factor_setup_required: Boolean(env.REQUIRE_ADMIN_2FA && isAdmin(user) && !user.totp_enabled),
});

const newToken = () => crypto.randomBytes(32).toString('hex');

/** Create a verification token and queue the email. Returns nothing (the token only travels by email). */
const sendVerification = async (user) => {
  const token = newToken();
  user.verify_token_hash = sha256(token);
  user.verify_token_expires = new Date(Date.now() + 24 * 3600 * 1000);
  await user.save();
  await outbox.enqueue('send_email', emailJob(user.email, 'verify_email', { full_name: user.full_name, link: `${env.APP_URL}/#verify-email?token=${token}` }));
};

const signup = asyncHandler(async (req, res) => {
  const { full_name, email, password, business_name, abn, phone } = req.body;
  if (await User.exists({ email })) throw conflict('An account with this email already exists. Please log in.');
  const user = await User.create({
    full_name,
    email,
    password,
    business_name: business_name || '',
    abn: abn ? formatAbn(abn) : '',
    phone: phone || '',
    role: 'hirer',
    terms_accepted_at: new Date(),
    terms_version: env.TERMS_VERSION,
    terms_accepted_ip: req.ip,
  });
  await sendVerification(user);
  res.status(201).json(authResponse(user));
});

const verifyCredentials = async (email, password, otp) => {
  const user = await User.findOne({ email }).select('+password +totp_secret +totp_last_step');
  const ok = await bcrypt.compare(String(password), user ? user.password : DUMMY_HASH);
  if (!user || !ok) throw unauthorized('Invalid email or password.');
  if (user.totp_enabled) {
    if (!otp) throw new HttpError(401, 'Enter the 6-digit code from your authenticator app.', { otp_required: true });
    const step = totp.verify(open(user.totp_secret), otp, { lastUsedStep: user.totp_last_step });
    if (step === null) throw new HttpError(401, 'That authenticator code is wrong or already used.', { otp_required: true });
    // Atomic replay guard: a code can be used once, even by two simultaneous logins.
    const claimed = await User.updateOne({ _id: user._id, totp_last_step: { $lt: step } }, { totp_last_step: step });
    if (!claimed.modifiedCount) throw new HttpError(401, 'That authenticator code was already used.', { otp_required: true });
  }
  return user;
};

const login = asyncHandler(async (req, res) => {
  const user = await verifyCredentials(req.body.email, req.body.password, req.body.otp);
  res.json(authResponse(user));
});

/** Always answers the same way, so it can't be used to find out which emails have accounts. */
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    const token = newToken();
    user.reset_token_hash = sha256(token);
    user.reset_token_expires = new Date(Date.now() + 3600 * 1000);
    await user.save();
    await outbox.enqueue(
      'send_email',
      emailJob(user.email, 'password_reset', { full_name: user.full_name, link: `${env.APP_URL}/#reset-password?token=${token}` })
    );
  }
  res.json({ success: true, message: 'If an account exists for that email, a reset link is on its way.' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ reset_token_hash: sha256(req.body.token), reset_token_expires: { $gt: new Date() } });
  if (!user) throw new HttpError(400, 'This reset link has expired or was already used. Request a new one.');
  user.password = req.body.new_password;
  user.token_version = (user.token_version || 0) + 1; // sign out everywhere
  user.reset_token_hash = undefined;
  user.reset_token_expires = undefined;
  if (!user.email_verified_at) user.email_verified_at = new Date(); // they proved they own the inbox
  await user.save();
  // Accounts with 2FA still need their code at the next login, so don't hand out a session here.
  if (user.totp_enabled) return res.json({ success: true, message: 'Password changed. Log in with your new password and authenticator code.' });
  return res.json({ success: true, ...authResponse(user) });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const user = await User.findOne({ verify_token_hash: sha256(req.body.token), verify_token_expires: { $gt: new Date() } });
  if (!user) throw new HttpError(400, 'This verification link has expired. Log in and request a new one.');
  user.email_verified_at = new Date();
  user.verify_token_hash = undefined;
  user.verify_token_expires = undefined;
  await user.save();
  res.json({ success: true, user: user.toSafeJSON() });
});

const resendVerification = asyncHandler(async (req, res) => {
  if (req.user.email_verified_at) return res.json({ success: true, message: 'Your email is already confirmed.' });
  await sendVerification(req.user);
  return res.json({ success: true, message: 'Verification email sent.' });
});

// ---------- Two-factor authentication ----------
const setup2fa = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user.totp_enabled) throw new HttpError(409, 'Two-factor authentication is already on.');
  const secret = totp.generateSecret();
  user.totp_pending_secret = seal(secret);
  await user.save();
  res.json({ secret, otpauth_url: totp.otpauthUrl(secret, user.email) });
});

const enable2fa = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+totp_pending_secret');
  if (!user.totp_pending_secret) throw new HttpError(400, 'Start two-factor setup first.');
  const secret = open(user.totp_pending_secret);
  const step = totp.verify(secret, req.body.code);
  if (step === null) throw new HttpError(400, 'That code is not right. Check the time on your phone and try again.');
  user.totp_secret = seal(secret);
  user.totp_pending_secret = undefined;
  user.totp_enabled = true;
  user.totp_last_step = step;
  user.token_version = (user.token_version || 0) + 1;
  await user.save();
  res.json({ success: true, ...authResponse(user) });
});

const disable2fa = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password +totp_secret +totp_last_step');
  if (!user.totp_enabled) return res.json({ success: true, user: user.toSafeJSON() });
  if (env.REQUIRE_ADMIN_2FA && isAdmin(user)) throw new HttpError(403, 'Two-factor authentication is required for staff accounts.');
  if (!(await user.comparePassword(req.body.password))) throw unauthorized('Password is incorrect.');
  if (totp.verify(open(user.totp_secret), req.body.code, { lastUsedStep: user.totp_last_step }) === null) {
    throw unauthorized('That authenticator code is wrong.');
  }
  user.totp_enabled = false;
  user.totp_secret = undefined;
  user.token_version = (user.token_version || 0) + 1;
  await user.save();
  return res.json({ success: true, ...authResponse(user) });
});

/** Staff portal login: same user table, but the account must hold an admin role. */
const adminLoginFor = (roles) =>
  asyncHandler(async (req, res) => {
    const user = await verifyCredentials(req.body.email, req.body.password, req.body.otp);
    if (!roles.includes(user.role)) throw forbidden('This account does not have access to this portal.');
    const out = authResponse(user);
    res.json({ ...out, username: user.email, role: user.role });
  });

const me = asyncHandler(async (req, res) => res.json(req.user.toSafeJSON()));

const updateProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  for (const key of ['full_name', 'business_name', 'phone']) {
    if (req.body[key] !== undefined) user[key] = req.body[key];
  }
  if (req.body.abn !== undefined) user.abn = req.body.abn ? formatAbn(req.body.abn) : '';
  await user.save();
  res.json({ success: true, user: user.toSafeJSON() });
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.current_password))) throw unauthorized('Current password is incorrect.');
  user.password = req.body.new_password;
  user.token_version = (user.token_version || 0) + 1;
  await user.save();
  res.json(authResponse(user));
});

const myBookings = asyncHandler(async (req, res) => {
  const list = await Booking.find({ user: req.user._id }).select('+access_code').sort({ start_at: -1 }).limit(500);
  res.json(
    list.map((b) => b.toPublicShape({ includeAccessCode: b.status === 'confirmed' && b.payment_status === 'paid' }))
  );
});

const myStorageBookings = asyncHandler(async (req, res) => {
  const list = await StorageBooking.find({ user: req.user._id }).select('+access_code').sort({ start_date: -1 }).limit(500);
  res.json(
    list.map((s) => s.toPublicShape({ includeAccessCode: s.status === 'confirmed' && s.payment_status === 'paid' }))
  );
});

const myInvoices = asyncHandler(async (req, res) => {
  const list = await Invoice.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(500);
  const notes = await AdjustmentNote.find({ invoice: { $in: list.map((i) => i._id) } });
  res.json(
    list.map((i) =>
      i.toPublicShape({ adjustments: notes.filter((n) => String(n.invoice) === String(i._id)).map((n) => n.toPublicShape()) })
    )
  );
});

const uploadDocument = asyncHandler(async (req, res) => {
  const { kind } = req.params;
  if (!documents.KINDS.includes(kind)) throw notFound('Unknown document type.');
  if (!req.file) throw badRequest('Attach a PDF, JPG or PNG file (max 5 MB).');
  const sniffed = documents.sniffType(req.file.buffer);
  if (!sniffed || !documents.ALLOWED_TYPES.includes(sniffed)) throw badRequest('Only PDF, JPG or PNG files are accepted.');

  const safeName = String(req.file.originalname || 'document').replace(/[^\w.\- ]+/g, '_').slice(0, 120);
  const fileId = await documents.save(req.file.buffer, safeName, sniffed, { user: req.user._id.toString(), kind });
  const previous = req.user.documents?.[kind]?.file_id;
  req.user.set(`documents.${kind}`, { file_id: fileId, filename: safeName, content_type: sniffed, size: req.file.size, uploaded_at: new Date() });
  await req.user.save();
  if (previous) await documents.remove(previous);
  res.status(201).json({ success: true, user: req.user.toSafeJSON() });
});

const sendDocument = (user, kind, res) => {
  const doc = user?.documents?.[kind];
  if (!doc) throw notFound('Document not found.');
  res.setHeader('Content-Type', doc.content_type);
  res.setHeader('Content-Disposition', `attachment; filename="${doc.filename.replace(/"/g, '')}"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  documents.stream(doc.file_id).on('error', () => res.destroy()).pipe(res);
};

const downloadMyDocument = asyncHandler(async (req, res) => sendDocument(req.user, req.params.kind, res));

const downloadUserDocument = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  sendDocument(user, req.params.kind, res);
});

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  setup2fa,
  enable2fa,
  disable2fa,
  adminLogin: adminLoginFor(['staff_admin', 'super_admin']),
  superAdminLogin: adminLoginFor(['super_admin']),
  me,
  updateProfile,
  changePassword,
  myBookings,
  myStorageBookings,
  myInvoices,
  uploadDocument,
  downloadMyDocument,
  downloadUserDocument,
};
