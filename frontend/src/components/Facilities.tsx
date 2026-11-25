import React, { useState } from 'react';
import { 
  Flame, 
  Utensils, 
  ThermometerSnowflake, 
  Layers, 
  Sparkles, 
  Package, 
  ShieldCheck,
  Check
} from 'lucide-react';
import { ApplianceImages } from '../assets/appliances';

export const Facilities: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Equipment' },
    { id: 'cooking', label: 'Cooking Line' },
    { id: 'baking', label: 'Baking & Ovens' },
    { id: 'refrigeration', label: 'Refrigeration' },
    { id: 'prep', label: 'Food Prep' },
    { id: 'sanitation', label: 'Sanitation' },
  ];

  const equipmentList = [
    {
      name: 'Giorik Heavy-Duty Tilting Bratt Pan',
      category: 'cooking',
      brand: 'Giorik / Stoddart Commercial',
      specs: '80L capacity, manual counterbalanced tilting pan, precision heat control & heavy stainless steel lid for high-volume batch cooking.',
      certification: 'Commercial Grade',
      status: 'Available',
      icon: Flame,
      image: ApplianceImages.brattPan,
    },
    {
      name: 'Moffat Turbofan Digital Convection Oven',
      category: 'baking',
      brand: 'Moffat Turbofan Series',
      specs: 'Digital LED control panel, bi-directional fan convection, dual-pane safety glass door with multi-tray base rack.',
      certification: 'Energy Star / HACCP',
      status: 'Available',
      icon: Sparkles,
      image: ApplianceImages.turbofanOven,
    },
    {
      name: 'FRYMAX Commercial High-Recovery Deep Fryer',
      category: 'cooking',
      brand: 'FRYMAX Australia',
      specs: 'Dual chrome wire baskets, rapid thermal recovery burners, stainless steel splashback & oil drain kit for continuous batch frying.',
      certification: 'AGA Certified',
      status: 'Available',
      icon: Flame,
      image: ApplianceImages.gasFryer,
    },
    {
      name: 'Roband Commercial High-Power Contact Grill',
      category: 'cooking',
      brand: 'Roband Australia',
      specs: 'Cast ribbed grilling plates, independent dual heat thermostats, countdown timer, ideal for paninis, sandwiches & searing.',
      certification: 'Commercial Standard',
      status: 'Available',
      icon: Flame,
      image: ApplianceImages.contactGrill,
    },
    {
      name: 'Devanti Twin Tank Benchtop Electric Fryers',
      category: 'cooking',
      brand: 'Devanti & H-Kitchen',
      specs: 'Twin tanks with independent temperature dials (60°C–200°C), immersion heating elements, nickel-plated baskets & cool-zone technology.',
      certification: 'SAA Safety Certified',
      status: 'Available',
      icon: Flame,
      image: ApplianceImages.benchFryers,
    },
    {
      name: 'Commercial 20L Planetary Dough Mixer (B20-W)',
      category: 'baking',
      brand: 'Heavy-Duty B20-W',
      specs: '20L 304 food-grade stainless bowl, interlocked safety wire guard, 3-speed gear transmission with dough hook, beater & wire whip.',
      certification: 'CE Safety Verified',
      status: 'Available',
      icon: Layers,
      image: ApplianceImages.doughMixer,
    },
    {
      name: 'Moffat Silhouette Loaf & Bread Slicer',
      category: 'baking',
      brand: 'Moffat Silhouette Series',
      specs: 'Gravity-feed chute, multi-blade precision uniform slicing, rear bread pusher and pull-out stainless crumb collection tray.',
      certification: 'Commercial Grade',
      status: 'Available',
      icon: Utensils,
      image: ApplianceImages.breadSlicer,
    },
    {
      name: '3-Door Under-Counter Refrigerated Prep Bench',
      category: 'refrigeration',
      brand: 'Commercial Stainless',
      specs: 'Digital Dixell temperature display (1°C to 4°C), self-closing doors, full-length heavy-gauge stainless steel preparation workbench.',
      certification: 'HACCP Compliant',
      status: 'Available',
      icon: ThermometerSnowflake,
      image: ApplianceImages.prepFridge,
    },
    {
      name: 'Ariston Commercial Upright No-Frost Freezer',
      category: 'refrigeration',
      brand: 'Ariston Commercial',
      specs: 'Deep sub-zero freezing (-18°C to -22°C), fan-assisted frost-free air circulation, multi-tier organized wire shelves.',
      certification: 'Eco Commercial Grade',
      status: 'Available',
      icon: ThermometerSnowflake,
      image: ApplianceImages.uprightFreezer,
    },
    {
      name: 'High-Capacity Bulk Storage Chest Freezer',
      category: 'refrigeration',
      brand: 'Commercial Chill Line',
      specs: 'Thick high-density insulated walls, counterbalanced solid lid with integrated key lock & removable wire storage baskets.',
      certification: 'Commercial Standard',
      status: 'Available',
      icon: ThermometerSnowflake,
      image: ApplianceImages.chestFreezer,
    },
    {
      name: 'Commercial Precision Deli & Meat Slicer (MS 220)',
      category: 'prep',
      brand: 'Model MS 220 VN',
      specs: '220mm hardened steel blade, micro-adjustable thickness dial (0-15mm), carriage safety guard & built-in top blade sharpener.',
      certification: 'CE Certified',
      status: 'Available',
      icon: Utensils,
      image: ApplianceImages.meatSlicer,
    },
    {
      name: 'Lisa 2-Group Commercial Espresso System & Grinder',
      category: 'prep',
      brand: 'Lisa Commercial Espresso',
      specs: 'Dual commercial brass brew groups, twin steam wands, programmable volumetric dosing touchpads, matched commercial hopper grinder.',
      certification: 'Australian Standards',
      status: 'Available',
      icon: Sparkles,
      image: ApplianceImages.espressoMachine,
    },
    {
      name: 'Breville Kitchen Wizz Commercial Food Processor',
      category: 'prep',
      brand: 'Breville Commercial',
      specs: 'High-torque induction motor, 4-blade cutting system, extra-wide feed chute, reversible precision slicing & shredding discs.',
      certification: 'Commercial Grade',
      status: 'Available',
      icon: Utensils,
      image: ApplianceImages.foodProcessor,
    },
    {
      name: 'Dual Heavy-Duty Batch & Portion Dial Scales',
      category: 'prep',
      brand: 'Commercial Mechanical',
      specs: '20kg & 5kg heavy-gauge stainless steel weighing platforms, large easy-read analog dials, instant zero-tare calibration knobs.',
      certification: 'Trade Calibrated',
      status: 'Available',
      icon: Package,
      image: ApplianceImages.portionScales,
    },
    {
      name: 'NSF Multi-Tier Stainless Storage Racking',
      category: 'prep',
      brand: 'Metro-Style NSF Racks',
      specs: 'High-capacity chrome-coated wire shelving, rust-resistant, optimal air ventilation for dry goods and cool staging.',
      certification: 'NSF Certified',
      status: 'Available',
      icon: Package,
      image: ApplianceImages.storageRacks,
    },
    {
      name: 'Commercial Linen, Apron & Towel Laundry Station',
      category: 'sanitation',
      brand: 'Fisher & Paykel Commercial',
      specs: 'QuickSmart high-temp sanitising washing machine, AeroSense rapid dryer, utility deep soak sink & high-pressure washdown hose.',
      certification: 'WaterMark Certified',
      status: 'Available',
      icon: Sparkles,
      image: ApplianceImages.laundryStation,
    },
  ];

  const filtered = activeCategory === 'all'
    ? equipmentList
    : equipmentList.filter((item) => item.category === activeCategory);

  return (
    <section id="facilities" className="py-10 lg:py-14 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-orange bg-brand-orange-light px-3.5 py-1.5 rounded-full inline-block mb-3">
            Commercial Equipment Inventory
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-dark tracking-tight">
            Certified Facilities & Commercial Appliances
          </h2>
          <p className="text-base sm:text-lg text-brand-muted mt-3">
            Explore our actual on-site commercial equipment. Maintained, calibrated, and sanitised to Australian commercial kitchen standards.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {categories.map((cat) => {
            const count = cat.id === 'all' 
              ? equipmentList.length 
              : equipmentList.filter((item) => item.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-1.5 ${
                  activeCategory === cat.id
                    ? 'bg-brand-forest text-white shadow-soft'
                    : 'bg-brand-cream text-brand-dark hover:bg-brand-mint border border-brand-mint-border'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeCategory === cat.id 
                    ? 'bg-white/20 text-white' 
                    : 'bg-brand-forest/10 text-brand-forest'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Equipment Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-brand-cream/30 rounded-2xl border border-brand-mint-border overflow-hidden hover:shadow-soft-lg transition-all duration-300 flex flex-col group hover:-translate-y-1"
              >
                {/* Photo Thumbnail */}
                <div className="relative h-48 overflow-hidden bg-gray-900/5">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Status & Category Tag */}
                  <div className="absolute top-2.5 right-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-500/90 text-white backdrop-blur-sm shadow-sm flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                      <span>{item.status}</span>
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 left-2.5">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-sm">
                      {item.brand}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5 text-brand-forest mb-1.5">
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                        {item.category.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-brand-dark leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-xs text-brand-muted mt-2 leading-relaxed">
                      {item.specs}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-brand-mint-border/80 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-brand-forest font-semibold flex items-center space-x-1 bg-brand-mint/60 px-2 py-0.5 rounded-md">
                      <ShieldCheck className="w-3.5 h-3.5 text-brand-forest" />
                      <span>{item.certification}</span>
                    </span>
                    <a
                      href="#booking-section"
                      className="font-bold text-xs text-brand-orange hover:text-brand-orange-hover flex items-center space-x-0.5 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Book</span>
                      <span>→</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer / Notice */}
        <div className="mt-12 p-5 rounded-2xl bg-brand-mint/30 border border-brand-mint-border text-center max-w-3xl mx-auto shadow-soft">
          <div className="flex items-center justify-center space-x-2 text-brand-forest font-bold text-sm mb-1">
            <Check className="w-4 h-4 text-brand-orange" />
            <span>100% Genuine On-Site Kitchen Equipment</span>
          </div>
          <p className="text-xs text-brand-muted leading-relaxed">
            All equipment shown is installed and certified for use at Daily Drop Commercial Kitchens. Need custom attachments, specialized pans, or dedicated storage bays? Mention it in your booking enquiry.
          </p>
        </div>

      </div>
    </section>
  );
};
