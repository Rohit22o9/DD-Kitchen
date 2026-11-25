const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

let memoryServer = null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

mongoose.set('strictQuery', true);

mongoose.connection.on('disconnected', () => logger.warn('[db] disconnected'));
mongoose.connection.on('reconnected', () => logger.info('[db] reconnected'));
mongoose.connection.on('error', (err) => logger.error('[db] error', err.message));

/**
 * Connect with exponential backoff. Bookings rely on multi-document
 * transactions, so the target must be a replica set (MongoDB Atlas is).
 * An in-memory replica set is only used when explicitly requested outside
 * production (USE_IN_MEMORY_DB=true) — never as a silent fallback.
 */
const connectDB = async (uriOverride) => {
  let uri = uriOverride || env.MONGODB_URI;

  if (!uri && env.USE_IN_MEMORY_DB && !env.isProd) {
    const { MongoMemoryReplSet } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    uri = memoryServer.getUri('dailydrop_dev');
    logger.warn('[db] Using an in-memory MongoDB replica set. Data is lost on restart.');
  }

  if (!uri) {
    throw new Error('MONGODB_URI is not set. For local throwaway data set USE_IN_MEMORY_DB=true.');
  }

  let attempt = 0;
  for (;;) {
    attempt += 1;
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000, retryWrites: true });
      logger.info(`[db] connected to ${mongoose.connection.host}/${mongoose.connection.name}`);
      break;
    } catch (err) {
      if (attempt >= env.DB_CONNECT_RETRIES) throw err;
      const wait = Math.min(30000, 500 * 2 ** attempt);
      logger.warn(`[db] connect attempt ${attempt} failed (${err.message}); retrying in ${wait}ms`);
      await sleep(wait);
    }
  }

  // Build indexes (including the unique slot index) before serving traffic.
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
};

const isDbUp = () => mongoose.connection.readyState === 1;

const closeDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
};

module.exports = { connectDB, closeDB, isDbUp };
