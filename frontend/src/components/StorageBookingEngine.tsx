import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle, 
  CreditCard, 
  ArrowRight, 
  Loader2, 
  Building, 
  User, 
  Mail, 
  ThermometerSnowflake, 
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { StorageType, StorageDurationType, StorageBooking, StorageAvailability } from '../types';
import { CountryCodePhoneInput } from './CountryCodePhoneInput';

interface StorageBookingEngineProps {
  onStorageBooked?: (booking: StorageBooking) => void;
  onRequireAuth?: (message: string) => void;
}

export const StorageBookingEngine: React.FC<StorageBookingEngineProps> = ({
  onStorageBooked,
  onRequireAuth
}) => {
  const currentUser = api.getCurrentUser();

  // Storage selection
  const [storageType, setStorageType] = useState<StorageType>('cool_room');
  const [durationType, setDurationType] = useState<StorageDurationType>('monthly');
  
  // Dates
  const [startDate, setStartDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = useState<string>(() => {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 31);
    return nextMonth.toISOString().split('T')[0];
  });

  // Contact & Business fields
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [businessName, setBusinessName] = useState(currentUser?.business_name || '');
  const [abn, setAbn] = useState(currentUser?.abn || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '+61 ');
  const [notes, setNotes] = useState('');

  // Availability & Submission State
  const [availability, setAvailability] = useState<StorageAvailability | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<StorageBooking | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Sync user details if logged in
  useEffect(() => {
    if (currentUser) {
      if (!fullName) setFullName(currentUser.full_name);
      if (!businessName && currentUser.business_name) setBusinessName(currentUser.business_name);
      if (!abn && currentUser.abn) setAbn(currentUser.abn);
      if (!email) setEmail(currentUser.email);
      if (!phone && currentUser.phone) setPhone(currentUser.phone);
    }
  }, [currentUser]);

  // Handle duration type change
  useEffect(() => {
    const s = new Date(startDate);
    if (isNaN(s.getTime())) return;

    if (durationType === 'daily') {
      const e = new Date(s);
      setEndDate(e.toISOString().split('T')[0]);
    } else if (durationType === 'weekly') {
      const e = new Date(s);
      e.setDate(e.getDate() + 7);
      setEndDate(e.toISOString().split('T')[0]);
    } else if (durationType === 'monthly') {
      const e = new Date(s);
      e.setDate(e.getDate() + 30);
      setEndDate(e.toISOString().split('T')[0]);
    }
  }, [durationType, startDate]);

  // Check availability when dates change
  useEffect(() => {
    if (startDate && endDate) {
      try {
        const result = api.checkStorageAvailability(startDate, endDate);
        setAvailability(result);
      } catch (err: any) {
        console.warn('Storage check error:', err);
      }
    }
  }, [startDate, endDate]);

  // Compute total price
  const calculateTotal = () => {
    if (!startDate || !endDate) return { days: 1, rate: 15, total: 15, bond: 200 };
    const dStart = new Date(startDate);
    const dEnd = new Date(endDate);
    const days = Math.max(1, Math.round((dEnd.getTime() - dStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    let total = 0;
    if (durationType === 'daily' || days === 1) {
      total = days * 15.0;
    } else if (durationType === 'weekly' || days <= 7) {
      total = 70.0 * Math.max(1, Math.ceil(days / 7));
    } else if (durationType === 'monthly' || days <= 31) {
      total = 220.0 * Math.max(1, Math.ceil(days / 30));
    } else {
      total = days * 8.0;
    }

    const bond = 200.0;
    const rate = Number((total / days).toFixed(2));
    return { days, rate, total, bond };
  };

  const pricing = calculateTotal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Auth verification
    if (!api.getCurrentUser()) {
      if (onRequireAuth) {
        onRequireAuth('Please log in or create an account first to book commercial storage space.');
      } else {
        setSubmitError('You must be logged in to reserve storage space.');
      }
      return;
    }

    if (!availability?.available) {
      setSubmitError('Storage capacity reached (Max 2 tenants). Please select different dates.');
      return;
    }

    setIsSubmitting(true);

    try {
      const booking = await api.createStorageBooking({
        full_name: fullName,
        business_name: businessName || undefined,
        abn: abn || undefined,
        email,
        phone,
        storage_type: storageType,
        start_date: startDate,
        end_date: endDate,
        duration_type: durationType,
        special_requirements: notes || undefined
      });

      setSubmitSuccess(booking);
      if (onStorageBooked) {
        onStorageBooked(booking);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Could not complete storage booking. Please check availability.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-brand-mint-border p-6 sm:p-8 shadow-xl relative overflow-hidden">
      
      {/* Decorative Brand Accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-brand-forest/5 rounded-full blur-3xl -z-0 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-100 gap-4 relative z-10">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-forest/10 text-brand-forest text-xs font-bold mb-2">
            <Package className="w-3.5 h-3.5" />
            <span>Dedicated Commercial Storage Bays</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-brand-dark tracking-tight">
            Reserve Storage Space
          </h2>
          <p className="text-xs sm:text-sm text-brand-muted mt-1">
            Secure commercial cool room, freezer, or ambient dry storage with 24/7 keyless access.
          </p>
        </div>

        {/* Capacity Indicator Pill (Strict Max 2 Tenants) */}
        <div className="bg-brand-cream/80 border border-brand-mint-border px-4 py-3 rounded-2xl flex items-center space-x-3 shrink-0">
          <div className={`w-3.5 h-3.5 rounded-full animate-pulse ${
            !availability || availability.available ? 'bg-emerald-500' : 'bg-rose-500'
          }`} />
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-brand-dark">
              Storage Capacity Limit
            </div>
            <div className="text-xs font-semibold text-brand-forest">
              {availability ? (
                availability.available ? (
                  <span>🟢 {availability.available_bays_count} of 2 Bays Available</span>
                ) : (
                  <span className="text-red-600 font-bold">🔴 0 of 2 Available (At Capacity)</span>
                )
              ) : (
                <span>Checking 2-Bay limit...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {submitSuccess ? (
        /* SUCCESS CONFIRMATION VIEW */
        <div className="py-10 text-center space-y-4 max-w-lg mx-auto animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-soft">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-extrabold text-brand-dark">
            Storage Request Received!
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Your storage bay reservation reference is <strong className="text-brand-forest font-mono">{submitSuccess.reference_code}</strong> (Bay #{submitSuccess.bay_number}).
            An instant confirmation email with Commonwealth Bank payment instructions has been sent to <strong>{submitSuccess.email}</strong>.
          </p>
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left">
            <strong>⚠️ Payment Required:</strong> Your storage bay will be officially confirmed and electronic door PIN issued once rental payment is received.
          </div>
          <button
            type="button"
            onClick={() => setSubmitSuccess(null)}
            className="px-6 py-3 rounded-xl bg-brand-forest hover:bg-brand-forest-light text-white text-xs sm:text-sm font-bold shadow-soft transition-all cursor-pointer"
          >
            Book Another Storage Bay
          </button>
        </div>
      ) : (
        /* STORAGE BOOKING FORM */
        <form onSubmit={handleSubmit} className="pt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
          
          {/* Left Column (7 cols): Configuration & Dates */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step 1: Choose Storage Space Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-3">
                1. Select Storage Space Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Cool Room */}
                <button
                  type="button"
                  onClick={() => setStorageType('cool_room')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    storageType === 'cool_room'
                      ? 'border-brand-forest bg-brand-forest/5 ring-2 ring-brand-forest shadow-soft-sm'
                      : 'border-gray-200 hover:border-brand-forest/40 bg-white'
                  }`}
                >
                  <ThermometerSnowflake className={`w-5 h-5 mb-2 ${storageType === 'cool_room' ? 'text-brand-forest' : 'text-gray-400'}`} />
                  <div className="font-bold text-xs sm:text-sm text-brand-dark">Cool Room Bay</div>
                  <div className="text-[11px] text-brand-muted mt-0.5">2°C – 4°C Walk-in</div>
                  <div className="text-xs font-black text-brand-forest mt-2">$220 / mo</div>
                </button>

                {/* Freezer Bay */}
                <button
                  type="button"
                  onClick={() => setStorageType('freezer')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    storageType === 'freezer'
                      ? 'border-brand-forest bg-brand-forest/5 ring-2 ring-brand-forest shadow-soft-sm'
                      : 'border-gray-200 hover:border-brand-forest/40 bg-white'
                  }`}
                >
                  <ThermometerSnowflake className={`w-5 h-5 mb-2 ${storageType === 'freezer' ? 'text-brand-forest' : 'text-gray-400'}`} />
                  <div className="font-bold text-xs sm:text-sm text-brand-dark">Commercial Freezer</div>
                  <div className="text-[11px] text-brand-muted mt-0.5">-18°C Deep Freeze</div>
                  <div className="text-xs font-black text-brand-forest mt-2">$220 / mo</div>
                </button>

                {/* Ambient Dry Storage */}
                <button
                  type="button"
                  onClick={() => setStorageType('dry_storage')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    storageType === 'dry_storage'
                      ? 'border-brand-forest bg-brand-forest/5 ring-2 ring-brand-forest shadow-soft-sm'
                      : 'border-gray-200 hover:border-brand-forest/40 bg-white'
                  }`}
                >
                  <Package className={`w-5 h-5 mb-2 ${storageType === 'dry_storage' ? 'text-brand-forest' : 'text-gray-400'}`} />
                  <div className="font-bold text-xs sm:text-sm text-brand-dark">Dry Ambient Bay</div>
                  <div className="text-[11px] text-brand-muted mt-0.5">Shelving & Packaging</div>
                  <div className="text-xs font-black text-brand-forest mt-2">$220 / mo</div>
                </button>
              </div>
            </div>

            {/* Step 2: Duration Period */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-3">
                2. Select Rental Duration
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'daily', label: '1 Day', sub: '$15 / day' },
                  { id: 'weekly', label: '1 Week', sub: '$70 / wk' },
                  { id: 'monthly', label: '1 Month', sub: '$220 / mo' },
                  { id: 'custom', label: 'Custom Range', sub: 'Flexible' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDurationType(item.id as StorageDurationType)}
                    className={`py-3 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                      durationType === item.id
                        ? 'bg-brand-forest text-white border-brand-forest shadow-soft-sm font-bold'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 text-xs'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className={`text-[10px] mt-0.5 ${durationType === item.id ? 'text-brand-mint' : 'text-gray-400'}`}>
                      {item.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-forest" />
                  <span>Start Date *</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-brand-dark text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-brand-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-forest" />
                  <span>End Date *</span>
                </label>
                <input
                  type="date"
                  required
                  disabled={durationType !== 'custom'}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-brand-forest focus:outline-none ${
                    durationType !== 'custom'
                      ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-brand-dark border-gray-300'
                  }`}
                />
              </div>
            </div>

            {/* Strict Capacity Alert Notice */}
            {availability && (
              <div className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start space-x-3 ${
                availability.available
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {availability.available ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Storage Bay Available!</p>
                      <p className="mt-0.5 text-emerald-800">
                        {availability.available_bays_count} of 2 commercial bays are open for these dates. Assigned to Bay #{availability.available_bay_numbers[0]}.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Storage Capacity Limit Reached (Max 2 Tenants)</p>
                      <p className="mt-0.5 text-rose-800">
                        Both commercial storage bays are already leased for the requested dates. Daily Drop has limited dedicated storage capacity to maintain highest hygiene standards. Please select different dates or contact operations.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Special Storage Requirements */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                Special Storage / Delivery Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Mention specific crates, pallet sizes, allergen separation, or delivery schedules..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-brand-dark text-xs font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
              />
            </div>
          </div>

          {/* Right Column (5 cols): Hirer Credentials & Pricing Summary */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* User Credentials Card */}
            <div className="p-5 rounded-2xl bg-brand-cream/60 border border-brand-mint-border space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-brand-mint-border">
                <span className="text-xs font-extrabold uppercase tracking-wider text-brand-dark">
                  Hirer Credentials
                </span>
                {currentUser ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    ✓ Logged In
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRequireAuth?.('Log in to auto-fill your credentials')}
                    className="text-[11px] font-bold text-brand-forest hover:text-brand-orange underline cursor-pointer"
                  >
                    Log In First
                  </button>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-brand-dark mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Chef / Manager Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
                  />
                  <User className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Business Name & ABN */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-brand-dark mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    placeholder="Perth Catering Co."
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-brand-dark mb-1">
                    ABN (11 Digits)
                  </label>
                  <input
                    type="text"
                    placeholder="54 123 456 789"
                    value={abn}
                    onChange={(e) => setAbn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-brand-dark mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="name@business.com.au"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
                  />
                  <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Phone with Country Code Selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-brand-dark mb-1">
                  Phone (with Country Code) *
                </label>
                <CountryCodePhoneInput
                  value={phone}
                  onChange={(val) => setPhone(val)}
                  required={true}
                  className="w-full"
                />
              </div>
            </div>

            {/* Storage Cost Summary Card */}
            <div className="p-5 rounded-2xl bg-brand-forest text-white space-y-3.5 shadow-soft">
              <div className="flex items-center justify-between pb-2 border-b border-brand-forest-light/30">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-mint">
                  Storage Cost Summary
                </span>
                <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded-md font-mono">
                  {pricing.days} Day{pricing.days > 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-brand-cream/80">
                  <span>Storage Bay Type:</span>
                  <span className="font-bold text-white capitalize">{storageType.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between text-brand-cream/80">
                  <span>Daily Rate:</span>
                  <span className="font-mono text-white">${pricing.rate.toFixed(2)} AUD / day</span>
                </div>
                <div className="flex justify-between text-brand-cream/80">
                  <span>Rental Subtotal:</span>
                  <span className="font-mono text-white">${pricing.total.toFixed(2)} AUD</span>
                </div>
                <div className="flex justify-between text-brand-cream/80">
                  <span>Security Bond (Refundable):</span>
                  <span className="font-mono text-white">${pricing.bond.toFixed(2)} AUD</span>
                </div>
              </div>

              <div className="pt-3 border-t border-brand-forest-light/40 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-brand-mint">Total Rental Due</div>
                  <div className="text-2xl font-black text-brand-orange">
                    ${pricing.total.toFixed(2)} <span className="text-xs text-brand-cream/70 font-normal">AUD</span>
                  </div>
                </div>
                <div className="text-right text-[10px] text-brand-cream/60">
                  Inclusive of GST &<br />24/7 keyless entry PIN
                </div>
              </div>

              {/* Submit Error */}
              {submitError && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-400 text-red-200 text-xs">
                  {submitError}
                </div>
              )}

              {/* Reserve Button */}
              <button
                type="submit"
                disabled={isSubmitting || !availability?.available}
                className={`w-full py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 flex items-center justify-center space-x-2 shadow-md cursor-pointer ${
                  !availability?.available
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : 'bg-brand-orange hover:bg-brand-orange-hover text-white hover:shadow-glow-orange transform hover:-translate-y-0.5'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Booking Storage Bay...</span>
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4" />
                    <span>
                      {availability?.available ? 'Reserve Storage Bay' : 'Storage at Capacity (Max 2)'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-brand-cream/60 leading-tight">
                * Payment required after submission to lock your storage bay. Max 2 tenants permitted.
              </p>
            </div>

          </div>

        </form>
      )}

    </div>
  );
};

