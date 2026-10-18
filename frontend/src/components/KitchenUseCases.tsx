import React from 'react';
import { 
  Clock, 
  Store, 
  ChefHat, 
  Users, 
  Lightbulb, 
  Sparkles, 
  Video,
  ArrowRight
} from 'lucide-react';

interface KitchenUseCasesProps {
  onStartBooking?: () => void;
}

export const KitchenUseCases: React.FC<KitchenUseCasesProps> = ({ onStartBooking }) => {
  const useCases = [
    {
      title: 'SHORT TERM HIRE',
      icon: Clock,
      desc: 'Short term hire is your best option when you need a kitchen right now while you’re looking for your own place or waiting for council approvals.',
    },
    {
      title: 'CLOUD KITCHEN',
      icon: Store,
      desc: 'We’re seeing an increasing demand for “cloud kitchens” with the food delivery business exploding across Uber Eats and DoorDash.',
    },
    {
      title: 'TEST YOUR MENU',
      icon: ChefHat,
      desc: 'Use our state-of-the-art kitchens to test and improve your menu, without investing in expensive equipment right now.',
    },
    {
      title: 'TEAM BUILDING',
      icon: Users,
      desc: 'Cooking is one of the most popular team-building exercises and we’re happy for you to use our space to connect with your team.',
    },
    {
      title: 'TEST YOUR BUSINESS IDEAS',
      icon: Lightbulb,
      desc: 'Use one of our kitchens long-term and take a business test drive without investing in your own commercial kitchen. Test, refine, grow.',
    },
    {
      title: 'IMPROVE YOUR MENU',
      icon: Sparkles,
      desc: 'Use commercial-grade equipment and precision culinary tools to refine your recipes and elevate your menu quality.',
    },
    {
      title: 'COOKING DEMONSTRATIONS',
      icon: Video,
      desc: 'Our kitchens are available for product launches and cooking demonstrations. We have the space and high-end setup to accommodate demonstrations, filming, or tastings.',
    },
  ];

  return (
    <section id="use-cases" className="py-10 lg:py-14 bg-white relative border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header styled cleanly matching the editorial reference */}
        <div className="text-center max-w-4xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-forest bg-brand-mint px-3.5 py-1.5 rounded-full inline-block mb-3 border border-brand-mint-border">
            Commercial Production Options
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-dark tracking-tight">
            One Kitchen. Endless Possibilities.
          </h2>
          <div className="w-24 h-1 bg-brand-orange mx-auto mt-4 rounded-full" />
        </div>

        {/* Clean Editorial Grid with subtle dividers and modern cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {useCases.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group p-6 sm:p-7 rounded-2xl bg-brand-cream/30 border border-brand-mint-border hover:bg-white hover:shadow-soft-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-mint text-brand-forest flex items-center justify-center group-hover:bg-brand-forest group-hover:text-white transition-colors shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-black tracking-wider text-brand-dark uppercase">
                      {item.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-brand-muted leading-relaxed italic">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-brand-forest">
                  <span className="text-[11px] text-brand-muted uppercase tracking-wider">Commercial Hire</span>
                  {onStartBooking && (
                    <button
                      onClick={onStartBooking}
                      className="text-brand-orange hover:text-brand-orange-hover flex items-center space-x-1 transition-colors"
                    >
                      <span>Book Slot</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-brand-mint/40 border border-brand-mint-border text-center max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h4 className="text-sm font-bold text-brand-dark">Have a bespoke production requirement?</h4>
            <p className="text-xs text-brand-muted mt-0.5">
              Talk directly with our kitchen management to tailor equipment allocation and shifts.
            </p>
          </div>
          <a
            href="#contact"
            className="bg-brand-forest hover:bg-brand-forest-light text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-soft-sm shrink-0"
          >
            Enquire Now
          </a>
        </div>

      </div>
    </section>
  );
};
