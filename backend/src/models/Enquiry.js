const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema(
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
      default: '',
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
    },
    preferred_contact: {
      type: String,
      default: 'Email',
    },
    rental_type: {
      type: String,
      default: 'Hourly Commercial Kitchen Hire',
    },
    registered_in_victoria_park: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'quoted', 'closed'],
      default: 'new',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

enquirySchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Enquiry', enquirySchema);
