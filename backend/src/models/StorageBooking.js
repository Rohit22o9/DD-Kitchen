const mongoose = require('mongoose');

const storageBookingSchema = new mongoose.Schema(
  {
    reference_code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    business_name: {
      type: String,
      trim: true,
      default: '',
    },
    abn: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    bay_number: {
      type: Number,
      required: true,
      enum: [1, 2],
    },
    bay_name: {
      type: String,
      required: true,
    },
    storage_type: {
      type: String,
      enum: ['dry_storage', 'cold_storage'],
      required: true,
    },
    start_date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    end_date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    monthly_rate: {
      type: Number,
      required: true,
    },
    security_deposit: {
      type: Number,
      default: 200.00,
    },
    total_price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'confirmed',
      index: true,
    },
    payment_status: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'paid',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

storageBookingSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('StorageBooking', storageBookingSchema);
