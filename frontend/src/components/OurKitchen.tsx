import React from 'react';
import { Calendar, ArrowRight, Layers, Flame, Wind, ThermometerSnowflake } from 'lucide-react';
import { Images } from '../assets/images';

interface OurKitchenProps {
  onCheckAvailability: () => void;
  onLearnMore?: () => void;
}

export const OurKitchen: React.FC<OurKitchenProps> = ({ onCheckAvailability, onLearnMore }) => {
  const scrollToFacilities = () => {
    if (onLearnMore) {
      onLearnMore();
    } else {
      const el = document.getElementById('facilities');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const cards = [
    {
      src: Images.actual.range,
      title: 'Commercial-Grade Equipment',
      description: 'Ovens, burners, prep benches, cold storage and more.',
    },
    {
      src: Images.actual.prep,
      title: 'Flexible Hourly Rental',
      description: 'Book from 4 hours upwards, when you need it.',
    },
    {
      src: Images.actual.wash,
      title: 'Clean, Compliant & Ready',
      description: 'Council approved and maintained to the highest standards.',
    },
  ];

  return (
    <section id="our-kitchen" className="py-10 lg:py-14 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Layout matching reference image: Left headline + copy + 2 buttons, Right 3 photo cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Heading, Text & Action Buttons */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-brand-dark tracking-tight leading-[1.18]">
              A Kitchen That Works For Your Business
            </h2>
            
            <p className="text-sm sm:text-base text-brand-muted leading-relaxed">
              Daily Drop provides a professional, flexible and affordable commercial kitchen for food businesses of all sizes. 
              Whether you're testing a new menu, scaling your production or need extra capacity, we give you the space and equipment to make it happen.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={onCheckAvailability}
                className="bg-brand-orange hover:bg-brand-orange-hover text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-md shadow-brand-orange/20 hover:shadow-glow-orange transition-all duration-200 flex items-center space-x-2 transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Book a Kitchen</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </button>

              <button
                onClick={scrollToFacilities}
                className="bg-white hover:bg-gray-50 text-brand-dark border border-gray-300 px-5 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <span>Learn More</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: 3 Cards in a Row (Matching reference screenshot) */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5">
              {cards.map((card, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
                    <img
                      src={card.src}
                      alt={card.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <h3 className="font-bold text-brand-dark text-sm leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-xs text-brand-muted mt-1.5 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Technical Infrastructure Specifications Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-12 border-t border-gray-100">
          <div className="p-4 rounded-xl bg-brand-cream/60 border border-brand-mint-border">
            <div className="w-8 h-8 rounded-lg bg-brand-mint text-brand-forest flex items-center justify-center mb-2">
              <Layers className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-brand-dark">88 sqm Layout</h4>
            <p className="text-[11px] text-brand-muted mt-0.5">Spacious multi-station layout with dedicated prep & cooking benches.</p>
          </div>

          <div className="p-4 rounded-xl bg-brand-cream/60 border border-brand-mint-border">
            <div className="w-8 h-8 rounded-lg bg-brand-mint text-brand-forest flex items-center justify-center mb-2">
              <Flame className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-brand-dark">3-Phase 415V Power</h4>
            <p className="text-[11px] text-brand-muted mt-0.5">High-output commercial gas supply & isolated circuits.</p>
          </div>

          <div className="p-4 rounded-xl bg-brand-cream/60 border border-brand-mint-border">
            <div className="w-8 h-8 rounded-lg bg-brand-mint text-brand-forest flex items-center justify-center mb-2">
              <Wind className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-brand-dark">Commercial Extraction Hood</h4>
            <p className="text-[11px] text-brand-muted mt-0.5">Heavy-duty exhaust removes smoke, heat & steam efficiently.</p>
          </div>

          <div className="p-4 rounded-xl bg-brand-cream/60 border border-brand-mint-border">
            <div className="w-8 h-8 rounded-lg bg-brand-mint text-brand-forest flex items-center justify-center mb-2">
              <ThermometerSnowflake className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-brand-dark">Cool Room & Freezers</h4>
            <p className="text-[11px] text-brand-muted mt-0.5">Walk-in cool room (2°C) + upright and bench freezer space.</p>
          </div>
        </div>

      </div>
    </section>
  );
};
