export interface KitchenConfig {
  hourly_rental_rate: number;
  min_rental_hours: number;
  operating_hours_start: string;
  operating_hours_end: string;
  cleaning_fee: number;
  security_deposit: number;
  kitchen_name: string;
  kitchen_address: string;
  kitchen_phone: string;
  kitchen_email: string;
  kitchen_whatsapp: string;
  currency_symbol: string;
}

export interface Booking {
  id: number;
  reference_code: string;
  full_name: string;
  business_name?: string;
  abn?: string;
  email: string;
  phone: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  intended_use: string;
  team_size: number;
  equipment_requirements?: string;
  additional_notes?: string;
  hourly_rate?: number;
  base_price?: number;
  base_cost?: number;
  cleaning_fee?: number;
  security_deposit?: number;
  total_price: number;
  total_cost?: number;
  status: 'pending' | 'approved' | 'confirmed' | 'rejected' | 'cancelled' | 'completed' | 'pending_approval';
  payment_status: 'unpaid' | 'deposit_paid' | 'paid' | 'refunded';
  admin_notes?: string;
  created_at: string;
}

export interface BookingCreateInput {
  full_name: string;
  business_name?: string;
  abn?: string;
  email: string;
  phone: string;
  booking_date: string;
  start_time: string;
  duration_hours: number;
  intended_use: string;
  team_size: number;
  equipment_requirements?: string;
  additional_notes?: string;
}

export interface SlotInterval {
  start_time: string;
  end_time: string;
  status: 'available' | 'booked' | 'blocked';
  reference?: string;
  reason?: string;
  equipment?: string;
  full_name?: string;
}

export interface AvailabilityData {
  date: string;
  operating_hours: {
    start: string;
    end: string;
  };
  hourly_rate?: number;
  min_hours?: number;
  slots: SlotInterval[];
  existing_bookings_count?: number;
  total_booked_hours?: number;
}

export interface DayAvailabilitySummary {
  date: string;
  total_booked_hours: number;
  available_hours: number;
  bookings_count: number;
  status: 'available' | 'partially_booked' | 'fully_booked' | 'blocked';
  slots: SlotInterval[];
  equipment_in_use: string[];
}

export interface BlockedSlot {
  id: number;
  block_date: string;
  start_time: string;
  end_time: string;
  reason?: string;
  created_at: string;
}

export interface EnquiryInput {
  name?: string;
  full_name?: string;
  phone?: string;
  email: string;
  business_name?: string;
  preferred_date?: string;
  estimated_hours?: string;
  business_type?: string;
  registered_in_victoria_park?: string | boolean;
  message: string;
  preferred_contact?: string;
  rental_type?: string;
}

export interface Enquiry {
  id: number;
  reference_code?: string;
  name?: string;
  full_name?: string;
  phone?: string;
  email: string;
  business_name?: string;
  preferred_date?: string;
  estimated_hours?: string;
  business_type?: string;
  registered_in_victoria_park?: string | boolean;
  message: string;
  preferred_contact?: string;
  rental_type?: string;
  status: string;
  created_at: string;
}

export interface DashboardStats {
  total_bookings: number;
  pending_requests?: number;
  approved_count?: number;
  confirmed_count?: number;
  completed_count?: number;
  cancelled_count?: number;
  total_confirmed_revenue?: number;
  pipeline_revenue?: number;
  total_hours_booked?: number;
  total_enquiries: number;
  new_enquiries: number;
  confirmed_bookings?: number;
  pending_bookings?: number;
  total_revenue_aud?: number;
}

export interface User {
  id: number | string;
  email: string;
  full_name: string;
  business_name?: string;
  abn?: string;
  phone?: string;
  food_safety_cert_name?: string;
  food_safety_cert_data?: string;
  liability_insurance_name?: string;
  liability_insurance_data?: string;
  terms_accepted?: boolean;
  terms_accepted_at?: string;
  created_at?: string;
}

export interface UserAuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type StorageType = 'dry_storage' | 'cool_room' | 'freezer';
export type StorageDurationType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface StorageBooking {
  id: number | string;
  reference_code: string;
  user_id?: number | string;
  full_name: string;
  business_name?: string;
  email: string;
  phone: string;
  abn?: string;
  storage_type: StorageType;
  bay_number: number; // 1 or 2 (Max 2 bays capacity)
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  duration_days: number;
  duration_type: StorageDurationType;
  daily_rate: number;
  total_price: number;
  security_deposit: number;
  status: 'pending' | 'approved' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
  payment_status: 'unpaid' | 'paid';
  special_requirements?: string;
  created_at: string;
}

export interface StorageAvailability {
  available: boolean;
  occupied_bays_count: number;
  max_bays: number; // 2
  available_bays_count: number; // max_bays - occupied_bays_count
  available_bay_numbers: number[]; // e.g. [1, 2] or [2] or []
  overlapping_bookings: StorageBooking[];
}


