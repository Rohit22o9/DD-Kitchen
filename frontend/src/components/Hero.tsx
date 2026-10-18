import React, { useState } from 'react';
import { Calendar, Clock, DollarSign, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { KitchenConfig } from '../types';
import { Images } from '../assets/images';

interface HeroProps {
  config: KitchenConfig | null;
  onQuickBook: (date: string, startTime: string, duration: number) => void;
  onExploreFacilities: () => void;
}

export const Hero: React.FC<HeroProps> = ({ config, onQuickBook, onExploreFacilities }) => {
  // Tomorrow's date formatted as YYYY-MM-DD
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(tomorrowStr);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [selectedDuration, setSelectedDuration] = useState(4);

  // Tiered pricing: 2h=$100, 4h=$152 ($38/h base), 8h=$256 ($32/h), 12h=$360 ($30/h)
  const getHeroTierPrice = (hrs: number): number => {
    if (hrs === 2) return 100.0;
    if (hrs === 4) return 152.0;
    if (hrs === 6) return 204.0;
    if (hrs === 8) return 256.0;
    if (hrs === 10) return 310.0;
    if (hrs === 12) return 360.0;
    if (hrs === 24) return 696.0;
    return hrs * 38.0;
  };

  const estimatedSubtotal = getHeroTierPrice(selectedDuration);
  const estimatedGst = estimatedSubtotal * 0.10;
  const estimatedTotal = estimatedSubtotal + estimatedGst;

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onQuickBook(selectedDate, selectedTime, selectedDuration);
  };

  return (
    <section id="hero" className="relative pt-6 pb-16 lg:py-20 overflow-hidden bg-gradient-to-b from-brand-mint/40 via-brand-cream to-white">
      {/* Background soft ambient accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-forest/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headlines & Benefits */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Brand Badge */}
            <div className="inline-flex items-center space-x-2 bg-brand-mint text-brand-forest px-4 py-2 rounded-full border border-brand-mint-border text-xs sm:text-sm font-semibold shadow-soft-sm">
              <span className="w-2 h-2 rounded-full bg-brand-forest animate-pulse" />
              <span>Daily Drop Commercial Kitchen Infrastructure</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-dark tracking-tight leading-[1.12]">
              A Professional Kitchen, <br />
              <span className="text-brand-forest">Whenever You Need It.</span>
            </h1>

            {/* Core Value Proposition */}
            <p className="text-lg sm:text-xl text-brand-muted max-w-2xl font-normal leading-relaxed">
              Skip the massive capital expense and multi-year leases of setting up your own space. 
              Rent Daily Drop’s certified commercial kitchen by the hour and focus on scaling your food business.
            </p>

            {/* Tagline Box */}
            <div className="p-4 rounded-xl bg-white/80 border border-brand-mint-border/80 shadow-soft-sm max-w-xl">
              <p className="text-sm font-bold text-brand-forest tracking-wide uppercase">
                “Your Kitchen. Your Hours. Your Business.”
              </p>
              <p className="text-xs text-brand-muted mt-1">
                We provide the compliant commercial infrastructure; you produce on your exact schedule.
              </p>
            </div>

            {/* Benefit Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-xl">
              <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-white/70 border border-brand-mint-border/60">
                <div className="p-1.5 rounded-md bg-brand-mint text-brand-forest">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-dark">Flexible Hourly Rentals</h4>
                  <p className="text-[11px] text-brand-muted">From 4 hrs upwards</p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-white/70 border border-brand-mint-border/60">
                <div className="p-1.5 rounded-md bg-brand-mint text-brand-forest">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-dark">Commercial Facilities</h4>
                  <p className="text-[11px] text-brand-muted">HACCP & Council approved</p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-white/70 border border-brand-mint-border/60">
                <div className="p-1.5 rounded-md bg-brand-mint text-brand-forest">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-dark">Around Your Schedule</h4>
                  <p className="text-[11px] text-brand-muted">Kitchen Timings 24 hours available</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onQuickBook(selectedDate, selectedTime, selectedDuration)}
                className="bg-brand-orange hover:bg-brand-orange-hover text-white px-7 py-3.5 rounded-xl font-bold text-base shadow-soft hover:shadow-glow-orange transition-all duration-200 flex items-center space-x-2.5 transform hover:-translate-y-0.5"
              >
                <span>Book Your Kitchen</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreFacilities}
                className="bg-white hover:bg-brand-mint/40 text-brand-forest border border-brand-mint-border px-6 py-3.5 rounded-xl font-semibold text-base transition-colors shadow-soft-sm"
              >
                Explore Facilities & Equipment
              </button>
            </div>

            {/* Kitchen Photo Preview Thumbnail */}
            <div className="pt-4 flex items-center space-x-4">
              <div className="relative rounded-xl overflow-hidden w-28 h-18 border-2 border-white shadow-soft">
                <img src={Images.hero} alt="Daily Drop Kitchen" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-xs font-bold text-brand-dark">Daily Drop Kitchen Hub 1 — Perth WA</p>
                <p className="text-[11px] text-brand-muted">Unit 1, 1 Lichfield Street, Victoria Park • 88 sqm Commercial Footprint</p>
              </div>
            </div>

          </div>

          {/* Right Column: Floating Interactive Booking Card */}
          <div className="lg:col-span-5">
            <div className="relative">
              {/* Backing decorative glow */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-brand-forest/20 to-brand-orange/20 rounded-3xl blur-lg opacity-70" />

              <div className="relative bg-white rounded-2xl shadow-soft-lg border border-brand-mint-border p-6 sm:p-8">
                <div className="flex items-center justify-between pb-5 border-b border-gray-100">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">Instant Rate Calculator</span>
                    <h3 className="text-xl font-extrabold text-brand-dark mt-0.5">Check Hourly Availability</h3>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline space-x-1 justify-end">
                      <span className="text-2xl font-black text-brand-forest">$38</span>
                      <span className="text-xs font-semibold text-brand-muted">/hr + GST</span>
                    </div>
                    <span className="text-[10px] text-brand-orange font-bold">Min 4h ($152 + GST)</span>
                  </div>
                </div>

                <form onSubmit={handleQuickSubmit} className="space-y-4 pt-5">
                  {/* Select Date */}
                  <div>
                    <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1.5">
                      1. Select Rental Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        min={tomorrowStr}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-brand-cream/40 text-brand-dark font-medium text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Select Start Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1.5">
                        2. Start Time
                      </label>
                      <select
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-brand-cream/40 text-brand-dark font-medium text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest"
                      >
                        <option value="00:00">12:00 AM (Midnight)</option>
                        <option value="02:00">02:00 AM (Overnight)</option>
                        <option value="04:00">04:00 AM (Early Baker)</option>
                        <option value="06:00">06:00 AM (Morning Bake)</option>
                        <option value="07:00">07:00 AM</option>
                        <option value="08:00">08:00 AM (Morning Shift)</option>
                        <option value="09:00">09:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="12:00">12:00 PM (Noon Prep)</option>
                        <option value="14:00">02:00 PM (Afternoon)</option>
                        <option value="16:00">04:00 PM (Evening Prep)</option>
                        <option value="18:00">06:00 PM (Dinner Service)</option>
                        <option value="20:00">08:00 PM (Night Shift)</option>
                        <option value="22:00">10:00 PM (Late Shift)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1.5">
                        3. Duration
                      </label>
                      <select
                        value={selectedDuration}
                        onChange={(e) => setSelectedDuration(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-brand-cream/40 text-brand-dark font-medium text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest"
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

                  {/* Estimated Pricing Breakdown Card */}
                  <div className="p-3.5 rounded-xl bg-brand-mint/50 border border-brand-mint-border space-y-1.5 text-xs">
                    <div className="flex justify-between text-brand-muted">
                      <span>Shift Rental ({selectedDuration} hrs excl. GST):</span>
                      <span className="font-semibold text-brand-dark">${estimatedSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-brand-muted">
                      <span>GST (10%):</span>
                      <span className="font-semibold text-brand-dark">${estimatedGst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-brand-muted">
                      <span>End-of-Shift Clean:</span>
                      <span className="font-semibold text-emerald-800">Cleaned by Tenant ($0)</span>
                    </div>
                    <div className="pt-1.5 border-t border-brand-mint-border/80 flex justify-between items-center text-sm font-bold text-brand-forest">
                      <span>Total Estimated (inc. GST):</span>
                      <span className="text-base text-brand-orange font-black">${estimatedTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    className="w-full bg-brand-forest hover:bg-brand-forest-light text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-soft transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <span>Check Availability & Proceed</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-[11px] text-center text-brand-muted leading-tight">
                    No immediate payment required. Availability verified in real time before booking request submission.
                  </p>
                </form>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
