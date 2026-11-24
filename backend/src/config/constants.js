/**
 * Daily Drop Commercial Kitchens - System Constants
 * Location: Victoria Park, Perth, WA 6101
 * Standards: WA Food Act 2008 & ATO Tax Compliance
 */

module.exports = {
  PERTH_TIMEZONE: process.env.PERTH_TIMEZONE || 'Australia/Perth',
  
  // Commercial Hourly Rates (AUD)
  DEFAULT_HOURLY_RATE: 38.00,
  MIN_RENTAL_HOURS: 4,
  GST_RATE: 0.10, // 10% Australian GST

  // Standard Shift Pricing
  // 4 Hours @ $38 = $152 + $15.20 GST = $167.20 Total
  STANDARD_4H_BASE: 152.00,
  STANDARD_4H_TOTAL: 167.20,

  // Refundable Escrow Security Bonds (AUD)
  KITCHEN_SECURITY_DEPOSIT: 750.00,
  STORAGE_SECURITY_DEPOSIT: 200.00,

  // Commercial Storage Bays (Max 2 in Victoria Park Hub)
  STORAGE_BAYS: [
    {
      id: 'bay-1',
      bay_number: 1,
      name: 'Dry Ambient Storage Bay A',
      type: 'dry_storage',
      monthly_rate: 150.00,
      security_deposit: 200.00,
      description: 'Dedicated commercial stainless racking, ambient dry goods, lockable unit.'
    },
    {
      id: 'bay-2',
      bay_number: 2,
      name: 'Walk-In Cold Room Storage Bay B',
      type: 'cold_storage',
      monthly_rate: 250.00,
      security_deposit: 200.00,
      description: 'Controlled +2°C to +4°C commercial refrigeration bay with temperature logging.'
    }
  ],

  // ATO Registered Entity & Banking Details
  LEGAL_ENTITY: 'Daily Drop Commercial Kitchens Pty Ltd',
  ABN: process.env.FACILITY_ABN || '51 824 753 556',
  EMAIL: process.env.FACILITY_EMAIL || 'hello@dailydrop.today',
  PAYID: process.env.FACILITY_PAYID || 'hello@dailydrop.today',
  BANK_NAME: 'National Australia Bank (NAB)',
  BSB: process.env.FACILITY_BSB || '066-000',
  ACCOUNT_NUMBER: process.env.FACILITY_ACCOUNT || '1234 5678',

  // Operating Hours (24/7 commercial access for approved caterers)
  OPERATING_START: '00:00',
  OPERATING_END: '23:59',

  // User Roles
  ROLES: {
    HIRER: 'hirer',
    STAFF_ADMIN: 'staff_admin',
    SUPER_ADMIN: 'super_admin'
  }
};
