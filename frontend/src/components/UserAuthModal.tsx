import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Building, 
  ArrowRight, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  ChefHat,
  Upload,
  FileCheck,
  ShieldCheck,
  Info,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { User as UserType } from '../types';
import { CountryCodePhoneInput } from './CountryCodePhoneInput';
import { TermsAndConditionsModal } from './TermsAndConditionsModal';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserType) => void;
  initialTab?: 'login' | 'signup';
  promptMessage?: string;
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialTab = 'login',
  promptMessage,
}) => {
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab);
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup fields
  const [signupName, setSignupName] = useState('');
  const [signupBusiness, setSignupBusiness] = useState('');
  const [signupAbn, setSignupAbn] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('+61 ');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  // Compliance uploads
  const [fssFileName, setFssFileName] = useState<string>('');
  const [fssFileData, setFssFileData] = useState<string>('');
  const [insuranceFileName, setInsuranceFileName] = useState<string>('');
  const [insuranceFileData, setInsuranceFileData] = useState<string>('');

  // Terms & Conditions acceptance
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'fss' | 'insurance'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Uploaded file is too large. Please upload files under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (type === 'fss') {
        setFssFileName(file.name);
        setFssFileData(base64);
      } else {
        setInsuranceFileName(file.name);
        setInsuranceFileData(base64);
      }
    };
    reader.readAsDataURL(file);
  };

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

    if (!termsAccepted) {
      setErrorMessage("Please accept Daily Drop Ventures' Terms & Conditions to register.");
      return;
    }

    setIsLoading(true);

    try {
      const auth = await api.userSignUp({
        email: signupEmail,
        password: signupPassword,
        full_name: signupName,
        business_name: signupBusiness || undefined,
        abn: signupAbn.trim() || undefined,
        phone: signupPhone.trim() || undefined,
        food_safety_cert_name: fssFileName || undefined,
        food_safety_cert_data: fssFileData || undefined,
        liability_insurance_name: insuranceFileName || undefined,
        liability_insurance_data: insuranceFileData || undefined,
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString()
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
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-brand-mint-border relative max-h-[92vh] overflow-y-auto">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-brand-dark hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Brand Header */}
          <div className="text-center pb-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-forest text-brand-orange flex items-center justify-center mx-auto mb-2.5 shadow-soft-sm">
              <ChefHat className="w-6 h-6 text-brand-orange" />
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-brand-dark">
              {tab === 'login' ? 'Customer Sign In' : 'Create Commercial Account'}
            </h3>
            <p className="text-xs text-brand-muted mt-1">
              {tab === 'login'
                ? 'Sign in to reserve kitchen shifts, rent storage, and view entry PINs'
                : 'Join Daily Drop Commercial Kitchens (Perth, WA) in 60 seconds'}
            </p>
          </div>

          {/* Informational Prompt Message if triggered from booking */}
          {promptMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5 shadow-2xs">
              <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold">Account Required to Book</p>
                <p className="mt-0.5 text-amber-800 leading-relaxed">{promptMessage}</p>
              </div>
            </div>
          )}

          {/* Tab Toggle (Sign In / Sign Up) */}
          <div className="flex bg-brand-cream/80 p-1 rounded-xl mb-4 border border-brand-mint-border">
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
              Sign Up (New Hirer)
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
                    <span>Sign In & Continue</span>
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

          {/* TAB 2: SIGN UP FORM WITH COMPLIANCE UPLOADS & T&C */}
          {tab === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3.5">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Chef / Kitchen Hirer Name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
                  />
                  <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Business Name & ABN (Australian Business Number) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1">
                    Business / Brand Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Perth Catering Co."
                      value={signupBusiness}
                      onChange={(e) => setSignupBusiness(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
                    />
                    <Building className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1 flex items-center justify-between">
                    <span>ABN (11 Digits)</span>
                    <span className="text-[10px] text-brand-muted font-normal">Australian Business No.</span>
                  </label>
                  <input
                    type="text"
                    placeholder="51 824 753 556"
                    value={signupAbn}
                    onChange={(e) => setSignupAbn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-medium focus:ring-2 focus:ring-brand-forest focus:outline-none"
                  />
                </div>
              </div>

              {/* Email Address */}
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

              {/* Phone Number with Country Code Dropdown */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1">
                  Phone Number (with Country Code) *
                </label>
                <CountryCodePhoneInput
                  value={signupPhone}
                  onChange={(val) => setSignupPhone(val)}
                  required={true}
                  className="w-full"
                />
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                    Confirm Password *
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

              {/* Compliance Certification Upload Section */}
              <div className="pt-2 pb-1 border-t border-dashed border-gray-200">
                <span className="block text-xs font-extrabold uppercase tracking-wider text-brand-forest mb-2 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Mandatory Compliance & Insurance (Initial Signup)</span>
                </span>
                
                <div className="space-y-2">
                  {/* 1. Food Safety Supervisor Certificate (FSS) */}
                  <div className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/70">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-gray-800">
                        1. Food Safety Supervisor Certificate (FSS)
                      </span>
                      <span className="text-[10px] text-brand-muted">WA Food Act 2008</span>
                    </div>
                    {fssFileName ? (
                      <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                        <span className="flex items-center space-x-1.5 truncate">
                          <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{fssFileName}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFssFileName('');
                            setFssFileData('');
                          }}
                          className="text-red-500 hover:text-red-700 ml-2 font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center space-x-2 border border-dashed border-gray-300 rounded-lg p-2 bg-white hover:bg-brand-mint/20 cursor-pointer text-xs text-gray-600 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-brand-forest" />
                        <span>Upload FSS Certificate (PDF or Image)</span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => handleFileUpload(e, 'fss')}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* 2. Public Liability Insurance Certificate (COC) */}
                  <div className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/70">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-gray-800">
                        2. Public Liability Certificate of Currency (COC)
                      </span>
                      <span className="text-[10px] text-brand-muted">Min. $10M Policy</span>
                    </div>
                    {insuranceFileName ? (
                      <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                        <span className="flex items-center space-x-1.5 truncate">
                          <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{insuranceFileName}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setInsuranceFileName('');
                            setInsuranceFileData('');
                          }}
                          className="text-red-500 hover:text-red-700 ml-2 font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center space-x-2 border border-dashed border-gray-300 rounded-lg p-2 bg-white hover:bg-brand-mint/20 cursor-pointer text-xs text-gray-600 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-brand-forest" />
                        <span>Upload Insurance COC (PDF or Image)</span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => handleFileUpload(e, 'insurance')}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Daily Drop Ventures' Terms & Conditions Acceptance Checkbox */}
              <div className="p-3 rounded-xl bg-brand-cream/90 border border-brand-mint-border">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded text-brand-forest focus:ring-brand-forest h-4 w-4 shrink-0 cursor-pointer"
                  />
                  <div className="text-xs text-brand-dark leading-tight">
                    <span>I accept </span>
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="font-bold text-brand-forest underline hover:text-brand-orange inline-flex items-center space-x-0.5 cursor-pointer"
                    >
                      <span>Daily Drop Ventures' Terms & Conditions</span>
                      <ExternalLink className="w-3 h-3 inline" />
                    </button>
                    <span> to use the commercial kitchen and facilities. *</span>
                  </div>
                </label>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading || !termsAccepted}
                className={`w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm shadow-soft transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer mt-3 ${
                  termsAccepted
                    ? 'bg-brand-orange hover:bg-brand-orange-hover text-white hover:shadow-glow-orange'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering Account & Compliance...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </div>

      {/* Terms & Conditions Modal */}
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => setTermsAccepted(true)}
      />
    </>
  );
};
