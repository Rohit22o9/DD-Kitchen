const mongoose = require('mongoose');
const { BOOKING_STATUSES, STORAGE_TYPES, STORAGE_DURATION_TYPES } = require('../config/constants');
const { toDollars } = require('../utils/money');

const storageBookingSchema = new mongoose.Schema(
  {
    reference_code: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    full_name: { type: String, required: true, trim: true, maxlength: 120 },
    business_name: { type: String, trim: true, default: '', maxlength: 160 },
    abn: { type: String, trim: true, default: '' },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true, maxlength: 32 },

    storage_type: { type: String, enum: STORAGE_TYPES, required: true },
    bay_number: { type: Number, required: true, min: 1 },
    duration_type: { type: String, enum: STORAGE_DURATION_TYPES, required: true },
    // Occupancy is [start_date, occupied_until): occupied_until is exclusive.
    start_date: { type: String, required: true },
    end_date: { type: String, required: true },
    occupied_until: { type: String, required: true },
    duration_days: { type: Number, required: true },

    total_cents: { type: Number, required: true }, // GST-inclusive
    gst_cents: { type: Number, required: true },
    security_deposit_cents: { type: Number, required: true },

    status: { type: String, enum: BOOKING_STATUSES, default: 'pending' },
    payment_status: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
    payment_method: { type: String, default: '' },
    payment_reference: { type: String, default: '' },
    paid_at: { type: Date },
    hold_expires_at: { type: Date },
    access_code: { type: String, select: false },
    special_requirements: { type: String, default: '', maxlength: 2000 },
    admin_notes: { type: String, default: '', maxlength: 2000 },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    terms_version: { type: String },
    terms_accepted_at: { type: Date },
  },
  { timestamps: true }
);

storageBookingSchema.index({ bay_number: 1, status: 1, start_date: 1, occupied_until: 1 });
storageBookingSchema.index({ status: 1, payment_status: 1, hold_expires_at: 1 });

storageBookingSchema.methods.toPublicShape = function toPublicShape({ includeAccessCode = false, admin = false } = {}) {
  const o = {
    id: this._id.toString(),
    reference_code: this.reference_code,
    user_id: this.user?.toString(),
    full_name: this.full_name,
    business_name: this.business_name,
    abn: this.abn,
    email: this.email,
    phone: this.phone,
    storage_type: this.storage_type,
    bay_number: this.bay_number,
    duration_type: this.duration_type,
    start_date: this.start_date,
    end_date: this.end_date,
    duration_days: this.duration_days,
    daily_rate: toDollars(Math.round(this.total_cents / Math.max(1, this.duration_days))),
    total_price: toDollars(this.total_cents),
    gst: toDollars(this.gst_cents),
    security_deposit: toDollars(this.security_deposit_cents),
    amount_payable: toDollars(this.total_cents + this.security_deposit_cents),
    status: this.status,
    payment_status: this.payment_status,
    payment_method: this.payment_method,
    paid_at: this.paid_at?.toISOString(),
    hold_expires_at: this.hold_expires_at?.toISOString(),
    special_requirements: this.special_requirements,
    created_at: this.createdAt?.toISOString(),
  };
  if (admin) {
    o.admin_notes = this.admin_notes;
    o.payment_reference = this.payment_reference;
  }
  if (includeAccessCode && this.access_code) o.access_code = this.access_code;
  return o;
};

module.exports = mongoose.model('StorageBooking', storageBookingSchema);
