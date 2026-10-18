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
    <header className="sticky top-0 z-50 glass-nav border-b border-brand-mint-border/60 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => scrollToSection('hero')}>
            <img
              src={Images.logo}
              alt="Daily Drop Commercial Kitchen Rental"
              className="h-10 sm:h-12 w-auto object-contain hover:opacity-95 transition-opacity"
            />
            <div className="hidden sm:flex flex-col pl-2 border-l border-brand-mint-border">
              <span className="text-xs font-bold tracking-wider uppercase text-brand-forest">Commercial Kitchen</span>
              <span className="text-[11px] text-brand-muted">Hourly Space Rental</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-sm font-medium text-brand-dark">
            <button onClick={() => scrollToSection('hero')} className="hover:text-brand-forest transition-colors">
              Home
            </button>
            <button onClick={() => scrollToSection('our-kitchen')} className="hover:text-brand-forest transition-colors">
              Our Kitchen
            </button>
            <button onClick={() => scrollToSection('facilities')} className="hover:text-brand-forest transition-colors">
              Facilities
            </button>
            <button onClick={() => scrollToSection('use-cases')} className="hover:text-brand-forest transition-colors">
              Use Cases
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-brand-forest transition-colors">
              How It Works
            </button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-brand-forest transition-colors">
              Pricing
            </button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-brand-forest transition-colors">
              FAQ
            </button>
            <button onClick={() => scrollToSection('contact')} className="hover:text-brand-forest transition-colors">
              Contact
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={onAdminClick}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isAdminLoggedIn
                  ? 'bg-brand-forest text-white shadow-sm'
                  : 'text-brand-muted hover:text-brand-forest hover:bg-brand-mint/50'
              }`}
              title="Admin Management Portal"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{isAdminLoggedIn ? 'Admin Panel' : 'Staff Login'}</span>
            </button>

            <button
              onClick={onBookClick}
              id="nav-book-cta"
              className="flex items-center space-x-2 bg-brand-orange hover:bg-brand-orange-hover text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-soft transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Calendar className="w-4 h-4" />
              <span>Book a Kitchen</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={onBookClick}
              className="bg-brand-orange text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
            >
              Book Now
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-brand-dark hover:text-brand-forest"
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
