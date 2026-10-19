import React, { useState } from 'react';
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
  ArrowLeft
} from 'lucide-react';
import { Images } from '../assets/images';
import { Booking } from '../types';
import { formatDisplayDate, formatDisplayTime, calculateEndTime } from '../services/api';

interface CustomerDashboardProps {
  onBackToSite: () => void;
  onGoToAdminPortal: () => void;
  onBookClick: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  onBackToSite,
  onGoToAdminPortal,
  onBookClick,
}) => {
  const [activeNav, setActiveNav] = useState<string>('dashboard');
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<any | null>(null);

  // Mock next booking matching image 2
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

  const upcomingBookings = [
    {
      date_time: 'Wed, 21 Oct 2026, 6:30 PM – 10:30 PM',
      reference_code: 'DD-BK-001',
      intended_use: 'Corporate Luncheon Meal Prep',
      status: 'confirmed',
      payment_status: 'unpaid',
      amount: 167.20
    },
    {
      date_time: 'Mon, 26 Oct 2026, 10:00 AM – 2:00 PM',
      reference_code: 'DD-BK-003',
      intended_use: 'Cloud Kitchen Prep',
      status: 'approved',
      payment_status: 'unpaid',
      amount: 167.20
    }
  ];

  const recentPayments = [
    {
      date: '15 Sep 2026',
      description: 'Kitchen Booking DD-BK-918',
      amount: 167.20,
      status: 'paid',
      receipt_id: 'REC-918'
    }
  ];

  const downloadCalendarFile = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Daily Drop Commercial Kitchen//Booking Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${nextBooking.reference_code}@dailydrop.com.au`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      'DTSTART:20261021T103000Z',
      'DTEND:20261021T143000Z',
      `SUMMARY:Daily Drop Commercial Kitchen Rental (${nextBooking.reference_code})`,
      `DESCRIPTION:Commercial kitchen reservation for ${nextBooking.intended_use}. Team of ${nextBooking.team_size}.`,
      'LOCATION:Unit 1, 1 Lichfield Street, Victoria Park, Perth, WA, 6101',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `DailyDrop-Kitchen-${nextBooking.reference_code}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            onClick={onGoToAdminPortal}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#B4D5C2] hover:bg-[#163c2b] hover:text-white transition-all text-left"
          >
            <ShieldCheck className="w-4 h-4 text-[#ED8533]" />
            <span>Switch to Admin Panel</span>
          </button>
          <button
            onClick={onBackToSite}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#B4D5C2] hover:bg-[#163c2b] hover:text-white transition-all text-left"
          >
            <ArrowLeft className="w-4 h-4 text-[#8BB89F]" />
            <span>Back to Website</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Header Bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Welcome back, Michael!</h2>
            <p className="text-xs text-gray-500 mt-0.5">Manage your kitchen bookings, payments and everything in one place.</p>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>

            <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
              <div className="w-9 h-9 rounded-full bg-[#1C4632] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                MD
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-gray-800">Michael Davies</div>
                <div className="text-[11px] text-gray-400">Tenant Chef</div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="p-8 space-y-8 flex-1 max-w-[1400px]">
          {/* Top 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Upcoming Bookings */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900 leading-none">2</div>
                <div className="text-xs text-gray-500 font-medium mt-1">Upcoming Bookings</div>
              </div>
            </div>

            {/* 2. Awaiting Payment */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900 leading-none">1</div>
                <div className="text-xs text-amber-700 font-semibold mt-1">Awaiting Payment</div>
              </div>
            </div>

            {/* 3. Completed Bookings */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-50 text-gray-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900 leading-none">8</div>
                <div className="text-xs text-gray-500 font-medium mt-1">Completed Bookings</div>
              </div>
            </div>

            {/* 4. Total Spend (This Year) */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex items-center gap-4">
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
                  {/* Photo Left */}
                  <div className="sm:col-span-5 relative h-48 sm:h-auto min-h-[200px]">
                    <img
                      src={Images.hero}
                      alt="Commercial Kitchen Setup"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                    <span className="absolute top-3 left-3 bg-emerald-600 text-white font-bold text-[10px] uppercase px-2.5 py-1 rounded-full shadow-sm tracking-wide">
                      ● CONFIRMED
                    </span>
                  </div>

                  {/* Booking Details Right */}
                  <div className="sm:col-span-7 p-6 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-400 font-mono mb-1">
                        <span>Ref: {nextBooking.reference_code}</span>
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          UNPAID
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-gray-900 leading-snug">
                        {nextBooking.intended_use}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{nextBooking.location}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-gray-600 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 font-medium text-gray-800">
                        <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>Wed, 21 Oct 2026</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>6:30 PM – 10:30 PM (4 hours)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>3 Person(s)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-[#ED8533] shrink-0" />
                        <span className="truncate">{nextBooking.equipment_requirements}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={() => {
                          setSelectedBookingDetails(nextBooking);
                          setShowDetailsModal(true);
                        }}
                        className="flex-1 bg-[#112F21] hover:bg-[#1a4731] text-white py-2.5 px-4 rounded-xl text-xs font-bold text-center transition-colors cursor-pointer shadow-sm"
                      >
                        View Full Details
                      </button>
                      <button
                        onClick={downloadCalendarFile}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                        title="Download .ics Calendar Invite"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Add to Calendar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Quick Actions & Availability */}
            <div className="lg:col-span-5 space-y-5">
              {/* Primary CTA */}
              <button
                onClick={onBookClick}
                className="w-full bg-[#ED8533] hover:bg-[#de7624] text-white py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-between shadow-md shadow-[#ED8533]/25 transition-transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-white" />
                  <span>Book Another Kitchen</span>
                </div>
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Kitchen Availability Live Widget */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-700" />
                    <span>Kitchen Availability</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-emerald-700 cursor-pointer hover:underline">
                    View Calendar →
                  </span>
                </div>
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Mon, 26 Oct 2026
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-emerald-50 border border-emerald-200/70 rounded-xl p-2.5 text-center">
                    <div className="font-bold text-gray-800">6 AM – 10 AM</div>
                    <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">Available</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200/70 rounded-xl p-2.5 text-center">
                    <div className="font-bold text-gray-800">10 AM – 2 PM</div>
                    <div className="text-[11px] text-amber-700 font-semibold mt-0.5">2/4 Slots</div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200/70 rounded-xl p-2.5 text-center">
                    <div className="font-bold text-gray-800">2 PM – 6 PM</div>
                    <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">Available</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200/70 rounded-xl p-2.5 text-center">
                    <div className="font-bold text-gray-800">6 PM – 10 PM</div>
                    <div className="text-[11px] text-amber-700 font-semibold mt-0.5">1/4 Slots</div>
                  </div>
                </div>
              </div>

              {/* Quick Links Menu */}
              <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-xs divide-y divide-gray-100">
                <button
                  onClick={() => setActiveNav('recurring')}
                  className="w-full py-2.5 flex items-center justify-between text-left hover:text-emerald-700 transition-colors"
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
                  className="w-full py-2.5 flex items-center justify-between text-left hover:text-emerald-700 transition-colors"
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
                  className="w-full py-2.5 flex items-center justify-between text-left hover:text-emerald-700 transition-colors"
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
                  className="w-full py-2.5 flex items-center justify-between text-left hover:text-emerald-700 transition-colors"
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

              {/* Recurring Banner Promo */}
              <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-xs text-gray-900">Need a regular kitchen slot?</h5>
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      Save time by setting up a recurring booking for weekly or monthly sessions.
                    </p>
                    <button
                      onClick={() => setActiveNav('recurring')}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-900 inline-flex items-center gap-1 mt-1 cursor-pointer"
                    >
                      <span>Set Up Recurring Booking</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Table: Upcoming Bookings */}
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
                  {upcomingBookings.map((b) => (
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
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-200">
                          {b.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedBookingDetails({
                              ...nextBooking,
                              reference_code: b.reference_code,
                              intended_use: b.intended_use,
                              status: b.status,
                            });
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

          {/* Bottom Table: Recent Payments */}
          <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-gray-600" />
                <span>Recent Payments</span>
              </h3>
              <button
                onClick={() => setActiveNav('payments')}
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
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Description</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {recentPayments.map((p, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-500">{p.date}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{p.description}</td>
                      <td className="px-6 py-4 font-mono font-bold text-gray-900">${p.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800">
                          ● {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => alert(`Receipt #${p.receipt_id} downloaded.`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
                className="text-gray-400 hover:text-gray-600 font-bold text-lg p-1"
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
                <span className="font-semibold text-gray-900">Wed, 21 Oct 2026, 6:30 PM – 10:30 PM (4h)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Equipment Reserved:</span>
                <span className="font-medium text-gray-700">{selectedBookingDetails.equipment_requirements}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Total Rental Rate:</span>
                <span className="font-mono font-bold text-gray-900">${selectedBookingDetails.total_price.toFixed(2)} AUD</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Current Status:</span>
                <span className="font-bold text-emerald-700 uppercase">{selectedBookingDetails.status}</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={downloadCalendarFile}
                className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Save to Calendar</span>
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 bg-[#112F21] hover:bg-[#1a4731] text-white py-2.5 rounded-xl font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
