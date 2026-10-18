import React from 'react';
import { 
  Rocket, 
  Store, 
  UtensilsCrossed, 
  Lightbulb, 
  Cake, 
  ArrowRight, 
  CheckCircle2 
} from 'lucide-react';

interface WhoCanRentProps {
  onSelectSegment: (segment: string) => void;
}

export const WhoCanRent: React.FC<WhoCanRentProps> = ({ onSelectSegment }) => {
  const segments = [
    {
      title: 'Cloud Kitchen Startups',
      tagline: 'Delivery-First Brands',
      icon: Rocket,
      desc: 'Launch a delivery-first virtual brand on Uber Eats or DoorDash without committing to 5-year commercial leases and high fitout costs.',
      hours: 'Recommended: 4h to 8h evening slots',
      bullets: ['Courier dispatch bay', 'Packaging stations', 'Storage lockers'],
    },
    {
      title: 'Restaurants & Cafes',
      tagline: 'Production Spillover & Batch Prep',
      icon: Store,
      desc: 'Handle peak weekend demand, corporate catering overflow, or seasonal production without disrupting your primary venue service.',
      hours: 'Recommended: 6h early morning batches',
      bullets: ['High-capacity gas burners', 'Combi ovens', 'Walk-in blast chilling'],
    },
    {
      title: 'Caterers & Event Businesses',
      tagline: 'Large-Volume Event Execution',
      icon: UtensilsCrossed,
      desc: 'Prepare high-volume wedding banquets, corporate luncheons, and festival menus with expansive prep benches and walk-in cold rooms.',
      hours: 'Recommended: 8h to 12h full-day sessions',
      bullets: ['Pallet loading dock', 'Multi-tray cooling', 'Hot holding gear'],
    },
    {
      title: 'Food Entrepreneurs',
      tagline: 'Recipe R&D & Consumer Brands',
      icon: Lightbulb,
      desc: 'Formulate, test, and bottle small-batch artisanal sauces, beverages, granolas, or health snacks in a certified commercial facility.',
      hours: 'Recommended: 4h to 6h flexible weekday slots',
      bullets: ['HACCP certified for retail', 'Pot sinks', 'Sanitised fill area'],
    },
    {
      title: 'Bakers & Independent Chefs',
      tagline: 'Artisan Pastry & Specialised Production',
      icon: Cake,
      desc: 'Bake sourdough bread, croissants, wedding cakes, and pastries using commercial planetary mixers and precision steam combi ovens.',
      hours: 'Recommended: 4h early morning bake-offs',
      bullets: ['Planetary mixer suite', 'Proofer racks', 'Marble pastry table'],
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-brand-cream/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-orange bg-brand-orange-light px-3.5 py-1.5 rounded-full inline-block mb-3">
            Tailored For Food Creators
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-dark tracking-tight">
            Who Can Rent Our Commercial Kitchen?
          </h2>
          <p className="text-base sm:text-lg text-brand-muted mt-3">
            Whether you need 4 hours to batch a recipe or 8 hours regular production shifts, 
            our infrastructure adapts to your business model.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {segments.map((seg, idx) => {
            const Icon = seg.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-7 border border-brand-mint-border shadow-soft-sm hover:shadow-soft-lg transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-brand-mint text-brand-forest flex items-center justify-center transition-colors group-hover:bg-brand-forest group-hover:text-white">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-orange bg-brand-orange-light px-2.5 py-1 rounded-full">
                      {seg.tagline}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-brand-dark mb-2">
                    {seg.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-brand-muted leading-relaxed mb-4">
                    {seg.desc}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    {seg.bullets.map((b, i) => (
                      <div key={i} className="flex items-center space-x-2 text-xs text-brand-dark">
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-forest shrink-0" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-brand-muted">{seg.hours}</span>
                  <button
                    onClick={() => onSelectSegment(seg.title)}
                    className="text-xs font-bold text-brand-forest group-hover:text-brand-orange transition-colors flex items-center space-x-1"
                  >
                    <span>Rent Space</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
