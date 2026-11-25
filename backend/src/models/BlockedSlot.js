const mongoose = require('mongoose');

const blockedSlotSchema = new mongoose.Schema(
  {
    block_date: { type: String, required: true, index: true }, // Perth YYYY-MM-DD
    start_time: { type: String, required: true }, // HH:mm
    end_time: { type: String, required: true }, // HH:mm or 24:00
    start_at: { type: Date, required: true },
    end_at: { type: Date, required: true },
    reason: { type: String, default: 'Maintenance', maxlength: 300 },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

blockedSlotSchema.methods.toPublicShape = function toPublicShape() {
  return {
    id: this._id.toString(),
    block_date: this.block_date,
    start_time: this.start_time,
    end_time: this.end_time,
    reason: this.reason,
    created_at: this.createdAt?.toISOString(),
  };
};

module.exports = mongoose.model('BlockedSlot', blockedSlotSchema);
