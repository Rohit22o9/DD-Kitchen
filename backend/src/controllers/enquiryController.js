const Enquiry = require('../models/Enquiry');
const { postToGoogleSheet } = require('../services/googleSheetService');

/**
 * @desc    Submit a commercial kitchen contact enquiry
 * @route   POST /api/enquiries
 */
const createEnquiry = async (req, res, next) => {
  try {
    const {
      full_name,
      business_name,
      email,
      phone,
      preferred_contact,
      rental_type,
      registered_in_victoria_park,
      message,
    } = req.body;

    const refCode = `ENQ-${Math.floor(1000 + Math.random() * 9000)}`;

    const enquiry = await Enquiry.create({
      reference_code: refCode,
      full_name: full_name.trim(),
      business_name: business_name || '',
      email: String(email).trim().toLowerCase(),
      phone: phone || '',
      preferred_contact: preferred_contact || 'Email',
      rental_type: rental_type || 'Hourly Commercial Kitchen Hire',
      registered_in_victoria_park: Boolean(registered_in_victoria_park),
      message: message || 'General Kitchen Rental Enquiry',
      status: 'new',
    });

    // Sync to Google Sheets
    await postToGoogleSheet({
      action: 'submit_enquiry',
      reference_code: refCode,
      full_name: enquiry.full_name,
      business_name: enquiry.business_name,
      email: enquiry.email,
      phone: enquiry.phone,
      preferred_contact: enquiry.preferred_contact,
      rental_type: enquiry.rental_type,
      registered_in_victoria_park: enquiry.registered_in_victoria_park,
      message: enquiry.message,
    });

    return res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully. A Daily Drop manager will be in touch.',
      reference_code: refCode,
      enquiry,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createEnquiry,
};
