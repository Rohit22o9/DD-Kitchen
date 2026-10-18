import {
  KitchenConfig,
  Booking,
  BookingCreateInput,
  AvailabilityData,
  BlockedSlot,
  EnquiryInput,
  Enquiry,
  DashboardStats
} from '../types';

const API_BASE = '/api';

// Get configured Google Sheet Webhook URL (from .env or saved in Admin Settings)
export const getGoogleSheetUrl = (): string => {
  return (
    import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL ||
    localStorage.getItem('dd_sheet_webhook_url') ||
    ''
  );
};

export const setGoogleSheetUrl = (url: string) => {
  localStorage.setItem('dd_sheet_webhook_url', url.trim());
};

// Local storage keys for instant fallback
const LS_BOOKINGS = 'dd_local_bookings';
const LS_ENQUIRIES = 'dd_local_enquiries';
const LS_BLOCKED = 'dd_local_blocked_slots';
const LS_CONFIG = 'dd_local_config';

const getStoredBookings = (): Booking[] => {
  try {
    return JSON.parse(localStorage.getItem(LS_BOOKINGS) || '[]');
  } catch {
    return [];
  }
};

const saveStoredBookings = (list: Booking[]) => {
  localStorage.setItem(LS_BOOKINGS, JSON.stringify(list));
};

const getStoredEnquiries = (): Enquiry[] => {
  try {
    return JSON.parse(localStorage.getItem(LS_ENQUIRIES) || '[]');
  } catch {
    return [];
  }
};

const saveStoredEnquiries = (list: Enquiry[]) => {
  localStorage.setItem(LS_ENQUIRIES, JSON.stringify(list));
};

const DEFAULT_FALLBACK_CONFIG: KitchenConfig = {
  hourly_rental_rate: 38.0,
  min_rental_hours: 4,
  operating_hours_start: '00:00',
  operating_hours_end: '24:00',
  cleaning_fee: 0.0,
  security_deposit: 750.0,
  kitchen_name: 'Daily Drop Commercial Kitchen Hub 1',
  kitchen_address: 'Unit 1, 1 Lichfield Street, Victoria Park, Perth, WA, 6101',
  kitchen_phone: '0479 175 705',
  kitchen_email: 'hello@dailydrop.today',
  kitchen_whatsapp: '+61479175705',
  currency_symbol: '$',
};

// Tiered price calculator helper
const calculateTierCost = (duration: number): { subtotal: number; gst: number; total: number } => {
  let subtotal = 0;
  if (duration === 2) subtotal = 100.0;
  else if (duration === 4) subtotal = 152.0;
  else if (duration === 6) subtotal = 204.0;
  else if (duration === 8) subtotal = 256.0;
  else if (duration === 10) subtotal = 310.0;
  else if (duration === 12) subtotal = 360.0;
  else if (duration === 24) subtotal = 696.0;
  else subtotal = duration * 38.0;

  const gst = subtotal * 0.10;
  const total = subtotal + gst;
  return { subtotal, gst, total };
};

// Send data to Google Sheets Webhook via no-cors POST
const postToGoogleSheet = async (payload: any): Promise<void> => {
  const sheetUrl = getGoogleSheetUrl();
  if (!sheetUrl) return;

  try {
    // Mode no-cors avoids browser CORS preflight restrictions on Google Apps Script
    await fetch(sheetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Google Sheets sync warning:', err);
  }
};

export const api = {
  // Public endpoints
  async getConfig(): Promise<KitchenConfig> {
    try {
      const res = await fetch(`${API_BASE}/config`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const saved = localStorage.getItem(LS_CONFIG);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_FALLBACK_CONFIG;
  },

  async getAvailability(date: string): Promise<AvailabilityData> {
    try {
      const res = await fetch(`${API_BASE}/availability?date=${date}`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    // Local check against stored bookings on that date
    const bookings = getStoredBookings().filter(
      (b) => b.booking_date === date && b.status !== 'cancelled' && b.status !== 'rejected'
    );
    const slots = bookings.map((b) => {
      const [sh, sm] = b.start_time.split(':').map(Number);
      const endTotal = sh * 60 + sm + Math.round(b.duration_hours * 60);
      const eh = Math.floor(endTotal / 60) % 24;
      const em = endTotal % 60;
      return {
        start_time: b.start_time,
        end_time: `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`,
        status: 'booked' as const,
        reason: 'Reserved Shift',
      };
    });

    return {
      date,
      slots,
      operating_hours: { start: '00:00', end: '24:00' },
      hourly_rate: 45,
      min_hours: 2,
      existing_bookings_count: bookings.length,
      total_booked_hours: bookings.reduce((sum, b) => sum + b.duration_hours, 0),
    };
  },

  async createBooking(data: BookingCreateInput): Promise<Booking> {
    const { subtotal, gst, total } = calculateTierCost(data.duration_hours);
    const refCode = `DD-BK-${Math.floor(10000 + Math.random() * 90000)}`;

    const [startHour, startMin] = (data.start_time || '08:00').split(':').map(Number);
    const endHourNum = (startHour + data.duration_hours) % 24;
    const computedEndTime = `${String(endHourNum).padStart(2, '0')}:${String(startMin || 0).padStart(2, '0')}`;

    const newBooking: Booking = {
      id: Date.now(),
      created_at: new Date().toISOString(),
      reference_code: refCode,
      full_name: data.full_name,
      business_name: data.business_name,
      email: data.email,
      phone: data.phone,
      booking_date: data.booking_date,
      start_time: data.start_time,
      end_time: computedEndTime,
      duration_hours: data.duration_hours,
      hourly_rate: 45,
      base_price: subtotal,
      base_cost: subtotal,
      cleaning_fee: 0.0,
      security_deposit: 750.0,
      total_price: total,
      total_cost: total,
      intended_use: data.intended_use,
      team_size: data.team_size,
      equipment_requirements: data.equipment_requirements,
      additional_notes: data.additional_notes,
      status: 'pending',
      payment_status: 'unpaid',
    };

    // 1. Send live row directly to Google Sheets Webhook!
    await postToGoogleSheet({
      action: 'create_booking',
      reference_code: refCode,
      full_name: data.full_name,
      business_name: data.business_name || '',
      email: data.email,
      phone: data.phone,
      booking_date: data.booking_date,
      start_time: data.start_time,
      duration_hours: data.duration_hours,
      base_cost: subtotal,
      gst_amount: gst,
      total_cost: total,
      security_deposit: 750.0,
      intended_use: data.intended_use,
      team_size: data.team_size,
      equipment_requirements: data.equipment_requirements,
      additional_notes: data.additional_notes || '',
      status: 'pending_approval',
    });

    // 2. Also try API if running
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const apiBooking = await res.json();
        const stored = getStoredBookings();
        saveStoredBookings([apiBooking, ...stored]);
        return apiBooking;
      }
    } catch {}

    // 3. Save locally
    const stored = getStoredBookings();
    saveStoredBookings([newBooking, ...stored]);
    return newBooking;
  },

  async getBookingByRef(referenceCode: string): Promise<Booking> {
    try {
      const res = await fetch(`${API_BASE}/bookings/${referenceCode}`);
      if (res.ok) return await res.json();
    } catch {}

    const found = getStoredBookings().find((b) => b.reference_code === referenceCode);
    if (found) return found;
    throw new Error('Booking not found');
  },

  async submitEnquiry(data: EnquiryInput): Promise<Enquiry> {
    const enqRef = `DD-ENQ-${Math.floor(10000 + Math.random() * 90000)}`;
    const personName = data.full_name || data.name || 'Website Visitor';
    const newEnquiry: Enquiry = {
      id: Date.now(),
      created_at: new Date().toISOString(),
      reference_code: enqRef,
      name: personName,
      full_name: personName,
      business_name: data.business_name,
      email: data.email,
      phone: data.phone,
      preferred_contact: data.preferred_contact || 'Email',
      rental_type: data.rental_type || 'General Enquiry',
      registered_in_victoria_park: String(data.registered_in_victoria_park ?? ''),
      message: data.message,
      status: 'new',
    };

    // 1. Send live row directly to Google Sheets Webhook!
    await postToGoogleSheet({
      action: 'submit_enquiry',
      reference_code: enqRef,
      full_name: personName,
      business_name: data.business_name || '',
      email: data.email,
      phone: data.phone,
      preferred_contact: data.preferred_contact || 'Email',
      rental_type: data.rental_type || 'General Enquiry',
      registered_in_victoria_park: Boolean(data.registered_in_victoria_park),
      message: data.message,
    });

    // 2. Also try API if running
    try {
      const res = await fetch(`${API_BASE}/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const apiEnq = await res.json();
        const stored = getStoredEnquiries();
        saveStoredEnquiries([apiEnq, ...stored]);
        return apiEnq;
      }
    } catch {}

    // 3. Save locally
    const stored = getStoredEnquiries();
    saveStoredEnquiries([newEnquiry, ...stored]);
    return newEnquiry;
  },

  // Admin endpoints
  async adminLogin(username: string, password: string): Promise<{ access_token: string; username: string }> {
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) return await res.json();
    } catch {}

    // Standalone fallback: Accepts admin / DailyDropAdmin2026! or admin / admin
    if (username.trim() === 'admin' && (password === 'DailyDropAdmin2026!' || password === 'admin' || password === 'DailyDrop2026')) {
      const token = `dd_jwt_${Date.now()}`;
      return { access_token: token, username: 'admin' };
    }

    throw new Error('Invalid admin credentials. (Default: username "admin", password "DailyDropAdmin2026!")');
  },

  async getDashboardStats(token: string): Promise<DashboardStats> {
    try {
      const res = await fetch(`${API_BASE}/admin/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) return await res.json();
    } catch {}

    const bookings = getStoredBookings();
    const enquiries = getStoredEnquiries();
    const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
    const pending = bookings.filter((b) => b.status === 'pending' || b.status === 'pending_approval').length;
    const approved = bookings.filter((b) => b.status === 'approved').length;
    const completed = bookings.filter((b) => b.status === 'completed').length;
    const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
    const totalRev = bookings.reduce((sum, b) => (b.status === 'confirmed' ? sum + (b.total_cost ?? b.total_price ?? 0) : sum), 0);
    const pipelineRev = bookings.reduce((sum, b) => sum + (b.total_cost ?? b.total_price ?? 0), 0);
    const totalHours = bookings.reduce((sum, b) => sum + b.duration_hours, 0);

    return {
      total_bookings: bookings.length,
      pending_requests: pending,
      approved_count: approved,
      confirmed_count: confirmed,
      completed_count: completed,
      cancelled_count: cancelled,
      total_confirmed_revenue: totalRev,
      pipeline_revenue: pipelineRev,
      total_hours_booked: totalHours,
      total_enquiries: enquiries.length,
      new_enquiries: enquiries.filter((e) => e.status === 'new').length,
      confirmed_bookings: confirmed,
      pending_bookings: pending,
      total_revenue_aud: totalRev,
    };
  },

  async getAdminBookings(token: string, status?: string, search?: string): Promise<Booking[]> {
    // 1. Check if Google Sheet Webhook has live data via GET
    const sheetUrl = getGoogleSheetUrl();
    if (sheetUrl) {
      try {
        const res = await fetch(`${sheetUrl}?action=get_bookings`);
        if (res.ok) {
          const json = await res.json();
          if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
            let result: Booking[] = json.data.map((item: any, idx: number) => ({
              id: item.id || (Date.now() + idx),
              reference_code: item.reference_code || `DD-BK-${idx}`,
              full_name: item.full_name || item.name || '',
              business_name: item.business_name || '',
              email: item.email || '',
              phone: item.phone || '',
              booking_date: item.booking_date || item.date || '',
              start_time: item.start_time || item.time || '',
              end_time: item.end_time || '',
              duration_hours: Number(item.duration_hours || 2),
              hourly_rate: Number(item.hourly_rate || 45),
              base_price: Number(item.base_price || item.base_cost || 0),
              cleaning_fee: Number(item.cleaning_fee || 0),
              total_price: Number(item.total_price || item.total_cost || 0),
              intended_use: item.intended_use || '',
              team_size: Number(item.team_size || 1),
              equipment_requirements: item.equipment_requirements || '',
              additional_notes: item.additional_notes || item.notes || '',
              status: item.status || 'pending',
              payment_status: item.payment_status || 'unpaid',
              created_at: item.created_at || new Date().toISOString()
            }));
            if (status && status !== 'all') result = result.filter((b) => b.status === status);
            if (search) {
              const q = search.toLowerCase();
              result = result.filter(
                (b) =>
                  b.full_name.toLowerCase().includes(q) ||
                  b.email.toLowerCase().includes(q) ||
                  b.reference_code.toLowerCase().includes(q)
              );
            }
            return result;
          }
        }
      } catch (err) {
        console.warn('Google Sheet GET bookings:', err);
      }
    }

    // 2. Try API
    try {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.append('status', status);
      if (search) params.append('search', search);
      const res = await fetch(`${API_BASE}/admin/bookings?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) return await res.json();
    } catch {}

    // 3. Fallback to local storage
    let local = getStoredBookings();
    if (status && status !== 'all') local = local.filter((b) => b.status === status);
    if (search) {
      const q = search.toLowerCase();
      local = local.filter(
        (b) =>
          b.full_name.toLowerCase().includes(q) ||
          b.email.toLowerCase().includes(q) ||
          b.reference_code.toLowerCase().includes(q)
      );
    }
    return local;
  },

  async updateBookingStatus(
    token: string,
    id: number,
    data: { status?: string; payment_status?: string; admin_notes?: string }
  ): Promise<Booking> {
    try {
      const res = await fetch(`${API_BASE}/admin/bookings/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch {}

    const bookings = getStoredBookings();
    const idx = bookings.findIndex((b) => b.id === id);
    if (idx !== -1) {
      bookings[idx] = { ...bookings[idx], ...data } as Booking;
      saveStoredBookings(bookings);
      return bookings[idx];
    }
    throw new Error('Booking not found');
  },

  async deleteBooking(token: string, id: number): Promise<void> {
    try {
      await fetch(`${API_BASE}/admin/bookings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    const bookings = getStoredBookings().filter((b) => b.id !== id);
    saveStoredBookings(bookings);
  },

  async getBlockedSlots(token: string): Promise<BlockedSlot[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/blocked-slots`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) return await res.json();
    } catch {}
    try {
      return JSON.parse(localStorage.getItem(LS_BLOCKED) || '[]');
    } catch {
      return [];
    }
  },

  async createBlockedSlot(
    token: string,
    data: { block_date: string; start_time: string; end_time: string; reason?: string }
  ): Promise<BlockedSlot> {
    try {
      const res = await fetch(`${API_BASE}/admin/blocked-slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch {}

    const newSlot: BlockedSlot = {
      id: Date.now(),
      block_date: data.block_date,
      start_time: data.start_time,
      end_time: data.end_time,
      reason: data.reason,
      created_at: new Date().toISOString(),
    };
    const slots = await this.getBlockedSlots(token);
    localStorage.setItem(LS_BLOCKED, JSON.stringify([newSlot, ...slots]));
    return newSlot;
  },

  async deleteBlockedSlot(token: string, id: number): Promise<void> {
    try {
      await fetch(`${API_BASE}/admin/blocked-slots/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    const slots = (await this.getBlockedSlots(token)).filter((s) => s.id !== id);
    localStorage.setItem(LS_BLOCKED, JSON.stringify(slots));
  },

  async updateAdminConfig(token: string, data: Partial<KitchenConfig>): Promise<KitchenConfig> {
    try {
      const res = await fetch(`${API_BASE}/admin/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch {}

    const current = await this.getConfig();
    const updated = { ...current, ...data };
    localStorage.setItem(LS_CONFIG, JSON.stringify(updated));
    return updated;
  },

  async getAdminEnquiries(token: string): Promise<Enquiry[]> {
    const sheetUrl = getGoogleSheetUrl();
    if (sheetUrl) {
      try {
        const res = await fetch(`${sheetUrl}?action=get_enquiries`);
        if (res.ok) {
          const json = await res.json();
          if (json.status === 'success' && Array.isArray(json.data)) {
            return json.data;
          }
        }
      } catch {}
    }

    try {
      const res = await fetch(`${API_BASE}/admin/enquiries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) return await res.json();
    } catch {}

    return getStoredEnquiries();
  },

  async updateEnquiryStatus(token: string, id: number, status: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/admin/enquiries/${id}/status?status_val=${status}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}

    const enqs = getStoredEnquiries();
    const idx = enqs.findIndex((e) => e.id === id);
    if (idx !== -1) {
      enqs[idx].status = status;
      saveStoredEnquiries(enqs);
    }
  },
};
