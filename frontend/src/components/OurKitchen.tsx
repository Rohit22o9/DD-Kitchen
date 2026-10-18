import React, { useState } from 'react';
import { 
  Flame, 
  Sparkles, 
  Wind, 
  CheckCircle, 
  ArrowRight, 
  Maximize2, 
  ShieldCheck, 
  Clock, 
  Layers, 
  ThermometerSnowflake 
} from 'lucide-react';

import { Images } from '../assets/images';

interface OurKitchenProps {
  onCheckAvailability: () => void;
}

export const OurKitchen: React.FC<OurKitchenProps> = ({ onCheckAvailability }) => {
  const [activePhoto, setActivePhoto] = useState<string>(Images.hero);

  const gallery = [
    {
      src: Images.hero,
      title: 'Main Commercial Kitchen & Island Range',
      description: 'Heavy duty stainless steel gas burners, industrial ventilation canopy, and central prep station.',
    },
    {
      src: Images.prepStation,
      title: 'Stainless Food Preparation Counters',
      description: 'Grade 304 food-grade stainless prep tables, planetary mixers, and high-volume mise en place bowls.',
    },
    {
      src: Images.cookingRange,
      title: 'High-Output Cooking Line & Combi Station',
      description: 'Garland 6-burner ranges, double flat top griddles, high-efficiency fryers, and overhead extraction.',
    },
    {
      src: Images.coldStorage,
      title: 'Commercial Walk-in Chiller & Dry Pantry',
      description: 'HACCP-monitored 2°C walk-in cool room, wire shelving racks, and organised dry ingredient storage.',
    },
  ];

  return (
    <section id="our-kitchen" className="py-20 lg:py-28 bg-brand-cream/50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-brand-mint text-brand-forest px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase mb-3 border border-brand-mint-border">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Commercial Infrastructure Tour</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-dark tracking-tight leading-tight">
              Purpose-Built for Food Creators & Commercial Scale
            </h2>
            <p className="text-base sm:text-lg text-brand-muted mt-3">
              Daily Drop’s kitchen facility is engineered to commercial health standards with heavy-duty 
              grade 304 stainless equipment, multi-tier ventilation, and expansive cold storage.
            </p>
          </div>

          <div className="mt-6 md:mt-0">
            <button
              onClick={onCheckAvailability}
              className="bg-brand-forest hover:bg-brand-forest-light text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-soft transition-all flex items-center space-x-2"
            >
              <span>Check Kitchen Availability</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive Photo Gallery Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16">
          {/* Main Featured Photo */}
          <div className="lg:col-span-8">
            <div className="relative rounded-3xl overflow-hidden shadow-soft-lg border-2 border-white aspect-[16/10] bg-gray-100 group">
              <img
                src={activePhoto}
                alt="Daily Drop Commercial Kitchen Facility"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6 sm:p-8">
                <div className="text-white">
                  <span className="text-xs uppercase font-bold tracking-widest text-brand-orange bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
                    Verified Commercial Asset
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold mt-2">
                    {gallery.find((g) => g.src === activePhoto)?.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-200 mt-1 max-w-xl">
                    {gallery.find((g) => g.src === activePhoto)?.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Thumbnails on the side */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {gallery.map((photo, i) => {
              const isActive = activePhoto === photo.src;
              return (
                <div
                  key={i}
                  onClick={() => setActivePhoto(photo.src)}
                  className={`flex items-center space-x-4 p-3 rounded-2xl cursor-pointer transition-all border ${
                    isActive
                      ? 'bg-white border-brand-forest shadow-soft ring-2 ring-brand-forest/20'
                      : 'bg-white/70 border-gray-200 hover:border-brand-mint-border hover:bg-white'
                  }`}
                >
                  <img
                    src={photo.src}
                    alt={photo.title}
                    className="w-20 h-16 rounded-xl object-cover shrink-0"
                  />
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-brand-dark truncate">{photo.title}</h4>
                    <p className="text-[11px] text-brand-muted line-clamp-2 mt-0.5">{photo.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Technical Specifications Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-4">
          <div className="bg-white p-5 rounded-2xl border border-brand-mint-border shadow-soft-sm">
            <div className="w-10 h-10 rounded-xl bg-brand-mint text-brand-forest flex items-center justify-center mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-base font-extrabold text-brand-dark">450 m² Space</h4>
            <p className="text-xs text-brand-muted mt-1">Multi-station layout with dedicated prep & hot zones.</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-mint-border shadow-soft-sm">
            <div className="w-10 h-10 rounded-xl bg-brand-mint text-brand-forest flex items-center justify-center mb-3">
              <Flame className="w-5 h-5" />
            </div>
            <h4 className="text-base font-extrabold text-brand-dark">3-Phase 415V Power</h4>
            <p className="text-xs text-brand-muted mt-1">High-output commercial gas supply & isolated circuits.</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-mint-border shadow-soft-sm">
            <div className="w-10 h-10 rounded-xl bg-brand-mint text-brand-forest flex items-center justify-center mb-3">
              <Wind className="w-5 h-5" />
            </div>
            <h4 className="text-base font-extrabold text-brand-dark">10,000 CFM Hood</h4>
            <p className="text-xs text-brand-muted mt-1">Industrial UV grease filtration & multi-duct makeup air.</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-mint-border shadow-soft-sm">
            <div className="w-10 h-10 rounded-xl bg-brand-mint text-brand-forest flex items-center justify-center mb-3">
              <ThermometerSnowflake className="w-5 h-5" />
            </div>
            <h4 className="text-base font-extrabold text-brand-dark">Dual Temp Storage</h4>
            <p className="text-xs text-brand-muted mt-1">Walk-in chiller (2°C) + Walk-in blast freezer (-18°C).</p>
          </div>
        </div>

      </div>
    </section>
  );
};
