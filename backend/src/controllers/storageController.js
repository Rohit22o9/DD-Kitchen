const StorageBooking = require('../models/StorageBooking');
const { STORAGE_BAYS, STORAGE_SECURITY_DEPOSIT } = require('../config/constants');
const { normalizeDate } = require('../utils/dateUtils');

/**
 * @desc    Get all commercial storage bookings
 * @route   GET /api/storage-bookings
 */
const getStorageBookings = async (req, res, next) => {
  try {
    const list = await StorageBooking.find().sort({ start_date: -1 });
    return res.json(list);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create a commercial storage lease reservation
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

    const bayNum = Number(bay_number) === 2 ? 2 : 1;
    const bayInfo = STORAGE_BAYS.find((b) => b.bay_number === bayNum) || STORAGE_BAYS[0];
    const refCode = `DD-ST-${Math.floor(10000 + Math.random() * 90000)}`;

    const storage = await StorageBooking.create({
      reference_code: refCode,
      full_name: full_name.trim(),
      business_name: business_name || '',
      abn: abn || '',
      email: String(email).trim().toLowerCase(),
      phone: phone ? String(phone).trim() : '',
      bay_number: bayNum,
      bay_name: bayInfo.name,
      storage_type: bayInfo.type,
      start_date: normalizeDate(start_date || new Date()),
      end_date: normalizeDate(end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      monthly_rate: bayInfo.monthly_rate,
      security_deposit: STORAGE_SECURITY_DEPOSIT,
      total_price: bayInfo.monthly_rate,
      status: 'confirmed',
      payment_status: 'paid',
      notes: notes || '',
    });

    return res.status(201).json(storage);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update storage lease status
 * @route   PATCH /api/storage-bookings/:refCode/status
 */
const updateStorageStatus = async (req, res, next) => {
  try {
    const { refCode } = req.params;
    const { status } = req.body;

    const storage = await StorageBooking.findOne({ reference_code: refCode });
    if (!storage) {
      return res.status(404).json({ success: false, error: 'Storage booking not found' });
    }

    if (status) storage.status = status;
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
