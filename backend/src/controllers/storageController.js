const StorageBooking = require('../models/StorageBooking');
const { STORAGE_BAYS, STORAGE_SECURITY_DEPOSIT } = require('../config/constants');
const { createInvoiceForStorage } = require('../services/invoiceService');
const { normalizeDate } = require('../utils/dateUtils');

/**
 * @desc    Get commercial storage bookings (Admins see all; Hirers see strictly their own)
 * @route   GET /api/storage-bookings
 */
const getStorageBookings = async (req, res, next) => {
  try {
    const isAdmin = req.user && (req.user.role === 'staff_admin' || req.user.role === 'super_admin');
    const filter = isAdmin ? {} : { email: String(req.user?.email || '').toLowerCase() };
    const list = await StorageBooking.find(filter).sort({ start_date: -1 });
    return res.json(list);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create a commercial storage lease reservation (Authenticated, Pending Payment)
 * @route   POST /api/storage-bookings
 */
const createStorageBooking = async (req, res, next) => {
  try {
    const {
      full_name,
      business_name,
      abn,
      email,
      phone,
      bay_number,
      start_date,
      end_date,
      notes,
    } = req.body;

    const cleanName = String(full_name || req.user?.full_name || '').trim();
    const cleanEmail = String(req.user?.email || email || '').trim().toLowerCase();
    const cleanPhone = String(phone || req.user?.phone || '').trim();

    if (!cleanName || !cleanEmail || !cleanPhone) {
      return res.status(400).json({ success: false, error: 'Name, email, and phone are required.' });
    }

    const bayNum = Number(bay_number) === 2 ? 2 : 1;
    const bayInfo = STORAGE_BAYS.find((b) => b.bay_number === bayNum) || STORAGE_BAYS[0];
    const refCode = `DD-ST-${Math.floor(10000 + Math.random() * 90000)}`;

    const startDate = normalizeDate(start_date || new Date());
    const endDate = normalizeDate(end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'Valid start_date and end_date are required.' });
    }

    const storage = await StorageBooking.create({
      reference_code: refCode,
      full_name: cleanName,
      business_name: business_name || req.user?.business_name || '',
      abn: abn || req.user?.abn || '',
      email: cleanEmail,
      phone: cleanPhone,
      bay_number: bayNum,
      bay_name: bayInfo.name,
      storage_type: bayInfo.type,
      start_date: startDate,
      end_date: endDate,
      monthly_rate: bayInfo.monthly_rate,
      security_deposit: STORAGE_SECURITY_DEPOSIT,
      total_price: bayInfo.monthly_rate,
      status: 'pending',
      payment_status: 'unpaid',
      notes: notes || '',
    });

    await createInvoiceForStorage(storage);

    return res.status(201).json(storage);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update storage lease status (Admin Only)
 * @route   PATCH /api/storage-bookings/:refCode/status
 */
const updateStorageStatus = async (req, res, next) => {
  try {
    const { refCode } = req.params;
    const { status, payment_status } = req.body;

    const storage = await StorageBooking.findOne({ reference_code: refCode });
    if (!storage) {
      return res.status(404).json({ success: false, error: 'Storage booking not found' });
    }

    if (status) storage.status = status;
    if (payment_status) storage.payment_status = payment_status;
    await storage.save();

    return res.json({ success: true, storage });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStorageBookings,
  createStorageBooking,
  updateStorageStatus,
};
