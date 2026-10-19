import React from 'react';
import { ShieldCheck, MapPin, Phone, Mail, Clock, Shield } from 'lucide-react';
import { KitchenConfig } from '../types';
import { Images } from '../assets/images';

interface FooterProps {
  config: KitchenConfig | null;
  onAdminClick: () => void;
}

export const Footer: React.FC<FooterProps> = ({ config, onAdminClick }) => {
  const currentYear = new Date().getFullYear();

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-brand-forest-dark text-white border-t border-brand-forest/60 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-white/10">
          
          {/* Brand Col */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center space-x-3">
              <img
                src={Images.logoWhite}
                alt="Daily Drop Commercial Kitchen"
                className="h-10 sm:h-11 w-auto object-contain"
              />
            </div>
            
            <p className="text-sm font-semibold text-brand-orange uppercase tracking-wider">
              “Your Kitchen. Your Hours. Your Business.”
            </p>

            <p className="text-xs text-gray-300 max-w-sm leading-relaxed">
              Daily Drop provides state-of-the-art commercial kitchen infrastructure for rent on a flexible, 
              hourly basis. Supporting restaurants, cloud kitchen startups, caterers, and food innovators.
            </p>

            <div className="pt-2 flex items-center space-x-3">
              <span className="px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-semibold flex items-center space-x-1.5 border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-orange" />
                <span>HACCP Certified</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-semibold flex items-center space-x-1.5 border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-orange" />
                <span>Council Registered</span>
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Platform Navigation</h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li>
                <button onClick={() => scrollTo('hero')} className="hover:text-brand-orange transition-colors">
                  Home & Rate Estimator
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('our-kitchen')} className="hover:text-brand-orange transition-colors">
                  Our Commercial Kitchen
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('facilities')} className="hover:text-brand-orange transition-colors">
                  Facilities & Equipment
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('how-it-works')} className="hover:text-brand-orange transition-colors">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('pricing')} className="hover:text-brand-orange transition-colors">
                  Hourly Rental Pricing
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('faq')} className="hover:text-brand-orange transition-colors">
                  Rental FAQ
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('contact')} className="hover:text-brand-orange transition-colors">
                  Contact & Inquiries
                </button>
              </li>
            </ul>
          </div>

          {/* Location & Hours */}
          <div className="lg:col-span-4 space-y-3 text-xs text-gray-300">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Facility Hub 1</h4>
            
            <p className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
              <span>{config?.kitchen_address || 'Unit 1, 1 Lichfield Street, Victoria Park, Perth, WA, 6101'}</span>
            </p>

            <p className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-brand-orange shrink-0" />
              <span>{config?.kitchen_phone || '0479 175 705'}</span>
            </p>

            <p className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-brand-orange shrink-0" />
              <span>{config?.kitchen_email || 'hello@dailydrop.today'}</span>
            </p>

            <p className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-brand-orange shrink-0" />
              <span>Kitchen Timings 24 hours available (24/7 for booked shifts)</span>
            </p>

            <div className="pt-3">
              <button
                onClick={onAdminClick}
                className="inline-flex items-center space-x-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin & Staff Portal Access</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
          <p>
            © {currentYear} Daily Drop Ventures Pty Ltd. All rights reserved. Commercial Kitchen Infrastructure Platform.
          </p>
          <div className="flex items-center space-x-6 text-[11px]">
            <span>Privacy Policy</span>
            <span>Kitchen Safety Terms</span>
            <span>Food Safety Guidelines</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
