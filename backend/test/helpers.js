/**
 * Test harness: a real single-node MongoDB replica set (transactions need one).
 * Locally you can point MONGOMS_SYSTEM_BINARY at an installed mongod;
 * in CI mongodb-memory-server downloads one.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-that-is-definitely-longer-than-32-chars';
process.env.SELLER_ABN = '51 824 753 556';
process.env.PAYMENT_ACCOUNT_NAME = 'Test Kitchens Pty Ltd';
process.env.PAYMENT_BSB = '000-000';
process.env.PAYMENT_ACCOUNT_NUMBER = '00000000';
process.env.PAYMENT_PAYID = 'payments@example.test';
process.env.CORS_ORIGINS = 'http://localhost:5173';

const { MongoMemoryReplSet } = require('mongodb-memory-server');
const request = require('supertest');
const mongoose = require('mongoose');
const { createApp } = require('../src/app');
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');
const { signToken } = require('../src/middlewares/auth');
const { ensureBays } = require('../src/services/storageService');
const { perthToday, addDays } = require('../src/utils/perthTime');

let replset;
const ctx = { app: null };

const setup = async () => {
  replset = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  ctx.app = createApp();
  await connectDB(replset.getUri('dd_test'));
  await ensureBays();
  return ctx;
};

const teardown = async () => {
  await mongoose.disconnect();
  if (replset) await replset.stop();
};

const reset = async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.filter((c) => !c.collectionName.startsWith('system.')).map((c) => c.deleteMany({})));
  await ensureBays();
};

let n = 0;
const makeUser = async (role = 'hirer', extra = {}) => {
  n += 1;
  const user = await User.create({
    full_name: `User ${n}`,
    email: `user${n}-${Date.now()}@example.test`,
    password: 'correct horse battery',
    role,
    phone: '+61 400 000 000',
    terms_accepted_at: new Date(),
    ...extra,
  });
  return { user, token: signToken(user), auth: { Authorization: `Bearer ${signToken(user)}` } };
};

const api = () => request(ctx.app);

/** A Perth date N days from today (always in the future for N >= 1). */
const day = (offset = 3) => addDays(perthToday(), offset);

const bookingBody = (over = {}) => ({
  phone: '+61 400 000 000',
  booking_date: day(3),
  start_time: '09:00',
  duration_hours: 4,
  intended_use: 'Catering prep',
  team_size: 2,
  terms_accepted: true,
  ...over,
});

module.exports = { setup, teardown, reset, makeUser, api, day, bookingBody, ctx };
