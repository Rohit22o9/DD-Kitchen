import React, { useState } from 'react';
import { Calendar, Phone, Menu, X, ShieldCheck, Clock, Shield } from 'lucide-react';
import { Images } from '../assets/images';

interface NavbarProps {
  onBookClick: () => void;
  onAdminClick: () => void;
  isAdminLoggedIn?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onBookClick, onAdminClick, isAdminLoggedIn }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-nav border-b border-brand-mint-border/60 transition-all shadow-xs">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Kitchen Tagline */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group shrink-0" 
            onClick={() => scrollToSection('hero')}
            title="Daily Drop Commercial Kitchen Home"
          >
            <img
              src={Images.logo}
              alt="Daily Drop Commercial Kitchen Rental"
              className="h-10 sm:h-11 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
            <div className="hidden xl:flex flex-col pl-3 border-l border-brand-mint-border/80">
              <span className="text-[11px] font-black tracking-wider uppercase text-brand-forest leading-tight">
                Commercial Kitchen
              </span>
              <span className="text-[10px] text-brand-muted font-medium">
                Hourly Space Rental
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links — Spacious & Elegant */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-3 text-xs xl:text-sm font-semibold text-brand-dark">
            <button 
              onClick={() => scrollToSection('our-kitchen')} 
              className="px-3 py-1.5 rounded-lg text-brand-dark/90 hover:text-brand-forest hover:bg-brand-mint/50 transition-all cursor-pointer"
            >
              Our Kitchen
            </button>
            <button 
              onClick={() => scrollToSection('facilities')} 
              className="px-3 py-1.5 rounded-lg text-brand-dark/90 hover:text-brand-forest hover:bg-brand-mint/50 transition-all cursor-pointer"
            >
              Facilities
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')} 
              className="px-3 py-1.5 rounded-lg text-brand-dark/90 hover:text-brand-forest hover:bg-brand-mint/50 transition-all cursor-pointer"
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToSection('pricing')} 
              className="px-3 py-1.5 rounded-lg text-brand-dark/90 hover:text-brand-forest hover:bg-brand-mint/50 transition-all cursor-pointer"
            >
              Pricing
            </button>
            <button 
              onClick={() => scrollToSection('faq')} 
              className="px-3 py-1.5 rounded-lg text-brand-dark/90 hover:text-brand-forest hover:bg-brand-mint/50 transition-all cursor-pointer"
            >
              FAQ
            </button>
            <button 
              onClick={() => scrollToSection('contact')} 
              className="px-3 py-1.5 rounded-lg text-brand-dark/90 hover:text-brand-forest hover:bg-brand-mint/50 transition-all cursor-pointer"
            >
              Contact
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center space-x-3 shrink-0">
            <button
              onClick={onAdminClick}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                isAdminLoggedIn
                  ? 'bg-brand-forest/10 text-brand-forest border-brand-forest/30 hover:bg-brand-forest hover:text-white'
                  : 'text-brand-muted hover:text-brand-forest hover:bg-brand-mint/60 border-transparent hover:border-brand-mint-border'
              }`}
              title="Admin Management Portal"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{isAdminLoggedIn ? 'Admin Panel' : 'Staff Login'}</span>
            </button>

            <button
              onClick={onBookClick}
              id="nav-book-cta"
              className="flex items-center space-x-2 bg-brand-orange hover:bg-brand-orange-hover text-white px-5 py-2.5 rounded-xl font-bold text-xs xl:text-sm shadow-md shadow-brand-orange/20 hover:shadow-glow-orange transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Book a Kitchen</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={onBookClick}
              className="bg-brand-orange text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
            >
              Book Now
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-brand-dark hover:text-brand-forest rounded-lg hover:bg-brand-mint/40"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-brand-mint-border bg-white/95 backdrop-blur-md px-6 py-6 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="flex flex-col space-y-4 text-base font-medium text-brand-dark">
            <button
              onClick={() => scrollToSection('hero')}
              className="text-left py-2 hover:text-brand-forest border-b border-gray-100"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('our-kitchen')}
              className="text-left py-2 hover:text-brand-forest border-b border-gray-100"
            >
              Our Kitchen
            </button>
            <button
              onClick={() => scrollToSection('facilities')}
              className="text-left py-2 hover:text-brand-forest border-b border-gray-100"
            >
              Facilities & Equipment
            </button>
            <button
              onClick={() => scrollToSection('use-cases')}
              className="text-left py-2 hover:text-brand-forest border-b border-gray-100"
            >
              Kitchen Use Cases
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-left py-2 hover:text-brand-forest border-b border-gray-100"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-left py-2 hover:text-brand-forest border-b border-gray-100"
            >
              Hourly Pricing
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-left py-2 hover:text-brand-forest border-b border-gray-100"
            >
              Frequently Asked Questions
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-left py-2 hover:text-brand-forest border-b border-gray-100"
            >
              Contact Us
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onAdminClick();
              }}
              className="text-left py-2 text-brand-forest font-semibold flex items-center space-x-2 border-b border-gray-100"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Management Dashboard</span>
            </button>

            <div className="pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onBookClick();
                }}
                className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-md"
              >
                <Calendar className="w-5 h-5" />
                <span>Book Kitchen Slot</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
