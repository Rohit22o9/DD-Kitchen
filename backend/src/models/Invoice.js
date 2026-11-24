const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unit_price: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoice_number: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    booking_reference: {
      type: String,
      required: true,
      index: true,
    },
    booking_type: {
      type: String,
      enum: ['kitchen_rental', 'storage_lease', 'custom'],
      default: 'kitchen_rental',
      index: true,
    },
    customer_name: {
      type: String,
      required: true,
    },
    business_name: {
      type: String,
      default: '',
    },
    abn: {
      type: String,
      default: '51 824 753 556',
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: '',
    },
    issue_date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    due_date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    service_date_range: {
      type: String,
      default: '',
    },
    line_items: [lineItemSchema],
    rental_amount: {
      type: Number,
      required: true,
    },
    cleaning_fee: {
      type: Number,
      default: 0,
    },
    security_deposit: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    gst: {
      type: Number,
      required: true,
    },
    total_amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'void'],
      default: 'pending',
      index: true,
    },
    payment_method: {
      type: String,
      default: '',
    },
    paid_at: {
      type: Date,
    },
    reconciled_by_ai: {
      type: Boolean,
      default: false,
    },
    ai_risk_level: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    ai_risk_reason: {
      type: String,
      default: '',
    },
    ai_recommended_action: {
      type: String,
      default: '',
    },
    reminder_sent_count: {
      type: Number,
      default: 0,
    },
    last_reminder_at: {
      type: String,
    },
    hold_expires_at: {
      type: String,
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

invoiceSchema.virtual('id').get(function () {
  return this.invoice_number;
});

module.exports = mongoose.model('Invoice', invoiceSchema);
