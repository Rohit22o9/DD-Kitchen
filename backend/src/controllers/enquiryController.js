const Enquiry = require('../models/Enquiry');
const outbox = require('../services/outboxService');
const { enquiryRow } = require('../services/syncPayloads');
const { enquiryRef } = require('../utils/refCode');
const { asyncHandler } = require('../utils/httpError');

const createEnquiry = asyncHandler(async (req, res) => {
  const b = req.body;
  const enquiry = await Enquiry.create({
    reference_code: enquiryRef(),
    full_name: b.full_name || b.name,
    business_name: b.business_name || '',
    email: b.email,
    phone: b.phone || '',
    preferred_contact: b.preferred_contact || 'Email',
    rental_type: b.rental_type || 'Hourly Commercial Kitchen Hire',
    preferred_date: b.preferred_date || '',
    estimated_hours: b.estimated_hours || '',
    business_type: b.business_type || '',
    registered_in_victoria_park: b.registered_in_victoria_park === true || b.registered_in_victoria_park === 'true' || b.registered_in_victoria_park === 'yes',
    message: b.message,
  });
  await outbox.enqueue('upsert_enquiry', { row: enquiryRow(enquiry) });
  // Only echo back what the visitor submitted, plus the reference.
  res.status(201).json({
    success: true,
    message: 'Enquiry received. A Daily Drop manager will be in touch.',
    reference_code: enquiry.reference_code,
    enquiry: enquiry.toPublicShape(),
  });
});

module.exports = { createEnquiry };
