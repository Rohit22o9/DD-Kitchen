const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema(
  {
    reference_code: { type: String, required: true, unique: true },
    full_name: { type: String, required: true, trim: true, maxlength: 120 },
    business_name: { type: String, default: '', maxlength: 160 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, default: '', maxlength: 32 },
    preferred_contact: { type: String, default: 'Email', maxlength: 40 },
    rental_type: { type: String, default: 'Hourly Commercial Kitchen Hire', maxlength: 120 },
    preferred_date: { type: String, default: '', maxlength: 40 },
    estimated_hours: { type: String, default: '', maxlength: 40 },
    business_type: { type: String, default: '', maxlength: 120 },
    registered_in_victoria_park: { type: Boolean, default: false },
    message: { type: String, required: true, maxlength: 5000 },
    status: { type: String, enum: ['new', 'contacted', 'quoted', 'closed'], default: 'new', index: true },
  },
  { timestamps: true }
);

enquirySchema.methods.toPublicShape = function toPublicShape() {
  return {
    id: this._id.toString(),
    reference_code: this.reference_code,
    full_name: this.full_name,
    name: this.full_name,
    business_name: this.business_name,
    email: this.email,
    phone: this.phone,
    preferred_contact: this.preferred_contact,
    rental_type: this.rental_type,
    preferred_date: this.preferred_date,
    estimated_hours: this.estimated_hours,
    business_type: this.business_type,
    registered_in_victoria_park: this.registered_in_victoria_park,
    message: this.message,
    status: this.status,
    created_at: this.createdAt?.toISOString(),
  };
};

module.exports = mongoose.model('Enquiry', enquirySchema);
