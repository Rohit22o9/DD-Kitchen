/**
 * Daily Drop API client.
 *
 * The backend is the single source of truth. There are no localStorage
 * databases, no client-side passwords, no direct Google Sheets calls and no
 * "silent success" fallbacks: if the server says no, the user sees why.
 */
import type {
  KitchenConfig,
  Booking,
  BookingCreateInput,
  AvailabilityData,
  DayAvailabilitySummary,
  BlockedSlot,
  Enquiry,
  EnquiryInput,
  DashboardStats,
  User,
  UserAuthResponse,
  StorageBooking,
  StorageType,
  StorageDurationType,
  StorageAvailability,
  Invoice,
  InvoiceStatus,
  SlotCheckResult,
  AdjustmentNote,
  BankReconcileResult,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

export const PERTH_TIMEZONE = 'Australia/Perth';
const PERTH_OFFSET_MS = 8 * 60 * 60 * 1000; // WA has no daylight saving

// ---------------------------------------------------------------------------
// Session storage (tokens only — never passwords or business data)
// ---------------------------------------------------------------------------
const KEYS = {
  user: 'dd_user_token',
  currentUser: 'dd_current_user',
  admin: 'dd_admin_token',
  superadmin: 'dd_superadmin_token',
  superadminUser: 'dd_superadmin_user',
} as const;

type Scope = 'user' | 'admin' | 'superadmin';

const store = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* private mode / quota: session simply won't persist */
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

// One-time cleanup of data the old client kept in the browser (plain-text passwords, cached bookings).
(() => {
  for (const k of [
    'dd_local_users',
    'dd_local_bookings',
    'dd_local_storage_bookings',
    'dd_local_enquiries',
    'dd_local_blocked_slots',
    'dd_local_config',
    'dd_local_invoices',
    'dd_sheet_webhook_url',
    'dd_gemini_api_key',
  ]) {
    store.remove(k);
  }
  const t = store.get(KEYS.admin);
  if (t === 'demo_admin_token' || t?.startsWith('dd_')) store.remove(KEYS.admin);
  const s = store.get(KEYS.superadmin);
  if (s?.startsWith('dd_')) store.remove(KEYS.superadmin);
  const u = store.get(KEYS.user);
  if (u?.startsWith('dd_')) {
    store.remove(KEYS.user);
    store.remove(KEYS.currentUser);
  }
})();

const tokenFor = (scope: Scope): string | null =>
  scope === 'user' ? store.get(KEYS.user) : scope === 'admin' ? store.get(KEYS.admin) || store.get(KEYS.superadmin) : store.get(KEYS.superadmin);

const clearScope = (scope: Scope) => {
  if (scope === 'user') {
    store.remove(KEYS.user);
    store.remove(KEYS.currentUser);
  } else if (scope === 'admin') {
    store.remove(KEYS.admin);
  } else {
    store.remove(KEYS.superadmin);
    store.remove(KEYS.superadminUser);
  }
  window.dispatchEvent(new CustomEvent('dd:auth-expired', { detail: { scope } }));
};

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------
export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  scope?: Scope;
  token?: string | null;
  form?: FormData;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = opts.token ?? (opts.scope ? tokenFor(opts.scope) : null);
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (opts.form) {
    body = opts.form;
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { method: opts.method || 'GET', headers, body });
  } catch {
    throw new ApiError(0, 'Cannot reach the Daily Drop server. Check your connection and try again.');
  }

  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && opts.scope) clearScope(opts.scope);
    const message =
      (data && (data.error || data.message)) ||
      (res.status >= 500 ? 'The server had a problem. Please try again shortly.' : `Request failed (${res.status}).`);
    throw new ApiError(res.status, message, data?.details);
  }
  return data as T;
}

// ---------------------------------------------------------------------------
// Perth date/time helpers
// ---------------------------------------------------------------------------
/** Today's date in Perth (not the browser's or UTC's). */
export const perthToday = (): string => new Date(Date.now() + PERTH_OFFSET_MS).toISOString().slice(0, 10);

/** Add days to a YYYY-MM-DD string without any timezone conversion. */
export const addDaysToDate = (date: string, days: number): string => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const normalizeDate = (val?: string | Date): string => {
  if (!val) return '';
  if (val instanceof Date) return new Date(val.getTime() + PERTH_OFFSET_MS).toISOString().slice(0, 10);
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime()) && /T|Z|[+-]\d{2}:?\d{2}$/.test(s)) {
    return new Date(d.getTime() + PERTH_OFFSET_MS).toISOString().slice(0, 10);
  }
  return s.slice(0, 10);
};

export const normalizeTime = (val?: string | Date): string => {
  if (!val) return '';
  if (val instanceof Date) return new Date(val.getTime() + PERTH_OFFSET_MS).toISOString().slice(11, 16);
  const s = String(val).trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (m) return `${m[1].padStart(2, '0')}:${m[2]}`;
  if (s.includes('T')) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return new Date(d.getTime() + PERTH_OFFSET_MS).toISOString().slice(11, 16);
  }
  return s;
};

/**
 * Format a YYYY-MM-DD business date. Built in UTC and formatted in UTC so the
 * calendar day never shifts, whatever timezone the viewer's browser is in.
 */
export const formatDisplayDate = (val?: string | Date): string => {
  const clean = normalizeDate(val);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean || '—';
  const [y, m, d] = clean.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('en-AU', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDisplayTime = (val?: string | Date, includeTzLabel = false): string => {
  if (!val) return '—';
  const clean = normalizeTime(val);
  if (clean === '24:00') return includeTzLabel ? '12:00 AM (midnight) AWST' : '12:00 AM (midnight)';
  const m = clean.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return clean;
  let h = parseInt(m[1], 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const out = `${h}:${m[2]} ${ampm}`;
  return includeTzLabel ? `${out} AWST` : out;
};

export const calculateEndTime = (startTime: string, durationHours = 4): string => {
  const m = normalizeTime(startTime).match(/^(\d{1,2}):(\d{2})/);
  if (!m) return '';
  const total = parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + Math.round(durationHours * 60);
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

export const formatMoney = (n?: number): string =>
  `$${Number(n || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
const saveUserSession = (auth: UserAuthResponse) => {
  store.set(KEYS.user, auth.access_token);
  store.set(KEYS.currentUser, JSON.stringify(auth.user));
};

const qs = (params: Record<string, string | number | undefined>) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');

export const api = {
  // ---------- Public ----------
  getConfig: () => request<KitchenConfig>('/config'),

  getAvailability: (date: string) => request<AvailabilityData>(`/availability?${qs({ date })}`),

  getMonthAvailability: (year: number, month: number) =>
    request<Record<string, DayAvailabilitySummary>>(`/month-availability?${qs({ year, month })}`),

  /** Server-side check (handles overnight shifts, blocks, past times). */
  checkSlot: (booking_date: string, start_time: string, duration_hours: number) =>
    request<SlotCheckResult>(`/availability/check?${qs({ booking_date, start_time, duration_hours })}`),

  submitEnquiry: (data: EnquiryInput) =>
    request<{ enquiry: Enquiry; reference_code: string }>('/enquiries', { method: 'POST', body: data }).then((r) => r.enquiry),

  // ---------- Customer auth ----------
  async userSignUp(data: {
    email: string;
    password: string;
    full_name: string;
    business_name?: string;
    abn?: string;
    phone?: string;
    food_safety_cert_file?: File | null;
    liability_insurance_file?: File | null;
    terms_accepted: boolean;
  }): Promise<UserAuthResponse> {
    const auth = await request<UserAuthResponse>('/auth/signup', {
      method: 'POST',
      body: {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        full_name: data.full_name.trim(),
        business_name: data.business_name?.trim() || undefined,
        abn: data.abn?.trim() || undefined,
        phone: data.phone?.trim() && data.phone.trim() !== '+61' ? data.phone.trim() : undefined,
        terms_accepted: data.terms_accepted,
      },
    });
    saveUserSession(auth);
    // Upload compliance documents to the server (they used to stay in localStorage).
    let user = auth.user;
    for (const [kind, file] of [
      ['food_safety_cert', data.food_safety_cert_file],
      ['liability_insurance', data.liability_insurance_file],
    ] as const) {
      if (file) user = await api.uploadDocument(kind, file);
    }
    return { ...auth, user };
  },

  async userLogin(email: string, password: string, otp?: string): Promise<UserAuthResponse> {
    const auth = await request<UserAuthResponse>('/auth/login', {
      method: 'POST',
      body: { email: email.trim().toLowerCase(), password, otp: otp || undefined },
    });
    saveUserSession(auth);
    return auth;
  },

  getCurrentUser(): User | null {
    if (!store.get(KEYS.user)) return null;
    try {
      const raw = store.get(KEYS.currentUser);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  },

  getUserToken: () => store.get(KEYS.user),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', { method: 'POST', body: { email: email.trim().toLowerCase() } }),

  /** Returns the new session when the account has no 2FA; otherwise just a message. */
  async resetPassword(token: string, newPassword: string): Promise<{ message?: string; user?: User }> {
    const res = await request<Partial<UserAuthResponse> & { message?: string }>('/auth/reset-password', {
      method: 'POST',
      body: { token, new_password: newPassword },
    });
    if (res.access_token && res.user && res.user.role === 'hirer') saveUserSession(res as UserAuthResponse);
    return { message: res.message, user: res.user };
  },

  async verifyEmail(token: string): Promise<User> {
    const res = await request<{ user: User }>('/auth/verify-email', { method: 'POST', body: { token } });
    const current = api.getCurrentUser();
    if (current && current.email === res.user.email) store.set(KEYS.currentUser, JSON.stringify(res.user));
    return res.user;
  },

  resendVerification: () => request<{ message: string }>('/auth/resend-verification', { method: 'POST', scope: 'user' }),

  async changePassword(currentPassword: string, newPassword: string): Promise<User> {
    const res = await request<UserAuthResponse>('/auth/password', {
      method: 'POST',
      scope: 'user',
      body: { current_password: currentPassword, new_password: newPassword },
    });
    saveUserSession(res);
    return res.user;
  },

  // ---------- Two-factor authentication (any signed-in scope) ----------
  twoFactorSetup: (scope: Scope) => request<{ secret: string; otpauth_url: string }>('/auth/2fa/setup', { method: 'POST', scope }),

  async twoFactorEnable(scope: Scope, code: string): Promise<UserAuthResponse> {
    const res = await request<UserAuthResponse>('/auth/2fa/enable', { method: 'POST', scope, body: { code } });
    if (scope === 'user') saveUserSession(res);
    else store.set(scope === 'admin' ? KEYS.admin : KEYS.superadmin, res.access_token);
    return res;
  },

  userLogout() {
    store.remove(KEYS.user);
    store.remove(KEYS.currentUser);
  },

  /** Re-validate the stored session with the server. */
  async refreshCurrentUser(): Promise<User | null> {
    if (!store.get(KEYS.user)) return null;
    try {
      const user = await request<User>('/auth/me', { scope: 'user' });
      store.set(KEYS.currentUser, JSON.stringify(user));
      return user;
    } catch {
      return null;
    }
  },

  async updateUserProfile(data: Partial<Pick<User, 'full_name' | 'business_name' | 'abn' | 'phone'>>): Promise<User> {
    const res = await request<{ user: User }>('/auth/profile', { method: 'PUT', scope: 'user', body: data });
    store.set(KEYS.currentUser, JSON.stringify(res.user));
    return res.user;
  },

  async uploadDocument(kind: 'food_safety_cert' | 'liability_insurance', file: File): Promise<User> {
    const form = new FormData();
    form.append('file', file);
    const res = await request<{ user: User }>(`/auth/documents/${kind}`, { method: 'POST', scope: 'user', form });
    store.set(KEYS.currentUser, JSON.stringify(res.user));
    return res.user;
  },

  // ---------- Customer bookings ----------
  createBooking: (data: BookingCreateInput) =>
    request<Booking>('/bookings', { method: 'POST', scope: 'user', body: { ...data, terms_accepted: true } }),

  getBookingByRef: (referenceCode: string) => request<Booking>(`/bookings/${encodeURIComponent(referenceCode)}`, { scope: 'user' }),

  createRecurring: (data: {
    booking_date: string;
    start_time: string;
    duration_hours: number;
    frequency: 'weekly' | 'fortnightly';
    occurrences: number;
    phone: string;
    intended_use?: string;
    team_size?: number;
    additional_notes?: string;
  }) =>
    request<{ series_id: string; created: Booking[]; skipped: { booking_date: string; reason: string }[] }>('/bookings/recurring', {
      method: 'POST',
      scope: 'user',
      body: { ...data, terms_accepted: true },
    }),

  cancelBooking: (referenceCode: string) =>
    request<Booking>(`/bookings/${encodeURIComponent(referenceCode)}/cancel`, { method: 'POST', scope: 'user' }),

  /** The signed-in customer's own bookings (the email argument is ignored; kept for compatibility). */
  getUserBookings: (_email?: string) => request<Booking[]>('/auth/bookings', { scope: 'user' }),

  getUserStorageBookings: (_email?: string) => request<StorageBooking[]>('/auth/storage-bookings', { scope: 'user' }),

  getUserInvoices: () => request<Invoice[]>('/auth/invoices', { scope: 'user' }),

  checkStorageAvailability: (startDate: string, endDate: string, durationType: StorageDurationType = 'custom') =>
    request<StorageAvailability>(`/storage/availability?${qs({ start_date: startDate, end_date: endDate, duration_type: durationType })}`),

  createStorageBooking: (data: {
    full_name: string;
    business_name?: string;
    abn?: string;
    email: string;
    phone: string;
    storage_type: StorageType;
    start_date: string;
    end_date: string;
    duration_type: StorageDurationType;
    special_requirements?: string;
  }) => request<StorageBooking>('/storage-bookings', { method: 'POST', scope: 'user', body: { ...data, terms_accepted: true } }),

  // ---------- Staff admin ----------
  async adminLogin(
    username: string,
    password: string,
    otp?: string
  ): Promise<{ access_token: string; username: string; two_factor_setup_required?: boolean }> {
    const res = await request<{ access_token: string; username: string; two_factor_setup_required?: boolean }>('/admin/login', {
      method: 'POST',
      body: { username: username.trim().toLowerCase(), password, otp: otp || undefined },
    });
    store.set(KEYS.admin, res.access_token);
    return res;
  },

  adminLogout() {
    store.remove(KEYS.admin);
  },

  getAdminToken: () => store.get(KEYS.admin),

  getDashboardStats: (token?: string) => request<DashboardStats>('/admin/dashboard-stats', { scope: 'admin', token }),

  getAdminBookings: (token?: string, status?: string, search?: string) =>
    request<Booking[]>(`/admin/bookings?${qs({ status: status && status !== 'all' ? status : undefined, search })}`, { scope: 'admin', token }),

  updateBookingStatus: (
    token: string | undefined,
    id: number | string,
    data: {
      status?: string;
      payment_status?: string;
      admin_notes?: string;
      reference_code?: string;
      access_code?: string;
      payment_method?: string;
      payment_reference?: string;
    }
  ) => {
    const { reference_code, ...changes } = data;
    const target = reference_code || String(id);
    return request<Booking>(`/admin/bookings/${encodeURIComponent(target)}/status`, { method: 'PATCH', scope: 'admin', token, body: changes });
  },

  deleteBooking: (token: string | undefined, id: number | string, referenceCode?: string) =>
    request<void>(`/admin/bookings/${encodeURIComponent(referenceCode || String(id))}`, { method: 'DELETE', scope: 'admin', token }),

  getBlockedSlots: (token?: string) => request<BlockedSlot[]>('/admin/blocked-slots', { scope: 'admin', token }),

  createBlockedSlot: (token: string | undefined, data: { block_date: string; start_time: string; end_time: string; reason?: string }) =>
    request<BlockedSlot>('/admin/blocked-slots', { method: 'POST', scope: 'admin', token, body: data }),

  deleteBlockedSlot: (token: string | undefined, id: number | string) =>
    request<void>(`/admin/blocked-slots/${encodeURIComponent(String(id))}`, { method: 'DELETE', scope: 'admin', token }),

  updateAdminConfig: (token: string | undefined, data: Partial<KitchenConfig>) => {
    const allowed: (keyof KitchenConfig)[] = [
      'hourly_rental_rate',
      'min_rental_hours',
      'packages',
      'operating_hours_start',
      'operating_hours_end',
      'cleaning_fee',
      'security_deposit',
      'kitchen_name',
      'kitchen_address',
      'kitchen_phone',
      'kitchen_email',
      'kitchen_whatsapp',
    ];
    const body = Object.fromEntries(Object.entries(data).filter(([k, v]) => allowed.includes(k as keyof KitchenConfig) && v !== undefined));
    return request<KitchenConfig>('/admin/config', { method: 'PUT', scope: 'admin', token, body });
  },

  getAdminEnquiries: (token?: string) => request<Enquiry[]>('/admin/enquiries', { scope: 'admin', token }),

  updateEnquiryStatus: (token: string | undefined, id: number | string, status: string) =>
    request<void>(`/admin/enquiries/${encodeURIComponent(String(id))}/status`, { method: 'PATCH', scope: 'admin', token, body: { status } }),

  getStorageBookings: () => request<StorageBooking[]>('/admin/storage-bookings', { scope: 'admin' }),

  updateStorageBookingStatus: (
    idOrRef: string | number,
    statusOrChanges: string | { status?: string; payment_status?: string; payment_reference?: string; admin_notes?: string }
  ) =>
    request<StorageBooking>(`/admin/storage-bookings/${encodeURIComponent(String(idOrRef))}/status`, {
      method: 'PATCH',
      scope: 'admin',
      body: typeof statusOrChanges === 'string' ? { status: statusOrChanges } : statusOrChanges,
    }),

  getAdminUsers: (search?: string) => request<User[]>(`/admin/users?${qs({ search })}`, { scope: 'admin' }),

  userDocumentUrl: (userId: string, kind: 'food_safety_cert' | 'liability_insurance') =>
    `${API_BASE}/admin/users/${encodeURIComponent(userId)}/documents/${kind}`,

  /** Download a protected file with the admin token and open it. */
  async openAdminDocument(userId: string, kind: 'food_safety_cert' | 'liability_insurance') {
    const token = tokenFor('admin');
    const res = await fetch(api.userDocumentUrl(userId, kind), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new ApiError(res.status, 'Document not available.');
    const url = URL.createObjectURL(await res.blob());
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  },

  // ---------- Super admin (finance) ----------
  async superAdminLogin(
    username: string,
    password: string,
    otp?: string
  ): Promise<{ access_token: string; username: string; role: string; two_factor_setup_required?: boolean }> {
    const res = await request<{ access_token: string; username: string; role: string; two_factor_setup_required?: boolean }>(
      '/superadmin/login',
      {
        method: 'POST',
        body: { username: username.trim().toLowerCase(), password, otp: otp || undefined },
      }
    );
    store.set(KEYS.superadmin, res.access_token);
    store.set(KEYS.superadminUser, res.username);
    return res;
  },

  getSuperAdminToken: () => store.get(KEYS.superadmin),

  superAdminLogout() {
    store.remove(KEYS.superadmin);
    store.remove(KEYS.superadminUser);
  },

  getInvoices: () => request<Invoice[]>('/invoices', { scope: 'superadmin' }),

  async updateInvoiceStatus(
    invoiceId: string,
    status: InvoiceStatus,
    paymentMethod?: string,
    notes?: string,
    paymentReference?: string
  ): Promise<Invoice> {
    if (status !== 'paid' && status !== 'void') throw new ApiError(400, 'Invoices can only be marked paid or void.');
    const res = await request<{ invoice: Invoice }>(`/invoices/${encodeURIComponent(invoiceId)}/status`, {
      method: 'PATCH',
      scope: 'superadmin',
      body: { status, payment_method: paymentMethod, payment_reference: paymentReference, notes },
    });
    return res.invoice;
  },

  /**
   * Manual tax invoice. Either pass line_items (unit prices ex GST) or a single
   * amount ex GST with a description.
   */
  createCustomInvoice: (data: {
    customer_name: string;
    business_name?: string;
    abn?: string;
    email?: string;
    phone?: string;
    booking_reference?: string;
    service_date_range?: string;
    description?: string;
    amount_ex_gst?: number;
    security_deposit?: number;
    notes?: string;
    line_items?: { description: string; quantity: number; unit_price: number; taxable?: boolean }[];
  }) => {
    const line_items = data.line_items?.length
      ? data.line_items
      : [{ description: data.description || 'Commercial kitchen services', quantity: 1, unit_price: Number(data.amount_ex_gst || 0) }];
    return request<Invoice>('/invoices', {
      method: 'POST',
      scope: 'superadmin',
      body: {
        customer_name: data.customer_name,
        business_name: data.business_name,
        abn: data.abn,
        email: data.email || undefined,
        phone: data.phone,
        booking_reference: data.booking_reference,
        service_date_range: data.service_date_range,
        security_deposit: data.security_deposit,
        notes: data.notes,
        line_items,
      },
    });
  },

  refundInvoice: (
    invoiceNumber: string,
    data: { amount: number; reason: string; method?: string; reference?: string; cancel_booking?: boolean }
  ) =>
    request<{ adjustment_note: AdjustmentNote; invoice: Invoice }>(`/invoices/${encodeURIComponent(invoiceNumber)}/refund`, {
      method: 'POST',
      scope: 'superadmin',
      body: data,
    }),

  settleBond: (invoiceNumber: string, data: { refund_amount: number; forfeit_amount: number; reason?: string; reference?: string }) =>
    request<{ invoice: Invoice }>(`/invoices/${encodeURIComponent(invoiceNumber)}/bond`, { method: 'POST', scope: 'superadmin', body: data }),

  reconcileBank: (csv: string, apply: boolean) =>
    request<BankReconcileResult>('/invoices/reconcile', { method: 'POST', scope: 'superadmin', body: { csv, apply } }),

  askFinanceAssistant: (query: string) =>
    request<{ answer: string; isLiveGemini: boolean; modelUsed?: string; errorNote?: string }>('/invoices/ai-query', {
      method: 'POST',
      scope: 'superadmin',
      body: { query },
    }),
};
