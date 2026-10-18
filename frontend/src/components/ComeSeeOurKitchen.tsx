import React from 'react';
import { Calendar, Phone, MessageSquare, CheckCircle2, MapPin, Clock } from 'lucide-react';
import { KitchenConfig } from '../types';

interface ComeSeeOurKitchenProps {
  config: KitchenConfig | null;
}

export const ComeSeeOurKitchen: React.FC<ComeSeeOurKitchenProps> = ({ config }) => {
  const phoneDisplay = config?.kitchen_phone || '0479 175 705';
  const whatsappNum = config?.kitchen_whatsapp || '+61479175705';

  return (
    <section id="tour-section" className="py-6 sm:py-8 bg-brand-cream/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#0B1A12] text-white p-6 sm:p-8 lg:p-9 shadow-xl border border-emerald-900/60 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-forest/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl space-y-4">
            {/* Header with calendar icon */}
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center shrink-0 text-emerald-400 mt-1">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                  Come See our Kitchen!
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-emerald-400 mt-0.5">
                  Schedule an In-Person Tour
                </p>
              </div>
            </div>

            {/* Description matching user requested text */}
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-3xl">
              See the kitchen before you book! Explore our commercial cooking facilities, check out the equipment and preparation spaces, and ask us any questions about renting the kitchen.
            </p>

            {/* Location & Appointment Details */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-gray-300 pt-0.5">
              <span className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Victoria Park, Perth</span>
              </span>
              <span className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Tours by appointment</span>
              </span>
            </div>

            {/* 3 Green Ticks */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-emerald-300 font-medium pt-1">
              <span className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Inspect Equipment Live</span>
              </span>
              <span className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Meet Facility Manager</span>
              </span>
              <span className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Unit 1, 1 Lichfield St, Victoria Park</span>
              </span>
            </div>

            {/* Call and WhatsApp buttons below the green ticks */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <a
                href={`tel:${phoneDisplay.replace(/\s+/g, '')}`}
                className="bg-brand-orange hover:bg-brand-orange-hover text-white py-3 px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-md hover:shadow-glow-orange transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Call {phoneDisplay}</span>
              </a>

              {whatsappNum && (
                <a
                  href={`https://wa.me/${whatsappNum.replace(/[^0-9]/g, '')}?text=Hello%20Daily%20Drop%20Kitchen,%20I'd%20like%20to%20schedule%20an%20in-person%20kitchen%20tour.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-md transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </a>
              )}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
