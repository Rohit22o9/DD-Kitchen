/**
 * Local demo data. Refuses to run in production.
 * Creates one hirer, one staff admin and one super admin with random
 * passwords (printed once), plus a maintenance block.
 */
const crypto = require('crypto');
const env = require('../config/env');
const { connectDB, closeDB } = require('../config/db');
const User = require('../models/User');
const bookingService = require('../services/bookingService');
const { ensureBays } = require('../services/storageService');
const { perthToday, addDays } = require('../utils/perthTime');

if (env.isProd) {
  console.error('seed:demo refuses to run with NODE_ENV=production.');
  process.exit(1);
}

const pw = () => crypto.randomBytes(9).toString('base64url');

(async () => {
  await connectDB();
  await ensureBays();
  const accounts = [
    { email: 'hirer@example.test', role: 'hirer', full_name: 'Demo Hirer', business_name: 'Demo Catering Co.' },
    { email: 'staff@example.test', role: 'staff_admin', full_name: 'Demo Staff Admin' },
    { email: 'director@example.test', role: 'super_admin', full_name: 'Demo Director' },
  ];
  console.log('Demo accounts (passwords shown once):');
  let superAdmin;
  for (const a of accounts) {
    const password = pw();
    let u = await User.findOne({ email: a.email });
    if (!u) u = new User({ ...a, terms_accepted_at: new Date(), terms_version: env.TERMS_VERSION });
    u.password = password;
    u.role = a.role;
    await u.save();
    if (a.role === 'super_admin') superAdmin = u;
    console.log(`  ${a.role.padEnd(12)} ${a.email.padEnd(24)} ${password}`);
  }
  try {
    await bookingService.createBlock(superAdmin, {
      block_date: addDays(perthToday(), 4),
      start_time: '06:00',
      end_time: '10:00',
      reason: 'Monthly deep clean & exhaust hood service',
    });
  } catch {
    /* already seeded */
  }
  await closeDB();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
