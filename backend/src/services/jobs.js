const env = require('../config/env');
const logger = require('../utils/logger');
const { expireHolds } = require('./bookingService');
const { expireStorageHolds } = require('./storageService');
const outbox = require('./outboxService');

let timer = null;

const sweep = async () => {
  try {
    const k = await expireHolds();
    const s = await expireStorageHolds();
    if (k || s) logger.info(`[jobs] expired ${k} kitchen and ${s} storage holds`);
  } catch (err) {
    logger.error('[jobs] hold sweep failed', err.message);
  }
};

const start = () => {
  outbox.start();
  if (!timer) {
    timer = setInterval(sweep, env.HOLD_SWEEP_MS);
    timer.unref();
  }
};

const stop = () => {
  outbox.stop();
  if (timer) clearInterval(timer);
  timer = null;
};

module.exports = { start, stop, sweep };
