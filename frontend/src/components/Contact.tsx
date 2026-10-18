import React, { useState } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ArrowRight,
  ClipboardList
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

  const phoneDisplay = config?.kitchen_phone || '0479 175 705';
  const emailDisplay = config?.kitchen_email || 'hello@dailydrop.today';
  const addressDisplay = config?.kitchen_address || 'Unit 1, 1 Lichfield Street, Victoria Park WA 6101';
  const whatsappNum = config?.kitchen_whatsapp || '+61479175705';

  return (
    <section id="contact" className="py-10 lg:py-16 bg-brand-cream/50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header matching Image 2 */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand-orange bg-brand-orange-light px-3.5 py-1.5 rounded-full inline-block mb-3">
            QUESTIONS & CUSTOM BOOKINGS
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-dark tracking-tight">
            Let's Talk About Your Kitchen Needs
          </h2>
          <p className="text-sm sm:text-base text-brand-muted mt-3 max-w-2xl mx-auto leading-relaxed">
            Need regular kitchen access, specialised equipment, or a customised rental arrangement? Get in touch with our team to discuss your requirements.
          </p>
        </div>

        {/* 2-Card Layout matching Image 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
          
          {/* Left Card: Visit or Contact Us (5 cols) */}
          <div className="lg:col-span-5 bg-[#0C120E] text-white rounded-3xl p-7 sm:p-8 border border-emerald-950/80 shadow-xl flex flex-col justify-between space-y-7">
            <div className="space-y-6">
              <div className="flex items-center space-x-2.5 pb-4 border-b border-white/10">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Visit or Contact Us
                </h3>
              </div>

              <div className="space-y-4 text-sm text-gray-300">
                <div>
                  <h4 className="font-extrabold text-white text-base">Daily Drop Kitchens</h4>
                  <p className="text-xs sm:text-sm text-gray-300 mt-1 leading-relaxed">
                    {addressDisplay}
                  </p>
                </div>

                <div className="pt-2 space-y-3">
                  <a 
                    href={`tel:${phoneDisplay.replace(/\s+/g, '')}`} 
                    className="flex items-center space-x-3 text-gray-200 hover:text-white transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-xs sm:text-sm">{phoneDisplay}</span>
                  </a>

                  <a 
                    href={`mailto:${emailDisplay}`} 
                    className="flex items-center space-x-3 text-gray-200 hover:text-white transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-xs sm:text-sm">{emailDisplay}</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Chat on WhatsApp Button */}
            {whatsappNum && (
              <div className="pt-2">
                <a
                  href={`https://wa.me/${whatsappNum.replace(/[^0-9]/g, '')}?text=Hello%20Daily%20Drop%20Kitchen,%20I'd%20like%20to%20enquire%20about%20kitchen%20rental.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#1EA952] hover:bg-[#1B9949] text-white py-3.5 px-5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2.5 shadow-md transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            )}
          </div>

          {/* Right Card: Custom Rental Enquiry (7 cols) */}
          <div className="lg:col-span-7 bg-[#0C120E] text-white rounded-3xl p-7 sm:p-8 border border-emerald-950/80 shadow-xl">
            <div className="flex items-center space-x-2.5 pb-4 border-b border-white/10 mb-5">
              <ClipboardList className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Custom Rental Enquiry
                </h3>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed mb-6">
              Tell us what you need and we'll help you find a suitable rental arrangement.
            </p>

            {success && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-900/50 border border-emerald-500 text-emerald-200 text-xs flex items-start space-x-2.5 animate-fadeIn">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Thank you for your enquiry!</p>
                  <p className="mt-0.5 text-gray-300">Our kitchen team has received your message and will reply with rate options and availability.</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Your name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141C16] border border-gray-700/60 text-white placeholder-gray-500 text-xs sm:text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141C16] border border-gray-700/60 text-white placeholder-gray-500 text-xs sm:text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  What do you need?
                </label>
                <select
                  required
                  value={enquiryType}
                  onChange={(e) => setEnquiryType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141C16] border border-gray-700/60 text-white text-xs sm:text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                >
                  <option value="" disabled className="bg-[#141C16] text-gray-500">
                    Select enquiry type
                  </option>
                  <option value="Recurring kitchen rental" className="bg-[#141C16] text-white">
                    Recurring kitchen rental
                  </option>
                  <option value="Special equipment requirements" className="bg-[#141C16] text-white">
                    Special equipment requirements
                  </option>
                  <option value="Long-term kitchen hire" className="bg-[#141C16] text-white">
                    Long-term kitchen hire
                  </option>
                  <option value="General enquiry" className="bg-[#141C16] text-white">
                    General enquiry
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Message
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tell us about your requirements..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141C16] border border-gray-700/60 text-white placeholder-gray-500 text-xs sm:text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#152319] hover:bg-[#1A2E20] border border-emerald-700/40 text-white py-3 px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm hover:border-emerald-500"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Sending Enquiry...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Enquiry</span>
                      <ArrowRight className="w-4 h-4 text-emerald-400" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-gray-500 text-center pt-1">
                Layout preview; submission requires connection to your website backend.
              </p>
            </form>
          </div>

        </div>

      </div>
    </section>
  );
};
