const mongoose = require('mongoose');

const blockedSlotSchema = new mongoose.Schema(
  {
    block_date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    start_time: {
      type: String, // HH:mm
      required: true,
    },
    end_time: {
      type: String, // HH:mm
      required: true,
    },
    reason: {
      type: String,
      default: 'Deep Clean / Facility Sanitization & Equipment Maintenance',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

blockedSlotSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('BlockedSlot', blockedSlotSchema);
