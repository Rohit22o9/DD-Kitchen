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
  hourly_rate: number;
  base_price: number;
  cleaning_fee: number;
  total_price: number;
  status: 'pending' | 'approved' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
  payment_status: 'unpaid' | 'deposit_paid' | 'paid' | 'refunded';
  admin_notes?: string;
  created_at: string;
}

export interface BookingCreateInput {
  full_name: string;
  business_name?: string;
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
}

export interface AvailabilityData {
  date: string;
  operating_hours: {
    start: string;
    end: string;
  };
  hourly_rate: number;
  min_hours: number;
  slots: SlotInterval[];
  existing_bookings_count: number;
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
  name: string;
  phone: string;
  email: string;
  business_name?: string;
  preferred_date?: string;
  estimated_hours?: string;
  business_type?: string;
  registered_in_victoria_park?: string;
  message: string;
}

export interface Enquiry {
  id: number;
  name: string;
  phone: string;
  email: string;
  business_name?: string;
  preferred_date?: string;
  estimated_hours?: string;
  business_type?: string;
  registered_in_victoria_park?: string;
  message: string;
  status: string;
  created_at: string;
}

export interface DashboardStats {
  total_bookings: number;
  pending_requests: number;
  approved_count: number;
  confirmed_count: number;
  completed_count: number;
  cancelled_count: number;
  total_confirmed_revenue: number;
  pipeline_revenue: number;
  total_hours_booked: number;
  total_enquiries: number;
  new_enquiries: number;
}
