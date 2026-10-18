import React from 'react';
import { Check, DollarSign, Sparkles, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { KitchenConfig } from '../types';

interface PricingProps {
  config: KitchenConfig | null;
  onSelectDuration: (duration: number) => void;
}

export const Pricing: React.FC<PricingProps> = ({ config, onSelectDuration }) => {
  const hourlyRate = config?.hourly_rental_rate || 45.0;
  const cleaningFee = config?.cleaning_fee || 25.0;

  const tiers = [
    {
      name: '2-Hour Quick Prep',
      duration: 2,
      tagline: 'Ideal for recipe R&D, plating tests, or light packaging runs.',
      basePrice: hourlyRate * 2,
      popular: false,
      features: [
        '2 full hours of kitchen access',
        'Stainless prep table & sinks',
        'Standard gas ranges & ovens',
        'Dishwashing sanitation area',
        'Standard waste disposal',
      ],
    },
    {
      name: '4-Hour Half-Shift',
      duration: 4,
      tagline: 'Most popular for cloud kitchen batching & bakery morning bakes.',
      basePrice: hourlyRate * 4,
      popular: true,
      features: [
        '4 hours of dedicated kitchen time',
        'Combi oven & deep fryers included',
        'Dedicated walk-in chiller rack space',
        'Courier delivery dispatch bench',
        'High-power 30L planetary mixer',
        'Includes kitchen waste removal',
      ],
    },
    {
      name: '8-Hour Full Production',
      duration: 8,
      tagline: 'Engineered for high-volume caterers and multi-day meal-prep brands.',
      basePrice: hourlyRate * 8,
      popular: false,
      features: [
        '8 hours full facility access',
        'All cooking lines & combi ovens',
        'Walk-in chiller & freezer shelf allocation',
        'Pallet delivery staging area',
        'Priority technical assistance on-site',
        'Complimentary equipment orientation',
      ],
    },
    {
      name: '12-Hour Commercial Run',
      duration: 12,
      tagline: 'Full day industrial-scale batching for wholesale & food manufacturers.',
      basePrice: hourlyRate * 12,
      popular: false,
      features: [
        '12 hours uninterrupted production',
        'Complete equipment suite reserved',
        'Full walk-in cold room allocation',
        'Multiple team member access (up to 8)',
        'Storage cage during shift',
        'Dedicated facility support',
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
            Flexible kitchen access designed around your production schedule. No hidden lease fees or long-term lock-ins.
          </p>

          <div className="mt-4 inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-brand-mint-border text-xs text-brand-forest shadow-soft-sm">
            <span className="font-bold">Base Hourly Rate:</span>
            <span className="font-black text-brand-orange">${hourlyRate.toFixed(2)} AUD / Hour</span>
            <span className="text-brand-muted">• Post-session cleaning fee: ${cleaningFee.toFixed(2)}</span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((t, idx) => {
            const totalPrice = t.basePrice + cleaningFee;
            return (
              <div
                key={idx}
                className={`rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 relative ${
                  t.popular
                    ? 'bg-white border-2 border-brand-orange shadow-soft-lg ring-4 ring-brand-orange/10 transform lg:-translate-y-2'
                    : 'bg-white border border-brand-mint-border shadow-soft-sm hover:shadow-soft-md'
                }`}
              >
                {t.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-orange text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                    Most Popular Choice
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
                        ({t.duration}h @ ${hourlyRate}/h)
                      </span>
                    </div>
                    <p className="text-[11px] text-brand-muted mt-1">
                      + ${cleaningFee.toFixed(2)} sanitization = <span className="font-bold text-brand-dark">${totalPrice.toFixed(2)} total</span>
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
