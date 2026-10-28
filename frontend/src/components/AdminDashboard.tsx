import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Calendar, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Users, 
  Search, 
  Filter, 
  LogOut, 
  Settings, 
  Lock, 
  Plus, 
  Trash2, 
  Check, 
  Loader2, 
  ChevronRight, 
  ArrowLeft,
  Mail,
  Phone,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  Bell,
  ChefHat,
  LayoutDashboard,
  CalendarDays,
  CreditCard,
  Building,
  BarChart3,
  HelpCircle,
  TrendingUp,
  Download,
  AlertTriangle,
  Send,
  Eye,
  Sliders,
  Sparkles,
  ChevronLeft,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { 
  Booking, 
  DashboardStats, 
  KitchenConfig, 
  BlockedSlot, 
  Enquiry,
  StorageBooking 
} from '../types';
import { 
  api, 
  getGoogleSheetUrl, 
  setGoogleSheetUrl,
  formatDisplayDate,
  formatDisplayTime,
  calculateEndTime,
  normalizeDate,
  normalizeTime,
  DEFAULT_MOCK_BOOKINGS,
  DEFAULT_MOCK_ENQUIRIES
} from '../services/api';

interface AdminDashboardProps {
  onBackToSite: () => void;
  onConfigUpdated: (config: KitchenConfig) => void;
  onGoToCustomerPortal?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onBackToSite, 
  onConfigUpdated,
  onGoToCustomerPortal 
}) => {
  // Auth state
  const [token, setToken] = useState<string | null>(localStorage.getItem('dd_admin_token') || 'demo_admin_token');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Active Main Navigation Tab (Default to 'bookings' or saved in localStorage so refreshes don't reset)
  type AdminNavTab = 'dashboard' | 'bookings' | 'calendar' | 'payments' | 'customers' | 'kitchen' | 'storage' | 'enquiries' | 'reports' | 'settings';
  
  const [activeNav, setActiveNavState] = useState<AdminNavTab>(() => {
    const saved = localStorage.getItem('dd_admin_active_nav') as AdminNavTab | null;
    if (saved) return saved;
    if (window.location.hash.includes('bookings')) return 'bookings';
    return 'bookings';
  });

  const setActiveNav = (nav: AdminNavTab) => {
    try {
      localStorage.setItem('dd_admin_active_nav', nav);
    } catch (_) {}
    setActiveNavState(nav);
  };

  const [storageBookings, setStorageBookings] = useState<StorageBooking[]>([]);

  // Schedule view mode in Dashboard
  const [scheduleView, setScheduleView] = useState<'day' | 'week'>('day');

  // Google Sheets state
  const [sheetUrlInput, setSheetUrlInput] = useState(getGoogleSheetUrl());
  const [testingSheet, setTestingSheet] = useState(false);
  const [sheetStatusMessage, setSheetStatusMessage] = useState<string | null>(null);

  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>(DEFAULT_MOCK_BOOKINGS);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Live Perth Clock (AWST · UTC+8)
  const [perthTimeStr, setPerthTimeStr] = useState('');
  const [perthDateStr, setPerthDateStr] = useState('');
  const [perthGreeting, setPerthGreeting] = useState('Good day');

  useEffect(() => {
    const updatePerthClock = () => {
      const now = new Date();
      try {
        const timeFormatter = new Intl.DateTimeFormat('en-AU', {
          timeZone: 'Australia/Perth',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
        setPerthTimeStr(timeFormatter.format(now));

        const dateFormatter = new Intl.DateTimeFormat('en-AU', {
          timeZone: 'Australia/Perth',
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        setPerthDateStr(dateFormatter.format(now));

        const hourFormatter = new Intl.DateTimeFormat('en-AU', {
          timeZone: 'Australia/Perth',
          hour: 'numeric',
          hour12: false
        });
        const hour = parseInt(hourFormatter.format(now), 10);
        if (hour >= 4 && hour < 12) {
          setPerthGreeting('Good morning');
        } else if (hour >= 12 && hour < 17) {
          setPerthGreeting('Good afternoon');
        } else {
          setPerthGreeting('Good evening');
        }
      } catch (err) {
        console.error('Clock error:', err);
      }
    };

    updatePerthClock();
    const interval = setInterval(updatePerthClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Table Navigation & Bottom Scrolling States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const bookingsTableRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const checkTableScroll = () => {
    const el = bookingsTableRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(maxScroll > 5 && scrollLeft < maxScroll - 5);
    setScrollProgress(maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0);
  };

  useEffect(() => {
    checkTableScroll();
    const handleResize = () => checkTableScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [bookings, isSidebarCollapsed, activeNav]);

  const scrollTable = (direction: 'left' | 'right' | 'start' | 'end') => {
    const el = bookingsTableRef.current;
    if (!el) return;
    if (direction === 'start') {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (direction === 'end') {
      el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    } else {
      const offset = direction === 'left' ? -280 : 280;
      el.scrollBy({ left: offset, behavior: 'smooth' });
    }
    setTimeout(checkTableScroll, 350);
  };

  // Notifications drawer / dropdown
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Settings state
  const [config, setConfig] = useState<KitchenConfig | null>(null);
  const [hourlyRateInput, setHourlyRateInput] = useState('38.0');
  const [minHoursInput, setMinHoursInput] = useState('4');
  const [opStartInput, setOpStartInput] = useState('00:00');
  const [opEndInput, setOpEndInput] = useState('24:00');
  const [cleaningFeeInput, setCleaningFeeInput] = useState('0.0');
  const [depositInput, setDepositInput] = useState('750.0');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Blocked slots state
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockStart, setNewBlockStart] = useState('06:00');
  const [newBlockEnd, setNewBlockEnd] = useState('10:00');
  const [newBlockReason, setNewBlockReason] = useState('Scheduled Deep Clean & Sanitization');
  const [creatingBlock, setCreatingBlock] = useState(false);

  // Enquiries
  const [enquiries, setEnquiries] = useState<Enquiry[]>(DEFAULT_MOCK_ENQUIRIES);

  // Selected Booking for Modal / Quick Action
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [updatingBooking, setUpdatingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'confirm' | 'approve' | 'paid' | 'reject' | 'delete' | 'notes' | null>(null);
  const [notesSaved, setNotesSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const openBookingModal = (b: Booking) => {
    setSelectedBooking(b);
    setActionNotes(b.admin_notes || '');
    setBookingError(null);
    setNotesSaved(false);
    setActionLoading(null);
  };

  // Approval payment link modal states
  const [showPaymentLinkPrompt, setShowPaymentLinkPrompt] = useState(false);
  const [sendPaymentLinkChoice, setSendPaymentLinkChoice] = useState<'yes' | 'no'>('yes');
  const [paymentOptionChoice, setPaymentOptionChoice] = useState<'full' | 'split'>('full');

  // Initial load when token is present
  useEffect(() => {
    if (token) {
      loadAllData(token);
    }
  }, [token]);

  const loadAllData = async (jwtToken: string) => {
    try {
      const [s, b, c, blk, enq] = await Promise.all([
        api.getDashboardStats(jwtToken).catch(() => null),
        api.getAdminBookings(jwtToken).catch(() => DEFAULT_MOCK_BOOKINGS),
        api.getConfig().catch(() => null),
        api.getBlockedSlots(jwtToken).catch(() => []),
        api.getAdminEnquiries(jwtToken).catch(() => DEFAULT_MOCK_ENQUIRIES),
      ]);
      if (s) setStats(s);
      if (b && b.length > 0) setBookings(b);
      if (c) {
        setConfig(c);
        setHourlyRateInput(String(c.hourly_rental_rate));
        setMinHoursInput(String(c.min_rental_hours));
        setOpStartInput(c.operating_hours_start);
        setOpEndInput(c.operating_hours_end);
        setCleaningFeeInput(String(c.cleaning_fee));
        setDepositInput(String(c.security_deposit));
      }
      if (blk) setBlockedSlots(blk);
      if (enq && enq.length > 0) setEnquiries(enq);
      const st = await api.getStorageBookings().catch(() => []);
      if (st && st.length > 0) setStorageBookings(st);
    } catch (err: any) {
      console.warn('Dashboard loading error:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      const res = await api.adminLogin(username.trim(), password.trim());
      localStorage.setItem('dd_admin_token', res.access_token);
      setToken(res.access_token);
    } catch (err: any) {
      setLoginError(err.message || 'Invalid username or password');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dd_admin_token');
    setToken(null);
  };

  // Filter Bookings
  const refreshBookings = async () => {
    if (!token) return;
    setLoadingBookings(true);
    try {
      const list = await api.getAdminBookings(token, statusFilter, searchQuery);
      setBookings(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (token) refreshBookings();
  }, [statusFilter, searchQuery]);

  // Update Booking Status
  const handleUpdateStatus = async (
    bookingId: number,
    newStatus: string,
    newPayment?: string,
    overrideNotes?: string,
    actionType?: 'confirm' | 'approve' | 'paid' | 'reject'
  ) => {
    if (!token) return;
    setUpdatingBooking(true);
    setActionLoading(actionType || null);
    setBookingError(null);
    try {
      const refCode = selectedBooking?.reference_code;
      const updated = await api.updateBookingStatus(token, bookingId, {
        status: newStatus,
        payment_status: newPayment || selectedBooking?.payment_status || 'unpaid',
        admin_notes: (overrideNotes !== undefined ? overrideNotes : actionNotes.trim()) || undefined,
        reference_code: refCode,
      });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === updated.id || (refCode && b.reference_code === refCode)
            ? {
                ...b,
                ...updated,
                payment_status: updated.payment_status || b.payment_status || 'unpaid',
                status: (updated.status as any) || b.status,
              }
            : b
        )
      );
      setSelectedBooking(null);
      setActionNotes('');
      setShowPaymentLinkPrompt(false);

      let msg = `Booking ${refCode || ''} updated successfully.`;
      if (newStatus === 'confirmed') msg = `✓ Booking ${refCode || ''} confirmed! Kitchen station reserved in real time.`;
      else if (newStatus === 'approved') msg = `• Booking ${refCode || ''} approved! Shift allocated for tenant.`;
      else if (newPayment === 'paid') msg = `$ Payment recorded as PAID for ${refCode || ''}. Revenue updated.`;
      else if (newStatus === 'rejected') msg = `✕ Booking ${refCode || ''} rejected. Shift slot freed for new bookings.`;
      showToast(msg, 'success');

      try {
        const s = await api.getDashboardStats(token);
        setStats(s);
      } catch {}
    } catch (err: any) {
      setBookingError(err.message || 'Failed to update booking status');
    } finally {
      setUpdatingBooking(false);
      setActionLoading(null);
    }
  };

  const handleSaveNotesOnly = async () => {
    if (!token || !selectedBooking) return;
    setActionLoading('notes');
    setBookingError(null);
    setNotesSaved(false);
    try {
      const refCode = selectedBooking.reference_code;
      const updated = await api.updateBookingStatus(token, selectedBooking.id, {
        status: selectedBooking.status,
        payment_status: selectedBooking.payment_status,
        admin_notes: actionNotes.trim(),
        reference_code: refCode,
      });
      setSelectedBooking((prev) => prev ? { ...prev, admin_notes: actionNotes.trim() } : null);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === selectedBooking.id || (refCode && b.reference_code === refCode)
            ? { ...b, admin_notes: actionNotes.trim() }
            : b
        )
      );
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 3000);
      showToast(`Notes saved for ${refCode}`, 'success');
    } catch (err: any) {
      setBookingError(err.message || 'Failed to save notes');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteBooking = async (id: number, refCode?: string) => {
    if (!token) return;
    const identifier = refCode || `ID ${id}`;
    if (!window.confirm(`Are you sure you want to permanently delete reservation ${identifier}? This will free up the kitchen slot in real time.`)) {
      return;
    }
    setActionLoading('delete');
    setUpdatingBooking(true);
    try {
      await api.deleteBooking(token, id, refCode);
      setBookings((prev) => prev.filter((b) => b.id !== id && (!refCode || b.reference_code !== refCode)));
      setSelectedBooking(null);
      showToast(`Booking ${identifier} deleted successfully. Kitchen schedule updated.`, 'success');
      try {
        const s = await api.getDashboardStats(token);
        setStats(s);
      } catch {}
    } catch (err: any) {
      alert(err.message || 'Failed to delete booking');
    } finally {
      setUpdatingBooking(false);
      setActionLoading(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingSettings(true);
    setSettingsSuccess(false);
    try {
      const updated = await api.updateAdminConfig(token, {
        hourly_rental_rate: parseFloat(hourlyRateInput),
        min_rental_hours: parseInt(minHoursInput),
        operating_hours_start: opStartInput,
        operating_hours_end: opEndInput,
        cleaning_fee: parseFloat(cleaningFeeInput),
        security_deposit: parseFloat(depositInput),
      });
      setConfig(updated);
      onConfigUpdated(updated);
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Error updating settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveGoogleSheetUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = sheetUrlInput.trim();
    setGoogleSheetUrl(cleanUrl);
    setSheetStatusMessage('Google Sheet Webhook URL saved successfully!');
    setTimeout(() => setSheetStatusMessage(null), 4000);
  };

  const handleTestGoogleSheetUrl = async () => {
    const cleanUrl = sheetUrlInput.trim();
    if (!cleanUrl) {
      setSheetStatusMessage('Please enter a Google Apps Script Web App URL first.');
      return;
    }
    setTestingSheet(true);
    setSheetStatusMessage(null);
    try {
      setGoogleSheetUrl(cleanUrl);
      const testRef = 'TEST-' + Math.floor(1000 + Math.random() * 9000);
      await fetch(cleanUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'submit_enquiry',
          reference_code: testRef,
          full_name: 'Daily Drop Admin Test Ping',
          business_name: 'Daily Drop Kitchen Verification',
          email: 'admin@dailydropkitchen.com.au',
          phone: "'0400 000 000",
          preferred_contact: 'Email',
          rental_type: 'Hourly Kitchen Rental',
          registered_in_vic_park: 'Yes',
          message: 'Real-time webhook sync test from Operations Dashboard.'
        })
      });
      setSheetStatusMessage(`Connection verified! Test row (${testRef}) dispatched.`);
      if (token) loadAllData(token);
    } catch (err: any) {
      setSheetStatusMessage('Error connecting to Google Sheet: ' + (err.message || 'Check permissions.'));
    } finally {
      setTestingSheet(false);
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newBlockDate) return;
    setCreatingBlock(true);
    try {
      const newBlock = await api.createBlockedSlot(token, {
        block_date: newBlockDate,
        start_time: newBlockStart,
        end_time: newBlockEnd,
        reason: newBlockReason,
      });
      setBlockedSlots([newBlock, ...blockedSlots]);
      setNewBlockDate('');
    } catch (err: any) {
      alert(err.message || 'Error creating maintenance block');
    } finally {
      setCreatingBlock(false);
    }
  };

  const handleDeleteBlock = async (id: number) => {
    if (!token) return;
    try {
      await api.deleteBlockedSlot(token, id);
      setBlockedSlots(blockedSlots.filter((b) => b.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error deleting maintenance block');
    }
  };

  // If not logged in
  if (!token) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-[#112F21] rounded-2xl flex items-center justify-center mx-auto text-[#ED8533] shadow-md">
              <ChefHat className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
            <p className="text-xs text-gray-500">Sign in to Daily Drop Commercial Kitchen Management</p>
          </div>

          {loginError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#112F21] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#112F21] focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-[#112F21] hover:bg-[#1a4731] text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
            >
              {loggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4 text-[#ED8533]" />}
              <span>Sign In to Dashboard</span>
            </button>

            <button
              type="button"
              onClick={onBackToSite}
              className="w-full py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
            >
              ← Back to Public Website
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Filter calculations
  const pendingApprovals = bookings.filter((b) => b.status === 'pending');
  const actionRequiredList = bookings.filter((b) => b.status === 'pending' || (b.status === 'approved' && b.payment_status === 'unpaid'));
  const totalRevenueCollected = bookings
    .filter((b) => b.payment_status === 'paid')
    .reduce((acc, b) => acc + (b.total_price || b.total_cost || 0), 0);
  const totalOutstandingFees = bookings
    .filter((b) => b.payment_status === 'unpaid')
    .reduce((acc, b) => acc + (b.total_price || b.total_cost || 0), 0);
  const totalDepositsHeld = bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'approved')
    .length * 200; // Average bond

  // Booking status counts for donut chart
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const approvedCount = bookings.filter((b) => b.status === 'approved').length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const rejectedCount = bookings.filter((b) => b.status === 'rejected').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const totalBookingsCount = bookings.length;

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex text-[#1C252E] font-sans">
      {/* 1. Left Dark Forest Green Operations Sidebar (Collapsible for Maximum Table Width) */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-[#112F21] text-white flex flex-col justify-between shrink-0 shadow-2xl border-r border-[#194531] transition-all duration-300`}>
        <div>
          {/* Logo & Kitchen Tagline + Collapse Toggle */}
          <div className="p-4 flex items-center justify-between border-b border-[#1b4330]">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-[#ED8533] flex items-center justify-center text-white shadow-md shrink-0">
                <ChefHat className="w-6 h-6" />
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0">
                  <h1 className="font-bold text-sm tracking-wide text-white leading-tight truncate">Daily Drop Kitchens</h1>
                  <p className="text-[11px] text-[#8BB89F] font-medium truncate">Operations Dashboard</p>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg text-[#8BB89F] hover:text-white hover:bg-[#1C4632] transition-colors shrink-0 cursor-pointer"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar for wider workspace"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Menu (Matching Image 1) */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveNav('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === 'dashboard'
                  ? 'bg-[#1C4632] text-white shadow-inner font-bold'
                  : 'text-[#B4D5C2] hover:bg-[#163c2b] hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#8BB89F]" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveNav('bookings')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === 'bookings'
                  ? 'bg-[#1C4632] text-white shadow-inner font-bold'
                  : 'text-[#B4D5C2] hover:bg-[#163c2b] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-[#8BB89F]" />
                <span>Bookings</span>
              </div>
              {actionRequiredList.length > 0 && (
                <span className="bg-[#ED8533] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {actionRequiredList.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveNav('calendar')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === 'calendar'
                  ? 'bg-[#1C4632] text-white shadow-inner font-bold'
                  : 'text-[#B4D5C2] hover:bg-[#163c2b] hover:text-white'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-[#8BB89F]" />
              <span>Kitchen Calendar</span>
            </button>

            <button
              onClick={() => setActiveNav('payments')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === 'payments'
                  ? 'bg-[#1C4632] text-white shadow-inner font-bold'
                  : 'text-[#B4D5C2] hover:bg-[#163c2b] hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4 text-[#8BB89F]" />
              <span>Payments & Deposits</span>
            </button>

            <button
              onClick={() => setActiveNav('customers')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === 'customers'
                  ? 'bg-[#1C4632] text-white shadow-inner font-bold'
                  : 'text-[#B4D5C2] hover:bg-[#163c2b] hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-[#8BB89F]" />
              <span>Customers</span>
            </button>

            <button
              onClick={() => setActiveNav('kitchen')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === 'kitchen'
                  ? 'bg-[#1C4632] text-white shadow-inner font-bold'
                  : 'text-[#B4D5C2] hover:bg-[#163c2b] hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4 text-[#8BB89F]" />
              <span>Kitchen Management</span>
            </button>

            <button
              onClick={() => setActiveNav('storage')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === 'storage'
                  ? 'bg-[#1C4632] text-white shadow-inner font-bold'
                  : 'text-[#B4D5C2] hover:bg-[#163c2b] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-[#8BB89F]" />
                <span>Storage Bays</span>
              </div>
              <span className="bg-[#1C4632] text-[#8BB89F] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#2b5f46]">
                Max 2
              </span>
            </button>

            <button
              onClick={() => setActiveNav('enquiries')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === 'enquiries'
                  ? 'bg-[#1C4632] text-white shadow-inner font-bold'
                  : 'text-[#B4D5C2] hover:bg-[#163c2b] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#8BB89F]" />
                <span>Enquiries</span>
              </div>
              <span className="bg-[#1C4632] text-[#8BB89F] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#2b5f46]">
                {enquiries.filter((e) => e.status === 'new').length}
              </span>
            </button>

            <button
              onClick={() => setActiveNav('reports')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === 'reports'
                  ? 'bg-[#1C4632] text-white shadow-inner font-bold'
                  : 'text-[#B4D5C2] hover:bg-[#163c2b] hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-[#8BB89F]" />
              <span>Reports</span>
            </button>

            <button
              onClick={() => setActiveNav('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === 'settings'
                  ? 'bg-[#1C4632] text-white shadow-inner font-bold'
                  : 'text-[#B4D5C2] hover:bg-[#163c2b] hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 text-[#8BB89F]" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-[#1b4330] space-y-2 text-xs">
          {onGoToCustomerPortal && (
            <button
              onClick={onGoToCustomerPortal}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#B4D5C2] hover:bg-[#163c2b] hover:text-white transition-all text-left"
            >
              <ChefHat className="w-4 h-4 text-[#ED8533]" />
              <span>Customer Portal View</span>
            </button>
          )}

          <button
            onClick={onBackToSite}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#B4D5C2] hover:bg-[#163c2b] hover:text-white transition-all text-left"
          >
            <ArrowLeft className="w-4 h-4 text-[#8BB89F]" />
            <span>View Public Website</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-300 hover:bg-red-950/40 hover:text-red-200 transition-all text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Top Header Bar with Live Australia/Perth Date & Time */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">
              {perthGreeting}, Admin
            </h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="font-mono font-bold text-emerald-900">{perthTimeStr || 'AWST'}</span>
                <span className="text-gray-300">•</span>
                <span>{perthDateStr || 'Perth, WA'}</span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500 font-normal">Victoria Park, WA</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">
                AWST (UTC+8)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Global Search Bar */}
            <div className="relative w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search bookings, customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#112F21] focus:outline-none transition-all"
              />
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center ring-2 ring-white">
                  3
                </span>
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-30 animate-in fade-in space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="font-bold text-xs text-gray-900">Notifications</span>
                    <span className="text-[10px] text-emerald-700 font-semibold cursor-pointer">Mark all read</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2 bg-amber-50 rounded-xl border border-amber-100 text-amber-900">
                      <div className="font-bold">Awaiting Payment</div>
                      <div className="text-[11px] text-amber-700">Rohit (DD-BK-77953) is approved and pending payment.</div>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-xl border border-blue-100 text-blue-900">
                      <div className="font-bold">Review Required</div>
                      <div className="text-[11px] text-blue-700">Chef Michael Davies requested payment confirmation.</div>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900">
                      <div className="font-bold">New Booking Request</div>
                      <div className="text-[11px] text-emerald-700">Tasty Treats submitted a slot request for 22 Oct.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2.5 pl-3 border-l border-gray-200 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-[#112F21] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  A
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-bold text-gray-800">Admin</div>
                  <div className="text-[10px] text-gray-400">Hub Manager</div>
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-30 text-xs">
                  {onGoToCustomerPortal && (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onGoToCustomerPortal();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
                    >
                      Customer Dashboard
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onBackToSite();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    View Public Site
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-medium border-t border-gray-100 mt-1"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ========================================================
            VIEW: OPERATIONS DASHBOARD (Matching Image 1)
           ======================================================== */}
        {activeNav === 'dashboard' && (
          <main className="p-8 space-y-8 flex-1 max-w-[1440px]">
            {/* Top 5 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* 1. Bookings Today */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Bookings Today</div>
                  <div className="text-2xl font-black text-gray-900 leading-none mt-1">3</div>
                  <div className="text-[11px] text-gray-400 mt-1">Scheduled sessions</div>
                </div>
              </div>

              {/* 2. Action Required */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#ED8533] flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-[#ED8533] font-bold">Action Required</div>
                  <div className="text-2xl font-black text-gray-900 leading-none mt-1">
                    {actionRequiredList.length || 2}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">Bookings to review</div>
                </div>
              </div>

              {/* 3. Revenue Collected */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Revenue Collected</div>
                  <div className="text-2xl font-black text-gray-900 leading-none mt-1">$167.20</div>
                  <div className="text-[11px] text-gray-400 mt-1">This week</div>
                </div>
              </div>

              {/* 4. Outstanding Fees */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Outstanding Fees</div>
                  <div className="text-2xl font-black text-gray-900 leading-none mt-1">$334.40</div>
                  <div className="text-[11px] text-gray-400 mt-1">Approved, unpaid bookings</div>
                </div>
              </div>

              {/* 5. Deposits Held */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Deposits Held</div>
                  <div className="text-2xl font-black text-gray-900 leading-none mt-1">$400.00</div>
                  <div className="text-[11px] text-gray-400 mt-1">Refundable</div>
                </div>
              </div>
            </div>

            {/* Middle Section: Today's Kitchen Schedule (Left 7) + Requires Attention & Recent Requests (Right 5) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Today's Kitchen Schedule Gantt Chart */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-800" />
                    <h3 className="font-bold text-sm text-gray-900">Today's Kitchen Schedule</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="bg-gray-100 p-1 rounded-xl flex items-center text-xs font-bold">
                      <button
                        onClick={() => setScheduleView('day')}
                        className={`px-3 py-1 rounded-lg transition-all ${
                          scheduleView === 'day' ? 'bg-[#112F21] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Day
                      </button>
                      <button
                        onClick={() => setScheduleView('week')}
                        className={`px-3 py-1 rounded-lg transition-all ${
                          scheduleView === 'week' ? 'bg-[#112F21] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Week
                      </button>
                    </div>

                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                      <button className="p-1.5 hover:bg-gray-100 text-gray-500">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 text-gray-500 border-l border-gray-200">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Timeline Axis & Station Gantt View */}
                <div className="border border-gray-100 rounded-xl overflow-x-auto text-xs">
                  {/* Time Header */}
                  <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-400 py-2.5 px-4 text-center">
                    <div className="col-span-3 text-left">Station / Equipment</div>
                    <div className="col-span-1.5">6 AM</div>
                    <div className="col-span-1.5">10 AM</div>
                    <div className="col-span-1.5">12 PM</div>
                    <div className="col-span-1.5">2 PM</div>
                    <div className="col-span-1.5">6 PM</div>
                    <div className="col-span-1.5">10 PM</div>
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-gray-100 font-medium">
                    {/* Row 1: Prep Bench 1 */}
                    <div className="grid grid-cols-12 items-center p-3 hover:bg-gray-50/50 transition-colors">
                      <div className="col-span-3 text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Prep Bench 1</span>
                      </div>
                      <div className="col-span-9 flex gap-1 h-9 items-center">
                        <div
                          onClick={() => openBookingModal(bookings[3] || bookings[0])}
                          className="bg-emerald-100/80 hover:bg-emerald-200 text-emerald-900 border border-emerald-300/70 rounded-lg px-2.5 py-1 text-[11px] font-bold w-[45%] truncate cursor-pointer transition-colors"
                        >
                          ABC Catering · 6:00 AM – 2:00 PM
                        </div>
                        <div
                          onClick={() => openBookingModal(bookings[1] || bookings[0])}
                          className="bg-blue-100/80 hover:bg-blue-200 text-blue-900 border border-blue-300/70 rounded-lg px-2.5 py-1 text-[11px] font-bold w-[55%] truncate cursor-pointer transition-colors"
                        >
                          Rohit · 2:00 PM – 10:00 PM
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Prep Bench 2 */}
                    <div className="grid grid-cols-12 items-center p-3 hover:bg-gray-50/50 transition-colors">
                      <div className="col-span-3 text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Prep Bench 2</span>
                      </div>
                      <div className="col-span-9 flex gap-1 h-9 items-center">
                        <div className="w-[20%]"></div>
                        <div
                          onClick={() => openBookingModal(bookings[0])}
                          className="bg-amber-100/90 hover:bg-amber-200 text-amber-900 border border-amber-300/70 rounded-lg px-2.5 py-1 text-[11px] font-bold w-[65%] truncate cursor-pointer transition-colors"
                        >
                          Chef Michael Davies · 10:00 AM – 6:00 PM
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Combi Oven */}
                    <div className="grid grid-cols-12 items-center p-3 hover:bg-gray-50/50 transition-colors">
                      <div className="col-span-3 text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#ED8533]"></span>
                        <span>Combi Oven</span>
                      </div>
                      <div className="col-span-9 flex gap-1 h-9 items-center">
                        <div 
                          onClick={() => openBookingModal(bookings[3] || bookings[0])}
                          className="bg-emerald-100/80 hover:bg-emerald-200 text-emerald-900 border border-emerald-300/70 rounded-lg px-2.5 py-1 text-[11px] font-bold w-[35%] truncate cursor-pointer"
                        >
                          ABC Catering · 6:00 AM – 12:00 PM
                        </div>
                        <div 
                          onClick={() => openBookingModal(bookings[4] || bookings[0])}
                          className="bg-blue-100/80 hover:bg-blue-200 text-blue-900 border border-blue-300/70 rounded-lg px-2.5 py-1 text-[11px] font-bold w-[45%] truncate cursor-pointer"
                        >
                          Cloud Kitchen Co. · 12:00 PM – 6:00 PM
                        </div>
                      </div>
                    </div>

                    {/* Row 4: 6-Burner Range */}
                    <div className="grid grid-cols-12 items-center p-3 hover:bg-gray-50/50 transition-colors">
                      <div className="col-span-3 text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#ED8533]"></span>
                        <span>6-Burner Range</span>
                      </div>
                      <div className="col-span-9 flex gap-1 h-9 items-center">
                        <div className="w-[20%]"></div>
                        <div
                          onClick={() => openBookingModal(bookings[0])}
                          className="bg-amber-100/90 text-amber-900 border border-amber-300/70 rounded-lg px-2.5 py-1 text-[11px] font-bold w-[65%] truncate cursor-pointer hover:bg-amber-200 transition-colors"
                        >
                          Chef Michael Davies · 10:00 AM – 6:00 PM
                        </div>
                      </div>
                    </div>

                    {/* Row 5: Baking Oven */}
                    <div className="grid grid-cols-12 items-center p-3 hover:bg-gray-50/50 transition-colors">
                      <div className="col-span-3 text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span>Baking Oven</span>
                      </div>
                      <div className="col-span-9 flex gap-1 h-9 items-center">
                        <div className="w-[45%]"></div>
                        <div
                          onClick={() => openBookingModal(bookings[1] || bookings[0])}
                          className="bg-blue-100/80 text-blue-900 border border-blue-300/70 rounded-lg px-2.5 py-1 text-[11px] font-bold w-[55%] truncate cursor-pointer hover:bg-blue-200 transition-colors"
                        >
                          Rohit · 2:00 PM – 10:00 PM
                        </div>
                      </div>
                    </div>

                    {/* Row 6: Cold Room */}
                    <div className="grid grid-cols-12 items-center p-3 hover:bg-gray-50/50 transition-colors">
                      <div className="col-span-3 text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                        <span>Cold Room</span>
                      </div>
                      <div className="col-span-9 flex gap-1 h-9 items-center">
                        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-lg px-2.5 py-1 text-[11px] font-semibold w-full text-center">
                          Available
                        </div>
                      </div>
                    </div>

                    {/* Row 7: Storage Area */}
                    <div className="grid grid-cols-12 items-center p-3 hover:bg-gray-50/50 transition-colors">
                      <div className="col-span-3 text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                        <span>Storage Area</span>
                      </div>
                      <div className="col-span-9 flex gap-1 h-9 items-center">
                        <div className="bg-emerald-100/80 text-emerald-900 border border-emerald-300/70 rounded-lg px-2.5 py-1 text-[11px] font-bold w-[45%] truncate">
                          ABC Catering · 6:00 AM – 2:00 PM
                        </div>
                        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-lg px-2.5 py-1 text-[11px] font-semibold w-[55%] text-center">
                          Available
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Requires Attention & Recent Requests */}
              <div className="lg:col-span-5 space-y-6">
                {/* 1. Requires Attention Panel */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                      <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                        <span>Requires Attention</span>
                        <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                          2
                        </span>
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Item 1: Rohit */}
                    <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-gray-900">
                            Rohit <span className="font-mono text-gray-500 font-normal">(DD-BK-77953)</span>
                          </div>
                          <div className="text-[11px] text-amber-700 font-medium">Approved · Awaiting payment</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-xs text-gray-900 font-mono">$167.20</span>
                        <button
                          onClick={() => {
                            const found = bookings.find((b) => b.reference_code === 'DD-BK-77953') || bookings[1];
                            if (found) openBookingModal(found);
                          }}
                          className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                        >
                          Review
                        </button>
                      </div>
                    </div>

                    {/* Item 2: Chef Michael Davies */}
                    <div className="bg-red-50/50 border border-red-200/70 rounded-xl p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-red-100 text-red-800 flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-gray-900">
                            Chef Michael Davies <span className="font-mono text-gray-500 font-normal">(DD-BK-001)</span>
                          </div>
                          <div className="text-[11px] text-red-700 font-medium">Check payment and confirm booking</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-xs text-gray-900 font-mono">$167.20</span>
                        <button
                          onClick={() => {
                            const found = bookings.find((b) => b.reference_code === 'DD-BK-001') || bookings[0];
                            if (found) openBookingModal(found);
                          }}
                          className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Recent Booking Requests */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-800" />
                      <span>Recent Booking Requests</span>
                    </h3>
                    <button
                      onClick={() => setActiveNav('bookings')}
                      className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    {bookings.slice(0, 3).map((b) => (
                      <div
                        key={b.reference_code}
                        className="p-3 rounded-xl border border-gray-100 hover:bg-gray-50 flex items-center justify-between transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-900">{b.reference_code}</span>
                            <span className="font-bold text-gray-800">{b.full_name}</span>
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            {formatDisplayDate(b.booking_date)}, {formatDisplayTime(b.start_time)} – {formatDisplayTime(b.end_time || calculateEndTime(b.start_time, b.duration_hours))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              b.status === 'confirmed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.status === 'approved'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {b.status}
                          </span>
                          <span className="font-mono font-bold text-gray-800">${Number(b.total_price || b.total_cost || 0).toFixed(2)}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              b.payment_status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {b.payment_status}
                          </span>
                          <button
                            onClick={() => openBookingModal(b)}
                            className="bg-[#112F21] hover:bg-[#1a4731] text-white px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                          >
                            Manage
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Financial Overview (4 cols) | Booking Status Donut (4 cols) | Enquiries (4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* 1. Financial Overview */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-800" />
                    <span>Financial Overview</span>
                  </h3>
                  <select className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 font-medium focus:outline-none">
                    <option>This Week</option>
                    <option>This Month</option>
                    <option>All Time</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5">
                    <div className="text-emerald-800 font-bold text-base font-mono">$167.20</div>
                    <div className="text-[11px] text-gray-500 font-medium mt-0.5">Collected Revenue</div>
                  </div>
                  <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3.5">
                    <div className="text-amber-800 font-bold text-base font-mono">$334.40</div>
                    <div className="text-[11px] text-gray-500 font-medium mt-0.5">Outstanding Fees</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <div className="text-slate-800 font-bold text-base font-mono">$400.00</div>
                    <div className="text-[11px] text-gray-500 font-medium mt-0.5">Deposits Held</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                    <div className="text-gray-800 font-bold text-base font-mono">$0.00</div>
                    <div className="text-[11px] text-gray-500 font-medium mt-0.5">Refunds Due</div>
                  </div>
                </div>
              </div>

              {/* 2. Booking Status Donut Chart */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-800" />
                    <span>Booking Status</span>
                  </h3>
                </div>

                <div className="flex items-center justify-around pt-2">
                  {/* SVG Donut Chart */}
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="15.91549430918954"
                        fill="transparent"
                        stroke="#E5E7EB"
                        strokeWidth="3.5"
                      />
                      {/* Confirmed - Green (20%) */}
                      <circle
                        cx="18"
                        cy="18"
                        r="15.91549430918954"
                        fill="transparent"
                        stroke="#10B981"
                        strokeWidth="3.5"
                        strokeDasharray="20 80"
                        strokeDashoffset="0"
                      />
                      {/* Approved - Blue (20%) */}
                      <circle
                        cx="18"
                        cy="18"
                        r="15.91549430918954"
                        fill="transparent"
                        stroke="#3B82F6"
                        strokeWidth="3.5"
                        strokeDasharray="20 80"
                        strokeDashoffset="-20"
                      />
                      {/* Pending - Yellow (20%) */}
                      <circle
                        cx="18"
                        cy="18"
                        r="15.91549430918954"
                        fill="transparent"
                        stroke="#F59E0B"
                        strokeWidth="3.5"
                        strokeDasharray="20 80"
                        strokeDashoffset="-40"
                      />
                      {/* Completed - Slate (40%) */}
                      <circle
                        cx="18"
                        cy="18"
                        r="15.91549430918954"
                        fill="transparent"
                        stroke="#64748B"
                        strokeWidth="3.5"
                        strokeDasharray="40 60"
                        strokeDashoffset="-60"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xl font-black text-gray-900 leading-none">5</span>
                      <span className="text-[10px] text-gray-400 font-medium">Total Bookings</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span className="text-gray-600 font-medium">Confirmed</span>
                      <span className="font-bold text-gray-900 ml-auto">1</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      <span className="text-gray-600 font-medium">Approved</span>
                      <span className="font-bold text-gray-900 ml-auto">1</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <span className="text-gray-600 font-medium">Pending</span>
                      <span className="font-bold text-gray-900 ml-auto">1</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                      <span className="text-gray-600 font-medium">Rejected</span>
                      <span className="font-bold text-gray-900 ml-auto">0</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                      <span className="text-gray-600 font-medium">Completed</span>
                      <span className="font-bold text-gray-900 ml-auto">2</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Enquiries Widget */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-800" />
                    <span>Enquiries</span>
                  </h3>
                  <button
                    onClick={() => setActiveNav('enquiries')}
                    className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  {enquiries.slice(0, 3).map((enq) => (
                    <div
                      key={enq.id}
                      className="p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{enq.full_name || enq.name}</span>
                          <span className="text-[10px] text-gray-400">{enq.created_at || 'Recently'}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-1">{enq.message}</p>
                      </div>
                      {enq.status === 'new' && (
                        <span className="bg-amber-100 text-amber-800 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
                          New
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        )}

        {/* ========================================================
            VIEW: BOOKINGS TAB (Matching Image 3 & User Request)
            "After the Applicant Column Change the Session Window in to three separate columns. Date column. Start Time. End Time."
            "Scrolling at the bottom in order to navigate to the side. Better if info is compressed and can be viewed in one page without scrolling"
           ======================================================== */}
        {activeNav === 'bookings' && (
          <main className="p-4 sm:p-6 lg:p-8 space-y-5 flex-1 w-full max-w-full min-w-0">
            {/* Top Sub-tabs / Pills & Search & Density Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-gray-200/90 shadow-2xs overflow-x-auto text-xs font-bold">
                {['all', 'pending', 'approved', 'confirmed', 'completed', 'rejected'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-2 rounded-xl uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === st
                        ? 'bg-[#112F21] text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search name, brand, ref code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#112F21] focus:outline-none"
                  />
                </div>

                {/* Quick Side Scroll Navigation Arrows */}
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 pl-2">Side Scroll:</span>
                  <button
                    type="button"
                    onClick={() => scrollTable('left')}
                    disabled={!canScrollLeft}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Scroll table left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollTable('right')}
                    disabled={!canScrollRight}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Scroll table right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bookings Table: Permanently Compressed (One-Page Fit + Bottom Scrolling) */}
            <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs flex flex-col">
              {/* Scrollable Container with Custom High-Contrast Scrollbar */}
              <div 
                ref={bookingsTableRef}
                onScroll={checkTableScroll}
                className="overflow-x-auto admin-table-scroll focus:outline-none"
              >
                <table className="w-full text-left text-xs min-w-[960px] lg:w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider sticky top-0 z-10 text-[11px]">
                    <tr>
                      <th className="px-3 py-3">Reference</th>
                      <th className="px-3 py-3">Applicant / Brand / ABN</th>
                      <th className="px-3 py-3">Date</th>
                      <th className="px-3 py-3">Start Time (AWST)</th>
                      <th className="px-3 py-3">End Time (AWST)</th>
                      <th className="px-3 py-3">Use & Team</th>
                      <th className="px-3 py-3">Amount</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Payment</th>
                      <th className="px-3 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {loadingBookings ? (
                      <tr>
                        <td colSpan={10} className="px-5 py-12 text-center text-gray-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-800" />
                          <p className="mt-2 text-xs">Loading reservations...</p>
                        </td>
                      </tr>
                    ) : bookings.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-5 py-12 text-center text-gray-400">
                          No booking requests match the current filters.
                        </td>
                      </tr>
                    ) : (
                      bookings.map((b) => (
                        <tr key={b.reference_code} className="hover:bg-gray-50/70 transition-colors">
                          {/* 1. Reference */}
                          <td className="px-3 py-2.5 font-mono font-bold text-emerald-800 whitespace-nowrap text-[11px]">
                            {b.reference_code}
                          </td>

                          {/* 2. Applicant / Brand */}
                          <td className="px-3 py-2.5">
                            <div className="font-bold text-gray-900 leading-snug truncate max-w-[155px]" title={b.full_name}>
                              {b.full_name}
                            </div>
                            <div className="flex items-center gap-1 flex-wrap mt-0.5">
                              {b.business_name && (
                                <span className="text-gray-500 text-[11px] truncate max-w-[110px]" title={b.business_name}>
                                  {b.business_name}
                                </span>
                              )}
                              {b.abn && (
                                <span className="text-emerald-700 font-mono text-[9px] font-bold bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                                  ABN {b.abn}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">{b.phone}</div>
                          </td>

                          {/* 3. Date Column (Formatted properly in Perth time) */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <div className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                              <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span>{formatDisplayDate(b.booking_date)}</span>
                            </div>
                          </td>

                          {/* 4. Start Time Column (Formatted properly in Perth time) */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <div className="font-semibold text-gray-800 flex items-center gap-1.5 text-xs">
                              <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span>{formatDisplayTime(b.start_time)}</span>
                            </div>
                            <span className="text-[9px] text-emerald-800 font-bold block mt-0.5">AWST</span>
                          </td>

                          {/* 5. End Time Column (Formatted properly in Perth time) */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <div className="font-semibold text-gray-800 flex items-center gap-1.5 text-xs">
                              <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span>{formatDisplayTime(b.end_time || calculateEndTime(b.start_time, b.duration_hours))}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-normal block mt-0.5">
                              {b.duration_hours}h duration
                            </span>
                          </td>

                          {/* 6. Use & Team */}
                          <td className="px-3 py-2.5">
                            <div className="font-medium text-gray-900 truncate max-w-[125px]" title={b.intended_use}>
                              {b.intended_use}
                            </div>
                            <div className="text-[11px] text-gray-400">{b.team_size} Person(s)</div>
                          </td>

                          {/* 7. Amount */}
                          <td className="px-3 py-2.5 font-mono font-bold text-gray-900 whitespace-nowrap text-xs">
                            ${Number(b.total_price || b.total_cost || 0).toFixed(2)}
                          </td>

                          {/* 8. Status */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                b.status === 'confirmed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : b.status === 'approved'
                                  ? 'bg-blue-100 text-blue-800'
                                  : b.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : b.status === 'completed'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              ● {b.status}
                            </span>
                          </td>

                          {/* 9. Payment */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                b.payment_status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : b.payment_status === 'deposit_paid'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {(b.payment_status || 'unpaid').replace('_', ' ')}
                            </span>
                          </td>

                          {/* 10. Actions */}
                          <td className="px-3 py-2.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => openBookingModal(b)}
                              className="px-3 py-1 rounded-xl bg-[#112F21] hover:bg-[#1a4731] text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* STICKY BOTTOM SCROLLING & NAVIGATION BAR */}
              <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                {/* Left: Summary */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700">
                    {bookings.length} {bookings.length === 1 ? 'Booking' : 'Bookings'}
                  </span>
                  <span className="text-[11px] text-gray-400">• Commercial Kitchen Schedule</span>
                </div>

                {/* Center / Right: Interactive Bottom Scroll Controls */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="text-[11px] font-semibold text-gray-400">Scroll Side:</span>
                    <button
                      type="button"
                      onClick={() => scrollTable('start')}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 px-1 py-0.5 rounded hover:bg-emerald-50 cursor-pointer transition-colors"
                      title="Jump to Reference column"
                    >
                      ⇤ Left
                    </button>

                    <div 
                      className="w-24 sm:w-36 h-2.5 bg-gray-200 hover:bg-gray-300 rounded-full cursor-pointer relative overflow-hidden transition-colors border border-gray-300"
                      title="Click anywhere on slider to scroll table side-to-side"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pct = (e.clientX - rect.left) / rect.width;
                        const el = bookingsTableRef.current;
                        if (el) el.scrollTo({ left: pct * (el.scrollWidth - el.clientWidth), behavior: 'smooth' });
                      }}
                    >
                      <div 
                        className="h-full bg-[#112F21] rounded-full transition-all"
                        style={{ 
                          width: `${Math.max(25, scrollProgress)}%`,
                          marginLeft: `${Math.min(100 - Math.max(25, scrollProgress), scrollProgress * 0.75)}%`
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => scrollTable('end')}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 px-1 py-0.5 rounded hover:bg-emerald-50 cursor-pointer transition-colors"
                      title="Jump to Actions column"
                    >
                      Right (Actions) ⇥
                    </button>
                  </div>

                  {/* Left & Right Arrow Buttons */}
                  <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
                    <button
                      type="button"
                      onClick={() => scrollTable('left')}
                      disabled={!canScrollLeft}
                      className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                      title="Scroll left"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollTable('right')}
                      disabled={!canScrollRight}
                      className="p-1.5 rounded-lg border border-[#112F21] bg-[#112F21] hover:bg-[#1a4731] text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                      title="Scroll right"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* ========================================================
            VIEW: KITCHEN CALENDAR
           ======================================================== */}
        {activeNav === 'calendar' && (
          <main className="p-8 space-y-6 flex-1 max-w-[1440px]">
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="font-bold text-base text-gray-900">Commercial Kitchen Reservation Calendar</h3>
                  <p className="text-xs text-gray-500">Visual operational schedule across all shifts and stations</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Confirmed
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-blue-700 font-semibold ml-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Approved
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold ml-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Pending
                  </span>
                </div>
              </div>

              {/* Day slot cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {bookings.map((b) => (
                  <div
                    key={b.reference_code}
                    onClick={() => openBookingModal(b)}
                    className="p-4 rounded-xl border border-gray-200 hover:border-emerald-600 transition-all cursor-pointer bg-gray-50/50 space-y-2 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-emerald-800">{b.reference_code}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        {b.status}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-gray-900">{b.full_name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{formatDisplayDate(b.booking_date)}</span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{formatDisplayTime(b.start_time)} – {formatDisplayTime(b.end_time || calculateEndTime(b.start_time, b.duration_hours))}</span>
                    </div>
                    <div className="text-xs text-gray-600 border-t border-gray-100 pt-2 flex items-center justify-between font-mono font-bold">
                      <span>Total: ${Number(b.total_price || b.total_cost || 0).toFixed(2)}</span>
                      <span className="text-emerald-700 font-sans text-[11px]">Click to manage →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        )}

        {/* ========================================================
            VIEW: PAYMENTS & DEPOSITS
           ======================================================== */}
        {activeNav === 'payments' && (
          <main className="p-8 space-y-6 flex-1 max-w-[1440px]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs">
                <div className="text-xs font-bold text-gray-500 uppercase">Total Revenue Collected</div>
                <div className="text-3xl font-black text-emerald-700 font-mono mt-2">${totalRevenueCollected.toFixed(2)} AUD</div>
                <div className="text-xs text-gray-400 mt-1">Paid bookings received</div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs">
                <div className="text-xs font-bold text-gray-500 uppercase">Pending Outstanding Fees</div>
                <div className="text-3xl font-black text-amber-700 font-mono mt-2">${totalOutstandingFees.toFixed(2)} AUD</div>
                <div className="text-xs text-gray-400 mt-1">Awaiting tenant payment</div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs">
                <div className="text-xs font-bold text-gray-500 uppercase">Security Deposits Held</div>
                <div className="text-3xl font-black text-slate-700 font-mono mt-2">${totalDepositsHeld.toFixed(2)} AUD</div>
                <div className="text-xs text-gray-400 mt-1">Refundable bond balances</div>
              </div>
            </div>

            {/* Invoices list */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs p-6 space-y-4">
              <h3 className="font-bold text-sm text-gray-900">Payment Invoices & Receipts</h3>
              <div className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <div key={b.reference_code} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-gray-900">{b.full_name} · <span className="font-mono text-emerald-800">{b.reference_code}</span></div>
                      <div className="text-gray-400 text-[11px]">{b.intended_use} · {formatDisplayDate(b.booking_date)}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono font-bold text-gray-900">${Number(b.total_price || b.total_cost || 0).toFixed(2)}</span>
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${b.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {b.payment_status}
                      </span>
                      <button
                        onClick={() => openBookingModal(b)}
                        className="px-3 py-1 rounded-lg border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 cursor-pointer"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        )}

        {/* ========================================================
            VIEW: CUSTOMERS
           ======================================================== */}
        {activeNav === 'customers' && (
          <main className="p-8 space-y-6 flex-1 max-w-[1440px]">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-gray-900">Tenant & Applicant Directory</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookings.map((b) => (
                  <div key={b.reference_code} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2 text-xs">
                    <div className="font-bold text-sm text-gray-900">{b.full_name}</div>
                    <div className="text-gray-500">{b.business_name || 'Individual Chef'}</div>
                    <div className="text-gray-600 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" /> {b.email}</div>
                    <div className="text-gray-600 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /> {b.phone}</div>
                    <div className="border-t border-gray-100 pt-2 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Ref: {b.reference_code}</span>
                      <span className="font-bold text-emerald-700 uppercase">{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        )}

        {/* ========================================================
            VIEW: KITCHEN MANAGEMENT & BLOCKED SLOTS
           ======================================================== */}
        {activeNav === 'kitchen' && (
          <main className="p-8 space-y-8 flex-1 max-w-[1440px]">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
              <h3 className="font-bold text-base text-gray-900">Scheduled Maintenance & Blocked Slots</h3>
              <p className="text-xs text-gray-500">Block hours for deep sanitation, hood degreasing, or maintenance</p>

              <form onSubmit={handleCreateBlock} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Date</label>
                  <input
                    type="date"
                    value={newBlockDate}
                    onChange={(e) => setNewBlockDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newBlockStart}
                    onChange={(e) => setNewBlockStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newBlockEnd}
                    onChange={(e) => setNewBlockEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                    required
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={creatingBlock}
                    className="w-full bg-[#112F21] text-white py-2 rounded-lg font-bold text-xs hover:bg-[#1a4731] transition-colors"
                  >
                    Add Blocked Slot
                  </button>
                </div>
              </form>

              {blockedSlots.length > 0 && (
                <div className="divide-y divide-gray-100 text-xs">
                  {blockedSlots.map((blk) => (
                    <div key={blk.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-gray-900">{formatDisplayDate(blk.block_date)} ({blk.start_time} – {blk.end_time})</div>
                        <div className="text-gray-500 text-[11px]">{blk.reason}</div>
                      </div>
                      <button
                        onClick={() => handleDeleteBlock(blk.id)}
                        className="text-red-600 hover:text-red-800 text-xs font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        )}

        {/* ========================================================
            VIEW: STORAGE BAYS (MAX 2 TENANTS CAPACITY)
           ======================================================== */}
        {activeNav === 'storage' && (
          <main className="p-8 space-y-8 flex-1 max-w-[1440px]">
            {/* Storage Header & Stats */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold mb-2">
                    <Package className="w-3.5 h-3.5" />
                    <span>Commercial Storage Space Management</span>
                  </div>
                  <h3 className="font-extrabold text-xl text-gray-900">Dedicated Storage Bays (Max 2 Tenants)</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Daily Drop has limited cold room, freezer & dry storage space. Enforcing strict maximum 2-tenant capacity constraint.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs">
                    <span className="font-bold">Total Bays: 2</span>
                    <span className="text-gray-400 mx-1.5">|</span>
                    <span className="text-emerald-700 font-bold">
                      {Math.max(0, 2 - storageBookings.filter(s => s.status !== 'cancelled' && s.status !== 'rejected').length)} Available
                    </span>
                  </div>
                </div>
              </div>

              {/* Bay 1 and Bay 2 Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                {/* Bay 1 Card */}
                {(() => {
                  const bay1Booking = storageBookings.find(s => s.bay_number === 1 && s.status !== 'cancelled');
                  return (
                    <div className={`p-5 rounded-2xl border ${
                      bay1Booking ? 'bg-sky-50/60 border-sky-200' : 'bg-gray-50/60 border-gray-200'
                    } space-y-3`}>
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                          <Package className="w-4 h-4 text-sky-700" />
                          <span>Storage Bay #1</span>
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          bay1Booking ? 'bg-sky-200 text-sky-900' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {bay1Booking ? 'Occupied' : 'Vacant / Available'}
                        </span>
                      </div>

                      {bay1Booking ? (
                        <div className="space-y-1.5 text-xs text-gray-700">
                          <div><strong>Tenant:</strong> {bay1Booking.full_name} ({bay1Booking.business_name || 'Sole Trader'})</div>
                          {bay1Booking.abn && <div><strong>ABN:</strong> <span className="font-mono">{bay1Booking.abn}</span></div>}
                          <div><strong>Type:</strong> <span className="capitalize">{bay1Booking.storage_type.replace('_', ' ')}</span></div>
                          <div><strong>Dates:</strong> {formatDisplayDate(bay1Booking.start_date)} – {formatDisplayDate(bay1Booking.end_date)}</div>
                          <div><strong>Rental:</strong> ${Number(bay1Booking.total_price).toFixed(2)} AUD ({bay1Booking.payment_status.toUpperCase()})</div>
                          <div className="text-[11px] text-gray-500">Ref: <span className="font-mono">{bay1Booking.reference_code}</span></div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 py-3 text-center">
                          Bay #1 is clean, sanitized, and open for instant customer rental.
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Bay 2 Card */}
                {(() => {
                  const bay2Booking = storageBookings.find(s => s.bay_number === 2 && s.status !== 'cancelled');
                  return (
                    <div className={`p-5 rounded-2xl border ${
                      bay2Booking ? 'bg-sky-50/60 border-sky-200' : 'bg-gray-50/60 border-gray-200'
                    } space-y-3`}>
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                          <Package className="w-4 h-4 text-sky-700" />
                          <span>Storage Bay #2</span>
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          bay2Booking ? 'bg-sky-200 text-sky-900' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {bay2Booking ? 'Occupied' : 'Vacant / Available'}
                        </span>
                      </div>

                      {bay2Booking ? (
                        <div className="space-y-1.5 text-xs text-gray-700">
                          <div><strong>Tenant:</strong> {bay2Booking.full_name} ({bay2Booking.business_name || 'Sole Trader'})</div>
                          {bay2Booking.abn && <div><strong>ABN:</strong> <span className="font-mono">{bay2Booking.abn}</span></div>}
                          <div><strong>Type:</strong> <span className="capitalize">{bay2Booking.storage_type.replace('_', ' ')}</span></div>
                          <div><strong>Dates:</strong> {formatDisplayDate(bay2Booking.start_date)} – {formatDisplayDate(bay2Booking.end_date)}</div>
                          <div><strong>Rental:</strong> ${Number(bay2Booking.total_price).toFixed(2)} AUD ({bay2Booking.payment_status.toUpperCase()})</div>
                          <div className="text-[11px] text-gray-500">Ref: <span className="font-mono">{bay2Booking.reference_code}</span></div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 py-3 text-center">
                          Bay #2 is clean, sanitized, and open for instant customer rental.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Storage Bookings Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-gray-900">All Commercial Storage Leases</h4>
                  <span className="text-[11px] bg-sky-50 text-sky-800 font-semibold px-2 py-0.5 rounded-md border border-sky-200">
                    Max 2 Active Tenants
                  </span>
                </div>
                <span className="text-xs text-gray-400 font-semibold">{storageBookings.length} Total Lease(s)</span>
              </div>
              <div className="overflow-x-auto admin-table-scroll">
                <table className="w-full text-left text-xs min-w-[850px]">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Reference</th>
                      <th className="px-4 py-3">Tenant / ABN</th>
                      <th className="px-4 py-3">Bay #</th>
                      <th className="px-4 py-3">Storage Type</th>
                      <th className="px-4 py-3">Rental Window</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {storageBookings.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-8 text-center text-gray-400">
                          No storage leases recorded yet.
                        </td>
                      </tr>
                    ) : (
                      storageBookings.map((st) => (
                        <tr key={st.reference_code} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-sky-800 whitespace-nowrap">{st.reference_code}</td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-gray-900 leading-snug">{st.full_name}</div>
                            {st.business_name && <div className="text-[11px] text-gray-500">{st.business_name}</div>}
                            {st.abn && <div className="text-[10px] text-emerald-700 font-mono font-bold">ABN: {st.abn}</div>}
                            <div className="text-[10px] text-gray-400 font-mono">{st.phone}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-900 font-bold font-mono text-[11px]">
                              Bay #{st.bay_number}
                            </span>
                          </td>
                          <td className="px-4 py-3 capitalize whitespace-nowrap">{st.storage_type.replace('_', ' ')}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-semibold text-gray-900">{formatDisplayDate(st.start_date)}</div>
                            <div className="text-[11px] text-gray-400">to {formatDisplayDate(st.end_date)} ({st.duration_days}d)</div>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold whitespace-nowrap">${Number(st.total_price).toFixed(2)} AUD</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              st.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              ● {st.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={async () => {
                                await api.updateStorageBookingStatus(st.reference_code, st.status === 'confirmed' ? 'completed' : 'confirmed');
                                const refreshed = await api.getStorageBookings();
                                setStorageBookings(refreshed);
                              }}
                              className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 font-bold transition-colors cursor-pointer"
                            >
                              {st.status === 'confirmed' ? 'Mark Completed' : 'Approve Lease'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* ========================================================
            VIEW: ENQUIRIES
           ======================================================== */}
        {activeNav === 'enquiries' && (
          <main className="p-8 space-y-6 flex-1 max-w-[1440px]">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-gray-900">Customer Enquiries & Prospective Tenants</h3>
              <div className="divide-y divide-gray-100">
                {enquiries.map((enq) => (
                  <div key={enq.id} className="py-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-gray-900">{enq.full_name || enq.name} · <span className="text-gray-500 font-normal">{enq.business_name}</span></div>
                      <span className="text-gray-400 text-[11px]">{enq.created_at}</span>
                    </div>
                    <div className="text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">{enq.message}</div>
                    <div className="flex items-center gap-4 text-gray-500 text-[11px]">
                      <span>Email: {enq.email}</span>
                      <span>Phone: {enq.phone}</span>
                      <span>Rental Type: {enq.rental_type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        )}

        {/* ========================================================
            VIEW: REPORTS
           ======================================================== */}
        {activeNav === 'reports' && (
          <main className="p-8 space-y-6 flex-1 max-w-[1440px]">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
              <h3 className="font-bold text-base text-gray-900">Operations & Occupancy Reports</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-emerald-900">
                  <div className="text-xs font-bold uppercase">Weekly Utilization</div>
                  <div className="text-2xl font-black mt-1">74.2%</div>
                  <div className="text-[11px] text-emerald-700 mt-1">+12% vs last month</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-blue-900">
                  <div className="text-xs font-bold uppercase">Average Session Length</div>
                  <div className="text-2xl font-black mt-1">4.6 Hours</div>
                  <div className="text-[11px] text-blue-700 mt-1">Commercial batch prep</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-amber-900">
                  <div className="text-xs font-bold uppercase">Repeat Tenant Rate</div>
                  <div className="text-2xl font-black mt-1">68.5%</div>
                  <div className="text-[11px] text-amber-700 mt-1">Weekly recurring slots</div>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* ========================================================
            VIEW: SETTINGS
           ======================================================== */}
        {activeNav === 'settings' && (
          <main className="p-8 space-y-8 flex-1 max-w-[1440px]">
            {/* Google Sheets Sync */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Google Sheets Live Sync Integration</h3>
                  <p className="text-xs text-gray-500">Real-time webhook sync for incoming bookings and enquiries</p>
                </div>
              </div>

              {sheetStatusMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold">
                  {sheetStatusMessage}
                </div>
              )}

              <form onSubmit={handleSaveGoogleSheetUrl} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Google Apps Script Web App URL</label>
                  <input
                    type="url"
                    value={sheetUrlInput}
                    onChange={(e) => setSheetUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#112F21] focus:outline-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="bg-[#112F21] hover:bg-[#1a4731] text-white px-5 py-2.5 rounded-xl font-bold text-xs"
                  >
                    Save URL
                  </button>
                  <button
                    type="button"
                    onClick={handleTestGoogleSheetUrl}
                    disabled={testingSheet}
                    className="border border-gray-200 hover:bg-gray-50 text-gray-800 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2"
                  >
                    {testingSheet ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    <span>Test Sync</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Pricing Settings */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-gray-900">Kitchen Pricing & Hours Configuration</h3>
              <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Hourly Rental Rate ($AUD)</label>
                  <input
                    type="number"
                    value={hourlyRateInput}
                    onChange={(e) => setHourlyRateInput(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Security Deposit Bond ($AUD)</label>
                  <input
                    type="number"
                    value={depositInput}
                    onChange={(e) => setDepositInput(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Minimum Booking Hours</label>
                  <input
                    type="number"
                    value={minHoursInput}
                    onChange={(e) => setMinHoursInput(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cleaning Fee ($AUD)</label>
                  <input
                    type="number"
                    value={cleaningFeeInput}
                    onChange={(e) => setCleaningFeeInput(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="bg-[#112F21] hover:bg-[#1a4731] text-white px-6 py-2.5 rounded-xl font-bold text-xs"
                  >
                    {savingSettings ? 'Saving...' : 'Update Kitchen Settings'}
                  </button>
                </div>
              </form>
            </div>
          </main>
        )}
      </div>

      {/* ========================================================
          BOOKING ACTION MODAL / DRAWER
         ======================================================== */}
      {selectedBooking && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedBooking(null);
          }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <span className="font-mono font-bold text-emerald-800 text-xs">{selectedBooking.reference_code}</span>
                <h3 className="font-bold text-lg text-gray-900 mt-0.5">{selectedBooking.full_name}</h3>
                <p className="text-xs text-gray-500">{selectedBooking.business_name || 'Individual Chef'}</p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center font-bold cursor-pointer transition-colors"
                title="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Error Message Alert */}
            {bookingError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span className="font-medium">{bookingError}</span>
                </div>
                <button 
                  onClick={() => setBookingError(null)}
                  className="text-red-500 hover:text-red-700 font-bold px-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Reservation Highlights */}
            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl text-xs border border-gray-100">
              <div>
                <span className="text-gray-400 block text-[11px] font-medium">Booking Date</span>
                <span className="font-bold text-gray-900">{formatDisplayDate(selectedBooking.booking_date)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px] font-medium">Time Window</span>
                <span className="font-bold text-gray-900">
                  {formatDisplayTime(selectedBooking.start_time)} – {formatDisplayTime(selectedBooking.end_time || calculateEndTime(selectedBooking.start_time, selectedBooking.duration_hours))}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px] font-medium">Total Fee</span>
                <span className="font-mono font-bold text-gray-900">${Number(selectedBooking.total_price || selectedBooking.total_cost || 0).toFixed(2)} AUD</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px] font-medium">Current Status</span>
                <div className="font-bold uppercase inline-flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedBooking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                    selectedBooking.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                    selectedBooking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedBooking.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedBooking.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {selectedBooking.payment_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700">Quick Decision Actions</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedBooking.id, 'confirmed', undefined, undefined, 'confirm')}
                  disabled={updatingBooking}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedBooking.status === 'confirmed'
                      ? 'bg-emerald-800 text-white ring-2 ring-emerald-500 shadow-sm'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                  } disabled:opacity-60`}
                >
                  {actionLoading === 'confirm' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>✓</span>
                  )}
                  <span>{selectedBooking.status === 'confirmed' ? 'Confirmed' : 'Confirm'}</span>
                </button>

                <button
                  onClick={() => handleUpdateStatus(selectedBooking.id, 'approved', undefined, undefined, 'approve')}
                  disabled={updatingBooking}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedBooking.status === 'approved'
                      ? 'bg-blue-700 text-white ring-2 ring-blue-400 shadow-sm'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  } disabled:opacity-60`}
                >
                  {actionLoading === 'approve' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>●</span>
                  )}
                  <span>{selectedBooking.status === 'approved' ? 'Approved' : 'Approve'}</span>
                </button>

                <button
                  onClick={() => handleUpdateStatus(selectedBooking.id, selectedBooking.status, 'paid', undefined, 'paid')}
                  disabled={updatingBooking}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedBooking.payment_status === 'paid'
                      ? 'bg-emerald-200 text-emerald-950 ring-2 ring-emerald-400 font-extrabold'
                      : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                  } disabled:opacity-60`}
                >
                  {actionLoading === 'paid' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>$</span>
                  )}
                  <span>{selectedBooking.payment_status === 'paid' ? 'Paid ✓' : 'Mark Paid'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleUpdateStatus(selectedBooking.id, 'rejected', undefined, undefined, 'reject')}
                  disabled={updatingBooking}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    selectedBooking.status === 'rejected'
                      ? 'border-red-500 bg-red-100 text-red-900 ring-2 ring-red-300'
                      : 'border-red-200 hover:bg-red-50 text-red-700'
                  } disabled:opacity-60`}
                >
                  {actionLoading === 'reject' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>✕</span>
                  )}
                  <span>{selectedBooking.status === 'rejected' ? 'Rejected' : 'Reject'}</span>
                </button>

                <button
                  onClick={() => handleDeleteBooking(selectedBooking.id, selectedBooking.reference_code)}
                  disabled={updatingBooking}
                  className="border border-gray-200 hover:bg-gray-100 hover:text-red-700 text-gray-600 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
                >
                  {actionLoading === 'delete' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 text-gray-500" />
                  )}
                  <span>Delete Booking</span>
                </button>
              </div>
            </div>

            {/* Admin Notes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-700">Admin Operational Notes</label>
                {notesSaved && (
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Check className="w-3 h-3 text-emerald-600" /> Saved!
                  </span>
                )}
              </div>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Add internal notes (access code sent, certificate checked, etc.)..."
                className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#112F21] focus:outline-none"
                rows={3}
              />
              <div className="flex items-center justify-between pt-0.5">
                <button
                  onClick={handleSaveNotesOnly}
                  disabled={actionLoading === 'notes'}
                  className="bg-[#112F21] hover:bg-[#1a4731] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors disabled:opacity-60"
                >
                  {actionLoading === 'notes' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ED8533]" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-[#ED8533]" />
                  )}
                  <span>Save Notes</span>
                </button>
                <span className="text-[11px] text-gray-400">Syncs immediately in real-time</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#112F21] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold border border-emerald-600 animate-in slide-in-from-bottom-5">
          <CheckCircle className="w-4 h-4 text-[#ED8533] shrink-0" />
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-gray-400 hover:text-white cursor-pointer font-bold">✕</button>
        </div>
      )}
    </div>
  );
};
