const env = require('./config/env');
const logger = require('./utils/logger');
const { connectDB, closeDB } = require('./config/db');
const { createApp } = require('./app');
const jobs = require('./services/jobs');
const { ensureBays } = require('./services/storageService');
const KitchenConfig = require('./models/KitchenConfig');

let server;
let shuttingDown = false;

const shutdown = async (signal, code = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`[server] ${signal} received, shutting down`);
  const force = setTimeout(() => process.exit(code || 1), 10000);
  force.unref();
  jobs.stop();
  if (server) await new Promise((r) => server.close(r));
  await closeDB().catch(() => {});
  process.exit(code);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
  logger.error('[server] unhandled rejection', err);
  shutdown('unhandledRejection', 1);
});
process.on('uncaughtException', (err) => {
  logger.error('[server] uncaught exception', err);
  shutdown('uncaughtException', 1);
});

const start = async () => {
  await connectDB();
  await KitchenConfig.get();
  await ensureBays();
  if (!env.paymentDetails) logger.warn('[config] No PAYMENT_* details set: customers will not see bank details.');
  if (!env.seller.abn) logger.warn('[config] SELLER_ABN not set: approving bookings (which issues tax invoices) will fail.');

  const app = createApp();
  server = app.listen(env.PORT, () => logger.info(`[server] listening on :${env.PORT} (${env.NODE_ENV})`));
  jobs.start();
};

start().catch((err) => {
  logger.error('[server] failed to start', err);
  process.exit(1);
});
