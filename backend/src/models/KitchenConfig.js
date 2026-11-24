const mongoose = require('mongoose');
const {
  DEFAULT_HOURLY_RATE,
  MIN_RENTAL_HOURS,
  OPERATING_START,
  OPERATING_END,
  KITCHEN_SECURITY_DEPOSIT,
} = require('../config/constants');

const kitchenConfigSchema = new mongoose.Schema(
  {
    hourly_rental_rate: {
      type: Number,
      default: DEFAULT_HOURLY_RATE,
    },
    min_rental_hours: {
      type: Number,
      default: MIN_RENTAL_HOURS,
    },
    operating_hours_start: {
      type: String,
      default: OPERATING_START,
    },
    operating_hours_end: {
      type: String,
      default: OPERATING_END,
    },
    cleaning_fee: {
      type: Number,
      default: 0.0,
    },
    security_deposit: {
      type: Number,
      default: KITCHEN_SECURITY_DEPOSIT,
    },
    facility_name: {
      type: String,
      default: 'Daily Drop Commercial Kitchens (Victoria Park)',
    },
    facility_address: {
      type: String,
      default: 'Unit 1, 1 Lichfield St, Victoria Park, Perth WA 6101',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('KitchenConfig', kitchenConfigSchema);
