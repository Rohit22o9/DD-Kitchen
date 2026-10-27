import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  CreditCard, 
  Receipt, 
  ExternalLink, 
  ArrowRight, 
  Download, 
  FileText, 
  Sparkles, 
  Users, 
  ChefHat, 
  Flame, 
  HelpCircle, 
  Bell, 
  ChevronRight, 
  LayoutDashboard, 
  BookOpen, 
  RefreshCw, 
  ShieldCheck, 
  User, 
  LogOut,
  MapPin,
  Building,
  ArrowLeft,
  AlertCircle,
  Check,
  Search,
  Lock,
  Filter,
  Phone,
  Mail,
  Plus,
  X,
  FileCheck,
  AlertTriangle
} from 'lucide-react';
import { Images } from '../assets/images';
import { api } from '../services/api';
import { User as UserType } from '../types';

interface CustomerDashboardProps {
  onBackToSite: () => void;
  onGoToAdminPortal: () => void;
  onBookClick: () => void;
  onUserAuthChange?: (user: UserType | null) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  onBackToSite,
  onGoToAdminPortal,
  onBookClick,
  onUserAuthChange,
}) => {
  const [currentUser, setCurrentUser] = useState<UserType | null>(() => api.getCurrentUser());
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authBusiness, setAuthBusiness] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Payment instruction modal state
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentBooking, setPaymentBooking] = useState<any | null>(null);
  const [paymentCopied, setPaymentCopied] = useState(false);
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<string | null>(null);

  // Live user bookings from database & storage
  const [liveUserBookings, setLiveUserBookings] = useState<any[]>([]);

  const [activeNav, setActiveNav] = useState<
    'dashboard' | 'bookings' | 'payments' | 'recurring' | 'guidelines' | 'support' | 'account'
  >('dashboard');
  
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<any | null>(null);

  // Filter state for Bookings tab
  const [bookingFilterStatus, setBookingFilterStatus] = useState<string>('all');
  const [bookingSearch, setBookingSearch] = useState<string>('');

  // Support ticket form state
  const [supportSubmitted, setSupportSubmitted] = useState<boolean>(false);
  const [supportCategory, setSupportCategory] = useState<string>('maintenance');
  const [supportMessage, setSupportMessage] = useState<string>('');

  // Recurring form modal
  const [showRecurringModal, setShowRecurringModal] = useState<boolean>(false);
  const [recurringSubmitted, setRecurringSubmitted] = useState<boolean>(false);

  // Account profile state
  const [profileSaved, setProfileSaved] = useState<boolean>(false);
  const [chefName, setChefName] = useState<string>(() => currentUser?.full_name || 'Michael Davies');
  const [businessName, setBusinessName] = useState<string>(() => currentUser?.business_name || 'Perth Catering Co.');
  const [chefEmail, setChefEmail] = useState<string>(() => currentUser?.email || 'michael.davies@example.com');
  const [chefPhone, setChefPhone] = useState<string>(() => currentUser?.phone || '+61 412 345 678');
  const [abnNumber, setAbnNumber] = useState<string>('54 123 456 789');
  const [fssCert, setFssCert] = useState<string>('FSS-WA-2024-8891');

  // Payment mock state
  const [paidInvoices, setPaidInvoices] = useState<string[]>(['REC-918', 'REC-890', 'REC-855']);

  // Synchronize chef details when user logs in/out
  useEffect(() => {
    if (currentUser) {
      if (currentUser.full_name) setChefName(currentUser.full_name);
      if (currentUser.business_name) setBusinessName(currentUser.business_name);
      if (currentUser.email) setChefEmail(currentUser.email);
      if (currentUser.phone) setChefPhone(currentUser.phone);
    }
  }, [currentUser]);

  // Load bookings for current user
  useEffect(() => {
    async function loadBookings() {
      if (currentUser?.email) {
        try {
          const list = await api.getUserBookings(currentUser.email);
          if (list && list.length > 0) {
            setLiveUserBookings(list.map((b) => ({
              reference_code: b.reference_code,
              booking_date: b.booking_date,
              date_time: `${b.booking_date}, ${b.start_time} – ${b.end_time}`,
              intended_use: b.intended_use,
              status: b.status === 'pending_approval' ? 'pending' : b.status,
              payment_status: b.payment_status || 'unpaid',
              amount: b.total_price || b.total_cost || 167.20,
              duration: `${b.duration_hours} hours`,
              team: `${b.team_size || 2} Persons`,
              equipment: b.equipment_requirements || 'All-Inclusive Commercial Equipment',
              location: 'Unit 1, 1 Lichfield St, Victoria Park',
              duration_hours: b.duration_hours,
              team_size: b.team_size || 2,
              start_time: b.start_time,
              end_time: b.end_time,
              hourly_rate: b.hourly_rate || 38,
              cleaning_fee: b.cleaning_fee || 0,
              security_deposit: b.security_deposit || 750,
              total_price: b.total_price || 167.20,
            })));
          }
        } catch (e) {
          console.warn('Error fetching bookings:', e);
        }
      }
    }
    loadBookings();
  }, [currentUser]);

  // Mock primary booking
  const nextBooking = {
    reference_code: 'DD-BK-001',
    status: 'confirmed',
    payment_status: 'unpaid',
    intended_use: 'Corporate Luncheon Meal Prep',
    location: 'Victoria Park, Perth',
    booking_date: '2026-10-21',
    start_time: '18:30',
    end_time: '22:30',
    duration_hours: 4,
    team_size: 3,
    equipment_requirements: 'Combi oven, 6-burner range, Prep benches',
    total_price: 167.20,
    hourly_rate: 38.00,
    cleaning_fee: 0,
    security_deposit: 750,
  };

  const allBookings = [
    {
      date_time: 'Wed, 21 Oct 2026, 6:30 PM – 10:30 PM',
      booking_date: '2026-10-21',
      reference_code: 'DD-BK-001',
      intended_use: 'Corporate Luncheon Meal Prep',
      status: 'confirmed',
      payment_status: paidInvoices.includes('INV-001') ? 'paid' : 'unpaid',
      amount: 167.20,
      duration: '4 hours',
      team: '3 Persons',
      equipment: 'Combi oven, 6-burner range, Prep benches',
    },
    {
      date_time: 'Mon, 26 Oct 2026, 10:00 AM – 2:00 PM',
      booking_date: '2026-10-26',
      reference_code: 'DD-BK-003',
      intended_use: 'Cloud Kitchen Prep & Packaging',
      status: 'approved',
      payment_status: paidInvoices.includes('INV-003') ? 'paid' : 'unpaid',
      amount: 167.20,
      duration: '4 hours',
      team: '2 Persons',
      equipment: 'Prep benches, Double-tank fryer, Chest freezer',
    },
    {
      date_time: 'Mon, 15 Sep 2026, 8:00 AM – 12:00 PM',
      booking_date: '2026-09-15',
      reference_code: 'DD-BK-918',
      intended_use: 'Artisan Sourdough & Pastry Batching',
      status: 'completed',
      payment_status: 'paid',
      amount: 167.20,
      duration: '4 hours',
      team: '2 Persons',
      equipment: '20L Planetary mixer, Turbofan oven, Bread slicer',
    },
    {
      date_time: 'Fri, 28 Aug 2026, 2:00 PM – 10:00 PM',
      booking_date: '2026-08-28',
      reference_code: 'DD-BK-890',
      intended_use: 'Weekend Market Catering Production',
      status: 'completed',
      payment_status: 'paid',
      amount: 281.60,
      duration: '8 hours',
      team: '4 Persons',
      equipment: 'Full cookline, Tilting bratt pan, Under-counter prep fridges',
    },
    {
      date_time: 'Wed, 12 Aug 2026, 6:00 AM – 10:00 AM',
      booking_date: '2026-08-12',
      reference_code: 'DD-BK-855',
      intended_use: 'Hot Sauce Bottling & Canning Batch',
      status: 'completed',
      payment_status: 'paid',
      amount: 167.20,
      duration: '4 hours',
      team: '2 Persons',
      equipment: '6-burner gas range, Stainless prep line, Food processor',
    },
  ];

  const invoicesList = [
    {
      id: 'INV-001',
      ref: 'DD-BK-001',
      date: '19 Oct 2026',
      dueDate: '21 Oct 2026',
      description: 'Kitchen Rental DD-BK-001 (Wed 21 Oct, 4h)',
      amount: 167.20,
      status: paidInvoices.includes('INV-001') ? 'paid' : 'unpaid',
    },
    {
      id: 'INV-003',
      ref: 'DD-BK-003',
      date: '19 Oct 2026',
      dueDate: '26 Oct 2026',
      description: 'Kitchen Rental DD-BK-003 (Mon 26 Oct, 4h)',
      amount: 167.20,
      status: paidInvoices.includes('INV-003') ? 'paid' : 'unpaid',
    },
    {
      id: 'REC-918',
      ref: 'DD-BK-918',
      date: '15 Sep 2026',
      dueDate: '15 Sep 2026',
      description: 'Kitchen Booking DD-BK-918 (4h)',
      amount: 167.20,
      status: 'paid',
    },
    {
      id: 'REC-890',
      ref: 'DD-BK-890',
      date: '28 Aug 2026',
      dueDate: '28 Aug 2026',
      description: 'Kitchen Booking DD-BK-890 (8h Tier)',
      amount: 281.60,
      status: 'paid',
    },
    {
      id: 'REC-855',
      ref: 'DD-BK-855',
      date: '12 Aug 2026',
      dueDate: '12 Aug 2026',
      description: 'Kitchen Booking DD-BK-855 (4h)',
      amount: 167.20,
      status: 'paid',
    },
  ];

  const recurringSlots = [
    {
      id: 'REC-SLOT-01',
      title: 'Weekly Production Night',
      day: 'Every Wednesday',
      time: '6:30 PM – 10:30 PM (4h)',
      startDate: '01 Oct 2026',
      status: 'active',
      equipment: 'Combi oven, 6-burner range, 2x prep stations',
      discount: '10% Tiered Discount Applied',
    },
    {
      id: 'REC-SLOT-02',
      title: 'Fortnightly Morning Batching',
      day: 'Every 2nd Monday',
      time: '10:00 AM – 2:00 PM (4h)',
      startDate: '12 Oct 2026',
      status: 'pending_review',
      equipment: 'Prep benches, Deep fryer, Cold storage bay',
      discount: 'Standard Rate ($38/hr)',
    },
  ];

  const handlePayInvoice = (invId: string) => {
    setPaidInvoices((prev) => [...prev, invId]);
    alert(`Payment of invoice ${invId} completed successfully! A receipt has been issued.`);
  };

  const handleDashboardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await api.userLogin(authEmail, authPassword);
      setCurrentUser(res.user);
      onUserAuthChange?.(res.user);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDashboardSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await api.userSignUp({
        email: authEmail,
        password: authPassword,
        full_name: authFullName,
        business_name: authBusiness || undefined,
        phone: authPhone || undefined,
      });
      setCurrentUser(res.user);
      onUserAuthChange?.(res.user);
    } catch (err: any) {
      setAuthError(err.message || 'Signup failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDashboardLogout = () => {
    api.userLogout();
    setCurrentUser(null);
    onUserAuthChange?.(null);
  };

  const handleOpenPaymentModal = (b: any) => {
    setPaymentBooking(b);
    setShowPaymentModal(true);
  };

  const handleConfirmBookingPayment = () => {
    if (!paymentBooking) return;
    const ref = paymentBooking.reference_code;
    
    // Update live bookings state
    setLiveUserBookings((prev) =>
      prev.map((item) =>
        item.reference_code === ref
          ? { ...item, payment_status: 'paid', status: 'confirmed' }
          : item
      )
    );

    setPaidInvoices((prev) => [...prev, `INV-${ref}`, ref]);
    setPaymentSuccessToast(`Payment recorded for ${ref}! Your slot is officially booked. Keypad PIN: 4892#`);
    setShowPaymentModal(false);
    setTimeout(() => setPaymentSuccessToast(null), 8000);
  };

  const downloadCalendarFile = (booking: any) => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Daily Drop Commercial Kitchen//Booking Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${booking.reference_code}@dailydrop.com.au`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      'DTSTART:20261021T103000Z',
      'DTEND:20261021T143000Z',
      `SUMMARY:Daily Drop Commercial Kitchen Rental (${booking.reference_code})`,
      `DESCRIPTION:Commercial kitchen reservation for ${booking.intended_use}.`,
      'LOCATION:Unit 1, 1 Lichfield Street, Victoria Park, Perth, WA, 6101',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `DailyDrop-Kitchen-${booking.reference_code}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Merge live user bookings with mock templates
  const combinedBookings = [
    ...liveUserBookings,
    ...allBookings.filter((m) => !liveUserBookings.some((l) => l.reference_code === m.reference_code)),
  ];

  const primaryBooking = combinedBookings[0] || nextBooking;

  // Filtered bookings for the Bookings Tab
  const filteredBookings = combinedBookings.filter((b) => {
    const matchesStatus = bookingFilterStatus === 'all' || b.status === bookingFilterStatus;
    const matchesSearch = 
      b.reference_code.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.intended_use.toLowerCase().includes(bookingSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // If user is not authenticated, show sign up / login portal screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex flex-col justify-center items-center p-4 selection:bg-brand-mint selection:text-brand-forest">
        {/* Brand Header */}
        <div className="max-w-md w-full mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#112F21] text-[#ED8533] flex items-center justify-center shadow-md">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-gray-900 leading-tight">Daily Drop Kitchens</h1>
              <p className="text-xs text-gray-500">Customer & Tenant Portal</p>
            </div>
          </div>
          <button
            onClick={onBackToSite}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Site</span>
          </button>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-gray-200 space-y-5">
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#ED8533] bg-[#FFF3EB] px-3 py-1 rounded-full">
              Member Access
            </span>
            <h2 className="text-2xl font-black text-gray-900 mt-2">
              {authTab === 'login' ? 'Customer Sign In' : 'Create Customer Account'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Sign up or log in using your email to view your kitchen bookings, payment confirmations & door keypad access.
            </p>
          </div>

          {/* Toggle buttons */}
          <div className="flex bg-[#F4F6F8] p-1 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => { setAuthTab('login'); setAuthError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authTab === 'login' ? 'bg-[#112F21] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthTab('signup'); setAuthError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authTab === 'signup' ? 'bg-[#112F21] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign Up (New User)
            </button>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {authTab === 'login' ? (
            <form onSubmit={handleDashboardLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="name@business.com.au"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#112F21] focus:outline-none"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#112F21] focus:outline-none"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#112F21] hover:bg-[#1a4731] text-white py-3 rounded-xl font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {authLoading ? 'Signing in...' : 'Sign In to Portal'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleDashboardSignup} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Chef / Manager Name"
                  value={authFullName}
                  onChange={(e) => setAuthFullName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#112F21] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Business (Opt.)
                  </label>
                  <input
                    type="text"
                    placeholder="Catering Co."
                    value={authBusiness}
                    onChange={(e) => setAuthBusiness(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#112F21] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Phone (Opt.)
                  </label>
                  <input
                    type="tel"
                    placeholder="0400 000 000"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#112F21] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@business.com.au"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#112F21] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Password * (Min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#112F21] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#ED8533] hover:bg-[#d87222] text-white py-3 rounded-xl font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {authLoading ? 'Creating account...' : 'Create Account & Enter'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick Demo button */}
          <div className="pt-3 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={() => {
                setAuthTab('login');
                setAuthEmail('demo@dailydrop.today');
                setAuthPassword('kitchen123');
              }}
              className="text-xs text-emerald-800 font-bold hover:underline cursor-pointer"
            >
              Quick Test: Fill Demo Account (demo@dailydrop.today / kitchen123)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex text-[#1C252E] font-sans">
      {/* 1. Left Dark Forest Green Sidebar */}
      <aside className="w-64 bg-[#112F21] text-white flex flex-col justify-between shrink-0 shadow-xl border-r border-[#194531]">
        <div>
          {/* Logo & Kitchen Tagline */}
          <div className="p-5 flex items-center gap-3 border-b border-[#1b4330]">
            <div className="w-10 h-10 rounded-xl bg-[#ED8533] flex items-center justify-center text-white shadow-md">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white leading-tight">Daily Drop Kitchens</h1>
              <p className="text-[11px] text-[#8BB89F] font-medium">Victoria Park, Perth</p>
            </div>
          </div>

          {/* Navigation Menu */}
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
              onClick={onBookClick}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#B4D5C2] hover:bg-[#163c2b] hover:text-white transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-[#8BB89F]" />
              <span>Book a Kitchen</span>
            </button>

            <button
              onClick={() => setActiveNav('bookings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === 'bookings'
                  ? 'bg-[#1C4632] text-white shadow-inner font-bold'
                  : 'text-[#B4D5C2] hover:bg-[#163c2b] hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#8BB89F]" />
              <span>My Bookings</span>
            </button>

            <button
              onClick={() => setActiveNav('payments')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === 'payments'
                  ? 'bg-[#1C4632] text-white shadow-inner font-bold'
                  : 'text-[#B4D5C2] hover:bg-[#163c2b] hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4 text-[#8BB89F]" />
              <span>Payments & Invoices</span>
            </button>

            <button
              onClick={() => setActiveNav('recurring')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === 'recurring'
                  ? 'bg-[#1C4632] text-white shadow-inner font-bold'
                  : 'text-[#B4D5C2] hover:bg-[#163c2b] hover:text-white'
              }`}
            >
              <RefreshCw className="w-4 h-4 text-[#8BB89F]" />
              <span>Recurring Bookings</span>
            </button>

            <button
              onClick={() => setActiveNav('guidelines')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === 'guidelines'
                  ? 'bg-[#1C4632] text-white shadow-inner font-bold'
                  : 'text-[#B4D5C2] hover:bg-[#163c2b] hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 text-[#8BB89F]" />
              <span>Kitchen Guidelines</span>
            </button>

            <button
              onClick={() => setActiveNav('support')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === 'support'
                  ? 'bg-[#1C4632] text-white shadow-inner font-bold'
                  : 'text-[#B4D5C2] hover:bg-[#163c2b] hover:text-white'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-[#8BB89F]" />
              <span>Support</span>
            </button>

            <button
              onClick={() => setActiveNav('account')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === 'account'
                  ? 'bg-[#1C4632] text-white shadow-inner font-bold'
                  : 'text-[#B4D5C2] hover:bg-[#163c2b] hover:text-white'
              }`}
            >
              <User className="w-4 h-4 text-[#8BB89F]" />
              <span>My Account</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-[#1b4330] space-y-2 text-xs">
          <button
            onClick={handleDashboardLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-300 hover:bg-red-950/40 hover:text-red-200 transition-all text-left cursor-pointer font-bold"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Sign Out</span>
          </button>
          <button
            onClick={onGoToAdminPortal}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#B4D5C2] hover:bg-[#163c2b] hover:text-white transition-all text-left cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-[#ED8533]" />
            <span>Switch to Admin Panel</span>
          </button>
          <button
            onClick={onBackToSite}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#B4D5C2] hover:bg-[#163c2b] hover:text-white transition-all text-left cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#8BB89F]" />
            <span>Back to Website</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Dynamic Header Bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {activeNav === 'dashboard' && `Welcome back, ${chefName}!`}
              {activeNav === 'bookings' && 'My Kitchen Bookings'}
              {activeNav === 'payments' && 'Payments & Invoices'}
              {activeNav === 'recurring' && 'Recurring Bookings & Production Schedules'}
              {activeNav === 'guidelines' && 'Commercial Kitchen Guidelines & Safety'}
              {activeNav === 'support' && 'Tenant Support & Facility Assistance'}
              {activeNav === 'account' && 'My Account & Business Profile'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {activeNav === 'dashboard' && 'Manage your kitchen bookings, payments and everything in one place.'}
              {activeNav === 'bookings' && 'Review your upcoming reservations, past cooking sessions, and booking specifications.'}
              {activeNav === 'payments' && 'Track outstanding fees, download official tax invoices, and manage payment records.'}
              {activeNav === 'recurring' && 'Reserve regular weekly or fortnightly production shifts with dedicated storage.'}
              {activeNav === 'guidelines' && 'Health compliance, sanitisation checklists, and council commercial standards.'}
              {activeNav === 'support' && '24/7 emergency hotline, maintenance requests, and direct facility manager help.'}
              {activeNav === 'account' && 'Manage your tenant profile, ABN, and Food Safety Supervisor certificates.'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveNav('support')}
              className="relative p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ED8533] rounded-full ring-2 ring-white"></span>
            </button>

            <div 
              onClick={() => setActiveNav('account')}
              className="flex items-center gap-3 pl-2 border-l border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-9 h-9 rounded-full bg-[#1C4632] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {chefName.substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-gray-800">{chefName}</div>
                <div className="text-[11px] text-gray-400">{currentUser?.email || 'Commercial Tenant'}</div>
              </div>
            </div>

            <button
              onClick={handleDashboardLogout}
              className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              title="Sign Out of Customer Account"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic Body Content based on activeNav */}
        <main className="p-8 space-y-8 flex-1 max-w-[1400px]">
          {paymentSuccessToast && (
            <div className="p-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-md flex items-center justify-between animate-in slide-in-from-top">
              <span>{paymentSuccessToast}</span>
              <button onClick={() => setPaymentSuccessToast(null)} className="text-white hover:opacity-80 cursor-pointer">✕</button>
            </div>
          )}

          {/* Payment Warning Notice */}
          {combinedBookings.some((b) => b.payment_status === 'unpaid') && (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-extrabold text-xs uppercase tracking-wide text-amber-900">
                  ⚠️ Action Required: Payment to Officially Book Slots
                </h4>
                <p className="text-xs text-amber-900/90 mt-0.5 leading-relaxed">
                  You have commercial kitchen slots on temporary hold. <strong>Please note: You need to pay first. After payment is received and verified, your slot will be officially booked</strong> and your 6-digit electronic keypad entry PIN will be activated.
                </p>
              </div>
            </div>
          )}
          
          {/* ========================================================== */}
          {/* TAB 1: DASHBOARD VIEW (Original Dashboard matching screenshot) */}
          {/* ========================================================== */}
          {activeNav === 'dashboard' && (
            <>
              {/* Top 4 Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Upcoming Bookings */}
                <div 
                  onClick={() => setActiveNav('bookings')}
                  className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex items-center gap-4 hover:border-emerald-300 transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-gray-900 leading-none">2</div>
                    <div className="text-xs text-gray-500 font-medium mt-1">Upcoming Bookings</div>
                  </div>
                </div>

                {/* 2. Awaiting Payment */}
                <div 
                  onClick={() => setActiveNav('payments')}
                  className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex items-center gap-4 hover:border-amber-300 transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-gray-900 leading-none">
                      {invoicesList.filter(i => i.status === 'unpaid').length}
                    </div>
                    <div className="text-xs text-amber-700 font-semibold mt-1">Awaiting Payment</div>
                  </div>
                </div>

                {/* 3. Completed Bookings */}
                <div 
                  onClick={() => setActiveNav('bookings')}
                  className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex items-center gap-4 hover:border-emerald-300 transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-50 text-gray-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-gray-900 leading-none">8</div>
                    <div className="text-xs text-gray-500 font-medium mt-1">Completed Bookings</div>
                  </div>
                </div>

                {/* 4. Total Spend */}
                <div 
                  onClick={() => setActiveNav('payments')}
                  className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex items-center gap-4 hover:border-emerald-300 transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-50 text-gray-700 flex items-center justify-center shrink-0">
                    <Receipt className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-gray-900 leading-none">$167.20</div>
                    <div className="text-xs text-gray-500 font-medium mt-1">Total Spend (This Year)</div>
                  </div>
                </div>
              </div>

              {/* Middle 2-Column Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left 7 Cols: "Your Next Booking" Highlight Card */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-700" />
                      <span>Your Next Booking</span>
                    </h3>
                    <button
                      onClick={() => setActiveNav('bookings')}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All Bookings</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Showcase Card */}
                  <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-12">
                      <div className="sm:col-span-5 relative bg-gray-900 h-52 sm:h-auto overflow-hidden">
                        <img
                          src={Images.hero}
                          alt="Kitchen Station"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            <span>Confirmed</span>
                          </span>
                        </div>
                      </div>

                      <div className="sm:col-span-7 p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-mono text-gray-400 font-bold">Ref: {primaryBooking.reference_code}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              primaryBooking.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {primaryBooking.payment_status === 'paid' ? 'Paid' : 'Unpaid (Action Req)'}
                            </span>
                          </div>

                          <h4 className="font-bold text-base text-gray-900 leading-tight">
                            {primaryBooking.intended_use}
                          </h4>

                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span>{primaryBooking.location || 'Unit 1, 1 Lichfield St, Victoria Park'}</span>
                          </div>

                          <div className="mt-4 space-y-2 text-xs">
                            <div className="flex items-center gap-2 text-gray-700 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{primaryBooking.booking_date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{primaryBooking.start_time} – {primaryBooking.end_time} ({primaryBooking.duration_hours || primaryBooking.duration})</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Users className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{primaryBooking.team_size || 2} Person(s)</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Flame className="w-3.5 h-3.5 text-[#ED8533]" />
                              <span className="truncate">{primaryBooking.equipment_requirements || primaryBooking.equipment}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2.5">
                          {primaryBooking.payment_status !== 'paid' && (
                            <button
                              onClick={() => handleOpenPaymentModal(primaryBooking)}
                              className="bg-[#ED8533] hover:bg-[#d87222] text-white py-2 px-3.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Pay Slot (${(primaryBooking.amount || 167.2).toFixed(2)})</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedBookingDetails(primaryBooking);
                              setShowDetailsModal(true);
                            }}
                            className="flex-1 bg-[#112F21] hover:bg-[#1a4731] text-white py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer text-center"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => downloadCalendarFile(primaryBooking)}
                            className="px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Add to iCal / Google Calendar"
                          >
                            <Calendar className="w-3.5 h-3.5 text-gray-500" />
                            <span>Calendar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 5 Cols: "Book Another Kitchen" & Quick Links */}
                <div className="lg:col-span-5 space-y-5">
                  {/* Action Banner Card */}
                  <button
                    onClick={onBookClick}
                    className="w-full bg-[#ED8533] hover:bg-[#d87222] text-white p-5 rounded-2xl shadow-sm flex items-center justify-between group transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 text-left">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Book Another Kitchen</h4>
                        <p className="text-xs text-white/80 mt-0.5">Reserve extra hours or upcoming batch sessions</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Kitchen Availability widget */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                        <Clock className="w-4 h-4 text-emerald-700" />
                        <span>Kitchen Availability</span>
                      </div>
                      <button
                        onClick={onBookClick}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                      >
                        View Calendar →
                      </button>
                    </div>

                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                      Mon, 26 Oct 2026
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 text-emerald-800">
                        <div className="font-bold">6 AM – 10 AM</div>
                        <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">Available</div>
                      </div>
                      <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 text-amber-800">
                        <div className="font-bold">10 AM – 2 PM</div>
                        <div className="text-[10px] text-amber-600 mt-0.5 font-medium">2/4 Slots</div>
                      </div>
                      <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 text-emerald-800">
                        <div className="font-bold">2 PM – 6 PM</div>
                        <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">Available</div>
                      </div>
                      <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 text-amber-800">
                        <div className="font-bold">6 PM – 10 PM</div>
                        <div className="text-[10px] text-amber-600 mt-0.5 font-medium">1/4 Slots</div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-xs space-y-2.5">
                    <button
                      onClick={() => setActiveNav('recurring')}
                      className="w-full py-2 flex items-center justify-between text-left hover:text-emerald-700 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <RefreshCw className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-xs font-bold text-gray-800">Recurring Bookings</div>
                          <div className="text-[11px] text-gray-400">Set up a regular weekly booking</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </button>

                    <button
                      onClick={() => setActiveNav('payments')}
                      className="w-full py-2 flex items-center justify-between text-left hover:text-emerald-700 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Receipt className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-xs font-bold text-gray-800">Invoices & Receipts</div>
                          <div className="text-[11px] text-gray-400">View and download your invoices</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </button>

                    <button
                      onClick={() => setActiveNav('guidelines')}
                      className="w-full py-2 flex items-center justify-between text-left hover:text-emerald-700 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-xs font-bold text-gray-800">Kitchen Guidelines</div>
                          <div className="text-[11px] text-gray-400">Rules, cleaning requirements and policies</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </button>

                    <button
                      onClick={() => setActiveNav('support')}
                      className="w-full py-2 flex items-center justify-between text-left hover:text-emerald-700 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <HelpCircle className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-xs font-bold text-gray-800">Contact Support</div>
                          <div className="text-[11px] text-gray-400">Get help with your bookings</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Table: Upcoming Bookings Preview */}
              <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-700" />
                    <span>Upcoming Bookings</span>
                  </h3>
                  <button
                    onClick={() => setActiveNav('bookings')}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/80 text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3.5">Date & Time</th>
                        <th className="px-6 py-3.5">Reference</th>
                        <th className="px-6 py-3.5">Use</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">Payment</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {allBookings.slice(0, 2).map((b) => (
                        <tr key={b.reference_code} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">{b.date_time}</td>
                          <td className="px-6 py-4 font-mono text-emerald-800 font-bold">{b.reference_code}</td>
                          <td className="px-6 py-4 text-gray-600">{b.intended_use}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                              b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              ● {b.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              b.payment_status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {b.payment_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedBookingDetails(b);
                                setShowDetailsModal(true);
                              }}
                              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ========================================================== */}
          {/* TAB 2: MY BOOKINGS VIEW */}
          {/* ========================================================== */}
          {activeNav === 'bookings' && (
            <div className="space-y-6">
              {/* Controls bar: Filters + Search + New Booking CTA */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {['all', 'confirmed', 'approved', 'completed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setBookingFilterStatus(status)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                        bookingFilterStatus === status
                          ? 'bg-[#1C4632] text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {status === 'all' ? 'All Bookings' : status}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search ref or purpose..."
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-gray-50 w-48 sm:w-64"
                    />
                  </div>
                  <button
                    onClick={onBookClick}
                    className="bg-[#ED8533] hover:bg-[#d87222] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Booking</span>
                  </button>
                </div>
              </div>

              {/* Bookings Full Table */}
              <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/80 text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3.5">Reference</th>
                        <th className="px-6 py-3.5">Scheduled Date & Time</th>
                        <th className="px-6 py-3.5">Intended Use</th>
                        <th className="px-6 py-3.5">Duration & Team</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">Payment</th>
                        <th className="px-6 py-3.5">Total Amount</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                            No bookings match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((b) => (
                          <tr key={b.reference_code} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-emerald-800">
                              {b.reference_code}
                            </td>
                            <td className="px-6 py-4 font-bold text-gray-900">
                              {b.date_time}
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              <div>{b.intended_use}</div>
                              <div className="text-[10px] text-gray-400 mt-0.5 truncate max-w-xs">{b.equipment}</div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              <div>{b.duration}</div>
                              <div className="text-[10px] text-gray-400">{b.team}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                                b.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                ● {b.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                b.payment_status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {b.payment_status}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-gray-900">
                              ${b.amount.toFixed(2)} AUD
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              {b.payment_status !== 'paid' && (
                                <button
                                  onClick={() => handleOpenPaymentModal(b)}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#ED8533] hover:bg-[#d87222] text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  <span>Pay Slot</span>
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedBookingDetails(b);
                                  setShowDetailsModal(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                              >
                                Details
                              </button>
                              <button
                                onClick={() => downloadCalendarFile(b)}
                                className="px-2.5 py-1.5 rounded-lg border border-emerald-200 text-emerald-800 text-xs font-semibold hover:bg-emerald-50 transition-colors cursor-pointer"
                                title="Download ICS"
                              >
                                Calendar
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

          {/* ========================================================== */}
          {/* TAB 3: PAYMENTS & INVOICES VIEW */}
          {/* ========================================================== */}
          {activeNav === 'payments' && (
            <div className="space-y-6">
              {/* Financial Snapshot */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-xs">
                  <div className="text-xs text-gray-500 font-semibold">Total Paid to Date</div>
                  <div className="text-2xl font-black text-gray-900 mt-1">$616.00 AUD</div>
                  <div className="text-[11px] text-emerald-700 font-medium mt-1">3 Completed bookings</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-xs">
                  <div className="text-xs text-gray-500 font-semibold">Pending Payments</div>
                  <div className="text-2xl font-black text-amber-700 mt-1">
                    ${invoicesList.filter(i => i.status === 'unpaid').reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)} AUD
                  </div>
                  <div className="text-[11px] text-amber-600 font-medium mt-1">
                    {invoicesList.filter(i => i.status === 'unpaid').length} invoices awaiting settlement
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-xs">
                  <div className="text-xs text-gray-500 font-semibold">Default Payment Method</div>
                  <div className="text-sm font-bold text-gray-900 mt-1 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-800" />
                    <span>Visa ending in 4242</span>
                  </div>
                  <div className="text-[11px] text-gray-400 font-medium mt-1">Direct Bank Deposit / Stripe</div>
                </div>
              </div>

              {/* Invoices Table */}
              <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-800" />
                    <span>Invoices & Official Tax Receipts</span>
                  </h3>
                  <span className="text-xs text-gray-400">All prices include 10% Australian GST</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/80 text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3.5">Invoice #</th>
                        <th className="px-6 py-3.5">Booking Ref</th>
                        <th className="px-6 py-3.5">Issue Date</th>
                        <th className="px-6 py-3.5">Due Date</th>
                        <th className="px-6 py-3.5">Description</th>
                        <th className="px-6 py-3.5">Amount (AUD)</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {invoicesList.map((inv) => (
                        <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-gray-900">{inv.id}</td>
                          <td className="px-6 py-4 font-mono text-emerald-800 font-bold">{inv.ref}</td>
                          <td className="px-6 py-4 text-gray-600">{inv.date}</td>
                          <td className="px-6 py-4 text-gray-600">{inv.dueDate}</td>
                          <td className="px-6 py-4 text-gray-800">{inv.description}</td>
                          <td className="px-6 py-4 font-mono font-bold text-gray-900">${inv.amount.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                              inv.status === 'paid' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              ● {inv.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {inv.status === 'unpaid' ? (
                              <button
                                onClick={() => handlePayInvoice(inv.id)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer"
                              >
                                Pay Now
                              </button>
                            ) : (
                              <button
                                onClick={() => alert(`Receipt #${inv.id} downloaded.`)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Receipt</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 4: RECURRING BOOKINGS VIEW */}
          {/* ========================================================== */}
          {activeNav === 'recurring' && (
            <div className="space-y-6">
              {/* Highlight Banner */}
              <div className="bg-[#112F21] text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-md">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-[#ED8533]" />
                    <span>Priority Production Slots</span>
                  </div>
                  <h3 className="text-xl font-bold">Regular Weekly Kitchen Shifts</h3>
                  <p className="text-xs text-[#B4D5C2] leading-relaxed">
                    Lock in predictable weekly commercial cooking hours, secure dedicated walk-in cold storage bays, and receive up to 15% bulk tiered rental savings.
                  </p>
                </div>

                <button
                  onClick={() => setShowRecurringModal(true)}
                  className="bg-[#ED8533] hover:bg-[#d87222] text-white px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Request Recurring Slot</span>
                </button>
              </div>

              {/* Recurring Shifts List */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-gray-900">Your Reserved Recurring Schedules</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {recurringSlots.map((slot) => (
                    <div key={slot.id} className="bg-white rounded-2xl p-6 border border-gray-200/90 shadow-xs space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-[10px] text-gray-400 font-bold uppercase">{slot.id}</span>
                          <h5 className="font-bold text-base text-gray-900">{slot.title}</h5>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          slot.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          ● {slot.status === 'active' ? 'Active Shift' : 'Under Review'}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-4 h-4 text-emerald-700" />
                          <span className="font-bold">{slot.day}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4 text-emerald-700" />
                          <span>{slot.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Flame className="w-4 h-4 text-[#ED8533]" />
                          <span>{slot.equipment}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-emerald-700 font-semibold">{slot.discount}</span>
                        <button
                          onClick={() => setActiveNav('support')}
                          className="font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
                        >
                          Modify Shift →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 5: KITCHEN GUIDELINES VIEW */}
          {/* ========================================================== */}
          {activeNav === 'guidelines' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-200/90 shadow-xs">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-900">Commercial Operations & Hygiene Protocols</h3>
                    <p className="text-xs text-gray-500">Maintained in compliance with City of South Perth / Victoria Park Health Regulations.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Protocol 1 */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                    <h5 className="font-bold text-xs text-gray-900 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>1. Arrival & Check-In Protocols</span>
                    </h5>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Enter using your unique digital keypad PIN. Put on clean chef whites, non-slip enclosed footwear, and hair coverings before stepping onto the kitchen floor. Complete the digital sign-in tablet at the entry door.
                    </p>
                  </div>

                  {/* Protocol 2 */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                    <h5 className="font-bold text-xs text-gray-900 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>2. Equipment & Exhaust Operation</span>
                    </h5>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      The mechanical extraction canopy must be switched to active speed during all burner, combi oven, and fryer operations. Do not pour grease or cooking oil down drainage sinks; use the designated oil recycling drum.
                    </p>
                  </div>

                  {/* Protocol 3 */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                    <h5 className="font-bold text-xs text-gray-900 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>3. Food Safety & Temperature Control</span>
                    </h5>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      All prepared foods stored in walk-in cold rooms must be sealed, date-labeled, and allergen-tagged. High-risk foods must be cooled within 2 hours from 60°C to 21°C, and within 4 hours from 21°C to 5°C.
                    </p>
                  </div>

                  {/* Protocol 4 */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                    <h5 className="font-bold text-xs text-gray-900 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>4. End-of-Shift Cleaning Checklist</span>
                    </h5>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Wipe and sanitise all stainless steel surfaces with food-grade spray. Wash and dry all smallwares and utensils. Mop floors using hot water and detergent. Empty trash bins and place bagged waste into exterior council bins.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Have questions regarding food inspection certification?</span>
                  <button
                    onClick={() => alert('Daily Drop Tenant Handbook (PDF) downloaded.')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Full Tenant Handbook (PDF)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 6: SUPPORT & ASSISTANCE VIEW */}
          {/* ========================================================== */}
          {activeNav === 'support' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left 7 cols: Support ticket submission */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-gray-200/90 shadow-xs space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ED8533] flex items-center justify-center font-bold">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-900">Tenant Helpdesk & Maintenance Request</h3>
                    <p className="text-xs text-gray-500">Submit requests for equipment inspection, schedule updates, or facility questions.</p>
                  </div>
                </div>

                {supportSubmitted ? (
                  <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Ticket Received!</span>
                    </div>
                    <p className="text-xs leading-relaxed">
                      Thank you. A Daily Drop facility manager has been notified and will contact you at <strong>{chefPhone}</strong> shortly.
                    </p>
                    <button
                      onClick={() => {
                        setSupportSubmitted(false);
                        setSupportMessage('');
                      }}
                      className="mt-2 text-xs font-bold text-emerald-800 underline cursor-pointer"
                    >
                      Submit another ticket
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSupportSubmitted(true);
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Issue Category</label>
                      <select
                        value={supportCategory}
                        onChange={(e) => setSupportCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                      >
                        <option value="maintenance">Appliance Maintenance / Malfunction</option>
                        <option value="access">Access Code / Entry Keypad Issue</option>
                        <option value="booking">Booking Modification / Cancellation</option>
                        <option value="billing">Invoicing & Payment Query</option>
                        <option value="cleaning">Supplies & Cleaning Restock</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Details & Description</label>
                      <textarea
                        rows={4}
                        required
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        placeholder="Please describe the equipment involved, current issue, or assistance required..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="bg-[#112F21] hover:bg-[#1a4731] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      Submit Support Request
                    </button>
                  </form>
                )}
              </div>

              {/* Right 5 cols: Emergency Contacts & Quick info */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-white rounded-2xl p-6 border border-gray-200/90 shadow-xs space-y-4">
                  <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-700" />
                    <span>Emergency Facility Hotline</span>
                  </h4>
                  <div className="p-3.5 rounded-xl bg-red-50/70 border border-red-200/60 text-red-900 space-y-1">
                    <div className="text-xs font-bold">24/7 Duty Facility Manager</div>
                    <div className="text-base font-black">0479 175 705</div>
                    <p className="text-[11px] text-red-700">Call immediately for gas leaks, power trips, or lockout emergencies.</p>
                  </div>
                  <div className="space-y-2 text-xs text-gray-600 pt-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>hello@dailydrop.today</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>Unit 1, 1 Lichfield St, Victoria Park, WA 6101</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200/90 shadow-xs space-y-3">
                  <h4 className="font-bold text-xs text-gray-800">Frequently Asked</h4>
                  <div className="text-xs space-y-2 text-gray-600">
                    <p><strong>Q: What if I run 15 minutes over my slot?</strong></p>
                    <p className="text-[11px] text-gray-500">Contact facility dispatch immediately. If unbooked, overtime is billed at standard pro-rata rate.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 7: MY ACCOUNT & PROFILE VIEW */}
          {/* ========================================================== */}
          {activeNav === 'account' && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/90 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#1C4632] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    MD
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-900">{chefName}</h3>
                    <p className="text-xs text-gray-500">{businessName}</p>
                  </div>
                </div>
                {profileSaved && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved!</span>
                  </span>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setProfileSaved(true);
                  setTimeout(() => setProfileSaved(false), 3000);
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Full Legal Name</label>
                    <input
                      type="text"
                      value={chefName}
                      onChange={(e) => setChefName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Registered Business Name</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Contact Email Address</label>
                    <input
                      type="email"
                      value={chefEmail}
                      onChange={(e) => setChefEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Phone Number</label>
                    <input
                      type="tel"
                      value={chefPhone}
                      onChange={(e) => setChefPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Australian Business Number (ABN)</label>
                    <input
                      type="text"
                      value={abnNumber}
                      onChange={(e) => setAbnNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Food Safety Supervisor Certificate #</label>
                    <input
                      type="text"
                      value={fssCert}
                      onChange={(e) => setFssCert(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-mono"
                    />
                  </div>
                </div>

                {/* Compliance Badges */}
                <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-emerald-900">Public Liability Insurance ($20M)</div>
                      <div className="text-[11px] text-emerald-700">Policy #CGU-PL-892147 (Valid to 30 Nov 2026)</div>
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-emerald-900">Food Act 2008 Notification</div>
                      <div className="text-[11px] text-emerald-700">Council registration on file</div>
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    className="bg-[#112F21] hover:bg-[#1a4731] text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

        </main>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedBookingDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">Booking Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Booking Reference:</span>
                <span className="font-mono font-bold text-emerald-800">{selectedBookingDetails.reference_code}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Intended Purpose:</span>
                <span className="font-semibold text-gray-900">{selectedBookingDetails.intended_use}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Facility Location:</span>
                <span className="font-medium text-gray-700">Unit 1, 1 Lichfield St, Victoria Park</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Scheduled Time:</span>
                <span className="font-semibold text-gray-900">
                  {selectedBookingDetails.date_time || `${selectedBookingDetails.booking_date}, ${selectedBookingDetails.start_time} – ${selectedBookingDetails.end_time}`}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Equipment Reserved:</span>
                <span className="font-medium text-gray-700">
                  {selectedBookingDetails.equipment_requirements || selectedBookingDetails.equipment}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Total Rental Rate:</span>
                <span className="font-mono font-bold text-gray-900">
                  ${(selectedBookingDetails.total_price || selectedBookingDetails.amount).toFixed(2)} AUD
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Current Status:</span>
                <span className="font-bold text-emerald-700 uppercase">{selectedBookingDetails.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Payment Status:</span>
                <span className="font-bold text-amber-700 uppercase">{selectedBookingDetails.payment_status}</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => downloadCalendarFile(selectedBookingDetails)}
                className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Save to Calendar</span>
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 bg-[#112F21] hover:bg-[#1a4731] text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recurring Request Modal */}
      {showRecurringModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">Request Recurring Kitchen Schedule</h3>
              <button
                onClick={() => setShowRecurringModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {recurringSubmitted ? (
              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2 text-xs">
                <div className="font-bold text-sm">Recurring Request Submitted!</div>
                <p>
                  Our kitchen facility manager will review your requested day & time slot to guarantee zero scheduling conflicts. We will confirm your recurring schedule within 24 hours.
                </p>
                <button
                  onClick={() => {
                    setRecurringSubmitted(false);
                    setShowRecurringModal(false);
                  }}
                  className="mt-3 bg-[#112F21] text-white px-4 py-2 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setRecurringSubmitted(true);
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Preferred Recurring Frequency</label>
                  <select className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50">
                    <option>Weekly (Same day each week)</option>
                    <option>Fortnightly (Every 2 weeks)</option>
                    <option>Monthly (Batch production)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Preferred Day</label>
                    <select className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50">
                      <option>Monday</option>
                      <option>Tuesday</option>
                      <option>Wednesday</option>
                      <option>Thursday</option>
                      <option>Friday</option>
                      <option>Saturday</option>
                      <option>Sunday</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Session Duration</label>
                    <select className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50">
                      <option>4 Hours (Half Day)</option>
                      <option>8 Hours (Full Day Shift)</option>
                      <option>12 Hours (High Volume)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Target Start Time</label>
                  <select className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50">
                    <option>06:00 AM – 10:00 AM (Early Prep)</option>
                    <option>10:00 AM – 02:00 PM (Midday Shift)</option>
                    <option>02:00 PM – 06:00 PM (Afternoon Shift)</option>
                    <option>06:30 PM – 10:30 PM (Evening Shift)</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRecurringModal(false)}
                    className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#ED8533] hover:bg-[#d87222] text-white py-2.5 rounded-xl font-bold cursor-pointer"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Payment Instruction & Settlement Modal */}
      {showPaymentModal && paymentBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#ED8533]" />
                <h3 className="font-bold text-base text-gray-900">Payment Required to Book Slot</h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs leading-relaxed">
              <p className="font-extrabold text-amber-900 mb-0.5">⚠️ SLOT AWAITING PAYMENT</p>
              <p>
                Your requested slot is on temporary hold. <strong>You need to pay before the slot is officially booked.</strong> After payment is received and confirmed, your reservation will be finalized and your door access PIN code will be activated.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Booking Reference:</span>
                <span className="font-mono font-bold text-emerald-800">{paymentBooking.reference_code}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Session Date & Time:</span>
                <span className="font-semibold text-gray-800">{paymentBooking.date_time}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Total Rental Amount:</span>
                <span className="font-black text-sm text-[#112F21]">${(paymentBooking.amount || 167.2).toFixed(2)} AUD</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2 text-xs">
              <div className="font-bold text-emerald-950">Bank Transfer / PayID Payment Details:</div>
              <div className="text-gray-700"><strong>Bank:</strong> Commonwealth Bank of Australia</div>
              <div className="text-gray-700"><strong>Account Name:</strong> Daily Drop Commercial Kitchens Pty Ltd</div>
              <div className="text-gray-700"><strong>BSB:</strong> 066-123</div>
              <div className="text-gray-700"><strong>Account Number:</strong> 1234 5678</div>
              <div className="text-gray-700">
                <strong>Reference:</strong>{' '}
                <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-900">
                  {paymentBooking.reference_code}
                </span>
              </div>
              <div className="text-gray-700"><strong>PayID:</strong> payments@dailydrop.today</div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Bank: Commonwealth Bank\nAccount: Daily Drop Commercial Kitchens\nBSB: 066-123\nAccount: 1234 5678\nRef: ${paymentBooking.reference_code}\nPayID: payments@dailydrop.today\nAmount: $${(paymentBooking.amount || 167.2).toFixed(2)}`
                  );
                  setPaymentCopied(true);
                  setTimeout(() => setPaymentCopied(false), 2000);
                }}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs cursor-pointer"
              >
                {paymentCopied ? 'Copied Details!' : 'Copy Bank Details'}
              </button>
              <button
                type="button"
                onClick={handleConfirmBookingPayment}
                className="flex-1 py-2.5 rounded-xl bg-[#ED8533] hover:bg-[#d87222] text-white font-bold text-xs cursor-pointer shadow-sm"
              >
                I Have Paid / Confirm Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
