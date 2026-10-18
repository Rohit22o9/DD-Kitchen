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
  ChevronDown,
  ChevronUp,
  FileCheck
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
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);

  // Slideshow background images
  const slides = [
    Images.hero,
    Images.cookingRange,
    Images.prepStation,
    Images.coldStorage,
  ];

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
      {/* Main Hero Section matching reference image */}
      <section id="hero" className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 overflow-hidden bg-brand-dark">
        {/* Background Slideshow with subtle dark gradient overlay for text readability */}
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
                className="w-full h-full object-cover object-center filter brightness-95"
              />
            </div>
          ))}
          
          {/* Subtle cinematic gradient: dark on the left for contrast, open and clear on the right */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30 lg:from-black/90 lg:via-black/65 lg:to-black/25" />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Headlines & 3 Badges */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Pill Badge */}
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
                <span>Perth's Flexible Commercial Kitchen Rental</span>
              </div>

              {/* Main Headline with Orange Accent */}
              <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-black text-white tracking-tight leading-[1.12]">
                A Professional <br className="hidden sm:inline" />
                Kitchen, Whenever <br />
                <span className="text-brand-orange">You Need It.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-gray-200 max-w-xl font-normal leading-relaxed">
                Rent a fully equipped, council-compliant commercial kitchen by the hour. 
                Perfect for caterers, food businesses, meal prep and more.
              </p>

              {/* 3 Benefit Cards in a Horizontal Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 max-w-2xl">
                
                {/* 1. Flexible Rentals */}
                <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white/95 backdrop-blur-md shadow-md border border-white/40">
                  <div className="w-10 h-10 rounded-xl bg-brand-mint text-brand-forest flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-brand-forest" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-gray-900 leading-tight">Flexible Rentals</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 font-medium">From 4 hours upwards</p>
                  </div>
                </div>

                {/* 2. Certified Facility */}
                <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white/95 backdrop-blur-md shadow-md border border-white/40">
                  <div className="w-10 h-10 rounded-xl bg-brand-mint text-brand-forest flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-brand-forest" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-gray-900 leading-tight">Certified Facility</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 font-medium">HACCP & Council approved</p>
                  </div>
                </div>

                {/* 3. 24/7 Access */}
                <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white/95 backdrop-blur-md shadow-md border border-white/40">
                  <div className="w-10 h-10 rounded-xl bg-brand-mint text-brand-forest flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-brand-forest" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-gray-900 leading-tight">24/7 Access</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Around your schedule</p>
                  </div>
                </div>

              </div>

            </div>

            {/* Right Column: Reference Card (Check Kitchen Availability) */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl shadow-2xl p-7 sm:p-8 border border-white/40">
                
                {/* Header */}
                <div className="mb-5">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Check Kitchen Availability</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Find your ideal time and get an instant rate.</p>
                </div>

                <form onSubmit={handleQuickSubmit} className="space-y-4">
                  
                  {/* Rental Date */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Rental Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        min={tomorrowStr}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest focus:border-brand-forest transition-all"
                      />
                    </div>
                  </div>

                  {/* Start Time & Duration */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Start Time
                      </label>
                      <select
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest focus:border-brand-forest transition-all cursor-pointer"
                      >
                        <option value="06:00">6:00 AM</option>
                        <option value="07:00">7:00 AM</option>
                        <option value="08:00">8:00 AM</option>
                        <option value="09:00">9:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="13:00">1:00 PM</option>
                        <option value="14:00">2:00 PM</option>
                        <option value="16:00">4:00 PM</option>
                        <option value="18:00">6:00 PM</option>
                        <option value="20:00">8:00 PM</option>
                        <option value="22:00">10:00 PM</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Duration
                      </label>
                      <select
                        value={selectedDuration}
                        onChange={(e) => setSelectedDuration(Number(e.target.value))}
                        className="w-full px-3.5 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-forest focus:border-brand-forest transition-all cursor-pointer"
                      >
                        <option value={2}>2 Hours</option>
                        <option value={4}>4 Hours</option>
                        <option value={6}>6 Hours</option>
                        <option value={8}>8 Hours</option>
                        <option value={10}>10 Hours</option>
                        <option value={12}>12 Hours</option>
                        <option value={24}>24 Hours</option>
                      </select>
                    </div>
                  </div>

                  {/* Estimated Total Row with Accordion Details */}
                  <div className="pt-2">
                    <div 
                      onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
                      className="flex items-center justify-between py-2 px-1 text-sm cursor-pointer select-none"
                    >
                      <span className="font-semibold text-gray-700">Estimated Total</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-xl sm:text-2xl font-black text-emerald-700">
                          ${estimatedTotal.toFixed(2)} <span className="text-xs font-semibold text-gray-500">AUD</span>
                        </span>
                        {showPriceBreakdown ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {showPriceBreakdown && (
                      <div className="p-3 bg-gray-50 rounded-xl space-y-1.5 text-xs text-gray-600 mt-1 animate-in fade-in duration-150">
                        <div className="flex justify-between">
                          <span>Shift Rate ({selectedDuration} hrs excl. GST):</span>
                          <span className="font-semibold text-gray-900">${estimatedSubtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>GST (10%):</span>
                          <span className="font-semibold text-gray-900">${estimatedGst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-medium">
                          <span>Clean-down:</span>
                          <span>Cleaned by Tenant ($0)</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Primary Orange Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base shadow-lg shadow-brand-orange/25 hover:shadow-glow-orange transition-all duration-200 flex items-center justify-center space-x-2 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Check Availability & Proceed</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>

                  <p className="text-[11px] text-center text-gray-400 leading-tight pt-1">
                    No immediate payment required • Instant real-time availability
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
