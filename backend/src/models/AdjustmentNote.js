const mongoose = require('mongoose');
const { toDollars } = require('../utils/money');

/**
 * Adjustment note: issued when a refund reduces the GST on a tax invoice that
 * has already been issued and paid. Sequential, never renumbered.
 */
const adjustmentNoteSchema = new mongoose.Schema(
  {
    note_number: { type: String, required: true, unique: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    invoice_number: { type: String, required: true },
    booking_reference: { type: String, default: '' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    seller: { legal_name: String, trading_name: String, abn: String, address: String, email: String, phone: String },
    buyer: { name: String, business_name: String, abn: String, email: String },
    issue_date: { type: String, required: true },
    reason: { type: String, required: true, maxlength: 500 },
    amount_inc_gst_cents: { type: Number, required: true },
    gst_cents: { type: Number, required: true },
    amount_ex_gst_cents: { type: Number, required: true },
    method: { type: String, default: 'Bank transfer' },
    reference: { type: String, default: '' },
    issued_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

adjustmentNoteSchema.methods.toPublicShape = function toPublicShape() {
  return {
    document_title: 'Adjustment Note',
    note_number: this.note_number,
    invoice_number: this.invoice_number,
    booking_reference: this.booking_reference,
    seller: this.seller,
    buyer: this.buyer,
    issue_date: this.issue_date,
    reason: this.reason,
    amount: toDollars(this.amount_inc_gst_cents),
    gst: toDollars(this.gst_cents),
    amount_ex_gst: toDollars(this.amount_ex_gst_cents),
    method: this.method,
    reference: this.reference,
    created_at: this.createdAt?.toISOString(),
  };
};

module.exports = mongoose.model('AdjustmentNote', adjustmentNoteSchema);
