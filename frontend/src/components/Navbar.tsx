import React, { useState } from 'react';
import { Calendar, Phone, Menu, X, ShieldCheck, Clock, Shield, User as UserIcon, LogOut } from 'lucide-react';
import { Images } from '../assets/images';
import { User } from '../types';

interface NavbarProps {
  onBookClick: () => void;
  onStorageClick?: () => void;
  onAdminClick: () => void;
  onCustomerClick?: () => void;
  onLoginClick?: () => void;
  currentUser?: User | null;
  onLogout?: () => void;
  isAdminLoggedIn?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onBookClick, 
  onStorageClick,
  onAdminClick, 
  onCustomerClick, 
  onLoginClick,
  currentUser,
  onLogout,
  isAdminLoggedIn 
}) => {
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
              className="h-10 sm:h-11 w-auto object-contain mix-blend-multiply transition-transform group-hover:scale-[1.02]"
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

          {/* Desktop Navigation Links */}
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
              onClick={() => {
                if (onStorageClick) onStorageClick();
                else scrollToSection('booking-section');
              }} 
              className="px-3 py-1.5 rounded-lg text-brand-forest font-bold hover:bg-brand-mint/60 transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <span>Storage Space</span>
              <span className="text-[9px] font-black uppercase tracking-wider bg-brand-orange text-white px-1.5 py-0.5 rounded-full">
                Max 2
              </span>
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
          <div className="hidden md:flex items-center space-x-2.5 shrink-0">
            {/* User Log In / Account Status */}
            {currentUser ? (
              <div className="flex items-center space-x-1.5 bg-brand-cream border border-brand-mint-border rounded-xl p-1 pr-2">
                <button
                  onClick={onCustomerClick}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-brand-forest hover:bg-brand-mint/50 transition-all cursor-pointer"
                  title="View Your Bookings & Profile"
                >
                  <UserIcon className="w-3.5 h-3.5 text-brand-forest" />
                  <span className="max-w-[120px] truncate">{currentUser.full_name}</span>
                </button>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-white transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-brand-dark border border-gray-300 hover:bg-gray-50 transition-all cursor-pointer shadow-2xs"
                title="Customer Sign In / Sign Up"
              >
                <UserIcon className="w-3.5 h-3.5 text-brand-forest" />
                <span>Log In / Sign Up</span>
              </button>
            )}

            <button
              onClick={onAdminClick}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-brand-forest border border-brand-forest/30 hover:bg-brand-mint/50 hover:border-brand-forest/50 transition-all cursor-pointer shadow-2xs"
              title="Admin Management Portal"
            >
              <Shield className="w-3.5 h-3.5 text-brand-forest" />
              <span>Admin</span>
            </button>

            <button
              onClick={onBookClick}
              id="nav-book-cta"
              className="flex items-center space-x-2 bg-brand-orange hover:bg-brand-orange-hover text-white px-4 xl:px-5 py-2.5 rounded-xl font-bold text-xs xl:text-sm shadow-md shadow-brand-orange/20 hover:shadow-glow-orange transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Kitchen</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center space-x-2">
            {currentUser ? (
              <button
                onClick={onCustomerClick}
                className="bg-brand-forest text-white text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center space-x-1"
              >
                <UserIcon className="w-3 h-3" />
                <span className="max-w-[70px] truncate">{currentUser.full_name.split(' ')[0]}</span>
              </button>
            ) : (
              <button
                onClick={onLoginClick}
                className="bg-brand-forest text-white text-xs font-bold px-2.5 py-1.5 rounded-lg"
              >
                Log In
              </button>
            )}
            <button
              onClick={onBookClick}
              className="bg-brand-orange text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
            >
              Book
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-brand-dark hover:text-brand-forest rounded-lg hover:bg-brand-mint/40 cursor-pointer"
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
          <div className="flex flex-col space-y-3.5 text-base font-medium text-brand-dark">
            {currentUser ? (
              <div className="p-3 rounded-xl bg-brand-cream border border-brand-mint-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-brand-forest">{currentUser.full_name}</p>
                  <p className="text-[11px] text-brand-muted">{currentUser.email}</p>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout?.();
                  }}
                  className="text-xs text-red-600 font-bold px-2 py-1 bg-white rounded-lg border border-red-200"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLoginClick?.();
                }}
                className="text-left py-2 font-bold text-brand-forest flex items-center space-x-2 border-b border-gray-100"
              >
                <UserIcon className="w-4 h-4" />
                <span>Customer Sign In / Sign Up</span>
              </button>
            )}

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
              onClick={() => scrollToSection('pricing')}
              className="text-left py-2 hover:text-brand-forest border-b border-gray-100"
            >
              Hourly Pricing
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onStorageClick) onStorageClick();
                else scrollToSection('booking-section');
              }}
              className="text-left py-2 text-brand-forest font-bold flex items-center justify-between border-b border-gray-100"
            >
              <span>Commercial Storage Space</span>
              <span className="text-[9px] bg-brand-orange text-white px-2 py-0.5 rounded-full font-black">
                Max 2 Bays
              </span>
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

            {currentUser && onCustomerClick && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onCustomerClick();
                }}
                className="text-left py-2 text-brand-forest font-semibold flex items-center space-x-2 border-b border-gray-100"
              >
                <UserIcon className="w-4 h-4" />
                <span>Customer Dashboard</span>
              </button>
            )}

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
                className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-md cursor-pointer"
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
