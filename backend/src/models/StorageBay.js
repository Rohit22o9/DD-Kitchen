const mongoose = require('mongoose');

/**
 * One document per physical storage bay. A booking transaction writes to the
 * bay document before checking its occupancy, so two transactions competing
 * for the same bay always conflict and one is retried — no overbooking.
 */
const storageBaySchema = new mongoose.Schema({
  bay_number: { type: Number, required: true, unique: true },
  lock_version: { type: Number, default: 0 },
});

module.exports = mongoose.model('StorageBay', storageBaySchema);
