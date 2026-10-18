import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2
} from 'lucide-react';
import { KitchenConfig } from '../types';
import { Images } from '../assets/images';

interface HeroProps {
  config: KitchenConfig | null;
  onQuickBook: (date: string, startTime: string, duration: number) => void;
  onExploreFacilities?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ config, onQuickBook, onExploreFacilities }) => {
  // Tomorrow's date formatted as YYYY-MM-DD
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(tomorrowStr);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [selectedDuration, setSelectedDuration] = useState(4);

  // Slideshow data for top hero banner
  const slides = [
    {
      src: Images.hero,
      title: 'Main Commercial Kitchen & Island Range',
      subtitle: 'Garland 6-burner gas range, 304 stainless prep line & extraction canopy',
      badge: 'Hub 1 — Perth WA',
    },
    {
      src: Images.prepStation,
      title: 'Stainless Food Preparation Workstations',
      subtitle: 'Grade 304 food-grade stainless tables & Hobart 30L planetary mixer',
      badge: 'Dedicated Prep Workbenches',
    },
    {
      src: Images.cookingRange,
      title: 'High-Output Cooking Line & Combi Station',
      subtitle: 'Rational iCombi Pro 10-tray steamer & twin 20L commercial deep fryers',
      badge: 'Commercial Cooking Line',
    },
    {
      src: Images.coldStorage,
      title: 'Commercial Walk-in Cool Room & Freezers',
      subtitle: 'HACCP-monitored 2°C walk-in cool room + upright and bench freezers',
      badge: 'Cold Storage Allocation',
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance background slides every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

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
    <section id="hero" className="relative pt-8 pb-16 lg:py-24 overflow-hidden bg-brand-cream">
      {/* Background Slideshow with smooth fade transitions */}
      <div className="absolute inset-0 z-0">
        {slides.map((s, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <img
              src={s.src}
              alt={s.title}
              className="w-full h-full object-cover object-center filter saturate-105"
            />
          </div>
        ))}
        {/* Translucent overlay: preserves text contrast on the left while showcasing the kitchen photo on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/60 to-transparent lg:from-white/92 lg:via-white/50 lg:to-black/20" />
        <div className="absolute inset-0 bg-black/5" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Headlines & Benefits */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Brand Badge */}
            <div className="inline-flex items-center space-x-2 bg-brand-mint text-brand-forest px-4 py-2 rounded-full border border-brand-mint-border text-xs sm:text-sm font-bold shadow-soft-sm">
              <span className="w-2 h-2 rounded-full bg-brand-forest animate-pulse" />
              <span>Daily Drop Commercial Kitchen Infrastructure</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-brand-dark tracking-tight leading-[1.12]">
              A Professional Kitchen, <br />
              <span className="text-brand-forest">Whenever You Need It.</span>
            </h1>

            {/* Core Value Proposition */}
            <p className="text-lg sm:text-xl text-brand-muted max-w-2xl font-normal leading-relaxed">
              Skip the massive capital expense and multi-year leases of setting up your own space. 
              Rent Daily Drop’s certified commercial kitchen by the hour and focus on scaling your food business.
            </p>

            {/* Tagline Box */}
            <div className="p-4 rounded-xl bg-white/90 backdrop-blur-sm border border-brand-mint-border/90 shadow-soft-sm max-w-xl">
              <p className="text-sm font-extrabold text-brand-forest tracking-wide uppercase">
                “Your Kitchen. Your Hours. Your Business.”
              </p>
              <p className="text-xs text-brand-muted mt-1">
                We provide the compliant commercial infrastructure; you produce on your exact schedule.
              </p>
            </div>

            {/* Benefit Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-xl">
              <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-white/90 backdrop-blur-sm border border-brand-mint-border/80 shadow-xs">
                <div className="p-2 rounded-lg bg-brand-mint text-brand-forest shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-dark">Flexible Rentals</h4>
                  <p className="text-[11px] text-brand-muted">From 4 hrs upwards</p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-white/90 backdrop-blur-sm border border-brand-mint-border/80 shadow-xs">
                <div className="p-2 rounded-lg bg-brand-mint text-brand-forest shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-dark">Certified Facility</h4>
                  <p className="text-[11px] text-brand-muted">HACCP & Council approved</p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-white/90 backdrop-blur-sm border border-brand-mint-border/80 shadow-xs">
                <div className="p-2 rounded-lg bg-brand-mint text-brand-forest shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-dark">24/7 Access</h4>
                  <p className="text-[11px] text-brand-muted">Around your schedule</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Centerpiece Interactive Booking Card */}
          <div className="lg:col-span-5">
            <div className="relative group">
              {/* Backing decorative glow */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-brand-orange/40 via-brand-forest/30 to-brand-orange/30 rounded-3xl blur-xl opacity-60 group-hover:opacity-85 transition-opacity" />

              <div className="relative bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-brand-forest/20 p-6 sm:p-8 hover:border-brand-forest/40 transition-all">
                
                {/* Header with Price Badge */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div>
                    <div className="inline-flex items-center space-x-1.5 bg-brand-orange-light text-brand-orange px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider mb-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Instant Rate Calculator</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-brand-dark">Check Hourly Availability</h3>
                  </div>
                  <div className="text-right bg-brand-cream/90 px-3.5 py-2 rounded-2xl border border-brand-mint-border shadow-xs">
                    <div className="flex items-baseline space-x-1 justify-end">
                      <span className="text-2xl sm:text-3xl font-black text-brand-forest">$38</span>
                      <span className="text-xs font-bold text-brand-muted">/hr</span>
                    </div>
                    <span className="text-[10px] text-brand-orange font-extrabold">+ GST (Min 4h)</span>
                  </div>
                </div>

                <form onSubmit={handleQuickSubmit} className="space-y-4 pt-5">
                  {/* Select Date */}
                  <div>
                    <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>1. Select Rental Date</span>
                      <span className="text-[11px] font-semibold text-brand-forest flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Live Slots</span>
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        min={tomorrowStr}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-brand-cream/50 text-brand-dark font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest focus:bg-white transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Select Start Time & Duration */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1.5">
                        2. Start Time
                      </label>
                      <select
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-xl border border-gray-200 bg-brand-cream/50 text-brand-dark font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest focus:bg-white transition-all shadow-inner"
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
                        className="w-full px-3.5 py-3 rounded-xl border border-gray-200 bg-brand-cream/50 text-brand-dark font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest focus:bg-white transition-all shadow-inner"
                      >
                        <option value={2}>2 Hours (Test Shift — $100)</option>
                        <option value={4}>4 Hours (Standard Base — $152)</option>
                        <option value={6}>6 Hours (Extended Prep — $204)</option>
                        <option value={8}>8 Hours (Full Shift — $256)</option>
                        <option value={10}>10 Hours ($310)</option>
                        <option value={12}>12 Hours (Commercial Run — $360)</option>
                        <option value={24}>24 Hours (Full-Day Access — $696)</option>
                      </select>
                    </div>
                  </div>

                  {/* Estimated Pricing Breakdown Card */}
                  <div className="p-4 rounded-2xl bg-brand-mint/60 border border-brand-mint-border space-y-2 text-xs">
                    <div className="flex justify-between text-brand-muted">
                      <span>Shift Rental ({selectedDuration} hrs excl. GST):</span>
                      <span className="font-bold text-brand-dark">${estimatedSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-brand-muted">
                      <span>GST (10%):</span>
                      <span className="font-bold text-brand-dark">${estimatedGst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-brand-muted">
                      <span>Cleaning Fee:</span>
                      <span className="font-bold text-emerald-800">$0 (Cleaned by Tenant)</span>
                    </div>
                    <div className="pt-2 border-t border-brand-mint-border/90 flex justify-between items-center text-sm font-bold text-brand-forest">
                      <span className="font-extrabold">Estimated Total:</span>
                      <span className="text-xl text-brand-orange font-black">${estimatedTotal.toFixed(2)} <span className="text-xs font-semibold text-brand-muted">AUD</span></span>
                    </div>
                  </div>

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-4 px-6 rounded-2xl font-black text-base shadow-lg shadow-brand-orange/30 hover:shadow-glow-orange transition-all duration-200 flex items-center justify-center space-x-2.5 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    <span>Check Availability & Proceed</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <p className="text-[11px] text-center text-brand-muted leading-tight pt-1">
                    No immediate payment required • Instant real-time availability check
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
