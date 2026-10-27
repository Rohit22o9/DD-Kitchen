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
  CreditCard,
  Package,
  ExternalLink,
  UserCheck
} from 'lucide-react';
import { KitchenConfig, AvailabilityData, Booking, BookingCreateInput } from '../types';
import { api, formatDisplayTime, formatDisplayDate } from '../services/api';
import { AvailabilityTimelineBar } from './AvailabilityTimelineBar';
import { CountryCodePhoneInput } from './CountryCodePhoneInput';
import { TermsAndConditionsModal } from './TermsAndConditionsModal';
import { StorageBookingEngine } from './StorageBookingEngine';

interface BookingEngineProps {
  config: KitchenConfig | null;
  initialDate?: string;
  initialTime?: string;
  initialDuration?: number;
  onBookingSuccess: (booking: Booking) => void;
  currentUser?: any;
  onRequireAuth?: (message: string) => void;
  initialServiceTab?: 'kitchen' | 'storage';
}

export const BookingEngine: React.FC<BookingEngineProps> = ({
  config,
  initialDate,
  initialTime,
  initialDuration,
  onBookingSuccess,
  currentUser: propUser,
  onRequireAuth,
  initialServiceTab = 'kitchen'
}) => {
  // Service Type Switcher: Kitchen Rental OR Storage Space
  const [activeServiceTab, setActiveServiceTab] = useState<'kitchen' | 'storage'>(initialServiceTab);

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
  const [abn, setAbn] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+61 ');
  const [intendedUse, setIntendedUse] = useState('Cloud Kitchen Delivery Prep');
  const [teamSize, setTeamSize] = useState(2);
  const [notes, setNotes] = useState('');

  // Terms and conditions
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Auth gate modal state
  const [showAuthGateModal, setShowAuthGateModal] = useState(false);

  // Availability checking state
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Pre-fill user details if logged in
  useEffect(() => {
    const user = propUser || api.getCurrentUser();
    if (user) {
      if (user.full_name && !fullName) setFullName(user.full_name);
      if (user.business_name && !businessName) setBusinessName(user.business_name);
      if (user.abn && !abn) setAbn(user.abn);
      if (user.email && !email) setEmail(user.email);
      if (user.phone && (!phone || phone === '+61 ')) setPhone(user.phone);
      if (user.terms_accepted) setTermsAccepted(true);
    }
  }, [propUser]);

  // Synchronize when initial props change
  useEffect(() => {
    if (initialDate) setDate(initialDate);
    if (initialTime) setStartTime(initialTime);
    if (initialDuration) setDuration(initialDuration);
    if (initialServiceTab) setActiveServiceTab(initialServiceTab);
  }, [initialDate, initialTime, initialDuration, initialServiceTab]);

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

  // Calculate requested time interval [startMin, endMin]
  const [startH, startM] = startTime.split(':').map(Number);
  const reqStartMin = (startH || 0) * 60 + (startM || 0);
  const reqEndMin = reqStartMin + Math.round(duration * 60);

  // Compute end time formatted
  const endH = Math.floor(reqEndMin / 60) % 24;
  const endM = reqEndMin % 60;
  const endTimeFormatted = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

  // Real-time conflict validation
  const checkSlotConflict = () => {
    if (!availability || !availability.slots) return { hasConflict: false, conflictReason: '' };
    
    for (const s of availability.slots) {
      const [sh, sm] = (s.start_time || '00:00').split(':').map(Number);
      const [eh, em] = (s.end_time || '24:00').split(':').map(Number);
      let sMin = sh * 60 + sm;
      let eMin = eh * 60 + em;
      if (eMin <= sMin) eMin = 24 * 60;

      // Overlap: reqStart < eMin && reqEnd > sMin
      if (reqStartMin < eMin && reqEndMin > sMin) {
        return {
          hasConflict: true,
          conflictReason: s.status === 'blocked' 
            ? `Maintenance block from ${formatDisplayTime(s.start_time)} to ${formatDisplayTime(s.end_time)}`
            : `Already reserved (${formatDisplayTime(s.start_time)} – ${formatDisplayTime(s.end_time)})`,
        };
      }
    }
    return { hasConflict: false, conflictReason: '' };
  };

  const slotConflict = checkSlotConflict();

  // Guard for advancing to Stage 2: Requires Logged-In User
  const handleProceedToStage2 = () => {
    const user = api.getCurrentUser();
    if (!user) {
      setShowAuthGateModal(true);
      return;
    }
    if (!slotConflict.hasConflict) {
      setCurrentStage(2);
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Verify authentication again before submitting
    const user = api.getCurrentUser();
    if (!user) {
      setShowAuthGateModal(true);
      return;
    }

    if (slotConflict.hasConflict) {
      setSubmitError('The selected time slot is no longer available. Please choose another time.');
      return;
    }

    if (!termsAccepted) {
      setSubmitError("Please accept Daily Drop Ventures' Terms & Conditions to complete your booking.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: BookingCreateInput = {
        full_name: fullName,
        business_name: businessName || undefined,
        abn: abn.trim() || undefined,
        email,
        phone,
        booking_date: date,
        start_time: startTime,
        duration_hours: duration,
        intended_use: intendedUse,
        team_size: teamSize,
        equipment_requirements: 'All-Inclusive Commercial Facility Access',
        additional_notes: notes || undefined,
      };

      const bookingResult = await api.createBooking(payload);
      onBookingSuccess(bookingResult);
    } catch (err: any) {
      setSubmitError(err.message || 'Could not submit your reservation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="booking-section" className="py-10 lg:py-14 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center space-x-2 bg-brand-orange-light text-brand-orange px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Commercial Booking Engine</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-dark tracking-tight">
            Reserve Kitchen Shifts & Storage Bays
          </h2>
          <p className="text-base sm:text-lg text-brand-muted mt-2">
            Fully licensed commercial food production facility in Victoria Park, Perth WA.
          </p>

          {/* Timezone Label Banner */}
          <div className="inline-flex items-center space-x-2 mt-3 px-3 py-1 rounded-full bg-brand-forest/10 border border-brand-forest/20 text-brand-forest text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>Operating on Australian Perth Time (AWST · UTC+8)</span>
          </div>
        </div>

        {/* Top Service Switcher: Kitchen Rental vs Storage Space */}
        <div className="flex justify-center mb-8">
          <div className="bg-brand-cream/80 p-1.5 rounded-2xl border border-brand-mint-border inline-flex shadow-sm gap-1.5">
            <button
              type="button"
              onClick={() => setActiveServiceTab('kitchen')}
              className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                activeServiceTab === 'kitchen'
                  ? 'bg-brand-forest text-white shadow-soft'
                  : 'text-brand-dark hover:text-brand-forest hover:bg-brand-mint/40'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>Commercial Kitchen Shift</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveServiceTab('storage')}
              className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                activeServiceTab === 'storage'
                  ? 'bg-brand-forest text-white shadow-soft'
                  : 'text-brand-dark hover:text-brand-forest hover:bg-brand-mint/40'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Storage Space (Max 2 Bays)</span>
            </button>
          </div>
        </div>

        {/* If Storage Tab is Active */}
        {activeServiceTab === 'storage' ? (
          <StorageBookingEngine
            onRequireAuth={(msg) => {
              if (onRequireAuth) {
                onRequireAuth(msg);
              } else {
                setShowAuthGateModal(true);
              }
            }}
          />
        ) : (
          /* Main Kitchen Booking Grid */
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

                {/* Step 2 Pill (Auth Protected) */}
                <button
                  type="button"
                  onClick={handleProceedToStage2}
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

              {/* Logged in indicator banner in Stage 1 */}
              {api.getCurrentUser() ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Signed in as <strong>{api.getCurrentUser()?.full_name}</strong> ({api.getCurrentUser()?.email})</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Verified Hirer</span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-brand-mint/40 border border-brand-forest/20 text-brand-forest text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-3.5 h-3.5 text-brand-forest shrink-0" />
                    <span>Commercial hirers must log in or sign up before finalizing a slot.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAuthGateModal(true)}
                    className="font-bold underline text-brand-orange hover:text-brand-orange-hover ml-2 shrink-0 cursor-pointer"
                  >
                    Log In / Sign Up
                  </button>
                </div>
              )}

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
                    <span className="text-xs text-brand-forest font-bold bg-brand-mint px-2.5 py-1 rounded-full">
                      AWST (Perth)
                    </span>
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
                      </div>
                    </div>

                    {/* Duration Buttons with Discount Badges */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-2">
                        Rental Duration (Hours)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          { hours: 2, label: '2 Hours', price: '$100', badge: 'Standard' },
                          { hours: 4, label: '4 Hours', price: '$152', badge: 'Most Popular' },
                          { hours: 8, label: '8 Hours', price: '$256', badge: 'Best Value' },
                          { hours: 12, label: '12 Hours', price: '$360', badge: 'Full Day' },
                        ].map((tier) => (
                          <button
                            key={tier.hours}
                            type="button"
                            onClick={() => setDuration(tier.hours)}
                            className={`p-3 rounded-xl border text-center transition-all cursor-pointer relative overflow-hidden ${
                              duration === tier.hours
                                ? 'bg-brand-forest text-white border-brand-forest shadow-soft-sm font-bold'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-brand-forest/40 hover:bg-brand-cream/40'
                            }`}
                          >
                            <div className="text-xs font-bold">{tier.label}</div>
                            <div className={`text-xs mt-0.5 ${duration === tier.hours ? 'text-brand-mint' : 'text-brand-forest font-bold'}`}>
                              {tier.price} AUD
                            </div>
                            <div className={`text-[9px] uppercase tracking-wider mt-1 px-1.5 py-0.5 rounded-full inline-block ${
                              duration === tier.hours
                                ? 'bg-white/20 text-white'
                                : 'bg-brand-cream text-brand-muted font-medium'
                            }`}>
                              {tier.badge}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Start Time Selector */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-2">
                        Start Time (AWST - Perth Time)
                      </label>
                      <select
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-brand-dark font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none cursor-pointer"
                      >
                        <option value="06:00">06:00 AM AWST (Early Morning Prep)</option>
                        <option value="08:00">08:00 AM AWST (Morning Shift)</option>
                        <option value="09:00">09:00 AM AWST</option>
                        <option value="10:00">10:00 AM AWST</option>
                        <option value="12:00">12:00 PM AWST (Lunch Production)</option>
                        <option value="14:00">02:00 PM AWST (Afternoon Shift)</option>
                        <option value="16:00">04:00 PM AWST</option>
                        <option value="18:00">06:00 PM AWST (Evening Delivery Prep)</option>
                        <option value="20:00">08:00 PM AWST (Night Shift)</option>
                        <option value="22:00">10:00 PM AWST (Overnight Batching)</option>
                      </select>
                      <span className="text-[11px] text-brand-muted mt-1 block">
                        Shift concludes at <strong>{formatDisplayTime(endTimeFormatted)} AWST</strong> ({duration}h total)
                      </span>
                    </div>

                    {/* Visual Day Schedule Timeline Bar */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark">
                          Occupancy Bar for {formatDisplayDate(date)}
                        </label>
                        <span className="text-[11px] text-brand-muted">
                          {loadingAvailability ? 'Checking live slots...' : '24-hour visual schedule'}
                        </span>
                      </div>
                      <AvailabilityTimelineBar
                        date={date}
                        slots={availability?.slots || []}
                        selectedStartTime={startTime}
                        selectedDuration={duration}
                        hasConflict={slotConflict.hasConflict}
                        conflictReason={slotConflict.conflictReason}
                      />
                    </div>

                    {/* Conflict Warning or Success */}
                    {slotConflict.hasConflict ? (
                      <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2.5">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Requested Slot Is Not Available</p>
                          <p className="mt-0.5">{slotConflict.conflictReason}. Please select a different start time or date.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span className="font-medium">
                          Time slot ({formatDisplayTime(startTime)} – {formatDisplayTime(endTimeFormatted)} AWST) is available! Click next to proceed.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stage 1 Action: Next Button (Auth Protected) */}
                  <div className="pt-4 border-t border-brand-mint-border flex justify-end">
                    <button
                      type="button"
                      disabled={slotConflict.hasConflict || loadingAvailability}
                      onClick={handleProceedToStage2}
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

              {/* STAGE 2: Applicant & Booking Details */}
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

                  {/* All-Inclusive Facility Feature Card */}
                  <div className="p-4 rounded-xl bg-brand-mint/60 border border-brand-forest/20 text-brand-forest">
                    <div className="flex items-start space-x-2.5">
                      <Sparkles className="w-5 h-5 text-brand-forest shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-brand-forest">
                          All-Inclusive Commercial Facility Access
                        </h4>
                        <p className="text-xs text-brand-dark/90 mt-1 leading-relaxed">
                          Your hourly rental includes full access to our commercial cookline: <strong>6-burner gas ranges, Moffat convection ovens, commercial deep fryers, 20L planetary mixer, bread slicer, stainless steel prep benches, walk-in cool room & freezer space</strong>, and high-speed sanitation stations. No separate equipment fees required!
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
                          Business or Brand Name
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

                    {/* ABN Details (Australian Business Number) */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5 flex items-center justify-between">
                        <span>Australian Business Number (ABN)</span>
                        <span className="text-[10px] text-brand-muted font-normal">11 digits (e.g. 51 824 753 556)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="51 824 753 556"
                        value={abn}
                        onChange={(e) => setAbn(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-brand-dark font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
                      />
                    </div>

                    {/* Email & Phone with Country Code Dropdown */}
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
                          Instant booking confirmation & PayID/EFT sent here
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                          Phone Number (with Country Code) *
                        </label>
                        <CountryCodePhoneInput
                          value={phone}
                          onChange={(val) => setPhone(val)}
                          required={true}
                          className="w-full"
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
                        Special Shift Notes (Optional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Mention refrigeration requirements, deliveries, or allergen considerations..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-brand-dark font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
                      />
                    </div>

                    {/* Daily Drop Ventures Terms & Conditions Acceptance Checkbox */}
                    <div className="p-3.5 rounded-xl bg-brand-cream/90 border border-brand-mint-border">
                      <label className="flex items-start space-x-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          required
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="mt-0.5 rounded text-brand-forest focus:ring-brand-forest h-4 w-4 shrink-0 cursor-pointer"
                        />
                        <div className="text-xs text-brand-dark leading-tight">
                          <span>I accept </span>
                          <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="font-bold text-brand-forest underline hover:text-brand-orange inline-flex items-center space-x-0.5 cursor-pointer"
                          >
                            <span>Daily Drop Ventures' Terms & Conditions</span>
                            <ExternalLink className="w-3 h-3 inline" />
                          </button>
                          <span> to use the commercial kitchen and facilities. *</span>
                        </div>
                      </label>
                    </div>

                    {/* Payment notice before submit */}
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5">
                      <CreditCard className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Payment Required After Submitting</p>
                        <p className="mt-0.5 text-amber-800">
                          After submitting, an instant confirmation email with Commonwealth Bank details and PayID will be sent to you. Your slot is held temporarily and officially booked once payment is received.
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
                        disabled={isSubmitting || slotConflict.hasConflict || !termsAccepted}
                        className={`w-full sm:flex-1 py-4 px-6 rounded-xl font-black text-sm sm:text-base transition-all duration-200 flex items-center justify-center space-x-2.5 shadow-md cursor-pointer ${
                          slotConflict.hasConflict || !termsAccepted
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
                      By submitting this request, you agree to Daily Drop Ventures' Commercial Kitchen Rental Terms 
                      and WA Food Safety regulations.
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
                    <span className="font-semibold text-brand-dark">{formatDisplayDate(date)}</span>
                  </div>

                  <div className="flex justify-between items-center text-brand-muted">
                    <span>Time Window (AWST):</span>
                    <span className="font-semibold text-brand-dark">
                      {formatDisplayTime(startTime)} – {formatDisplayTime(endTimeFormatted)}
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
                      Schedule for {formatDisplayDate(date)}
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
                              {formatDisplayTime(s.start_time)} – {formatDisplayTime(s.end_time)} AWST
                            </span>
                          </div>
                          <span className="text-[10px] uppercase font-bold tracking-wider">
                            {s.status === 'blocked' ? 'Maintenance' : 'Reserved'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-gray-50 text-center text-xs text-brand-muted">
                      No other bookings on this date. Whole kitchen available!
                    </div>
                  )}
                </div>

              </div>

            </div>

          </form>
        )}

      </div>

      {/* POPUP MODAL: Login or Sign Up Instruction when attempting to book without logging in */}
      {showAuthGateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-brand-mint-border relative text-center">
            
            {/* Close button */}
            <button
              onClick={() => setShowAuthGateModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-brand-dark hover:bg-gray-100 transition-colors cursor-pointer"
            >
              ✕
            </button>

            {/* Icon & Heading */}
            <div className="w-14 h-14 rounded-3xl bg-brand-forest text-brand-orange flex items-center justify-center mx-auto mb-4 shadow-soft">
              <Lock className="w-7 h-7 text-brand-orange" />
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-brand-mint text-brand-forest text-xs font-bold uppercase tracking-wider mb-2">
              Account Required
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-brand-dark tracking-tight">
              Sign In to Book a Slot
            </h3>

            <p className="text-xs sm:text-sm text-gray-600 mt-2.5 leading-relaxed">
              To comply with commercial kitchen food safety standards and receive your electronic door PIN, <strong>all hirers must have an account before booking</strong>. Please sign in or create an account in 60 seconds.
            </p>

            <div className="p-3 my-4 rounded-xl bg-brand-cream/80 border border-brand-mint-border text-xs text-brand-forest font-medium">
              ✓ Your selected slot (<strong>{formatDisplayDate(date)} · {formatDisplayTime(startTime)}</strong>) will be saved!
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAuthGateModal(false);
                  if (onRequireAuth) {
                    onRequireAuth('Please sign in to confirm your booking.');
                  }
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-brand-forest hover:bg-brand-forest-light text-white font-bold text-xs sm:text-sm shadow-soft transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Sign In to Existing Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAuthGateModal(false);
                  if (onRequireAuth) {
                    onRequireAuth('Sign up for a new account with your compliance documents.');
                  }
                }}
                className="w-full py-3 px-4 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white font-bold text-xs sm:text-sm shadow-soft transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Create New Account (60 secs)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAuthGateModal(false)}
                className="w-full py-2.5 text-xs text-brand-muted hover:text-brand-dark font-medium transition-colors cursor-pointer"
              >
                Cancel & Continue Browsing
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Terms & Conditions Modal */}
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => setTermsAccepted(true)}
      />

    </section>
  );
};
