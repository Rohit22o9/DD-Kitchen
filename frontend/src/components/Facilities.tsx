import React, { useState } from 'react';
import { 
  Flame, 
  Utensils, 
  ThermometerSnowflake, 
  Layers, 
  Wind, 
  Sparkles, 
  CheckCircle, 
  Package, 
  ShieldCheck 
} from 'lucide-react';
import { Images } from '../assets/images';

export const Facilities: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Equipment' },
    { id: 'cooking', label: 'Cooking Line' },
    { id: 'prep', label: 'Food Prep' },
    { id: 'refrigeration', label: 'Refrigeration' },
    { id: 'baking', label: 'Baking & Ovens' },
    { id: 'sanitation', label: 'Sanitation' },
  ];

  const equipmentList = [
    {
      name: 'Garland 6-Burner Gas Range',
      category: 'cooking',
      specs: 'Cast iron trivets, 30,000 BTU/burner, dual gas oven base',
      status: 'Available',
      icon: Flame,
      image: Images.cookingRange,
    },
    {
      name: 'Rational iCombi Pro 10-Tray Combi Oven',
      category: 'baking',
      specs: 'Steam, convection & combination modes with multi-point core probe',
      status: 'Available',
      icon: Sparkles,
      image: Images.hero,
    },
    {
      name: '304 Food-Grade Prep Workstations',
      category: 'prep',
      specs: '4x stainless 2.4m prep tables, undershelves, cutting boards',
      status: 'Available',
      icon: Utensils,
      image: Images.prepStation,
    },
    {
      name: 'Commercial Walk-in Chiller (40 m³)',
      category: 'refrigeration',
      specs: 'Digitally monitored at 2°C, multi-tier wire shelving, pallet ramp',
      status: 'Available',
      icon: ThermometerSnowflake,
      image: Images.coldStorage,
    },
    {
      name: 'Hobart 30L Planetary Commercial Mixer',
      category: 'baking',
      specs: '3-speed gear transmission, bowl guard, dough hook, whisk, beater',
      status: 'Available',
      icon: Layers,
      image: Images.prepStation,
    },
    {
      name: '2x 20L Twin Pit Commercial Deep Fryers',
      category: 'cooking',
      specs: 'Fast recovery gas burners, dual wire baskets, oil filtration kit',
      status: 'Available',
      icon: Flame,
      image: Images.cookingRange,
    },
    {
      name: 'High-Temp Pass-Through Hood Dishwasher',
      category: 'sanitation',
      specs: '82°C sanitising rinse cycle, chemical dosing, triple sink pre-rinse',
      status: 'Available',
      icon: Sparkles,
      image: Images.hero,
    },
    {
      name: 'Dedicated Packaging & Dispatch Counter',
      category: 'prep',
      specs: 'Direct external courier access door, labeling bench, heat sealers',
      status: 'Available',
      icon: Package,
      image: Images.prepStation,
    },
  ];

  const filtered = activeCategory === 'all'
    ? equipmentList
    : equipmentList.filter((item) => item.category === activeCategory);

  return (
    <section id="facilities" className="py-20 lg:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-orange bg-brand-orange-light px-3.5 py-1.5 rounded-full inline-block mb-3">
            Commercial Equipment Inventory
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-dark tracking-tight">
            Certified Facilities & Commercial Appliances
          </h2>
          <p className="text-base sm:text-lg text-brand-muted mt-3">
            Every piece of equipment is maintained, calibrated, and sanitised to Australian commercial kitchen standards.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeCategory === cat.id
                  ? 'bg-brand-forest text-white shadow-soft'
                  : 'bg-brand-cream text-brand-dark hover:bg-brand-mint border border-brand-mint-border'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Equipment Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-brand-cream/40 rounded-2xl border border-brand-mint-border overflow-hidden hover:shadow-soft-lg transition-all duration-300 flex flex-col group hover:-translate-y-1"
              >
                {/* Photo Thumbnail */}
                <div className="relative h-44 overflow-hidden bg-gray-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ● {item.status}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-2 text-brand-forest mb-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                        {item.category.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-brand-dark leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-xs text-brand-muted mt-2 leading-relaxed">
                      {item.specs}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-brand-mint-border/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-brand-forest font-semibold flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Certified In Stock</span>
                    </span>
                    <a
                      href="#booking-section"
                      className="font-bold text-brand-orange hover:text-brand-orange-hover"
                    >
                      Book →
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer / Notice */}
        <div className="mt-12 p-4 rounded-xl bg-brand-mint/40 border border-brand-mint-border text-center max-w-2xl mx-auto">
          <p className="text-xs text-brand-dark">
            <span className="font-bold">Equipment Verification:</span> All equipment listings are maintained and 
            inspected by Daily Drop facility managers. Specialised tooling or custom attachments can be arranged prior to rental.
          </p>
        </div>

      </div>
    </section>
  );
};
