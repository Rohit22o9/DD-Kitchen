import React, { useState, useEffect } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { 
  Booking, 
  DashboardStats, 
  KitchenConfig, 
  BlockedSlot, 
  Enquiry 
} from '../types';
import { api, getGoogleSheetUrl, setGoogleSheetUrl } from '../services/api';

interface AdminDashboardProps {
  onBackToSite: () => void;
  onConfigUpdated: (config: KitchenConfig) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToSite, onConfigUpdated }) => {
  // Auth state
  const [token, setToken] = useState<string | null>(localStorage.getItem('dd_admin_token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Google Sheets state
  const [sheetUrlInput, setSheetUrlInput] = useState(getGoogleSheetUrl());
  const [testingSheet, setTestingSheet] = useState(false);
  const [sheetStatusMessage, setSheetStatusMessage] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'bookings' | 'settings' | 'blocked' | 'enquiries'>('bookings');

  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Settings state
  const [config, setConfig] = useState<KitchenConfig | null>(null);
  const [hourlyRateInput, setHourlyRateInput] = useState('45.0');
  const [minHoursInput, setMinHoursInput] = useState('2');
  const [opStartInput, setOpStartInput] = useState('06:00');
  const [opEndInput, setOpEndInput] = useState('23:00');
  const [cleaningFeeInput, setCleaningFeeInput] = useState('25.0');
  const [depositInput, setDepositInput] = useState('150.0');
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
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  // Selected Booking for Modal / Quick Action
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [updatingBooking, setUpdatingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Initial load when token is present
  useEffect(() => {
    if (token) {
      loadAllData(token);
    }
  }, [token]);

  const loadAllData = async (jwtToken: string) => {
    try {
      const [s, b, c, blk, enq] = await Promise.all([
        api.getDashboardStats(jwtToken),
        api.getAdminBookings(jwtToken),
        api.getConfig(),
        api.getBlockedSlots(jwtToken),
        api.getAdminEnquiries(jwtToken),
      ]);
      setStats(s);
      setBookings(b);
      setConfig(c);
      setHourlyRateInput(String(c.hourly_rental_rate));
      setMinHoursInput(String(c.min_rental_hours));
      setOpStartInput(c.operating_hours_start);
      setOpEndInput(c.operating_hours_end);
      setCleaningFeeInput(String(c.cleaning_fee));
      setDepositInput(String(c.security_deposit));
      setBlockedSlots(blk);
      setEnquiries(enq);
    } catch (err: any) {
      if (err.message?.includes('401') || err.message?.includes('Invalid')) {
        handleLogout();
      }
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
    newPayment?: string
  ) => {
    if (!token) return;
    setUpdatingBooking(true);
    setBookingError(null);
    try {
      const updated = await api.updateBookingStatus(token, bookingId, {
        status: newStatus,
        payment_status: newPayment,
        admin_notes: actionNotes.trim() || undefined,
      });
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      setSelectedBooking(null);
      setActionNotes('');
      // Refresh stats
      const s = await api.getDashboardStats(token);
      setStats(s);
    } catch (err: any) {
      setBookingError(err.message || 'Failed to update booking status');
    } finally {
      setUpdatingBooking(false);
    }
  };

  // Save Settings
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

  // Google Sheet Webhook Handlers
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
          message: 'Real-time webhook sync test from Admin Dashboard. Your Google Sheet is now active and receiving live website submissions!'
        })
      });
      setSheetStatusMessage('Connection successful! A test row (' + testRef + ') was sent to your Google Sheet Enquiries tab.');
      if (token) {
        loadAllData(token);
      }
    } catch (err: any) {
      setSheetStatusMessage('Error connecting to Google Sheet: ' + (err.message || 'Check URL permissions.'));
    } finally {
      setTestingSheet(false);
    }
  };

  // Add Blocked Slot
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

  // Delete Blocked Slot
  const handleDeleteBlock = async (id: number) => {
    if (!token || !confirm('Remove this maintenance block?')) return;
    try {
      await api.deleteBlockedSlot(token, id);
      setBlockedSlots(blockedSlots.filter((b) => b.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error deleting block');
    }
  };

  // Login View
  if (!token) {
    return (
      <div className="min-h-screen bg-brand-cream/60 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-brand-mint-border shadow-soft-lg">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-brand-forest text-white flex items-center justify-center mx-auto mb-3 shadow-soft-sm">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-extrabold text-brand-dark">Daily Drop Admin Portal</h2>
            <p className="text-xs text-brand-muted mt-1">
              Secure access for kitchen facility managers and staff
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-brand-dark focus:ring-2 focus:ring-brand-forest focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-brand-dark focus:ring-2 focus:ring-brand-forest focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-brand-forest hover:bg-brand-forest-light text-white py-3 rounded-xl font-bold text-xs sm:text-sm shadow-soft transition-all flex items-center justify-center space-x-2"
            >
              {loggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In to Admin Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Hint */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <span className="text-[11px] font-bold text-brand-muted uppercase tracking-wider">
              Default Credentials
            </span>
            <p className="text-xs text-brand-dark mt-1 font-mono bg-brand-mint/40 p-2 rounded-lg">
              admin / admin123
            </p>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={onBackToSite}
              className="text-xs text-brand-muted hover:text-brand-dark flex items-center justify-center space-x-1 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Website</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard Main View
  return (
    <div className="min-h-screen bg-brand-cream/40">
      
      {/* Top Admin Nav */}
      <div className="bg-brand-forest-dark text-white border-b border-brand-forest">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            <div className="flex items-center space-x-4">
              <button
                onClick={onBackToSite}
                className="text-xs text-gray-300 hover:text-white flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white/10"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Exit Admin</span>
              </button>

              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-brand-orange" />
                <span className="font-extrabold text-sm tracking-wide">Daily Drop Kitchen Operations</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-300 hidden sm:inline">
                Logged in as <strong className="text-white">Admin</strong>
              </span>

              <button
                onClick={handleLogout}
                className="text-xs text-red-300 hover:text-red-100 flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-900/60"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* KPI Metric Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white p-4 rounded-2xl border border-brand-mint-border shadow-soft-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">Total Requests</span>
              <div className="text-2xl font-black text-brand-dark mt-1">{stats.total_bookings}</div>
              <span className="text-[10px] text-brand-muted">{stats.total_hours_booked} Hours Total</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-soft-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Pending Review</span>
              <div className="text-2xl font-black text-amber-700 mt-1">{stats.pending_requests}</div>
              <span className="text-[10px] text-amber-700">Awaiting approval</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/30 shadow-soft-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">Approved</span>
              <div className="text-2xl font-black text-blue-700 mt-1">{stats.approved_count}</div>
              <span className="text-[10px] text-blue-700">Awaiting payment</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-soft-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Confirmed</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">{stats.confirmed_count}</div>
              <span className="text-[10px] text-emerald-700">Ready for check-in</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-brand-mint-border shadow-soft-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">Confirmed Rev.</span>
              <div className="text-2xl font-black text-brand-forest mt-1">${stats.total_confirmed_revenue}</div>
              <span className="text-[10px] text-brand-muted">+${stats.pipeline_revenue} pipeline</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-brand-mint-border shadow-soft-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">Enquiries</span>
              <div className="text-2xl font-black text-brand-dark mt-1">{stats.total_enquiries}</div>
              <span className="text-[10px] text-brand-orange font-bold">{stats.new_enquiries} New</span>
            </div>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex border-b border-brand-mint-border space-x-6 mb-6">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'bookings'
                ? 'border-brand-forest text-brand-forest'
                : 'border-transparent text-brand-muted hover:text-brand-dark'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Booking Requests & Reservations</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'settings'
                ? 'border-brand-forest text-brand-forest'
                : 'border-transparent text-brand-muted hover:text-brand-dark'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Kitchen & Pricing Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('blocked')}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'blocked'
                ? 'border-brand-forest text-brand-forest'
                : 'border-transparent text-brand-muted hover:text-brand-dark'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Maintenance & Blocked Slots</span>
          </button>

          <button
            onClick={() => setActiveTab('enquiries')}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'enquiries'
                ? 'border-brand-forest text-brand-forest'
                : 'border-transparent text-brand-muted hover:text-brand-dark'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Customer Enquiries</span>
          </button>
        </div>

        {/* TAB 1: BOOKINGS LIST */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            
            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-brand-mint-border flex flex-col sm:flex-row gap-4 items-center justify-between shadow-soft-sm">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {['all', 'pending', 'approved', 'confirmed', 'completed', 'rejected'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      statusFilter === st
                        ? 'bg-brand-forest text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search name, brand, ref code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-forest focus:outline-none"
                />
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-2xl border border-brand-mint-border overflow-hidden shadow-soft-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-brand-muted uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Reference</th>
                      <th className="px-5 py-3.5">Applicant / Brand</th>
                      <th className="px-5 py-3.5">Session Window</th>
                      <th className="px-5 py-3.5">Use & Team</th>
                      <th className="px-5 py-3.5">Amount</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Payment</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loadingBookings ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-8 text-center text-brand-muted">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-forest" />
                          <p className="mt-2 text-xs">Loading reservations...</p>
                        </td>
                      </tr>
                    ) : bookings.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-8 text-center text-brand-muted">
                          No booking requests match the current filters.
                        </td>
                      </tr>
                    ) : (
                      bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-brand-cream/30 transition-colors">
                          <td className="px-5 py-4 font-mono font-bold text-brand-forest">
                            {b.reference_code}
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-bold text-brand-dark">{b.full_name}</div>
                            {b.business_name && (
                              <div className="text-brand-muted text-[11px]">{b.business_name}</div>
                            )}
                            <div className="text-[11px] text-gray-400">{b.phone}</div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-bold text-brand-dark">{b.booking_date}</div>
                            <div className="text-[11px] text-brand-muted">
                              {b.start_time} – {b.end_time} ({b.duration_hours}h)
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-medium text-brand-dark truncate max-w-[150px]">
                              {b.intended_use}
                            </div>
                            <div className="text-[11px] text-brand-muted">{b.team_size} Person(s)</div>
                          </td>

                          <td className="px-5 py-4 font-mono font-bold text-brand-dark">
                            ${b.total_price.toFixed(2)}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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

                          <td className="px-5 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                b.payment_status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : b.payment_status === 'deposit_paid'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {b.payment_status.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedBooking(b);
                                setActionNotes(b.admin_notes || '');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-brand-forest hover:bg-brand-forest-light text-white font-bold text-[11px] transition-colors"
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
            </div>

          </div>
        )}

        {/* TAB 2: SETTINGS & PRICING */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Card 1: Kitchen Rates & Operational Hours */}
            <div className="bg-white rounded-2xl border border-brand-mint-border p-7 shadow-soft-sm">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                <div>
                  <h3 className="text-lg font-extrabold text-brand-dark">Kitchen & Hourly Rate Configuration</h3>
                  <p className="text-xs text-brand-muted mt-0.5">
                    Update live rental rates, minimum session duration, and operating hours.
                  </p>
                </div>
                <Settings className="w-5 h-5 text-brand-forest" />
              </div>

              {settingsSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2 mb-4">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Settings updated successfully! Changes are live across the public site.</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1">
                      Base Hourly Rate (AUD)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={hourlyRateInput}
                      onChange={(e) => setHourlyRateInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-brand-dark font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1">
                      Minimum Rental Hours
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      required
                      value={minHoursInput}
                      onChange={(e) => setMinHoursInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-brand-dark font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1">
                      Operating Hours Start
                    </label>
                    <input
                      type="text"
                      required
                      value={opStartInput}
                      onChange={(e) => setOpStartInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-brand-dark font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1">
                      Operating Hours End
                    </label>
                    <input
                      type="text"
                      required
                      value={opEndInput}
                      onChange={(e) => setOpEndInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-brand-dark font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1">
                      Sanitization Cleaning Fee (AUD)
                    </label>
                    <input
                      type="number"
                      step="1"
                      required
                      value={cleaningFeeInput}
                      onChange={(e) => setCleaningFeeInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-brand-dark font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1">
                      Security Deposit Bond (AUD)
                    </label>
                    <input
                      type="number"
                      step="10"
                      required
                      value={depositInput}
                      onChange={(e) => setDepositInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-brand-dark font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full bg-brand-forest hover:bg-brand-forest-light text-white py-3 rounded-xl font-bold text-xs sm:text-sm shadow-soft transition-all"
                >
                  {savingSettings ? 'Saving Settings...' : 'Save Configuration'}
                </button>
              </form>
            </div>

            {/* Card 2: Google Sheets Live Sync & Webhook Configuration */}
            <div className="bg-white rounded-2xl border border-brand-mint-border p-7 shadow-soft-sm">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                <div>
                  <h3 className="text-lg font-extrabold text-brand-dark">Google Sheets Real-Time Sync</h3>
                  <p className="text-xs text-brand-muted mt-0.5">
                    Connect your Google Sheet to receive live bookings and enquiries in real-time.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-200 mb-5">
                <div className="flex items-center space-x-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${sheetUrlInput.trim() ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="text-xs font-bold text-brand-dark">
                    {sheetUrlInput.trim() ? 'Live Google Sheet Connected' : 'Google Sheet Not Configured'}
                  </span>
                </div>
                {sheetUrlInput.trim() && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>

              {sheetStatusMessage && (
                <div className="p-3.5 rounded-xl bg-brand-mint/40 border border-brand-mint-border text-brand-dark text-xs flex items-center space-x-2 mb-4">
                  <Check className="w-4 h-4 text-brand-forest shrink-0" />
                  <span>{sheetStatusMessage}</span>
                </div>
              )}

              <form onSubmit={handleSaveGoogleSheetUrl} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1">
                    Google Apps Script Web App URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    value={sheetUrlInput}
                    onChange={(e) => setSheetUrlInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-brand-dark font-mono placeholder:font-sans placeholder:text-gray-400"
                  />
                  <p className="text-[11px] text-brand-muted mt-1.5 leading-relaxed">
                    Deploy your sheet script as a <strong>Web app</strong> set to <em>"Anyone"</em> access. Submissions on the website instantly append rows to your Google Sheet!
                  </p>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-brand-forest hover:bg-brand-forest-light text-white py-3 rounded-xl font-bold text-xs sm:text-sm shadow-soft transition-all"
                  >
                    Save Webhook URL
                  </button>
                  <button
                    type="button"
                    onClick={handleTestGoogleSheetUrl}
                    disabled={testingSheet || !sheetUrlInput.trim()}
                    className="px-5 py-3 rounded-xl border border-brand-forest text-brand-forest hover:bg-brand-mint/30 font-bold text-xs sm:text-sm transition-all disabled:opacity-40 flex items-center justify-center space-x-1.5"
                  >
                    {testingSheet ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Testing...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Send Test Row</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Quick Setup Instructions */}
              <div className="mt-6 pt-5 border-t border-gray-100">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-dark mb-2.5 flex items-center space-x-1.5">
                  <span>How to Set Up Your Google Sheet (3 Minutes)</span>
                </h4>
                <ol className="text-xs text-brand-muted space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    Open a new Google Sheet at <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-brand-forest underline font-semibold inline-flex items-center">sheets.new <ExternalLink className="w-3 h-3 ml-0.5 inline" /></a>
                  </li>
                  <li>In the top menu, click <strong>Extensions &gt; Apps Script</strong>.</li>
                  <li>Replace any code with the contents of <code className="bg-gray-100 px-1 py-0.5 rounded text-brand-dark font-mono text-[11px]">google-apps-script.js</code> (found in project root).</li>
                  <li>Click <strong>Deploy &gt; New deployment</strong>, choose <strong>Web app</strong>, and set <em>"Who has access"</em> to <strong>Anyone</strong>.</li>
                  <li>Copy the resulting Web App URL and paste it into the box above!</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BLOCKED SLOTS / MAINTENANCE */}
        {activeTab === 'blocked' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Create Block Form */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-brand-mint-border p-6 shadow-soft-sm">
              <h3 className="text-base font-extrabold text-brand-dark mb-4">
                Schedule Maintenance Block
              </h3>

              <form onSubmit={handleCreateBlock} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-brand-dark mb-1 uppercase">Date</label>
                  <input
                    type="date"
                    required
                    value={newBlockDate}
                    onChange={(e) => setNewBlockDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-brand-dark mb-1 uppercase">Start</label>
                    <input
                      type="time"
                      required
                      value={newBlockStart}
                      onChange={(e) => setNewBlockStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brand-dark mb-1 uppercase">End</label>
                    <input
                      type="time"
                      required
                      value={newBlockEnd}
                      onChange={(e) => setNewBlockEnd(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-brand-dark mb-1 uppercase">Reason</label>
                  <input
                    type="text"
                    required
                    value={newBlockReason}
                    onChange={(e) => setNewBlockReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingBlock}
                  className="w-full bg-brand-forest hover:bg-brand-forest-light text-white py-2.5 rounded-xl font-bold transition-colors"
                >
                  {creatingBlock ? 'Adding Block...' : 'Block Kitchen Slot'}
                </button>
              </form>
            </div>

            {/* List of Blocked Slots */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-brand-mint-border p-6 shadow-soft-sm">
              <h3 className="text-base font-extrabold text-brand-dark mb-4">
                Scheduled Maintenance & Blocks
              </h3>

              {blockedSlots.length === 0 ? (
                <p className="text-xs text-brand-muted">No maintenance blocks scheduled.</p>
              ) : (
                <div className="space-y-3">
                  {blockedSlots.map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-brand-dark">
                          {b.block_date} ({b.start_time} – {b.end_time})
                        </div>
                        <div className="text-brand-muted text-[11px] mt-0.5">{b.reason}</div>
                      </div>
                      <button
                        onClick={() => handleDeleteBlock(b.id)}
                        className="text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-50"
                        title="Delete block"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: ENQUIRIES */}
        {activeTab === 'enquiries' && (
          <div className="bg-white rounded-2xl border border-brand-mint-border overflow-hidden shadow-soft-sm">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-brand-dark">Customer Enquiries</h3>
              <span className="text-xs text-brand-muted">{enquiries.length} Total Messages</span>
            </div>

            <div className="divide-y divide-gray-100">
              {enquiries.length === 0 ? (
                <div className="p-8 text-center text-xs text-brand-muted">No enquiries received yet.</div>
              ) : (
                enquiries.map((enq) => (
                  <div key={enq.id} className="p-5 hover:bg-gray-50 transition-colors text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-brand-dark">{enq.name}</span>
                        {enq.business_name && (
                          <span className="px-2 py-0.5 rounded-full bg-brand-mint text-brand-forest font-semibold text-[10px]">
                            {enq.business_name}
                          </span>
                        )}
                        <span className="text-gray-400">({enq.business_type})</span>
                      </div>
                      <span className="text-gray-400 text-[11px]">
                        {new Date(enq.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-brand-muted">
                      <span>Email: <strong>{enq.email}</strong></span>
                      <span>Phone: <strong>{enq.phone}</strong></span>
                      {enq.estimated_hours && <span>Needs: <strong>{enq.estimated_hours}</strong></span>}
                      <span>Registered in Vic Park: <strong className={enq.registered_in_victoria_park === 'Yes' ? 'text-emerald-700 font-bold' : 'text-gray-700'}>{enq.registered_in_victoria_park || 'No'}</strong></span>
                    </div>

                    <p className="bg-brand-cream/60 p-3 rounded-xl border border-brand-mint-border text-brand-dark leading-relaxed">
                      "{enq.message}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* Booking Management Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-brand-mint-border space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                  Manage Booking
                </span>
                <h4 className="text-lg font-black text-brand-forest font-mono">
                  {selectedBooking.reference_code}
                </h4>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-brand-dark text-xs"
              >
                Close
              </button>
            </div>

            {bookingError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {bookingError}
              </div>
            )}

            <div className="text-xs space-y-1.5 bg-gray-50 p-3.5 rounded-xl">
              <div><strong className="text-brand-dark">Applicant:</strong> {selectedBooking.full_name} ({selectedBooking.email}, {selectedBooking.phone})</div>
              <div><strong className="text-brand-dark">Date & Slot:</strong> {selectedBooking.booking_date} ({selectedBooking.start_time} - {selectedBooking.end_time})</div>
              <div><strong className="text-brand-dark">Intended Use:</strong> {selectedBooking.intended_use}</div>
              <div><strong className="text-brand-dark">Equipment:</strong> {selectedBooking.equipment_requirements || 'Standard'}</div>
              <div><strong className="text-brand-dark">Total Fee:</strong> ${selectedBooking.total_price.toFixed(2)} AUD</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1">
                Admin / Inspection Notes
              </label>
              <textarea
                rows={2}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Keycode provided, bond received, cleaning verification..."
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-forest focus:outline-none"
              />
            </div>

            <div className="space-y-2 pt-2">
              <span className="block text-xs font-bold text-brand-dark uppercase tracking-wider">
                Change Status:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedBooking.id, 'approved')}
                  className="py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  Approve Request
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedBooking.id, 'confirmed')}
                  className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  Confirm Slot
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedBooking.id, 'completed')}
                  className="py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                >
                  Mark Completed
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedBooking.id, selectedBooking.status, 'paid')}
                  className="py-2 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-brand-dark font-bold text-xs"
                >
                  Mark Paid
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedBooking.id, selectedBooking.status, 'deposit_paid')}
                  className="py-2 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-brand-dark font-bold text-xs"
                >
                  Deposit Paid
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedBooking.id, 'rejected')}
                  className="py-2 px-3 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 font-bold text-xs"
                >
                  Reject Request
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
