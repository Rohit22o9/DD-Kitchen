import React from 'react';
import { 
  PiggyBank, 
  CalendarClock, 
  Sliders, 
  ChefHat, 
  TrendingUp, 
  HeartHandshake, 
  ShieldCheck, 
  Check 
} from 'lucide-react';
import { Images } from '../assets/images';

export const WhyChoose: React.FC = () => {
  const benefits = [
    {
      title: 'Avoid Heavy Capital Expenditure',
      desc: 'Eliminate $200k+ in upfront fitout costs, commercial grease trap installations, extraction canopy permits, and council approvals.',
      icon: PiggyBank,
    },
    {
      title: 'Pay Only For Production Hours',
      desc: 'Zero lock-in leases or expensive idle periods. If you only produce 12 hours a week, you only pay for 12 hours.',
      icon: CalendarClock,
    },
    {
      title: 'Commercial Health Compliance',
      desc: 'Fully registered with local health authorities, HACCP food hygiene protocols, scheduled deep cleans, and monitored cold chains.',
      icon: ShieldCheck,
    },
    {
      title: 'Professional Commercial Appliances',
      desc: 'Work on Rational combi steamers, heavy Garland burners, commercial mixers, and walk-in cool room storage without repair or maintenance headaches.',
      icon: ChefHat,
    },
    {
      title: 'De-Risk Menu & Brand Expansion',
      desc: 'Test fresh culinary concepts, pop-up catering, or new consumer packaged goods in the real market before taking big risks.',
      icon: TrendingUp,
    },
    {
      title: 'Focus on Growing Your Business',
      desc: 'Spend your energy mastering recipes, winning customers, and growing revenue while Daily Drop maintains the facility.',
      icon: HeartHandshake,
    },
  ];

  return (
    <section className="py-10 lg:py-14 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-forest bg-brand-mint px-3.5 py-1.5 rounded-full inline-block mb-3 border border-brand-mint-border">
            The Daily Drop Advantage
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-dark tracking-tight">
            Why Food Creators Choose Daily Drop Commercial Kitchens
          </h2>
          <p className="text-base sm:text-lg text-brand-muted mt-3">
            Building a commercial food business shouldn't require risking your life savings on real estate. 
            We provide the infrastructure so you can thrive.
          </p>
        </div>

        {/* Split Layout: Photo on Left, Benefit Cards on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Image Stack */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-soft-lg border-4 border-white aspect-[4/5] bg-gray-100">
              <img
                src={Images.prepStation}
                alt="Chef prepping in Daily Drop Commercial Kitchen"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-forest/90 via-transparent to-transparent flex items-end p-6 sm:p-8">
                <div className="text-white">
                  <div className="flex items-center space-x-2 text-brand-orange text-xs font-bold uppercase tracking-wider mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Commercial Grade Quality</span>
                  </div>
                  <h4 className="text-xl font-bold">Spotless Hygiene & Full Compliance</h4>
                  <p className="text-xs text-gray-200 mt-1">
                    Daily sanitisation logs and certified waste management.
                  </p>
                </div>
              </div>
            </div>

            {/* Floating Trust Badge repositioned to top-right to prevent covering text */}
            <div className="absolute -top-4 -right-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-soft-lg border border-brand-mint-border max-w-[190px] z-10 hidden sm:block">
              <span className="text-2xl font-black text-brand-forest">100%</span>
              <p className="text-xs font-bold text-brand-dark mt-0.5">Commercial Grade</p>
              <p className="text-[10px] text-brand-muted">HACCP & Council registered kitchen facility</p>
            </div>
          </div>

          {/* Right Column: 6 Benefit Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {benefits.map((b, idx) => {
              const Icon = b.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-brand-cream/50 border border-brand-mint-border hover:bg-white hover:shadow-soft-md transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-mint text-brand-forest flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-brand-dark">{b.title}</h3>
                  <p className="text-xs text-brand-muted mt-1.5 leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};
