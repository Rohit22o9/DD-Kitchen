import React, { useState } from 'react';
import { 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ArrowRight,
  ClipboardList,
  Sparkles
} from 'lucide-react';
import { KitchenConfig, EnquiryInput } from '../types';
import { api } from '../services/api';

interface ContactProps {
  config: KitchenConfig | null;
}

export const Contact: React.FC<ContactProps> = ({ config }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [enquiryType, setEnquiryType] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryType) {
      setError('Please select what you need from the dropdown.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload: EnquiryInput = {
        name: name.trim(),
        email: email.trim(),
        business_type: enquiryType,
        message: message.trim(),
      };
      await api.submitEnquiry(payload);
      setSuccess(true);
      setName('');
      setEmail('');
      setEnquiryType('');
      setMessage('');
      setTimeout(() => setSuccess(false), 6000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit enquiry. Please try again or reach out directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-12 lg:py-20 bg-brand-cream/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-2 bg-brand-orange-light text-brand-orange px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Questions & Custom Bookings</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-dark tracking-tight">
            Custom Rental Enquiry
          </h2>
          <p className="text-sm sm:text-base text-brand-muted mt-3 max-w-2xl mx-auto leading-relaxed">
            Need regular kitchen access, specialised equipment, or a customised rental arrangement? 
            Tell us what you need and our team will prepare a tailored arrangement for you.
          </p>
        </div>

        {/* Centered Form Card (Styled to match the Book Your Kitchen theme) */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl p-7 sm:p-10 border border-brand-mint-border shadow-soft-lg space-y-6">
            
            <div className="flex items-center space-x-3 pb-4 border-b border-brand-mint-border">
              <div className="w-9 h-9 rounded-xl bg-brand-orange-light text-brand-orange flex items-center justify-center shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-brand-dark tracking-tight">
                  Enquiry Details
                </h3>
                <p className="text-xs text-brand-muted mt-0.5">
                  Fill in your details and we will get back to you promptly.
                </p>
              </div>
            </div>

            {success && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start space-x-3 animate-in fade-in">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Thank you for your enquiry!</p>
                  <p className="mt-0.5 text-emerald-700 text-xs">
                    Our kitchen team has received your message and will reply with customized rate options and availability.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs sm:text-sm flex items-center space-x-2.5">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-brand-mint-border bg-brand-cream/30 text-brand-dark text-xs sm:text-sm placeholder-gray-400 focus:bg-white focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-brand-mint-border bg-brand-cream/30 text-brand-dark text-xs sm:text-sm placeholder-gray-400 focus:bg-white focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                  What Do You Need?
                </label>
                <select
                  required
                  value={enquiryType}
                  onChange={(e) => setEnquiryType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-brand-mint-border bg-brand-cream/30 text-brand-dark text-xs sm:text-sm focus:bg-white focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 focus:outline-none transition-all shadow-2xs cursor-pointer"
                >
                  <option value="" disabled className="text-gray-400">
                    Select enquiry type
                  </option>
                  <option value="Recurring kitchen rental">
                    Recurring kitchen rental
                  </option>
                  <option value="Special equipment requirements">
                    Special equipment requirements
                  </option>
                  <option value="Long-term kitchen hire">
                    Long-term kitchen hire
                  </option>
                  <option value="General enquiry">
                    General enquiry
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                  Message
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tell us about your requirements, preferred days, equipment, or any questions..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-brand-mint-border bg-brand-cream/30 text-brand-dark text-xs sm:text-sm placeholder-gray-400 focus:bg-white focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-3.5 px-6 rounded-xl font-bold text-sm shadow-md shadow-brand-orange/20 hover:shadow-glow-orange transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Sending Enquiry...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Enquiry</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-brand-muted text-center pt-1">
                Your enquiry is securely sent to our management team and synced with Google Sheets.
              </p>
            </form>
          </div>
        </div>

      </div>
    </section>
  );
};
