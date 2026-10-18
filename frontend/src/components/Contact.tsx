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
  const [registeredInVicPark, setRegisteredInVicPark] = useState('No');
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
        registered_in_victoria_park: registeredInVicPark,
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
      setRegisteredInVicPark('No');
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit enquiry. Please try again or reach out by phone.');
    } finally {
      setLoading(false);
    }
  };

  const phoneDisplay = config?.kitchen_phone || '0479 175 705';
  const emailDisplay = config?.kitchen_email || 'hello@dailydrop.today';
  const addressDisplay = config?.kitchen_address || 'Unit 1, 1 Lichfield Street, Victoria Park, Perth, WA, 6101';
  const whatsappNum = config?.kitchen_whatsapp || '+61479175705';

  return (
    <section id="contact" className="py-20 lg:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Full-Width Priority Banner: Schedule an In-Person Facility Walkthrough */}
        <div className="mb-16 rounded-3xl bg-gradient-to-br from-brand-forest via-[#163825] to-brand-forest text-white p-8 sm:p-10 shadow-xl border border-emerald-700/50 relative overflow-hidden">
          {/* Subtle ambient lighting */}
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-brand-orange/15 blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-emerald-200 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/10">
                <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
                <span>Facility Tour & Inspection</span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                Schedule an In-Person Facility Walkthrough
              </h3>
              <p className="text-sm sm:text-base text-gray-200 leading-relaxed font-normal">
                Want to inspect our Rational combi ovens, refrigeration space, prep workstations, and loading facilities in person before booking? Drop by for a 15-minute walkthrough with our kitchen management team.
              </p>
              
              <div className="flex flex-wrap gap-3 pt-2 text-xs font-semibold text-emerald-100">
                <span className="flex items-center space-x-1.5 bg-black/25 px-3 py-1.5 rounded-lg border border-white/10">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Free 15-Min Guided Tour</span>
                </span>
                <span className="flex items-center space-x-1.5 bg-black/25 px-3 py-1.5 rounded-lg border border-white/10">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Hands-On Equipment Inspection</span>
                </span>
                <span className="flex items-center space-x-1.5 bg-black/25 px-3 py-1.5 rounded-lg border border-white/10">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Unit 1, 1 Lichfield St, Victoria Park</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 lg:w-72">
              <a
                href={`tel:${phoneDisplay.replace(/\s+/g, '')}`}
                className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-brand-orange/30 hover:shadow-glow-orange transition-all duration-200 text-center"
              >
                <Phone className="w-4 h-4" />
                <span>Call {phoneDisplay}</span>
              </a>
              {whatsappNum && (
                <a
                  href={`https://wa.me/${whatsappNum.replace(/[^0-9]/g, '')}?text=Hello%20Daily%20Drop%20Kitchen,%20I'd%20like%20to%20schedule%20an%20in-person%20facility%20walkthrough.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 py-3 px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all text-center"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Request Tour on WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-orange bg-brand-orange-light px-3.5 py-1.5 rounded-full inline-block mb-3">
            Custom Rental Enquiries
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-dark tracking-tight">
            Connect With Our Kitchen Facility Team
          </h2>
          <p className="text-base sm:text-lg text-brand-muted mt-3">
            Need specialised equipment, monthly long-term shifts, or have bespoke production requirements? 
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
                      Victoria Park Commercial Precinct
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
                    <p className="text-brand-muted mt-0.5">Kitchen Timings 24 hours available (24/7 for booked shifts)</p>
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

                  {/* Town of Victoria Park Registration Question */}
                  <div className="p-4 rounded-xl bg-brand-cream/60 border border-brand-mint-border">
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-2">
                      Is your food business registered in the Town of Victoria Park? *
                    </label>
                    <div className="flex items-center space-x-6">
                      <label className="flex items-center space-x-2 text-xs font-semibold text-brand-dark cursor-pointer">
                        <input
                          type="radio"
                          name="registeredVicPark"
                          value="Yes"
                          checked={registeredInVicPark === 'Yes'}
                          onChange={() => setRegisteredInVicPark('Yes')}
                          className="text-brand-forest focus:ring-brand-forest h-4 w-4"
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs font-semibold text-brand-dark cursor-pointer">
                        <input
                          type="radio"
                          name="registeredVicPark"
                          value="No"
                          checked={registeredInVicPark === 'No'}
                          onChange={() => setRegisteredInVicPark('No')}
                          className="text-brand-forest focus:ring-brand-forest h-4 w-4"
                        />
                        <span>No</span>
                      </label>
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

                  <p className="text-[11px] text-center text-brand-muted mt-2">
                    Rental enquiries are sent directly to{' '}
                    <a href="mailto:hello@dailydrop.today" className="font-bold text-brand-forest underline">
                      hello@dailydrop.today
                    </a>
                  </p>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
