const mongoose = require('mongoose');
const { toDollars } = require('../utils/money');
const { perthToday } = require('../utils/perthTime');

/**
 * Persisted tax invoice. Numbers come from a counter and never change.
 * Seller and buyer details are snapshotted at issue time, so later profile
 * or config edits do not rewrite an invoice that has already been issued.
 */
const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, maxlength: 300 },
    quantity: { type: Number, required: true, min: 0 },
    unit_price_cents: { type: Number, required: true }, // ex GST
    amount_ex_gst_cents: { type: Number, required: true },
    gst_cents: { type: Number, required: true },
    amount_inc_gst_cents: { type: Number, required: true },
    taxable: { type: Boolean, default: true },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    amount_cents: { type: Number, required: true },
    method: { type: String, default: 'Bank transfer / PayID' },
    reference: { type: String, default: '' },
    received_at: { type: Date, default: Date.now },
    recorded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoice_number: { type: String, required: true, unique: true },
    kind: { type: String, enum: ['kitchen_rental', 'storage_lease', 'custom'], required: true, index: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    storage_booking: { type: mongoose.Schema.Types.ObjectId, ref: 'StorageBooking' },
    booking_reference: { type: String, default: '', index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },

    seller: {
      legal_name: String,
      trading_name: String,
      abn: String,
      address: String,
      email: String,
      phone: String,
    },
    buyer: {
      name: { type: String, required: true },
      business_name: { type: String, default: '' },
      abn: { type: String, default: '' }, // only a validated buyer ABN, never the seller's
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
    },

    issue_date: { type: String, required: true }, // Perth date the invoice was issued
    due_date: { type: String, required: true },
    supply_description: { type: String, default: '' },

    line_items: { type: [lineItemSchema], required: true },
    subtotal_ex_gst_cents: { type: Number, required: true },
    gst_cents: { type: Number, required: true },
    total_inc_gst_cents: { type: Number, required: true },
    // Refundable security bond: held as security, not consideration for a supply
    // (GST Act s 99-5), so it is shown separately and excluded from GST.
    security_deposit_cents: { type: Number, default: 0 },
    amount_payable_cents: { type: Number, required: true },

    status: { type: String, enum: ['pending', 'paid', 'void'], default: 'pending', index: true },
    // Refunds of the taxable amount, each backed by an AdjustmentNote
    refunded_cents: { type: Number, default: 0 },
    refunded_gst_cents: { type: Number, default: 0 },
    // Security bond outcome after the post-use inspection
    bond: {
      status: { type: String, enum: ['held', 'refunded', 'partly_forfeited', 'forfeited'], default: 'held' },
      refunded_cents: { type: Number, default: 0 },
      forfeited_cents: { type: Number, default: 0 },
      // A forfeited bond becomes consideration: 1/11 of it is GST (GST Act s 99-10)
      forfeit_gst_cents: { type: Number, default: 0 },
      reason: { type: String, default: '' },
      reference: { type: String, default: '' },
      settled_at: { type: Date },
    },
    payments: { type: [paymentSchema], default: [] },
    paid_at: { type: Date },
    void_reason: { type: String, default: '' },
    voided_at: { type: Date },
    notes: { type: String, default: '', maxlength: 2000 },
    issued_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

invoiceSchema.methods.effectiveStatus = function effectiveStatus(today = perthToday()) {
  if (this.status === 'pending' && this.due_date < today) return 'overdue';
  return this.status;
};

invoiceSchema.methods.toPublicShape = function toPublicShape(extra = {}) {
  const lastPayment = this.payments[this.payments.length - 1];
  return {
    id: this.invoice_number,
    invoice_number: this.invoice_number,
    document_title: 'Tax Invoice',
    booking_reference: this.booking_reference,
    booking_type: this.kind,
    invoice_type: this.kind,
    seller: this.seller,
    customer_name: this.buyer.name,
    business_name: this.buyer.business_name,
    abn: this.buyer.abn,
    email: this.buyer.email,
    phone: this.buyer.phone,
    issue_date: this.issue_date,
    due_date: this.due_date,
    service_date_range: this.supply_description,
    line_items: this.line_items.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unit_price: toDollars(li.unit_price_cents),
      total: toDollars(li.amount_ex_gst_cents),
      gst: toDollars(li.gst_cents),
      total_inc_gst: toDollars(li.amount_inc_gst_cents),
      taxable: li.taxable,
    })),
    rental_amount: toDollars(this.total_inc_gst_cents),
    cleaning_fee: 0,
    subtotal: toDollars(this.subtotal_ex_gst_cents),
    gst: toDollars(this.gst_cents),
    total_amount: toDollars(this.total_inc_gst_cents),
    security_deposit: toDollars(this.security_deposit_cents),
    amount_payable: toDollars(this.amount_payable_cents),
    status: this.effectiveStatus(),
    payment_method: lastPayment?.method,
    payment_reference: lastPayment?.reference,
    paid_at: this.paid_at?.toISOString(),
    void_reason: this.void_reason || undefined,
    notes: this.notes || undefined,
    reconciled_by_ai: false,
    refunded_amount: toDollars(this.refunded_cents),
    refunded_gst: toDollars(this.refunded_gst_cents),
    bond_status: this.security_deposit_cents > 0 ? this.bond?.status || 'held' : undefined,
    bond_refunded: toDollars(this.bond?.refunded_cents),
    bond_forfeited: toDollars(this.bond?.forfeited_cents),
    bond_forfeit_gst: toDollars(this.bond?.forfeit_gst_cents),
    bond_settled_at: this.bond?.settled_at?.toISOString(),
    bond_reason: this.bond?.reason || undefined,
    created_at: this.createdAt?.toISOString(),
    ...extra,
  };
};

module.exports = mongoose.model('Invoice', invoiceSchema);
