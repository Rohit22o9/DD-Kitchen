import React from 'react';
import { Check, DollarSign, Sparkles, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { KitchenConfig } from '../types';

interface PricingProps {
  config: KitchenConfig | null;
  onSelectDuration: (duration: number) => void;
}

export const Pricing: React.FC<PricingProps> = ({ config, onSelectDuration }) => {
  const hourlyRate = config?.hourly_rental_rate || 45.0;

  const tiers = [
    {
      name: '4-Hour Half-Shift',
      duration: 4,
      tagline: 'Our minimum booking duration. Perfect for bakery batches and cloud kitchen prep.',
      basePrice: hourlyRate * 4,
      popular: false,
      badge: 'Minimum Duration',
      features: [
        '4 hours dedicated commercial kitchen access',
        'One dedicated cooking bench for food prep',
        'Rational combi oven & deep fryers access',
        'Temporary walk-in cool room staging space',
        'Commercial pass-through dishwasher',
        'Tenants wash down station after shift',
      ],
    },
    {
      name: '8-Hour Full Production',
      duration: 8,
      tagline: 'Engineered for high-volume caterers and multi-day meal-prep brands.',
      basePrice: hourlyRate * 8,
      popular: true,
      badge: 'Most Popular Choice',
      features: [
        '8 hours full production shift access',
        'One dedicated cooking bench + priority line',
        'Full access to burners, ovens & fryers',
        'Walk-in cool room & freezer rack allocation',
        'Pallet delivery staging & courier dispatch',
        'Complimentary equipment orientation',
      ],
    },
    {
      name: '12-Hour Commercial Run',
      duration: 12,
      tagline: 'Full-day industrial batching for wholesale & food manufacturers.',
      basePrice: hourlyRate * 12,
      popular: false,
      badge: null,
      features: [
        '12 hours uninterrupted kitchen access',
        'Complete equipment suite coordinated',
        'Full walk-in cool room staging allocation',
        'Multiple team member access (up to 8)',
        'Storage cage during shift',
        'Dedicated kitchen facility support',
      ],
    },
    {
      name: '24-Hour Continuous Shift',
      duration: 24,
      tagline: 'Round-the-clock commercial access for major events & high-scale prep.',
      basePrice: hourlyRate * 24,
      popular: false,
      badge: '24 Hours Open',
      features: [
        '24 hours open access (24/7 kitchen facility)',
        'Dedicated cooking station & line access',
        'Uninterrupted overnight baking or batching',
        'Full cool room & staging shelf space',
        'Digital keypad entry PIN for shift changes',
        'All utilities, gas & power included',
      ],
    },
  ];

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-brand-cream/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-orange bg-brand-orange-light px-3.5 py-1.5 rounded-full inline-block mb-3">
            Transparent Hourly Rates
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-dark tracking-tight">
            Pay for the Hours You Need.
          </h2>
          <p className="text-base sm:text-lg text-brand-muted mt-3">
            Flexible commercial kitchen access designed around your production schedule. Minimum 4 hours, available 24 hours a day.
          </p>

          <div className="mt-4 inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-brand-mint-border text-xs text-brand-forest shadow-soft-sm">
            <span className="font-bold">Base Hourly Rate:</span>
            <span className="font-black text-brand-orange">${hourlyRate.toFixed(2)} AUD / Hour</span>
            <span className="text-brand-muted">• Clean-down included (additional fee only if left uncleaned)</span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((t, idx) => {
            return (
              <div
                key={idx}
                className={`rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 relative ${
                  t.popular
                    ? 'bg-white border-2 border-brand-orange shadow-soft-lg ring-4 ring-brand-orange/10 transform lg:-translate-y-2'
                    : 'bg-white border border-brand-mint-border shadow-soft-sm hover:shadow-soft-md'
                }`}
              >
                {t.badge && (
                  <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm ${
                    t.popular ? 'bg-brand-orange' : 'bg-brand-forest'
                  }`}>
                    {t.badge}
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-extrabold text-brand-dark">{t.name}</h3>
                  <p className="text-xs text-brand-muted mt-1 min-h-[32px]">{t.tagline}</p>

                  {/* Price */}
                  <div className="my-6 pb-6 border-b border-gray-100">
                    <div className="flex items-baseline space-x-1">
                      <span className="text-3xl sm:text-4xl font-black text-brand-forest">
                        ${t.basePrice.toFixed(2)}
                      </span>
                      <span className="text-xs font-semibold text-brand-muted">
                        AUD
                      </span>
                    </div>
                    <p className="text-[11px] text-brand-muted mt-1">
                      {t.duration}h @ ${hourlyRate}/h • <span className="text-emerald-700 font-semibold">$0 upfront cleaning fee</span>
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 text-xs mb-8">
                    {t.features.map((feat, i) => (
                      <div key={i} className="flex items-start space-x-2 text-brand-dark">
                        <Check className="w-4 h-4 text-brand-forest shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => onSelectDuration(t.duration)}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all ${
                    t.popular
                      ? 'bg-brand-orange hover:bg-brand-orange-hover text-white shadow-soft hover:shadow-glow-orange'
                      : 'bg-brand-mint text-brand-forest hover:bg-brand-forest hover:text-white'
                  }`}
                >
                  <span>Book {t.duration} Hours</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Custom or Recurring Pricing Notice */}
        <div className="mt-14 p-6 rounded-2xl bg-white border border-brand-mint-border text-center max-w-3xl mx-auto shadow-soft-sm">
          <h4 className="text-sm font-extrabold text-brand-dark">
            Need Recurring Shifts (e.g. 20+ Hours Every Week)?
          </h4>
          <p className="text-xs text-brand-muted mt-1 max-w-xl mx-auto">
            We offer discounted monthly retainer packages, dedicated dry storage cages, and walk-in chiller pallet slots for established partners.
          </p>
          <a
            href="#contact"
            className="inline-block mt-3 text-xs font-bold text-brand-orange hover:text-brand-orange-hover underline underline-offset-4"
          >
            Contact our team for tailored enterprise rates →
          </a>
        </div>

      </div>
    </section>
  );
};
