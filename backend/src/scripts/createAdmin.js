/**
 * Create or update a staff account.
 *
 *   ADMIN_EMAIL=ops@dailydrop.today ADMIN_PASSWORD='...' ADMIN_ROLE=super_admin npm run create-admin
 *   Add ADMIN_TOTP=true to enrol two-factor authentication at the same time.
 *
 * The password is read from the environment so it never appears in shell
 * history as a command-line argument. Use 12+ characters.
 */
const mongoose = require('mongoose');
const { connectDB, closeDB } = require('../config/db');
const User = require('../models/User');
const totp = require('../utils/totp');
const { seal } = require('../utils/secretBox');

(async () => {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  const role = process.env.ADMIN_ROLE || 'staff_admin';
  const name = process.env.ADMIN_NAME || (role === 'super_admin' ? 'Director' : 'Operations Manager');

  if (!email || password.length < 12 || !['staff_admin', 'super_admin'].includes(role)) {
    console.error('Set ADMIN_EMAIL, ADMIN_PASSWORD (12+ chars) and ADMIN_ROLE (staff_admin | super_admin).');
    process.exit(1);
  }

  await connectDB();
  let user = await User.findOne({ email });
  if (user) {
    user.role = role;
    user.password = password;
    user.token_version = (user.token_version || 0) + 1;
  } else {
    user = new User({ email, password, role, full_name: name, terms_accepted_at: new Date(), terms_version: 'staff' });
  }
  user.email_verified_at = user.email_verified_at || new Date();
  if (process.env.ADMIN_TOTP === 'true') {
    // Enrol two-factor now and print the key once, for the authenticator app.
    const secret = totp.generateSecret();
    user.totp_secret = seal(secret);
    user.totp_enabled = true;
    user.totp_last_step = -1;
    console.log('\nTwo-factor authentication enabled. Add this to an authenticator app now (shown once):');
    console.log(`  Key:  ${secret}`);
    console.log(`  Link: ${totp.otpauthUrl(secret, email)}\n`);
  }
  await user.save();
  console.log(`✓ ${role} account ready: ${email}`);
  await closeDB();
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
