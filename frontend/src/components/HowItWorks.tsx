import React from 'react';
import { 
  Calendar, 
  Search, 
  FileCheck2, 
  Key, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2 
} from 'lucide-react';

interface HowItWorksProps {
  onStartBooking: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onStartBooking }) => {
  const steps = [
    {
      num: '01',
      title: 'Choose Your Slot',
      desc: 'Pick your preferred date, any 24-hour start time, and desired duration from 4 hours up to a full 24-hour production shift.',
      icon: Calendar,
    },
    {
      num: '02',
      title: 'Check Availability',
      desc: 'Our real-time engine validates calendar availability. Review the itemised hourly rental rate with zero upfront cleaning fees.',
      icon: Search,
    },
    {
      num: '03',
      title: 'Submit Your Request',
      desc: 'Enter your business details, kitchen crew size, and select the specific appliances or cool room racks you will need.',
      icon: FileCheck2,
    },
    {
      num: '04',
      title: 'Get Confirmation',
      desc: 'Receive confirmation and payment instructions from Daily Drop. Once verified, receive your digital door access PIN and check-in pass.',
      icon: Key,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-forest bg-brand-mint px-3.5 py-1.5 rounded-full inline-block mb-3 border border-brand-mint-border">
            Seamless 4-Step Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-dark tracking-tight">
            How Renting With Daily Drop Works
          </h2>
          <p className="text-base sm:text-lg text-brand-muted mt-3">
            From discovering available kitchen hours to checking in with your digital PIN, 
            we make commercial food production simple and flexible.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div
                key={idx}
                className="bg-brand-cream/40 rounded-3xl p-7 border border-brand-mint-border relative flex flex-col justify-between hover:shadow-soft-md transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-2xl font-black text-brand-forest/30 font-mono group-hover:text-brand-forest transition-colors">
                      {st.num}
                    </span>
                    <div className="w-11 h-11 rounded-xl bg-brand-mint text-brand-forest flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-extrabold text-brand-dark mb-2">
                    {st.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                    {st.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-brand-mint-border/60">
                  <span className="text-[11px] font-bold text-brand-forest uppercase tracking-wider">
                    Step {idx + 1}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Compliance & Onboarding Checklist Banner */}
        <div className="mt-16 bg-gradient-to-r from-brand-forest to-brand-forest-dark text-white rounded-3xl p-8 sm:p-10 shadow-soft-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center space-x-2 text-brand-orange text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Commercial Kitchen Regulatory Compliance</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                What You Need Before Your First Shift
              </h3>
              <p className="text-xs sm:text-sm text-gray-200 max-w-2xl leading-relaxed">
                To maintain our spotless food hygiene certification and satisfy local health authorities, 
                all rental tenants must hold valid Australian regulatory documentation:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                <div className="flex items-start space-x-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                  <span>Food Safety Supervisor Certificate</span>
                </div>
                <div className="flex items-start space-x-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                  <span>Public Liability Insurance ($20 million min)</span>
                </div>
                <div className="flex items-start space-x-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                  <span>Council Food Business Registration</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 lg:text-right">
              <button
                onClick={onStartBooking}
                className="w-full sm:w-auto bg-brand-orange hover:bg-brand-orange-hover text-white px-7 py-3.5 rounded-xl font-bold text-sm shadow-soft transition-all transform hover:-translate-y-0.5"
              >
                Start Kitchen Reservation
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
