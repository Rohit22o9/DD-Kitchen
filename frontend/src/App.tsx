import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ComeSeeOurKitchen } from './components/ComeSeeOurKitchen';
import { BookingEngine } from './components/BookingEngine';
import { BookingConfirmationModal } from './components/BookingConfirmationModal';
import { OurKitchen } from './components/OurKitchen';
import { Facilities } from './components/Facilities';
import { KitchenUseCases } from './components/KitchenUseCases';
import { WhoCanRent } from './components/WhoCanRent';
import { HowItWorks } from './components/HowItWorks';
import { Pricing } from './components/Pricing';
import { WhyChoose } from './components/WhyChoose';
import { FAQ } from './components/FAQ';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { AdminDashboard } from './components/AdminDashboard';
import { CustomerDashboard } from './components/CustomerDashboard';
import { KitchenConfig, Booking } from './types';
import { api } from './services/api';
import { Calendar, ArrowUp } from 'lucide-react';

export function App() {
  const [config, setConfig] = useState<KitchenConfig | null>(null);
  const [viewMode, setViewMode] = useState<'site' | 'admin' | 'customer'>('site');
  const [latestBooking, setLatestBooking] = useState<Booking | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);

  // Prefill states for booking engine
  const [bookingDate, setBookingDate] = useState<string | undefined>(undefined);
  const [bookingTime, setBookingTime] = useState<string | undefined>(undefined);
  const [bookingDuration, setBookingDuration] = useState<number | undefined>(undefined);

  // Load config on startup
  useEffect(() => {
    async function loadConfig() {
      try {
        const data = await api.getConfig();
        setConfig(data);
      } catch (err) {
        console.warn('Using local fallback config:', err);
        // Fallback defaults
        setConfig({
          hourly_rental_rate: 38.0,
          min_rental_hours: 4,
          operating_hours_start: '00:00',
          operating_hours_end: '24:00',
          cleaning_fee: 0.0,
          security_deposit: 750.0,
          kitchen_name: 'Daily Drop Commercial Kitchen Hub 1',
          kitchen_address: 'Unit 1, 1 Lichfield Street, Victoria Park, Perth, WA, 6101',
          kitchen_phone: '0479 175 705',
          kitchen_email: 'hello@dailydrop.today',
          kitchen_whatsapp: '+61479175705',
          currency_symbol: '$',
        });
      }
    }
    loadConfig();
  }, []);

  const scrollToBooking = (date?: string, time?: string, duration?: number) => {
    setViewMode('site');
    if (date) setBookingDate(date);
    if (time) setBookingTime(time);
    if (duration) setBookingDuration(duration);

    setTimeout(() => {
      const el = document.getElementById('booking-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const scrollToSection = (id: string) => {
    setViewMode('site');
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleBookingSuccess = (booking: Booking) => {
    setLatestBooking(booking);
    setShowConfirmation(true);
  };

  // If viewing admin panel
  if (viewMode === 'admin') {
    return (
      <AdminDashboard
        onBackToSite={() => setViewMode('site')}
        onConfigUpdated={(newConfig) => setConfig(newConfig)}
        onGoToCustomerPortal={() => setViewMode('customer')}
      />
    );
  }

  // If viewing customer dashboard
  if (viewMode === 'customer') {
    return (
      <CustomerDashboard
        onBackToSite={() => setViewMode('site')}
        onGoToAdminPortal={() => setViewMode('admin')}
        onBookClick={() => scrollToBooking()}
      />
    );
  }

  const hourlyRate = config?.hourly_rental_rate || 45.0;

  return (
    <div className="min-h-screen flex flex-col bg-brand-cream text-brand-dark selection:bg-brand-mint selection:text-brand-forest">
      
      {/* Top Sticky Header */}
      <Navbar
        onBookClick={() => scrollToBooking()}
        onAdminClick={() => setViewMode('admin')}
        onCustomerClick={() => setViewMode('customer')}
        isAdminLoggedIn={Boolean(localStorage.getItem('dd_admin_token'))}
      />

      <main className="flex-1">
        {/* 1. Hero Section */}
        <Hero
          config={config}
          onQuickBook={(d, t, dur) => scrollToBooking(d, t, dur)}
          onExploreFacilities={() => scrollToSection('facilities')}
        />

        {/* 1.5. Come See Our Kitchen Walkthrough Banner */}
        <ComeSeeOurKitchen config={config} />

        {/* 2. Our Kitchen Section */}
        <OurKitchen
          onCheckAvailability={() => scrollToBooking()}
        />

        {/* 3. Facilities & Equipment */}
        <Facilities />

        {/* 4. How Can You Use Our Fully Equipped Commercial Kitchens? */}
        <KitchenUseCases
          onStartBooking={() => scrollToBooking()}
        />

        {/* 5. Who Can Rent */}
        <WhoCanRent
          onSelectSegment={() => scrollToBooking()}
        />

        {/* 6. How It Works */}
        <HowItWorks
          onStartBooking={() => scrollToBooking()}
        />

        {/* 7. Transparent Hourly Pricing */}
        <Pricing
          config={config}
          onSelectDuration={(dur) => scrollToBooking(undefined, undefined, dur)}
        />

        {/* 8. Why Choose Daily Drop */}
        <WhyChoose />

        {/* 9. FAQ Section */}
        <FAQ />

        {/* 10. Core Feature: Kitchen Rental Booking Engine */}
        <BookingEngine
          config={config}
          initialDate={bookingDate}
          initialTime={bookingTime}
          initialDuration={bookingDuration}
          onBookingSuccess={handleBookingSuccess}
        />

        {/* 11. Contact & Enquiry */}
        <Contact config={config} />
      </main>

      {/* Footer */}
      <Footer
        config={config}
        onAdminClick={() => setViewMode('admin')}
      />

      {/* Booking Confirmation Modal */}
      {showConfirmation && (
        <BookingConfirmationModal
          booking={latestBooking}
          onClose={() => setShowConfirmation(false)}
        />
      )}

      {/* Mobile Sticky Booking Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-brand-mint-border z-40 flex items-center justify-between shadow-2xl">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">
            Commercial Kitchen
          </span>
          <div className="text-base font-black text-brand-forest">
            ${hourlyRate.toFixed(2)} <span className="text-xs font-semibold text-brand-muted">/ hr</span>
          </div>
        </div>

        <button
          onClick={() => scrollToBooking()}
          className="bg-brand-orange hover:bg-brand-orange-hover text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-soft"
        >
          <Calendar className="w-4 h-4" />
          <span>Book Hours</span>
        </button>
      </div>

    </div>
  );
}

export default App;
