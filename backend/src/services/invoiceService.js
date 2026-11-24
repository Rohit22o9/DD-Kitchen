const Invoice = require('../models/Invoice');
const { normalizeDate, addDays } = require('../utils/dateUtils');

/**
 * Generate next permanent sequential ATO Tax Invoice number (e.g. INV-2026-0001)
 */
const generateNextInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const latest = await Invoice.findOne({ invoice_number: new RegExp(`^${prefix}\\d+$`) })
    .sort({ invoice_number: -1 })
    .lean();

  let nextSeq = 1;
  if (latest && latest.invoice_number) {
    const parts = latest.invoice_number.split('-');
    const num = parseInt(parts[2], 10);
    if (!isNaN(num)) nextSeq = num + 1;
  }

  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
};

/**
 * Create and persist an ATO-compliant Tax Invoice for a Kitchen Booking
 */
const createInvoiceForBooking = async (booking, pricing) => {
  const invoiceNumber = await generateNextInvoiceNumber();
  const issueDate = normalizeDate(new Date()); // Actual issue date in Perth AWST
  const dueDate = addDays(issueDate, 2); // 48-hour provisional hold window

  const lineItems = [
    {
      description: `Commercial Kitchen Shift Rental (${booking.duration_hours} hrs @ $${pricing.hourly_rate.toFixed(2)}/hr ex-GST)`,
      quantity: booking.duration_hours,
      unit_price: pricing.hourly_rate,
      total: pricing.base_price,
    },
  ];

  if (pricing.cleaning_fee > 0) {
    lineItems.push({
      description: 'End-of-Shift Commercial Sanitization Fee (ex-GST)',
      quantity: 1,
      unit_price: pricing.cleaning_fee,
      total: pricing.cleaning_fee,
    });
  }

  return Invoice.create({
    invoice_number: invoiceNumber,
    booking_reference: booking.reference_code,
    booking_type: 'kitchen_rental',
    customer_name: booking.full_name,
    business_name: booking.business_name || '',
    abn: booking.abn || '', // Never substitute Daily Drop's own ABN as customer ABN
    email: booking.email,
    phone: booking.phone || '',
    issue_date: issueDate,
    due_date: dueDate,
    service_date_range: `${booking.booking_date}, ${booking.start_time} – ${booking.end_time} (${booking.duration_hours} hrs AWST)`,
    line_items: lineItems,
    rental_amount: pricing.base_price,
    cleaning_fee: pricing.cleaning_fee,
    security_deposit: pricing.security_deposit, // Listed separately as non-taxable escrow bond
    subtotal: pricing.subtotal,
    gst: pricing.gst, // Exact 10% of taxable subtotal (1/11th of total_amount)
    total_amount: pricing.total_price,
    status: 'pending',
    ai_risk_level: 'low',
    ai_risk_reason: 'Provisional 48-hour hold awaiting PayID/bank transfer verification.',
    ai_recommended_action: 'Await bank transfer match or send PayID reminder.',
  });
};

/**
 * Create and persist an ATO-compliant Tax Invoice for a Storage Lease
 */
const createInvoiceForStorage = async (storageBooking) => {
  const invoiceNumber = await generateNextInvoiceNumber();
  const issueDate = normalizeDate(new Date());
  const dueDate = addDays(issueDate, 2);

  const totalInclusive = Number(storageBooking.total_price || 0);
  // 1/11th of GST-inclusive supply
  const gst = Number((totalInclusive / 11).toFixed(2));
  const subtotal = Number((totalInclusive - gst).toFixed(2));
  const bond = Number(storageBooking.security_deposit || 200);

  return Invoice.create({
    invoice_number: invoiceNumber,
    booking_reference: storageBooking.reference_code,
    booking_type: 'storage_lease',
    customer_name: storageBooking.full_name,
    business_name: storageBooking.business_name || '',
    abn: storageBooking.abn || '',
    email: storageBooking.email,
    phone: storageBooking.phone || '',
    issue_date: issueDate,
    due_date: dueDate,
    service_date_range: `${storageBooking.start_date} to ${storageBooking.end_date}`,
    line_items: [
      {
        description: `${storageBooking.bay_name} Commercial Storage Lease (ex-GST)`,
        quantity: 1,
        unit_price: subtotal,
        total: subtotal,
      },
    ],
    rental_amount: subtotal,
    cleaning_fee: 0,
    security_deposit: bond,
    subtotal,
    gst,
    total_amount: totalInclusive,
    status: 'pending',
    ai_risk_level: 'low',
    ai_risk_reason: 'Storage lease application awaiting initial payment.',
    ai_recommended_action: 'Send PayID details and bay induction checklist.',
  });
};

module.exports = {
  generateNextInvoiceNumber,
  createInvoiceForBooking,
  createInvoiceForStorage,
};
