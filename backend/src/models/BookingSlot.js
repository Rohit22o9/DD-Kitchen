const mongoose = require('mongoose');

const bookingSlotSchema = new mongoose.Schema(
  {
    slot_date: {
      type: String, // YYYY-MM-DD in Australia/Perth
      required: true,
    },
    slot_hour: {
      type: Number, // 0..23
      required: true,
      min: 0,
      max: 23,
    },
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    reference_code: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Atomic concurrency lock: guarantees two bookings can never occupy the same date+hour
bookingSlotSchema.index({ slot_date: 1, slot_hour: 1 }, { unique: true });

module.exports = mongoose.model('BookingSlot', bookingSlotSchema);
