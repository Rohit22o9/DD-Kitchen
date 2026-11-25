const mongoose = require('mongoose');
const { DEFAULT_KITCHEN_CONFIG: D } = require('../config/constants');

const packageSchema = new mongoose.Schema(
  {
    hours: { type: Number, required: true, min: 1, max: 24 },
    price: { type: Number, required: true, min: 0 }, // AUD ex GST
    label: { type: String, default: '' },
  },
  { _id: false }
);

const kitchenConfigSchema = new mongoose.Schema(
  {
    singleton: { type: String, default: 'kitchen', unique: true },
    hourly_rental_rate: { type: Number, default: D.hourly_rental_rate, min: 0 },
    min_rental_hours: { type: Number, default: D.min_rental_hours, min: 1, max: 24 },
    packages: { type: [packageSchema], default: () => D.packages },
    operating_hours_start: { type: String, default: D.operating_hours_start },
    operating_hours_end: { type: String, default: D.operating_hours_end },
    cleaning_fee: { type: Number, default: D.cleaning_fee, min: 0 },
    security_deposit: { type: Number, default: D.security_deposit, min: 0 },
    kitchen_name: { type: String, default: D.kitchen_name },
    kitchen_address: { type: String, default: D.kitchen_address },
    kitchen_phone: { type: String, default: D.kitchen_phone },
    kitchen_email: { type: String, default: D.kitchen_email },
    kitchen_whatsapp: { type: String, default: D.kitchen_whatsapp },
    currency_symbol: { type: String, default: D.currency_symbol },
  },
  { timestamps: true }
);

kitchenConfigSchema.statics.get = async function get() {
  const existing = await this.findOne({ singleton: 'kitchen' });
  if (existing) return existing;
  try {
    return await this.create({ singleton: 'kitchen' });
  } catch (err) {
    if (err.code === 11000) return this.findOne({ singleton: 'kitchen' });
    throw err;
  }
};

module.exports = mongoose.model('KitchenConfig', kitchenConfigSchema);
