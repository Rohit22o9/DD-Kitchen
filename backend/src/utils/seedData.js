const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();
const { connectDB, closeDB } = require('../config/db');
const User = require('../models/User');
const Booking = require('../models/Booking');
const StorageBooking = require('../models/StorageBooking');
const KitchenConfig = require('../models/KitchenConfig');
const BlockedSlot = require('../models/BlockedSlot');
const { STORAGE_BAYS } = require('../config/constants');

const seedDatabase = async () => {
  try {
    console.log('[Seeder] Connecting to MongoDB...');
    await connectDB();

    // 1. Seed Kitchen Config
    const configCount = await KitchenConfig.countDocuments();
    if (configCount === 0) {
      await KitchenConfig.create({
        hourly_rental_rate: 38.00,
        min_rental_hours: 4,
        operating_hours_start: '00:00',
        operating_hours_end: '23:59',
        cleaning_fee: 0.0,
        security_deposit: 750.00,
        facility_name: 'Daily Drop Commercial Kitchens (Victoria Park)',
        facility_address: 'Unit 1, 1 Lichfield St, Victoria Park, Perth WA 6101',
      });
      console.log('✓ Seeded Kitchen Config ($38.00/hr + GST)');
    }

    // 2. Seed Users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.create([
        {
          full_name: 'Michael Davies',
          email: 'demo@dailydrop.today',
          password: 'kitchen123',
          business_name: 'Perth Catering Co.',
          abn: '54 123 456 789',
          phone: '+61 412 345 678',
          role: 'hirer',
          food_safety_cert_name: 'FSS_Michael_Davies_WA.pdf',
          liability_insurance_name: 'QBE_Public_Liability_20M.pdf',
          terms_accepted: true,
        },
        {
          full_name: 'Rohit',
          email: 'rratnaparkhi3@gmail.com',
          password: 'kitchen123',
          business_name: 'ABC Kitchen',
          abn: '12 312 312 312',
          phone: '+61 0412345862',
          role: 'hirer',
          food_safety_cert_name: 'FSS_Rohit_WA.pdf',
          liability_insurance_name: 'CGU_Liability_10M.pdf',
          terms_accepted: true,
        },
        {
          full_name: 'Operations Manager',
          email: 'admin@dailydrop.today',
          password: 'kitchen2026',
          role: 'staff_admin',
          business_name: 'Daily Drop Operations',
        },
        {
          full_name: 'Executive Director',
          email: 'director@dailydrop.today',
          password: 'director2026',
          role: 'super_admin',
          business_name: 'Daily Drop Ventures Pty Ltd',
        },
      ]);
      console.log('✓ Seeded Initial Users (Hirers & Admins)');
    }

    // 3. Seed Commercial Storage Leases
    const storageCount = await StorageBooking.countDocuments();
    if (storageCount === 0) {
      await StorageBooking.create([
        {
          reference_code: 'DD-ST-201',
          full_name: 'Chef Michael Davies',
          business_name: 'Perth Catering Co.',
          abn: '54 123 456 789',
          email: 'michael@perthcatering.com.au',
          phone: '0412 345 678',
          bay_number: 1,
          bay_name: STORAGE_BAYS[0].name,
          storage_type: 'dry_storage',
          start_date: '2026-10-01',
          end_date: '2026-11-01',
          monthly_rate: 150.00,
          security_deposit: 200.00,
          total_price: 150.00,
          status: 'confirmed',
          payment_status: 'paid',
        },
        {
          reference_code: 'DD-ST-202',
          full_name: 'ABC Catering Co.',
          business_name: 'ABC Catering WA',
          abn: '12 312 312 312',
          email: 'contact@abccatering.com.au',
          phone: '+61 412 345 678',
          bay_number: 2,
          bay_name: STORAGE_BAYS[1].name,
          storage_type: 'cold_storage',
          start_date: '2026-10-15',
          end_date: '2026-11-15',
          monthly_rate: 250.00,
          security_deposit: 200.00,
          total_price: 250.00,
          status: 'confirmed',
          payment_status: 'paid',
        },
      ]);
      console.log('✓ Seeded Commercial Storage Leases (Bay 1 & Bay 2)');
    }

    // 4. Seed Initial Kitchen Bookings
    const bookingCount = await Booking.countDocuments();
    if (bookingCount === 0) {
      await Booking.create([
        {
          reference_code: 'DD-BK-001',
          full_name: 'Chef Michael Davies',
          business_name: 'Perth Catering Co.',
          abn: '54 123 456 789',
          email: 'demo@dailydrop.today',
          phone: '+61 412 345 678',
          booking_date: '2026-10-22',
          start_time: '08:00',
          end_time: '12:00',
          duration_hours: 4,
          hourly_rate: 38,
          base_price: 152.00,
          total_price: 167.20,
          security_deposit: 750.00,
          status: 'approved',
          payment_status: 'paid',
          paid_at: new Date('2026-10-18T14:22:00Z'),
          door_pin_code: '4892#',
        },
        {
          reference_code: 'DD-BK-77953',
          full_name: 'Rohit',
          business_name: 'ABC Kitchen',
          abn: '12 312 312 312',
          email: 'rratnaparkhi3@gmail.com',
          phone: '+61 0412345862',
          booking_date: '2026-10-20',
          start_time: '09:00',
          end_time: '13:00',
          duration_hours: 4,
          hourly_rate: 38,
          base_price: 152.00,
          total_price: 167.20,
          security_deposit: 750.00,
          status: 'approved',
          payment_status: 'unpaid',
          door_pin_code: '4892#',
        },
        {
          reference_code: 'DD-BK-83068',
          full_name: 'Rohit',
          business_name: 'ABC Kitchen',
          abn: '12 312 312 312',
          email: 'rratnaparkhi3@gmail.com',
          phone: '+61 0412345862',
          booking_date: '2026-11-24',
          start_time: '09:00',
          end_time: '13:00',
          duration_hours: 4,
          hourly_rate: 38,
          base_price: 152.00,
          total_price: 167.20,
          security_deposit: 750.00,
          status: 'pending',
          payment_status: 'unpaid',
          door_pin_code: '4892#',
        },
        {
          reference_code: 'DD-BK-49503',
          full_name: 'Rohit',
          business_name: 'ABC Kitchen',
          abn: '12 312 312 312',
          email: 'rratnaparkhi3@gmail.com',
          phone: '+61 0412345862',
          booking_date: '2026-11-26',
          start_time: '09:00',
          end_time: '13:00',
          duration_hours: 4,
          hourly_rate: 38,
          base_price: 152.00,
          total_price: 167.20,
          security_deposit: 750.00,
          status: 'pending',
          payment_status: 'unpaid',
          door_pin_code: '4892#',
        },
      ]);
      console.log('✓ Seeded Kitchen Bookings (including Rohit & Michael Davies)');
    }

    // 5. Seed Maintenance Blocked Slot
    const blockCount = await BlockedSlot.countDocuments();
    if (blockCount === 0) {
      await BlockedSlot.create({
        block_date: '2026-11-28',
        start_time: '06:00',
        end_time: '10:00',
        reason: 'Monthly Commercial Deep Clean & Exhaust Hood Grease Extraction',
      });
      console.log('✓ Seeded Maintenance Blocked Slot');
    }

    console.log('[Seeder] Database seeding completed successfully.');
  } catch (err) {
    console.error('[Seeder] Seeding error:', err);
  }
};

if (require.main === module) {
  seedDatabase().then(() => {
    closeDB().then(() => process.exit(0));
  });
}

module.exports = seedDatabase;
