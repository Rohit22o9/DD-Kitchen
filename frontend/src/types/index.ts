export interface KitchenPackage {
  hours: number;
  price: number; // AUD ex GST
  label?: string;
}

export interface PaymentDetails {
  account_name: string | null;
  bank_name: string | null;
  bsb: string | null;
  account_number: string | null;
  payid: string | null;
}

export interface KitchenConfig {
  packages?: KitchenPackage[];
  gst_rate?: number;
  booking_hold_hours?: number;
  storage_pricing?: { daily: number; weekly: number; monthly: number; long_term_daily: number; security_deposit: number };
  storage_bay_count?: number;
  terms_version?: string;
  seller?: { legal_name: string; trading_name: string; abn: string | null };
  payment_details?: PaymentDetails | null;
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
  id: number | string;
  end_date?: string;
  start_at?: string;
  end_at?: string;
  gst?: number;
  amount_payable?: number;
  package_label?: string;
  access_code?: string;
  hold_expires_at?: string;
  paid_at?: string;
  payment_method?: string;
  user_id?: string;
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
  status: 'pending' | 'approved' | 'confirmed' | 'rejected' | 'cancelled' | 'completed' | 'expired' | 'pending_approval';
  payment_status: 'unpaid' | 'deposit_paid' | 'paid' | 'refunded';
  admin_notes?: string;
  created_at: string;
}

export interface SlotCheckResult {
  available: boolean;
  reason?: string;
  end_date?: string;
  end_time?: string;
  conflicts?: { status: 'booked' | 'blocked'; start: { date: string; time: string }; end: { date: string; time: string } }[];
  quote: {
    hours: number;
    label: string;
    base_price: number;
    cleaning_fee: number;
    gst: number;
    total_price: number;
    security_deposit: number;
    amount_payable: number;
  };
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
  id: number | string;
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
  id: number | string;
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
  gst_collected?: number;
  bonds_held?: number;
  outstanding_amount?: number;
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
  email_verified?: boolean;
  two_factor_enabled?: boolean;
  role?: 'hirer' | 'staff_admin' | 'super_admin';
  terms_version?: string;
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
  two_factor_setup_required?: boolean;
}

export interface AdjustmentNote {
  document_title: string;
  note_number: string;
  invoice_number: string;
  booking_reference?: string;
  issue_date: string;
  reason: string;
  amount: number;
  gst: number;
  amount_ex_gst: number;
  method?: string;
  reference?: string;
}

export interface BankReconcileResult {
  applied: boolean;
  summary: { credits: number; matched: number; recorded: number; already_paid: number; amount_mismatch: number; unmatched: number };
  results: {
    line: number;
    date: string | null;
    amount: number;
    description: string;
    status: string;
    reference: string | null;
    invoice_number: string | null;
    expected: number | null;
  }[];
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
  gst?: number;
  amount_payable?: number;
  security_deposit: number;
  access_code?: string;
  hold_expires_at?: string;
  status: 'pending' | 'approved' | 'confirmed' | 'rejected' | 'cancelled' | 'completed' | 'expired';
  payment_status: 'unpaid' | 'paid' | 'refunded';
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
  quote?: { days: number; total_price: number; gst: number; daily_rate: number; security_deposit: number; amount_payable: number };
}

export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'disputed' | 'refunded' | 'void';
export type InvoiceType = 'kitchen_rental' | 'storage_lease' | 'equipment_hire' | 'custom';
export type AIRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface InvoiceLineItem {
  gst?: number;
  total_inc_gst?: number;
  taxable?: boolean;
  description: string;
  quantity?: number;
  hours_or_quantity?: number;
  unit_price?: number;
  unit_rate?: number;
  total: number;
}

export interface Invoice {
  refunded_amount?: number;
  refunded_gst?: number;
  adjustments?: AdjustmentNote[];
  bond_status?: 'held' | 'refunded' | 'partly_forfeited' | 'forfeited';
  bond_refunded?: number;
  bond_forfeited?: number;
  bond_forfeit_gst?: number;
  bond_settled_at?: string;
  bond_reason?: string;
  document_title?: string;
  seller?: { legal_name?: string; trading_name?: string; abn?: string; address?: string; email?: string; phone?: string };
  amount_payable?: number;
  payment_reference?: string;
  void_reason?: string;
  risk_source?: string;
  created_at?: string;
  id: string; // e.g. "INV-2026-001"
  invoice_number: string;
  booking_reference: string; // e.g. "DD-BK-77953" or "DD-ST-88102"
  booking_type?: InvoiceType;
  invoice_type?: InvoiceType;
  customer_name: string;
  business_name?: string;
  abn?: string;
  email?: string;
  phone?: string;
  customer_email?: string;
  customer_phone?: string;
  issue_date: string; // YYYY-MM-DD
  due_date: string; // YYYY-MM-DD
  service_date_range?: string; // e.g. "Tue, 20 Oct 2026, 11:38 AM - 3:38 PM"
  line_items: InvoiceLineItem[];
  rental_amount: number;
  cleaning_fee?: number;
  security_deposit: number; // $750 kitchen or $200 storage
  subtotal?: number;
  gst?: number;
  total_amount: number;
  status: InvoiceStatus;
  payment_method?: string;
  paid_at?: string;
  reconciled_by_ai: boolean;
  ai_risk_level: AIRiskLevel;
  ai_risk_reason?: string;
  ai_recommended_action?: string;
  reminder_sent_count?: number;
  last_reminder_at?: string;
  hold_expires_at?: string;
  notes?: string;
  description?: string;
}


