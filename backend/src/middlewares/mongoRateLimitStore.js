/**
 * express-rate-limit store backed by MongoDB, so limits are shared by every
 * API instance (no Redis needed). Counters expire via a TTL index.
 */
const mongoose = require('mongoose');

const COLLECTION = 'ratelimits';
let indexReady = null;

const ensureIndex = () => {
  if (!indexReady) {
    indexReady = mongoose.connection
      .collection(COLLECTION)
      .createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 })
      .catch(() => {
        indexReady = null;
      });
  }
  return indexReady;
};

class MongoRateLimitStore {
  constructor(prefix) {
    this.prefix = prefix;
    this.localKeys = false; // shared across instances
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  key(k) {
    return `${this.prefix}:${k}`;
  }

  async increment(k) {
    await ensureIndex();
    const now = new Date();
    const fresh = { $or: [{ $eq: [{ $ifNull: ['$expires_at', null] }, null] }, { $lte: ['$expires_at', now] }] };
    // One atomic pipeline update: start a new window if the old one ended, else count up.
    const doc = await mongoose.connection.collection(COLLECTION).findOneAndUpdate(
      { _id: this.key(k) },
      [
        {
          $set: {
            hits: { $cond: [fresh, 1, { $add: ['$hits', 1] }] },
            expires_at: { $cond: [fresh, new Date(now.getTime() + this.windowMs), '$expires_at'] },
          },
        },
      ],
      { upsert: true, returnDocument: 'after' }
    );
    const value = doc && doc.value !== undefined && !doc.hits ? doc.value : doc;
    return { totalHits: value.hits, resetTime: value.expires_at };
  }

  async decrement(k) {
    await mongoose.connection.collection(COLLECTION).updateOne({ _id: this.key(k), hits: { $gt: 0 } }, { $inc: { hits: -1 } });
  }

  async resetKey(k) {
    await mongoose.connection.collection(COLLECTION).deleteOne({ _id: this.key(k) });
  }
}

module.exports = MongoRateLimitStore;
