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

export const api = {
  // Public endpoints
  async getConfig(): Promise<KitchenConfig> {
    const res = await fetch(`${API_BASE}/config`);
    if (!res.ok) throw new Error('Failed to fetch kitchen configuration');
    return res.json();
  },

  async getAvailability(date: string): Promise<AvailabilityData> {
    const res = await fetch(`${API_BASE}/availability?date=${date}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch slot availability');
    }
    return res.json();
  },

  async createBooking(data: BookingCreateInput): Promise<Booking> {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit booking request');
    }
    return res.json();
  },

  async getBookingByRef(referenceCode: string): Promise<Booking> {
    const res = await fetch(`${API_BASE}/bookings/${referenceCode}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Booking not found');
    }
    return res.json();
  },

  async submitEnquiry(data: EnquiryInput): Promise<Enquiry> {
    const res = await fetch(`${API_BASE}/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit enquiry');
    }
    return res.json();
  },

  // Admin endpoints
  async adminLogin(username: string, password: string): Promise<{ access_token: string; username: string }> {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Invalid admin credentials');
    }
    return res.json();
  },

  async getDashboardStats(token: string): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/admin/dashboard-stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load dashboard metrics');
    return res.json();
  },

  async getAdminBookings(token: string, status?: string, search?: string): Promise<Booking[]> {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE}/admin/bookings?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch bookings list');
    return res.json();
  },

  async updateBookingStatus(
    token: string,
    id: number,
    data: { status?: string; payment_status?: string; admin_notes?: string }
  ): Promise<Booking> {
    const res = await fetch(`${API_BASE}/admin/bookings/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update booking status');
    }
    return res.json();
  },

  async deleteBooking(token: string, id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/bookings/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to delete booking');
  },

  async getBlockedSlots(token: string): Promise<BlockedSlot[]> {
    const res = await fetch(`${API_BASE}/admin/blocked-slots`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch blocked slots');
    return res.json();
  },

  async createBlockedSlot(
    token: string,
    data: { block_date: string; start_time: string; end_time: string; reason?: string }
  ): Promise<BlockedSlot> {
    const res = await fetch(`${API_BASE}/admin/blocked-slots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create blocked slot');
    }
    return res.json();
  },

  async deleteBlockedSlot(token: string, id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/blocked-slots/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to delete blocked slot');
  },

  async updateAdminConfig(token: string, data: Partial<KitchenConfig>): Promise<KitchenConfig> {
    const res = await fetch(`${API_BASE}/admin/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update kitchen settings');
    return res.json();
  },

  async getAdminEnquiries(token: string): Promise<Enquiry[]> {
    const res = await fetch(`${API_BASE}/admin/enquiries`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch customer enquiries');
    return res.json();
  },

  async updateEnquiryStatus(token: string, id: number, status: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/enquiries/${id}/status?status_val=${status}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to update enquiry status');
  },
};
