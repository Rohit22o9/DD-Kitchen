const mongoose = require('mongoose');
const { DEFAULT_HOURLY_RATE, KITCHEN_SECURITY_DEPOSIT } = require('../config/constants');

const bookingSchema = new mongoose.Schema(
  {
    reference_code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    full_name: {
      type: String,
      required: [true, 'Customer name is required'],
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
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    booking_date: {
      type: String, // YYYY-MM-DD
      required: [true, 'Booking date is required'],
      index: true,
    },
    start_time: {
      type: String, // HH:mm
      required: [true, 'Start time is required'],
    },
    end_time: {
      type: String, // HH:mm
      required: true,
    },
    duration_hours: {
      type: Number,
      required: true,
      default: 4,
    },
    hourly_rate: {
      type: Number,
      default: DEFAULT_HOURLY_RATE,
    },
    base_price: {
      type: Number,
      required: true,
    },
    cleaning_fee: {
      type: Number,
      default: 0.0,
    },
    security_deposit: {
      type: Number,
      default: KITCHEN_SECURITY_DEPOSIT,
    },
    total_price: {
      type: Number,
      required: true,
    },
    intended_use: {
      type: String,
      default: 'Commercial Food Production / Catering',
    },
    team_size: {
      type: Number,
      default: 1,
    },
    equipment_requirements: {
      type: String,
      default: 'All-Inclusive Commercial Facility Access',
    },
    additional_notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'confirmed', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
      index: true,
    },
    payment_status: {
      type: String,
      enum: ['unpaid', 'deposit_paid', 'paid', 'refunded'],
      default: 'unpaid',
      index: true,
    },
    payment_method: {
      type: String,
      default: '',
    },
    paid_at: {
      type: Date,
    },
    door_pin_code: {
      type: String,
      default: '',
    },
    door_access_pin: {
      type: String,
      default: '',
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    hold_expires_at: {
      type: Date,
    },
    admin_notes: {
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

bookingSchema.index({ booking_date: 1, status: 1 });

// Virtual for formatted id
bookingSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Booking', bookingSchema);
