const mongoose = require('mongoose');

/**
 * One document per occupied 30-minute slot of the kitchen.
 *
 * The unique index on slot_start is what makes double-booking impossible:
 * two bookings (or a booking and a maintenance block) can never both own the
 * same slot, no matter how many requests arrive at once. Bookings insert
 * their slots inside the same transaction as the booking itself.
 */
const bookingSlotSchema = new mongoose.Schema({
  slot_start: { type: Date, required: true, unique: true },
  kind: { type: String, enum: ['booking', 'block'], required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', index: true, sparse: true },
  blocked_slot: { type: mongoose.Schema.Types.ObjectId, ref: 'BlockedSlot', index: true, sparse: true },
});

module.exports = mongoose.model('BookingSlot', bookingSlotSchema);
