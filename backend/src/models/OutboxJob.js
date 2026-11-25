const mongoose = require('mongoose');

/**
 * Transactional outbox for the Google Sheets webhook. Jobs are written in the
 * same transaction as the booking they describe, then delivered by a
 * background worker with timeouts and retries — the request that created the
 * booking never waits on Google.
 */
const outboxJobSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    status: { type: String, enum: ['pending', 'processing', 'done', 'failed'], default: 'pending' },
    attempts: { type: Number, default: 0 },
    next_attempt_at: { type: Date, default: Date.now },
    locked_until: { type: Date },
    last_error: { type: String },
  },
  { timestamps: true }
);

outboxJobSchema.index({ status: 1, next_attempt_at: 1 });

module.exports = mongoose.model('OutboxJob', outboxJobSchema);
