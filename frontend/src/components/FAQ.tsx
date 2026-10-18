import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, HelpCircle, MessageCircle } from 'lucide-react';

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      q: 'Will there be other people using the kitchen at the same time?',
      a: 'Yes, the kitchen is a shared commercial space, so other cooks may be working at the same time. Your booking includes one dedicated cooking bench for food preparation. Other kitchen equipment and appliances, such as burners, ovens, and dishwashers, are shared. To ensure a smooth cooking experience, we ask that you provide a list of the equipment and appliances you will need in advance. This will help us coordinate their use, minimise scheduling conflicts, and ensure everyone can work efficiently.',
    },
    {
      q: 'How does hourly commercial kitchen rental work?',
      a: 'Daily Drop operates fully licensed, certified commercial kitchen facilities. You select your date, start time, and required duration (from 4 hours up to a full day). After submitting your request, our team confirms availability, sends payment details, and issues you a digital door access PIN. You bring your ingredients and culinary team, produce your food, and check out.',
    },
    {
      q: 'What is the minimum rental duration?',
      a: 'The minimum rental duration is 4 hours. This ensures you have adequate time for station setup, cooking production, and post-shift clean down.',
    },
    {
      q: 'Can I book multiple hours or a full shift?',
      a: 'Yes! We are open 24 hours. You can book 4, 6, 8, 10, or 12 continuous hours in a single booking session, 24/7 subject to calendar availability.',
    },
    {
      q: 'Can I rent the kitchen every week on a recurring schedule?',
      a: 'Absolutely. Many of our restaurant, catering, and bakery partners maintain standing weekly slots. Please contact our kitchen manager directly via the enquiry form to arrange recurring billing, dedicated storage, and priority slot reservations.',
    },
    {
      q: 'What equipment is included in the base hourly rental?',
      a: 'Base rental includes access to commercial appliances: Garland 6-burner gas range, Rational iCombi Pro 10-tray combi steamer, twin 20L commercial deep fryers, double flat top griddles, 304 food-grade stainless workbenches, commercial double pot wash sinks, high-temperature sanitising pass-through hood dishwasher, and Hobart 30L planetary mixer. Staging space in our commercial cool room during your booked shift is also included.',
    },
    {
      q: 'Can I bring my own ingredients and small tools?',
      a: 'Yes. You bring your raw ingredients, specialised chef knives, specialised bakeware, and packaging materials. All food brought on-site must be stored in food-grade containers in accordance with Australian food hygiene standards. We also offer cool room storage and dry storage at an additional fee.',
    },
    {
      q: 'Is cleaning included in the rental?',
      a: 'Tenants are responsible for basic kitchen wash-down (sweeping station floors, wiping down workbenches, and washing cookware used). Additional fees may apply if the kitchen is not cleaned after the shift.',
    },
    {
      q: 'Is a security deposit required?',
      a: 'Yes, a refundable security deposit of $750 AUD is required prior to key handover. This is released following facility inspection for cleanliness and equipment integrity after your shift.',
    },
    {
      q: 'How do I cancel or reschedule a booking?',
      a: 'You can cancel or reschedule with full refund up to 48 hours prior to your booked start time. Rescheduling requests within 48 hours can be accommodated subject to calendar availability and a 20% rescheduling fee.',
    },
    {
      q: 'When do I need to make payment?',
      a: 'After you submit a booking request and our manager confirms availability, you will receive an official invoice with payment instructions. Payment must be cleared prior to your shift start time in order to activate your door access PIN.',
    },
    {
      q: 'Can I use the kitchen for Uber Eats or food delivery orders?',
      a: 'Yes! Daily Drop has a dedicated courier dispatch station with an exterior entrance so delivery drivers (Uber Eats, DoorDash, Menulog) can collect orders without entering your active food prep area.',
    },
    {
      q: 'What food safety requirements must I follow?',
      a: 'In compliance with Australian health regulations, at least one person working on shift must hold a recognised Food Safety Supervisor certificate. All businesses must provide proof of Public Liability Insurance ($20 million minimum).',
    },
  ];

  const filtered = faqs.filter(
    (item) =>
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section id="faq" className="py-20 lg:py-28 bg-brand-cream/40 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-forest bg-brand-mint px-3.5 py-1.5 rounded-full inline-block mb-3 border border-brand-mint-border">
            Got Questions?
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-dark tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-base text-brand-muted mt-3">
            Everything you need to know about renting commercial kitchen space with Daily Drop.
          </p>

          {/* Search Input */}
          <div className="relative mt-6 max-w-md mx-auto">
            <Search className="w-4 h-4 text-brand-muted absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search kitchen policies, equipment, payment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-mint-border bg-white text-xs sm:text-sm font-medium text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-forest"
            />
          </div>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {filtered.length > 0 ? (
            filtered.map((item, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-brand-mint-border bg-white overflow-hidden shadow-soft-sm transition-all"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full text-left p-5 sm:p-6 flex items-center justify-between space-x-4 hover:bg-brand-cream/30 transition-colors"
                  >
                    <span className="text-sm sm:text-base font-bold text-brand-dark">
                      {item.q}
                    </span>
                    <span className="p-1 rounded-full bg-brand-mint text-brand-forest shrink-0">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-6 sm:px-6 text-xs sm:text-sm text-brand-muted leading-relaxed border-t border-gray-100 pt-4 bg-brand-cream/10">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-brand-mint-border text-xs text-brand-muted">
              No matching questions found for "{searchQuery}". Please contact our team below.
            </div>
          )}
        </div>

        {/* Still Have Questions Box */}
        <div className="mt-12 p-6 rounded-2xl bg-white border border-brand-mint-border text-center flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h4 className="text-sm font-bold text-brand-dark">Have a question not listed here?</h4>
            <p className="text-xs text-brand-muted mt-0.5">
              Our kitchen facility managers are available 7 days a week to assist.
            </p>
          </div>
          <a
            href="#contact"
            className="bg-brand-forest hover:bg-brand-forest-light text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors shrink-0 shadow-soft-sm"
          >
            Ask a Facility Question
          </a>
        </div>

      </div>
    </section>
  );
};
