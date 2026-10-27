import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Building, 
  Phone, 
  ArrowRight, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  ChefHat,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { User as UserType } from '../types';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserType) => void;
  initialTab?: 'login' | 'signup';
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialTab = 'login',
}) => {
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab);
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup fields
  const [signupName, setSignupName] = useState('');
  const [signupBusiness, setSignupBusiness] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const auth = await api.userLogin(loginEmail, loginPassword);
      setSuccessMessage(`Welcome back, ${auth.user.full_name}!`);
      setTimeout(() => {
        onAuthSuccess(auth.user);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (signupPassword !== signupConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const auth = await api.userSignUp({
        email: signupEmail,
        password: signupPassword,
        full_name: signupName,
        business_name: signupBusiness || undefined,
        phone: signupPhone || undefined,
      });

      setSuccessMessage(`Account created successfully! Welcome, ${auth.user.full_name}!`);
      setTimeout(() => {
        onAuthSuccess(auth.user);
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Sign up failed. Please check your information.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setTab('login');
    setLoginEmail('demo@dailydrop.today');
    setLoginPassword('kitchen123');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-brand-mint-border relative max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-brand-dark hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Brand Header */}
        <div className="text-center pb-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-forest text-brand-orange flex items-center justify-center mx-auto mb-2.5 shadow-soft-sm">
            <ChefHat className="w-6 h-6 text-brand-orange" />
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-brand-dark">
            {tab === 'login' ? 'Customer Sign In' : 'Create Customer Account'}
          </h3>
          <p className="text-xs text-brand-muted mt-1">
            Access your kitchen rental bookings, invoices & check-in pins
          </p>
        </div>

        {/* Tab Toggle (Sign In / Sign Up) */}
        <div className="flex bg-brand-cream/80 p-1 rounded-xl mb-5 border border-brand-mint-border">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tab === 'login'
                ? 'bg-brand-forest text-white shadow-xs'
                : 'text-brand-dark hover:text-brand-forest'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tab === 'signup'
                ? 'bg-brand-forest text-white shadow-xs'
                : 'text-brand-dark hover:text-brand-forest'
            }`}
          >
            Sign Up (New User)
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: LOG IN FORM */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@business.com.au"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 bg-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-brand-dark"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-forest hover:bg-brand-forest-light text-white py-3 rounded-xl font-bold text-xs sm:text-sm shadow-soft transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Demo Credentials shortcut */}
            <div className="pt-3 border-t border-gray-100 text-center">
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-xs text-brand-forest hover:text-brand-orange font-semibold underline cursor-pointer"
              >
                Use Demo Account (demo@dailydrop.today / kitchen123)
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: SIGN UP FORM */}
        {tab === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1">
                Full Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Chef / Manager Name"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
                />
                <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1">
                  Business (Opt.)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Bakery / Prep Co"
                    value={signupBusiness}
                    onChange={(e) => setSignupBusiness(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
                  />
                  <Building className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1">
                  Phone (Opt.)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="0400 000 000"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
                  />
                  <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="you@business.com.au"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
                />
                <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Min 6 chars"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
                  />
                  <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1">
                  Confirm *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Repeat password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
                  />
                  <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-brand-muted pt-1">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  className="rounded text-brand-forest focus:ring-brand-forest h-3.5 w-3.5"
                />
                <span>Show passwords</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-3 rounded-xl font-bold text-xs sm:text-sm shadow-soft transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Log In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

