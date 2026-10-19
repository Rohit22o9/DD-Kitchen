import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  ArrowRight, 
  ShieldCheck, 
  Utensils, 
  MapPin, 
  Users,
  Sparkles
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

  // Slideshow background images with actual Daily Drop commercial kitchen photos
  const slides = Images.actual.slideshow;

  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance background slides every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
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
    <>
      {/* Main Hero Section: Fits 1st Screen Viewport (100vh minus navbar) */}
      <section id="hero" className="relative min-h-[calc(100vh-5rem)] flex items-center overflow-hidden bg-brand-cream py-6 lg:py-10">
        
        {/* Background Slideshow: Light, vibrant and clearly visible across full first screen */}
        <div className="absolute inset-0 z-0">
          {slides.map((s, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <img
                src={s}
                alt="Commercial Kitchen"
                className="w-full h-full object-cover object-center filter saturate-105"
              />
            </div>
          ))}
          
          {/* Subtle balanced overlay: natural uniform kitchen photo visibility across the whole width */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/35 to-black/10" />
          <div className="absolute inset-0 bg-black/10" />
        </div>

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Headlines & 3 Benefit Badges */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Pill Badge */}
              <div className="inline-flex items-center space-x-2 bg-black/35 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
                <span>Perth's Flexible Commercial Kitchen Rental</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-black text-white tracking-tight leading-[1.12] drop-shadow-sm">
                A Professional Kitchen, <br />
                <span className="text-brand-orange drop-shadow-sm">Whenever You Need It.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-base text-gray-100 max-w-xl font-normal leading-relaxed drop-shadow-xs">
                Rent a fully equipped, council-compliant commercial kitchen by the hour. 
                Perfect for caterers, food businesses, meal prep and more.
              </p>

              {/* 3 Benefit Cards in a Horizontal Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 max-w-2xl">
                
                {/* 1. Flexible Rentals */}
                <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white/95 backdrop-blur-md shadow-md border border-white/40">
                  <div className="w-9 h-9 rounded-xl bg-brand-mint text-brand-forest flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-brand-forest" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-gray-900 leading-tight">Flexible Rentals</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 font-medium">From 4 hours upwards</p>
                  </div>
                </div>

                {/* 2. Certified Facility */}
                <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white/95 backdrop-blur-md shadow-md border border-white/40">
                  <div className="w-9 h-9 rounded-xl bg-brand-mint text-brand-forest flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-brand-forest" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-gray-900 leading-tight">Certified Facility</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 font-medium">HACCP & Council approved</p>
                  </div>
                </div>

                {/* 3. 24/7 Access */}
                <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white/95 backdrop-blur-md shadow-md border border-white/40">
                  <div className="w-9 h-9 rounded-xl bg-brand-mint text-brand-forest flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-brand-forest" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-gray-900 leading-tight">24/7 Access</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Around your schedule</p>
                  </div>
                </div>

              </div>

            </div>

            {/* Right Column: High-Contrast, Balanced Rate Calculator Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-6 border border-gray-100/80 ring-1 ring-black/5 relative backdrop-blur-xl">
                
                {/* Header: Instant Rate Calculator + Price Badge */}
                <div className="flex items-start justify-between pb-3 border-b border-gray-100 gap-2.5">
                  <div>
                    <div className="inline-flex items-center space-x-1.5 bg-brand-orange-light text-brand-orange px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1 border border-brand-orange/20">
                      <Sparkles className="w-2.5 h-2.5 text-brand-orange" />
                      <span>Instant Rate Calculator</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-tight">
                      Check Hourly Availability
                    </h3>
                  </div>
                  
                  <div className="text-right bg-brand-cream/80 border border-brand-mint-border px-3 py-1.5 rounded-xl shadow-xs shrink-0">
                    <div className="flex items-baseline space-x-0.5 justify-end">
                      <span className="text-2xl sm:text-3xl font-black text-brand-forest">$38</span>
                      <span className="text-xs font-bold text-gray-600">/hr + GST</span>
                    </div>
                    <span className="text-[11px] text-brand-orange font-extrabold block mt-0.5">
                      Min 4h ($152 + GST)
                    </span>
                  </div>
                </div>

                <form onSubmit={handleQuickSubmit} className="space-y-3 pt-3">
                  
                  {/* 1. SELECT RENTAL DATE */}
                  <div>
                    <label className="block text-[11px] font-black text-gray-800 uppercase tracking-wider mb-1">
                      1. SELECT RENTAL DATE
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        min={tomorrowStr}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 font-bold text-sm focus:outline-none focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 shadow-xs transition-all"
                      />
                    </div>
                  </div>

                  {/* 2. START TIME & 3. DURATION */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-black text-gray-800 uppercase tracking-wider mb-1">
                        2. START TIME
                      </label>
                      <select
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 font-bold text-xs sm:text-sm focus:outline-none focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 shadow-xs transition-all cursor-pointer"
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
                      <label className="block text-[11px] font-black text-gray-800 uppercase tracking-wider mb-1">
                        3. DURATION
                      </label>
                      <select
                        value={selectedDuration}
                        onChange={(e) => setSelectedDuration(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 font-bold text-xs sm:text-sm focus:outline-none focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 shadow-xs transition-all cursor-pointer"
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

                  {/* High-Contrast Pricing Breakdown Card */}
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100/90 space-y-1.5 text-xs shadow-xs">
                    <div className="flex justify-between items-center text-gray-700">
                      <span className="font-semibold text-xs">Shift Rental ({selectedDuration} hrs excl. GST):</span>
                      <span className="font-extrabold text-gray-900 text-xs sm:text-sm">${estimatedSubtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-gray-700">
                      <span className="font-semibold text-xs">GST (10%):</span>
                      <span className="font-extrabold text-gray-900 text-xs sm:text-sm">${estimatedGst.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center text-gray-700">
                      <span className="font-semibold text-xs">End-of-Shift Clean:</span>
                      <span className="font-extrabold text-emerald-800 text-xs">Cleaned by Tenant ($0)</span>
                    </div>

                    <div className="pt-2 border-t border-emerald-200/80 flex justify-between items-center">
                      <span className="text-xs sm:text-sm font-black text-gray-900">Total Estimated (inc. GST):</span>
                      <span className="text-xl sm:text-2xl font-black text-brand-orange">
                        ${estimatedTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Dark Forest Green Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-[#1A3A25] hover:bg-[#245033] text-white py-3.5 px-6 rounded-xl font-black text-sm shadow-md shadow-emerald-950/20 hover:shadow-emerald-950/30 transition-all duration-200 flex items-center justify-center space-x-2 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    <span>Check Availability & Proceed</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-[11px] text-center text-gray-500 font-medium leading-tight">
                    No immediate payment required. Availability verified in real time before booking request submission.
                  </p>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6 Features Ribbon Strip (Matching reference image) */}
      <div className="bg-white border-b border-gray-200/80 py-5 sm:py-6 shadow-xs relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 sm:gap-6 items-center">
            
            {/* 1. Fully Equipped */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-brand-mint text-brand-forest flex items-center justify-center shrink-0">
                <Utensils className="w-5 h-5 text-brand-forest" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 leading-tight">Fully Equipped</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Professional-grade appliances</p>
              </div>
            </div>

            {/* 2. Prime Location */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-brand-mint text-brand-forest flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-brand-forest" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 leading-tight">Prime Location</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Victoria Park, Perth</p>
              </div>
            </div>

            {/* 3. Perfect for Your Business */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-brand-mint text-brand-forest flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-brand-forest" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 leading-tight">Perfect for Your Business</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Caterers, meal prep, food trucks & more</p>
              </div>
            </div>

            {/* 4. Clean & Compliant */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-brand-mint text-brand-forest flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-brand-forest" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 leading-tight">Clean & Compliant</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">HACCP & Council approved</p>
              </div>
            </div>

            {/* 5. Transparent Pricing */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-brand-mint text-brand-forest flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 text-brand-forest" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 leading-tight">Transparent Pricing</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">No hidden costs</p>
              </div>
            </div>

            {/* 6. Recurring Bookings */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-brand-mint text-brand-forest flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-brand-forest" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 leading-tight">Recurring Bookings</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Save time with regular slots</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};
