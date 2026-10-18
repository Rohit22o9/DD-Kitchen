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
  Clock
} from 'lucide-react';
import { KitchenConfig, EnquiryInput } from '../types';
import { api } from '../services/api';

interface ContactProps {
  config: KitchenConfig | null;
}

export const Contact: React.FC<ContactProps> = ({ config }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [businessType, setBusinessType] = useState('Cloud Kitchen');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: EnquiryInput = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        business_name: businessName.trim() || undefined,
        preferred_date: preferredDate.trim() || undefined,
        estimated_hours: estimatedHours.trim() || undefined,
        business_type: businessType,
        message: message.trim(),
      };
      await api.submitEnquiry(payload);
      setSuccess(true);
      setName('');
      setPhone('');
      setEmail('');
      setBusinessName('');
      setPreferredDate('');
      setEstimatedHours('');
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit enquiry. Please try again or reach out by phone.');
    } finally {
      setLoading(false);
    }
  };

  const phoneDisplay = config?.kitchen_phone || '+61 472 701 922';
  const emailDisplay = config?.kitchen_email || 'kitchens@dailydrop.com.au';
  const addressDisplay = config?.kitchen_address || '876 Albany Hwy, East Victoria Park, Perth WA 6101';
  const whatsappNum = config?.kitchen_whatsapp || '+61472701922';

  return (
    <section id="contact" className="py-20 lg:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-orange bg-brand-orange-light px-3.5 py-1.5 rounded-full inline-block mb-3">
            Custom Rental Enquiries
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-dark tracking-tight">
            Connect With Our Kitchen Facility Team
          </h2>
          <p className="text-base sm:text-lg text-brand-muted mt-3">
            Need specialized equipment, monthly long-term shifts, or have bespoke production requirements? 
            Speak directly with our kitchen management.
          </p>
        </div>

        {/* Contact Container Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Direct Contact Info & WhatsApp */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-brand-cream/60 rounded-3xl p-7 border border-brand-mint-border space-y-6 shadow-soft-sm">
              <h3 className="text-xl font-extrabold text-brand-dark">Facility Location & Direct Contacts</h3>
              
              <div className="space-y-5 text-xs sm:text-sm">
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-brand-mint text-brand-forest flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-dark">Daily Drop Kitchen Hub 1</h4>
                    <p className="text-brand-muted mt-0.5">{addressDisplay}</p>
                    <span className="text-[11px] text-brand-forest font-semibold mt-1 inline-block">
                      East Victoria Park Commercial Precinct
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-brand-mint text-brand-forest flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-dark">Phone Enquiries & On-Site Support</h4>
                    <p className="text-brand-muted mt-0.5">{phoneDisplay}</p>
                    <p className="text-[11px] text-brand-muted">Mon – Sun: 7:00 AM – 7:00 PM AWST</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-brand-mint text-brand-forest flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-dark">Email Inquiries & Invoicing</h4>
                    <p className="text-brand-muted mt-0.5">{emailDisplay}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-brand-mint text-brand-forest flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-dark">Kitchen Operating Schedule</h4>
                    <p className="text-brand-muted mt-0.5">06:00 AM – 11:00 PM (Daily for booked shifts)</p>
                  </div>
                </div>
              </div>

              {/* WhatsApp Quick Connect Button */}
              {whatsappNum && (
                <div className="pt-4 border-t border-brand-mint-border">
                  <a
                    href={`https://wa.me/${whatsappNum.replace(/[^0-9]/g, '')}?text=Hello%20Daily%20Drop%20Kitchen,%20I'm%20interested%20in%20hourly%20commercial%20kitchen%20rental.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-soft"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Chat on WhatsApp Directly</span>
                  </a>
                </div>
              )}
            </div>

            {/* Quick Tour Invitation */}
            <div className="p-6 rounded-2xl bg-brand-forest text-white shadow-soft">
              <h4 className="text-base font-bold">Schedule an In-Person Facility Walkthrough</h4>
              <p className="text-xs text-gray-200 mt-1 leading-relaxed">
                Want to inspect our Rational combi ovens, refrigeration space, and prep lines in person before booking? 
                Drop by or request a walkthrough time.
              </p>
            </div>

          </div>

          {/* Right Column: Custom Enquiry Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-7 sm:p-9 border border-brand-mint-border shadow-soft-lg">
              <h3 className="text-xl font-extrabold text-brand-dark mb-1">
                Custom Rental Enquiry
              </h3>
              <p className="text-xs sm:text-sm text-brand-muted mb-6">
                Fill in your details below and our kitchen team will reply with rate options and availability.
              </p>

              {success ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-lg font-bold text-emerald-900">Enquiry Received!</h4>
                  <p className="text-xs sm:text-sm text-emerald-700 max-w-md mx-auto">
                    Thank you. Our kitchen facility manager has received your message and will contact you via email or phone within 2 business hours.
                  </p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="mt-3 text-xs font-bold text-emerald-800 underline underline-offset-2"
                  >
                    Send another enquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="John Smith"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-brand-dark focus:ring-2 focus:ring-brand-forest focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+61 400 000 000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-brand-dark focus:ring-2 focus:ring-brand-forest focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="john@kitchenbrand.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-brand-dark focus:ring-2 focus:ring-brand-forest focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                        Business Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sedap Place"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-brand-dark focus:ring-2 focus:ring-brand-forest focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                        Type of Food Business
                      </label>
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-brand-dark focus:ring-2 focus:ring-brand-forest focus:outline-none"
                      >
                        <option value="Cloud Kitchen">Cloud Kitchen</option>
                        <option value="Restaurant / Cafe">Restaurant / Cafe</option>
                        <option value="Catering Business">Catering Business</option>
                        <option value="Bakery / Pastry">Bakery / Pastry</option>
                        <option value="Food CPG / Startup">Food CPG / Startup</option>
                        <option value="Private Chef">Private Chef</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                        Preferred Date / Range
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Next month or weekly"
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-brand-dark focus:ring-2 focus:ring-brand-forest focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                        Estimated Hours
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 15 hrs / week"
                        value={estimatedHours}
                        onChange={(e) => setEstimatedHours(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-brand-dark focus:ring-2 focus:ring-brand-forest focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                      Message & Requirements *
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Tell us about the equipment you need, timeline, or storage requirements..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-brand-dark focus:ring-2 focus:ring-brand-forest focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-forest hover:bg-brand-forest-light text-white py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-soft"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Enquiry...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Custom Rental Enquiry</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
