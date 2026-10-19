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
  Check
} from 'lucide-react';
import { KitchenConfig, AvailabilityData, Booking, BookingCreateInput } from '../types';
import { api } from '../services/api';
import { StationTimelineBars } from './StationTimelineBars';

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
  // Tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];

  // Multi-stage stepper state (1: Date & Time, 2: Equipment & Use, 3: Contact & Submit)
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3>(1);

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
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([
    '6-Burner Gas Range',
    'Stainless Food Prep Table',
  ]);
  const [notes, setNotes] = useState('');

  // Availability checking state
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Synchronize when initial props change (e.g. from hero or pricing card click)
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

  // Check if current slot conflicts with availability (Kitchen is 24/7)
  const checkConflict = (): { hasConflict: boolean; reason?: string } => {
    if (!availability) return { hasConflict: false };
    const reqStart = startH * 60 + startM;
    const reqEnd = endMinutesTotal;

    // Check booked / blocked slots on this date
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

  // Handle Equipment Checkbox toggle
  const toggleEquipment = (eq: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(eq) ? prev.filter((item) => item !== eq) : [...prev, eq]
    );
  };

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
        equipment_requirements: selectedEquipment.join(', '),
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

  const equipmentOptions = [
    '6-Burner Gas Range',
    'Rational Combi Oven',
    '2x 20L Commercial Deep Fryers',
    'Stainless Food Prep Table',
    '30L Planetary Mixer',
    'Commercial Bread Slicer',
    'Walk-in Cool Room Space',
    'Upright & Bench Freezer Space',
    'Pass-Through Commercial Dishwasher',
  ];

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
            Book Your Kitchen
          </h2>
          <p className="text-base sm:text-lg text-brand-muted mt-3">
            Choose your date and time slot, configure equipment needs, view transparent pricing, 
            and submit your booking request directly to the Daily Drop kitchen team.
          </p>
        </div>

        {/* Main Grid: Left Side Controls & Form, Right Side Pricing Breakdown & Live Schedule */}
        <form onSubmit={handleSubmitBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Left Column (7 cols): 3-Stage Booking Form */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Interactive 3-Stage Progress Indicator */}
            <div className="bg-brand-cream/70 rounded-2xl p-2.5 sm:p-3 border border-brand-mint-border flex items-center justify-between gap-1 sm:gap-2 shadow-xs">
              {/* Step 1 Pill */}
              <button
                type="button"
                onClick={() => setCurrentStage(1)}
                className={`flex-1 flex items-center justify-center sm:justify-start space-x-2 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
                <span className="truncate">Date & Time</span>
              </button>

              <div className="w-3 sm:w-4 h-0.5 bg-brand-mint-border shrink-0" />

              {/* Step 2 Pill */}
              <button
                type="button"
                onClick={() => {
                  if (!slotConflict.hasConflict) setCurrentStage(2);
                }}
                className={`flex-1 flex items-center justify-center sm:justify-start space-x-2 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
                <span className="truncate">Equipment</span>
              </button>

              <div className="w-3 sm:w-4 h-0.5 bg-brand-mint-border shrink-0" />

              {/* Step 3 Pill */}
              <button
                type="button"
                onClick={() => {
                  if (!slotConflict.hasConflict) setCurrentStage(3);
                }}
                className={`flex-1 flex items-center justify-center sm:justify-start space-x-2 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentStage === 3
                    ? 'bg-brand-forest text-white shadow-sm'
                    : 'text-brand-dark hover:bg-brand-mint/60'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                  currentStage === 3 ? 'bg-white text-brand-forest' : 'bg-brand-forest/20 text-brand-forest'
                }`}>
                  3
                </span>
                <span className="truncate">Details & Submit</span>
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
                  <span className="text-xs text-brand-muted font-semibold hidden sm:inline">Stage 1 of 3</span>
                </div>

                <div className="space-y-4">
                  {/* Date of Rental Picker */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark">
                        Date of Rental (Past dates disabled)
                      </label>
                      <span className="text-[11px] text-brand-muted font-semibold hidden sm:inline">
                        24-Hour Kitchen Open
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="date"
                        min={minDateStr}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-brand-dark font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none shadow-xs"
                      />
                    </div>

                    {/* Quick date shortcuts */}
                    <div className="flex flex-wrap gap-2 mt-2.5">
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

                  {/* 24-Hour Station & Equipment Timeline with Colored Bars (Admin Panel Style) */}
                  <StationTimelineBars
                    selectedDate={date}
                    startTime={startTime}
                    duration={duration}
                    availability={availability}
                    onSelectSlot={(newStart, newDuration) => {
                      setStartTime(newStart);
                      setDuration(newDuration);
                    }}
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
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-brand-dark font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
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
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-brand-dark font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
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
                        Time slot is currently available! Click below to choose equipment.
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
                    className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-md ${
                      slotConflict.hasConflict || loadingAvailability
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-brand-orange hover:bg-brand-orange-hover text-white hover:shadow-glow-orange transform hover:-translate-y-0.5 cursor-pointer'
                    }`}
                  >
                    <span>Next: Kitchen & Equipment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 2: Kitchen Use & Equipment Checklist */}
            {currentStage === 2 && (
              <div className="p-6 sm:p-7 rounded-2xl bg-brand-cream/60 border border-brand-mint-border shadow-soft-sm space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-brand-mint-border">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-full bg-brand-forest text-white font-bold text-xs flex items-center justify-center">
                      2
                    </span>
                    <h3 className="text-lg font-extrabold text-brand-dark">Kitchen Use & Equipment Checklist</h3>
                  </div>
                  <span className="text-xs text-brand-muted font-semibold hidden sm:inline">Stage 2 of 3</span>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-2">
                        Intended Kitchen Use
                      </label>
                      <select
                        value={intendedUse}
                        onChange={(e) => setIntendedUse(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-brand-dark font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
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
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-2">
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

                  {/* Equipment Checkboxes */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-2">
                      Key Equipment Required
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {equipmentOptions.map((eq) => {
                        const checked = selectedEquipment.includes(eq);
                        return (
                          <label
                            key={eq}
                            className={`flex items-center space-x-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                              checked
                                ? 'bg-brand-mint/60 border-brand-forest/40 text-brand-forest font-semibold'
                                : 'bg-white border-gray-200 text-brand-dark hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleEquipment(eq)}
                              className="rounded text-brand-forest focus:ring-brand-forest h-4 w-4"
                            />
                            <span>{eq}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Stage 2 Actions: Back & Next */}
                <div className="pt-4 border-t border-brand-mint-border flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStage(1)}
                    className="px-5 py-3 rounded-xl font-bold text-xs sm:text-sm bg-white border border-gray-300 text-brand-dark hover:bg-gray-50 flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Date</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStage(3)}
                    className="px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-brand-orange hover:bg-brand-orange-hover text-white shadow-md hover:shadow-glow-orange flex items-center space-x-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    <span>Next: Contact Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 3: Contact & Business Information + Submit */}
            {currentStage === 3 && (
              <div className="p-6 sm:p-7 rounded-2xl bg-brand-cream/60 border border-brand-mint-border shadow-soft-sm space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-brand-mint-border">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-full bg-brand-forest text-white font-bold text-xs flex items-center justify-center">
                      3
                    </span>
                    <h3 className="text-lg font-extrabold text-brand-dark">Applicant & Business Information</h3>
                  </div>
                  <span className="text-xs text-brand-muted font-semibold hidden sm:inline">Stage 3 of 3</span>
                </div>

                <div className="space-y-4">
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
                        placeholder="e.g. Sedap Place / Gulati Kitchen"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-brand-dark font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
                      />
                    </div>
                  </div>

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

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                      Additional Notes or Special Requirements
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe specific storage requirements, allergen considerations, deliveries, or schedule notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-brand-dark font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {submitError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Stage 3 Actions: Back & Submit */}
                <div className="pt-4 border-t border-brand-mint-border space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStage(2)}
                      className="w-full sm:w-auto px-5 py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-white border border-gray-300 text-brand-dark hover:bg-gray-50 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Equipment</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || slotConflict.hasConflict}
                      className={`w-full sm:flex-1 py-4 px-6 rounded-xl font-black text-sm sm:text-base transition-all duration-200 flex items-center justify-center space-x-2.5 shadow-md ${
                        slotConflict.hasConflict
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-brand-orange hover:bg-brand-orange-hover text-white hover:shadow-glow-orange transform hover:-translate-y-0.5 cursor-pointer'
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
                    and food safety hygiene regulations. Our kitchen manager will contact you promptly.
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
                  Configured Rate
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
                  <span>Shift Rate (excl. GST):</span>
                  <span className="font-semibold text-brand-dark">${baseRentalCost.toFixed(2)} AUD</span>
                </div>

                <div className="flex justify-between items-center text-brand-muted">
                  <span>GST (10%):</span>
                  <span className="font-semibold text-brand-dark">${gstAmount.toFixed(2)} AUD</span>
                </div>

                <div className="flex justify-between items-center text-brand-muted">
                  <span>Post-shift Clean-down:</span>
                  <span className="font-semibold text-emerald-700">Included ($0.00)*</span>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-between items-baseline">
                  <div>
                    <span className="text-base font-bold text-brand-dark">Total Estimated Cost:</span>
                    <p className="text-[11px] text-brand-muted">Includes power, gas, utilities & GST</p>
                  </div>
                  <span className="text-2xl font-black text-brand-forest">${totalRentalCost.toFixed(2)} AUD</span>
                </div>
                <p className="text-[10px] text-brand-muted italic">
                  *Tenants are responsible for basic station wash-down. Additional fees apply if the kitchen is left uncleaned.
                </p>
              </div>

              {/* Security Deposit Note */}
              <div className="p-3.5 rounded-xl bg-brand-mint/40 border border-brand-mint-border text-xs text-brand-forest space-y-1">
                <div className="flex items-center space-x-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-brand-forest" />
                  <span>Refundable Security Bond: ${securityDeposit.toFixed(2)} AUD</span>
                </div>
                <p className="text-[11px] text-brand-muted leading-relaxed">
                  A standard refundable security bond of $750 AUD is authorised prior to key handover. Released within 24 hours of shift completion following facility inspection for cleanliness and equipment integrity.
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
                    The kitchen is open 24 hours. All hours are currently open on this date.
                  </div>
                )}
              </div>

              {/* Need assistance contact */}
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
