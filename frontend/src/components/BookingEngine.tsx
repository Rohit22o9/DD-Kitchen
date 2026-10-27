import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  Users, 
  ChefHat, 
  AlertCircle, 
  CheckCircle, 
  Sparkles,
  Info,
  Loader2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Check,
  Mail,
  CreditCard
} from 'lucide-react';
import { KitchenConfig, AvailabilityData, Booking, BookingCreateInput } from '../types';
import { api } from '../services/api';
import { AvailabilityTimelineBar } from './AvailabilityTimelineBar';

interface BookingEngineProps {
  config: KitchenConfig | null;
  initialDate?: string;
  initialTime?: string;
  initialDuration?: number;
  onBookingSuccess: (booking: Booking) => void;
}

export const BookingEngine: React.FC<BookingEngineProps> = ({
  config,
  initialDate,
  initialTime,
  initialDuration,
  onBookingSuccess,
}) => {
  // Today's date (past dates disabled)
  const today = new Date();
  const minDateStr = today.toISOString().split('T')[0];

  // 2-Stage Stepper: 1: Date & Time Slot, 2: Reservation & Contact Details
  const [currentStage, setCurrentStage] = useState<1 | 2>(1);

  // Selection states
  const [date, setDate] = useState<string>(initialDate || minDateStr);
  const [startTime, setStartTime] = useState<string>(initialTime || '09:00');
  const [duration, setDuration] = useState<number>(initialDuration || 4);

  // Form states
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [intendedUse, setIntendedUse] = useState('Cloud Kitchen Delivery Prep');
  const [teamSize, setTeamSize] = useState(2);
  const [notes, setNotes] = useState('');

  // Availability checking state
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Pre-fill user details if logged in
  useEffect(() => {
    const user = api.getCurrentUser();
    if (user) {
      if (user.full_name && !fullName) setFullName(user.full_name);
      if (user.business_name && !businessName) setBusinessName(user.business_name);
      if (user.email && !email) setEmail(user.email);
      if (user.phone && !phone) setPhone(user.phone);
    }
  }, []);

  // Synchronize when initial props change
  useEffect(() => {
    if (initialDate) setDate(initialDate);
    if (initialTime) setStartTime(initialTime);
    if (initialDuration) setDuration(initialDuration);
  }, [initialDate, initialTime, initialDuration]);

  // Load availability on date change
  useEffect(() => {
    let isMounted = true;
    async function loadDateAvailability() {
      setLoadingAvailability(true);
      setAvailabilityError(null);
      try {
        const data = await api.getAvailability(date);
        if (isMounted) {
          setAvailability(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setAvailabilityError(err.message || 'Could not verify date availability');
        }
      } finally {
        if (isMounted) setLoadingAvailability(false);
      }
    }
    loadDateAvailability();
    return () => {
      isMounted = false;
    };
  }, [date]);

  // Pricing calculations
  const securityDeposit = config?.security_deposit || 750.0;
  
  // Tiered pricing: 2h=$100, 4h=$152 ($38/h base), 8h=$256 ($32/h), 12h=$360 ($30/h)
  const getTierPrice = (hrs: number): number => {
    if (hrs === 2) return 100.0;
    if (hrs === 4) return 152.0;
    if (hrs === 6) return 204.0;
    if (hrs === 8) return 256.0;
    if (hrs === 10) return 310.0;
    if (hrs === 12) return 360.0;
    if (hrs === 24) return 696.0;
    return hrs * 38.0;
  };

  const baseRentalCost = getTierPrice(duration);
  const gstAmount = baseRentalCost * 0.10;
  const totalRentalCost = baseRentalCost + gstAmount;

  // Calculate end time
  const [startH, startM] = startTime.split(':').map(Number);
  const endMinutesTotal = startH * 60 + startM + Math.round(duration * 60);
  const endH = Math.floor(endMinutesTotal / 60) % 24;
  const endM = endMinutesTotal % 60;
  const isNextDay = Math.floor(endMinutesTotal / 60) >= 24;
  const endTimeFormatted = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}${isNextDay ? ' (+1 day)' : ''}`;

  // Check if current slot conflicts with availability
  const checkConflict = (): { hasConflict: boolean; reason?: string } => {
    if (!availability) return { hasConflict: false };
    const reqStart = startH * 60 + startM;
    const reqEnd = endMinutesTotal;

    for (const slot of availability.slots) {
      const [sh, sm] = slot.start_time.split(':').map(Number);
      const [eh, em] = slot.end_time.split(':').map(Number);
      const slotStart = sh * 60 + sm;
      const slotEnd = eh * 60 + em;

      if (Math.max(reqStart, slotStart) < Math.min(reqEnd, slotEnd)) {
        return {
          hasConflict: true,
          reason: `Conflicts with a reserved slot (${slot.start_time} - ${slot.end_time}: ${slot.reason || slot.status}).`,
        };
      }
    }

    return { hasConflict: false };
  };

  const slotConflict = checkConflict();

  // Submit Booking Request
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (slotConflict.hasConflict) {
      setSubmitError(slotConflict.reason || 'Selected slot is not available. Please choose another time.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: BookingCreateInput = {
        full_name: fullName.trim(),
        business_name: businessName.trim() || undefined,
        email: email.trim(),
        phone: phone.trim(),
        booking_date: date,
        start_time: startTime,
        duration_hours: duration,
        intended_use: intendedUse,
        team_size: teamSize,
        // All-Inclusive Facility: users rent the whole kitchen space, no individual items selection
        equipment_requirements: 'All-Inclusive Commercial Kitchen Facility',
        additional_notes: notes.trim() || undefined,
      };

      const bookingResult = await api.createBooking(payload);
      onBookingSuccess(bookingResult);
    } catch (err: any) {
      setSubmitError(err.message || 'Error submitting booking request. Please verify your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="booking-section" className="py-10 lg:py-14 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center space-x-2 bg-brand-orange-light text-brand-orange px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dedicated Rental Booking System</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-dark tracking-tight">
            Book Your Commercial Kitchen
          </h2>
          <p className="text-base sm:text-lg text-brand-muted mt-3">
            Select your hourly slot, enter your business details, and reserve your fully equipped kitchen space. All commercial equipment is included with every shift!
          </p>
        </div>

        {/* Main Grid: Left Side Controls & Form, Right Side Pricing Breakdown & Live Schedule */}
        <form onSubmit={handleSubmitBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Left Column (7 cols): Streamlined 2-Stage Booking Form */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Interactive 2-Stage Progress Indicator */}
            <div className="bg-brand-cream/70 rounded-2xl p-2.5 sm:p-3 border border-brand-mint-border flex items-center justify-between gap-2 shadow-xs">
              {/* Step 1 Pill */}
              <button
                type="button"
                onClick={() => setCurrentStage(1)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  currentStage === 1
                    ? 'bg-brand-forest text-white shadow-sm'
                    : 'text-brand-dark hover:bg-brand-mint/60'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                  currentStage === 1 ? 'bg-white text-brand-forest' : 'bg-brand-forest/20 text-brand-forest'
                }`}>
                  1
                </span>
                <span className="truncate">1. Select Date & Time Slot</span>
              </button>

              <div className="w-6 h-0.5 bg-brand-mint-border shrink-0" />

              {/* Step 2 Pill */}
              <button
                type="button"
                onClick={() => {
                  if (!slotConflict.hasConflict) setCurrentStage(2);
                }}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  currentStage === 2
                    ? 'bg-brand-forest text-white shadow-sm'
                    : 'text-brand-dark hover:bg-brand-mint/60'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                  currentStage === 2 ? 'bg-white text-brand-forest' : 'bg-brand-forest/20 text-brand-forest'
                }`}>
                  2
                </span>
                <span className="truncate">2. Applicant & Booking Details</span>
              </button>
            </div>

            {/* STAGE 1: Date & Time Slot */}
            {currentStage === 1 && (
              <div className="p-6 sm:p-7 rounded-2xl bg-brand-cream/60 border border-brand-mint-border shadow-soft-sm space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-brand-mint-border">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-full bg-brand-forest text-white font-bold text-xs flex items-center justify-center">
                      1
                    </span>
                    <h3 className="text-lg font-extrabold text-brand-dark">Select Date & Time Slot</h3>
                  </div>
                  <span className="text-xs text-brand-muted font-semibold hidden sm:inline">Step 1 of 2</span>
                </div>

                <div className="space-y-4">
                  {/* Date Picker */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-2">
                      Date of Rental (Past dates disabled)
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        min={minDateStr}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-brand-dark font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none cursor-pointer"
                      />
                    </div>
                    {/* Quick date shortcuts */}
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          setDate(d.toISOString().split('T')[0]);
                        }}
                        className="text-xs px-2.5 py-1 rounded-md bg-white border border-gray-200 text-brand-dark hover:bg-brand-mint hover:border-brand-forest/30 transition-colors cursor-pointer"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 1);
                          setDate(d.toISOString().split('T')[0]);
                        }}
                        className="text-xs px-2.5 py-1 rounded-md bg-white border border-gray-200 text-brand-dark hover:bg-brand-mint hover:border-brand-forest/30 transition-colors cursor-pointer"
                      >
                        Tomorrow
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 2);
                          setDate(d.toISOString().split('T')[0]);
                        }}
                        className="text-xs px-2.5 py-1 rounded-md bg-white border border-gray-200 text-brand-dark hover:bg-brand-mint hover:border-brand-forest/30 transition-colors cursor-pointer"
                      >
                        In 2 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
                          setDate(d.toISOString().split('T')[0]);
                        }}
                        className="text-xs px-2.5 py-1 rounded-md bg-white border border-gray-200 text-brand-dark hover:bg-brand-mint hover:border-brand-forest/30 transition-colors cursor-pointer"
                      >
                        Upcoming Weekend
                      </button>
                    </div>
                  </div>

                  {/* 24-HOUR VISUAL TIMELINE BAR */}
                  <AvailabilityTimelineBar
                    date={date}
                    slots={availability?.slots || []}
                    loading={loadingAvailability}
                    selectedStartTime={startTime}
                    selectedDuration={duration}
                    onSelectStartTime={(newTime) => setStartTime(newTime)}
                    hasConflict={slotConflict.hasConflict}
                    conflictReason={slotConflict.reason}
                  />

                  {/* Start Time & Duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-2">
                        Start Time
                      </label>
                      <select
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-brand-dark font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none cursor-pointer"
                      >
                        <option value="00:00">12:00 AM (Midnight Shift)</option>
                        <option value="02:00">02:00 AM (Overnight Batch)</option>
                        <option value="04:00">04:00 AM (Early Baker Start)</option>
                        <option value="06:00">06:00 AM (Morning Bake Shift)</option>
                        <option value="07:00">07:00 AM</option>
                        <option value="08:00">08:00 AM (Breakfast Prep)</option>
                        <option value="09:00">09:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM (Lunch Rush Prep)</option>
                        <option value="12:00">12:00 PM (Midday)</option>
                        <option value="13:00">01:00 PM (Afternoon Shift)</option>
                        <option value="14:00">02:00 PM</option>
                        <option value="15:00">03:00 PM</option>
                        <option value="16:00">04:00 PM (Evening Batch)</option>
                        <option value="17:00">05:00 PM</option>
                        <option value="18:00">06:00 PM (Dinner Service Prep)</option>
                        <option value="20:00">08:00 PM (Late Shift)</option>
                        <option value="22:00">10:00 PM (Night Production)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-2">
                        Rental Duration
                      </label>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-brand-dark font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none cursor-pointer"
                      >
                        <option value={2}>2 Hours (Test Prep Shift — $100 + GST)</option>
                        <option value={4}>4 Hours (Standard Base — $152 + GST)</option>
                        <option value={6}>6 Hours (Extended Prep — $204 + GST)</option>
                        <option value={8}>8 Hours (Full Shift — $256 + GST)</option>
                        <option value={10}>10 Hours ($310 + GST)</option>
                        <option value={12}>12 Hours (Commercial Run — $360 + GST)</option>
                        <option value={24}>24 Hours (Full-Day Access — $696 + GST)</option>
                      </select>
                    </div>
                  </div>

                  {/* Real-time Conflict Alert */}
                  {loadingAvailability ? (
                    <div className="flex items-center space-x-2 text-xs text-brand-muted">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-forest" />
                      <span>Checking real-time calendar availability...</span>
                    </div>
                  ) : slotConflict.hasConflict ? (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Slot Unavailable</p>
                        <p className="mt-0.5">{slotConflict.reason}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span className="font-medium">
                        Time slot is available! Click next to enter your booking details.
                      </span>
                    </div>
                  )}
                </div>

                {/* Stage 1 Action: Next Button */}
                <div className="pt-4 border-t border-brand-mint-border flex justify-end">
                  <button
                    type="button"
                    disabled={slotConflict.hasConflict || loadingAvailability}
                    onClick={() => setCurrentStage(2)}
                    className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer ${
                      slotConflict.hasConflict || loadingAvailability
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-brand-orange hover:bg-brand-orange-hover text-white hover:shadow-glow-orange transform hover:-translate-y-0.5'
                    }`}
                  >
                    <span>Next: Booking Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 2: Applicant & Booking Details (No individual items selection required) */}
            {currentStage === 2 && (
              <div className="p-6 sm:p-7 rounded-2xl bg-brand-cream/60 border border-brand-mint-border shadow-soft-sm space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-brand-mint-border">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-full bg-brand-forest text-white font-bold text-xs flex items-center justify-center">
                      2
                    </span>
                    <h3 className="text-lg font-extrabold text-brand-dark">Applicant & Booking Details</h3>
                  </div>
                  <span className="text-xs text-brand-muted font-semibold hidden sm:inline">Step 2 of 2</span>
                </div>

                {/* All-Inclusive Facility Feature Card (Explains that all items are included, no individual picking needed) */}
                <div className="p-4 rounded-xl bg-brand-mint/60 border border-brand-forest/20 text-brand-forest">
                  <div className="flex items-start space-x-2.5">
                    <Sparkles className="w-5 h-5 text-brand-forest shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-brand-forest">
                        All-Inclusive Commercial Facility Access
                      </h4>
                      <p className="text-xs text-brand-dark/90 mt-1 leading-relaxed">
                        Your hourly rental includes full access to our commercial cookline: <strong>6-burner gas ranges, Moffat convection ovens, commercial deep fryers, 20L planetary mixer, bread slicer, stainless steel prep benches, walk-in cool room & freezer space</strong>, and high-speed sanitation stations. No separate item fees or checklist selection required!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Name & Business */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Chef / Manager Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-brand-dark font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                        Business or Brand Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Perth Catering Co."
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-brand-dark font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="you@business.com.au"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-brand-dark font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
                      />
                      <span className="text-[11px] text-brand-muted mt-1 block">
                        Confirmation email & payment instructions will be sent here
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+61 400 000 000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-brand-dark font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Intended Use & Team Size */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                        Intended Kitchen Use
                      </label>
                      <select
                        value={intendedUse}
                        onChange={(e) => setIntendedUse(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-brand-dark font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none cursor-pointer"
                      >
                        <option value="Cloud Kitchen Delivery Prep">Cloud Kitchen Delivery Prep</option>
                        <option value="Event Catering Batch Production">Event Catering Batch Production</option>
                        <option value="Bakery & Pastry Production">Bakery & Pastry Production</option>
                        <option value="Recipe Testing & R&D">Recipe Testing & R&D</option>
                        <option value="Sauce Bottling & Packaging">Sauce Bottling & Packaging</option>
                        <option value="Pop-up / Food Truck Prep">Pop-up / Food Truck Prep</option>
                        <option value="Private Cooking Masterclass">Private Cooking Masterclass</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                        Number of People in Team (Max 8)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={8}
                        value={teamSize}
                        onChange={(e) => setTeamSize(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-brand-dark font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                      Special Storage or Shift Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Describe specific refrigeration needs, allergen considerations, deliveries, or schedule notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-brand-dark font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
                    />
                  </div>

                  {/* Payment notice before submit */}
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5">
                    <CreditCard className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Payment Required After Submitting</p>
                      <p className="mt-0.5 text-amber-800">
                        After submitting, an instant confirmation email with bank details will be sent to you. Your slot will be officially booked once payment is received.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {submitError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Stage 2 Actions: Back & Submit */}
                <div className="pt-4 border-t border-brand-mint-border space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStage(1)}
                      className="w-full sm:w-auto px-5 py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-white border border-gray-300 text-brand-dark hover:bg-gray-50 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Date & Time</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || slotConflict.hasConflict}
                      className={`w-full sm:flex-1 py-4 px-6 rounded-xl font-black text-sm sm:text-base transition-all duration-200 flex items-center justify-center space-x-2.5 shadow-md cursor-pointer ${
                        slotConflict.hasConflict
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-brand-orange hover:bg-brand-orange-hover text-white hover:shadow-glow-orange transform hover:-translate-y-0.5'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Submitting Request...</span>
                        </>
                      ) : (
                        <>
                          <CalendarIcon className="w-5 h-5" />
                          <span>Submit Kitchen Booking Request</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-center text-brand-muted leading-relaxed">
                    By submitting this request, you agree to Daily Drop's Commercial Kitchen Rental Terms 
                    and food safety hygiene regulations.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Right Column (5 cols): Live Price Breakdown & Kitchen Schedule Overview */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Live Pricing Breakdown Card */}
            <div className="bg-white rounded-2xl border border-brand-mint-border shadow-soft-lg p-6 sm:p-7 sticky top-28">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h4 className="text-lg font-extrabold text-brand-dark">Rental Price Breakdown</h4>
                <span className="text-xs px-2.5 py-1 rounded-full bg-brand-mint text-brand-forest font-bold">
                  All-Inclusive Shift
                </span>
              </div>

              <div className="space-y-3.5 py-5 text-sm">
                <div className="flex justify-between items-center text-brand-muted">
                  <span>Selected Date:</span>
                  <span className="font-semibold text-brand-dark">{date}</span>
                </div>

                <div className="flex justify-between items-center text-brand-muted">
                  <span>Time Window:</span>
                  <span className="font-semibold text-brand-dark">
                    {startTime} – {endTimeFormatted}
                  </span>
                </div>

                <div className="flex justify-between items-center text-brand-muted">
                  <span>Rental Hours:</span>
                  <span className="font-semibold text-brand-dark">{duration} Hours</span>
                </div>

                <div className="flex justify-between items-center text-brand-muted">
                  <span>Kitchen Equipment:</span>
                  <span className="font-semibold text-emerald-700">All Appliances Included ($0)</span>
                </div>

                <div className="flex justify-between items-center text-brand-muted">
                  <span>Shift Rate (excl. GST):</span>
                  <span className="font-semibold text-brand-dark">${baseRentalCost.toFixed(2)} AUD</span>
                </div>

                <div className="flex justify-between items-center text-brand-muted">
                  <span>GST (10%):</span>
                  <span className="font-semibold text-brand-dark">${gstAmount.toFixed(2)} AUD</span>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-between items-baseline">
                  <div>
                    <span className="text-base font-bold text-brand-dark">Total Due:</span>
                    <p className="text-[11px] text-brand-muted">Includes power, gas, utilities & GST</p>
                  </div>
                  <span className="text-2xl font-black text-brand-forest">${totalRentalCost.toFixed(2)} AUD</span>
                </div>
              </div>

              {/* Security Deposit Note */}
              <div className="p-3.5 rounded-xl bg-brand-mint/40 border border-brand-mint-border text-xs text-brand-forest space-y-1">
                <div className="flex items-center space-x-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-brand-forest" />
                  <span>Refundable Security Bond: ${securityDeposit.toFixed(2)} AUD</span>
                </div>
                <p className="text-[11px] text-brand-muted leading-relaxed">
                  A standard refundable security bond of $750 AUD is authorised prior to shift start. Released within 24 hours following facility inspection for cleanliness and equipment integrity.
                </p>
              </div>

              {/* Day Occupancy Timeline Visual */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-brand-dark">
                    Schedule for {date}
                  </h5>
                  <span className="text-[11px] text-brand-muted">
                    {availability?.slots.length || 0} scheduled block(s)
                  </span>
                </div>

                {availability?.slots && availability.slots.length > 0 ? (
                  <div className="space-y-2">
                    {availability.slots.map((s, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg text-xs border flex items-center justify-between ${
                          s.status === 'blocked'
                            ? 'bg-gray-100 border-gray-200 text-gray-700'
                            : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Lock className="w-3.5 h-3.5 text-gray-500" />
                          <span className="font-bold">
                            {s.start_time} – {s.end_time}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium">{s.reason || 'Booked Slot'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-800 text-center">
                    The kitchen operates 24/7. All hours are currently open on this date.
                  </div>
                )}
              </div>

              {/* Assistance contact */}
              <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
                <p className="text-xs text-brand-muted">
                  Need a recurring weekly slot or custom hours?
                </p>
                <a
                  href="#contact"
                  className="inline-block mt-1.5 text-xs font-bold text-brand-forest hover:text-brand-orange transition-colors"
                >
                  Contact Kitchen Manager directly →
                </a>
              </div>
            </div>

          </div>

        </form>

      </div>
    </section>
  );
};
