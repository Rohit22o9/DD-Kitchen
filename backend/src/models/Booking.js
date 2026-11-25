const mongoose = require('mongoose');
const { BOOKING_STATUSES } = require('../config/constants');
const { toDollars } = require('../utils/money');

const bookingSchema = new mongoose.Schema(
  {
    reference_code: { type: String, required: true, unique: true },
    // Required for every new booking; v1 bookings migrated without a matching account have none.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },

    full_name: { type: String, required: true, trim: true, maxlength: 120 },
    business_name: { type: String, trim: true, default: '', maxlength: 160 },
    abn: { type: String, trim: true, default: '' },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true, maxlength: 32 },

    // Perth wall-clock values for display
    booking_date: { type: String, required: true }, // YYYY-MM-DD (start date)
    start_time: { type: String, required: true }, // HH:mm
    end_date: { type: String, required: true }, // YYYY-MM-DD (may be next day)
    end_time: { type: String, required: true }, // HH:mm
    // Absolute instants: the source of truth for overlap and time checks
    start_at: { type: Date, required: true },
    end_at: { type: Date, required: true },
    duration_hours: { type: Number, required: true },

    package_label: { type: String, default: '' },
    base_price_cents: { type: Number, required: true }, // ex GST
    gst_cents: { type: Number, required: true },
    total_cents: { type: Number, required: true }, // inc GST
    cleaning_fee_cents: { type: Number, default: 0 },
    security_deposit_cents: { type: Number, required: true }, // refundable bond, not GST-able

    intended_use: { type: String, default: 'Commercial Food Production', maxlength: 200 },
    team_size: { type: Number, default: 1, min: 1, max: 50 },
    equipment_requirements: { type: String, default: '', maxlength: 500 },
    additional_notes: { type: String, default: '', maxlength: 2000 },

    status: { type: String, enum: BOOKING_STATUSES, default: 'pending' },
    payment_status: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
    payment_method: { type: String, default: '' },
    payment_reference: { type: String, default: '' },
    paid_at: { type: Date },
    hold_expires_at: { type: Date },

    // Door code: never returned by default; see toCustomerJSON / toAdminJSON.
    access_code: { type: String, select: false },
    admin_notes: { type: String, default: '', maxlength: 2000 },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },

    series_id: { type: String, index: true, sparse: true }, // recurring bookings share one id
    terms_version: { type: String },
    terms_accepted_at: { type: Date },
  },
  { timestamps: true }
);

bookingSchema.index({ status: 1, start_at: 1 });
bookingSchema.index({ status: 1, payment_status: 1, hold_expires_at: 1 });
bookingSchema.index({ booking_date: 1, status: 1 });

bookingSchema.methods.toPublicShape = function toPublicShape({ includeAccessCode = false, admin = false } = {}) {
  const o = {
    id: this._id.toString(),
    reference_code: this.reference_code,
    full_name: this.full_name,
    business_name: this.business_name,
    abn: this.abn,
    email: this.email,
    phone: this.phone,
    booking_date: this.booking_date,
    start_time: this.start_time,
    end_date: this.end_date,
    end_time: this.end_time,
    start_at: this.start_at?.toISOString(),
    end_at: this.end_at?.toISOString(),
    duration_hours: this.duration_hours,
    package_label: this.package_label,
    hourly_rate: this.duration_hours ? toDollars(Math.round(this.base_price_cents / this.duration_hours)) : 0,
    base_price: toDollars(this.base_price_cents),
    base_cost: toDollars(this.base_price_cents),
    gst: toDollars(this.gst_cents),
    total_price: toDollars(this.total_cents),
    total_cost: toDollars(this.total_cents),
    cleaning_fee: toDollars(this.cleaning_fee_cents),
    security_deposit: toDollars(this.security_deposit_cents),
    amount_payable: toDollars(this.total_cents + this.security_deposit_cents),
    intended_use: this.intended_use,
    team_size: this.team_size,
    equipment_requirements: this.equipment_requirements,
    additional_notes: this.additional_notes,
    status: this.status,
    payment_status: this.payment_status,
    payment_method: this.payment_method,
    paid_at: this.paid_at?.toISOString(),
    hold_expires_at: this.hold_expires_at?.toISOString(),
    series_id: this.series_id,
    created_at: this.createdAt?.toISOString(),
  };
  if (admin) {
    o.admin_notes = this.admin_notes;
    o.payment_reference = this.payment_reference;
    o.user_id = this.user?.toString();
  }
  if (includeAccessCode && this.access_code) o.access_code = this.access_code;
  return o;
};

module.exports = mongoose.model('Booking', bookingSchema);
