import React from 'react';
import { Grid, Activity, Layers, Users, ArrowRight, Zap } from 'lucide-react';

const CommunitySection: React.FC = () => {
  const categories = [
    {
      title: "Jumuiya",
      label: "Fellowship",
      description: "Local parish groups connecting community members in faith.",
      icon: <Grid size={22} />,
      gradient: "from-blue-400/80 via-blue-500/70 to-blue-600/60",
      labelColor: "text-blue-600/70 bg-blue-50/50",
      link: "#jumuiya"
    },
    {
      title: "Activities",
      label: "Engagement",
      description: "Participate in prayer meetings and community events.",
      icon: <Activity size={22} />,
      gradient: "from-emerald-400/80 via-emerald-500/70 to-emerald-600/60",
      labelColor: "text-emerald-600/70 bg-emerald-50/50",
      link: "#activities"
    },
    {
      title: "Projects",
      label: "Growth",
      description: "Discover and contribute to community development.",
      icon: <Layers size={22} />,
      gradient: "from-amber-400/80 via-amber-500/70 to-amber-600/60",
      labelColor: "text-amber-600/70 bg-amber-50/50",
      link: "#projects"
    },
    {
      title: "Officials",
      label: "Leadership",
      description: "Dedicated leaders guiding our community in service.",
      icon: <Users size={22} />,
      gradient: "from-indigo-400/80 via-indigo-500/70 to-indigo-600/60",
      labelColor: "text-indigo-600/70 bg-indigo-50/50",
      link: "#officials"
    }
  ];

  return (
    <section className="pt-20 md:pt-32 pb-6 md:pb-10 bg-white relative" id="explore">
      {/* Precision Background - Pure White Focus */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-50/20 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Bose-style Header: Minimalist & Pure */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase mb-8">
            <Zap size={12} className="text-primary/40" />
            Vibrant Community
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 tracking-tighter leading-tight">
            Explore Our <span className="text-primary/80">Connection</span>
          </h2>
          <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl mx-auto">
            A meticulously designed ecosystem of faith, service, and togetherness.
          </p>
        </div>

        {/* Live Blended Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((item, index) => (
            <div 
              key={index}
              className="group relative bg-white rounded-[2.5rem] p-8 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] border border-slate-50 hover:border-slate-100 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)] cursor-pointer overflow-hidden will-change-transform flex flex-col items-center text-center md:items-start md:text-left"
            >
              {/* Subtle Glowing Background Accent - Blends with White */}
              <div className={`absolute -right-12 -top-12 w-48 h-48 rounded-full bg-gradient-to-br ${item.gradient} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 blur-3xl`}></div>

              {/* Icon Container: Soft Tinted Glow */}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-10 relative transition-all duration-700 group-hover:scale-110 group-hover:-rotate-3`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-10 rounded-2xl`}></div>
                <div className="relative z-10">
                  {/* Matching the icon color to the specific category for 'Live' flow */}
                  <div className={`transition-colors duration-500 ${
                    item.title === 'Jumuiya' ? 'text-blue-500' : 
                    item.title === 'Activities' ? 'text-emerald-500' : 
                    item.title === 'Projects' ? 'text-amber-500' : 'text-indigo-500'
                  }`}>
                    {item.icon}
                  </div>
                </div>
              </div>
              
              {/* Content Group */}
              <div className="space-y-4 relative z-10 w-full flex flex-col items-center md:items-start">
                <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black tracking-[0.2em] uppercase mb-2 ${item.labelColor}`}>
                  {item.label}
                </span>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight transition-colors duration-500 group-hover:text-slate-900">
                  {item.title}
                </h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed mb-4 md:mb-8 opacity-80">
                  {item.description}
                </p>
                
                {/* Minimalist Link: Clean Blend */}
                <div className="pt-2 md:pt-4 w-full flex justify-center md:justify-start">
                   <div 
                    className="inline-flex items-center gap-3 text-slate-800 md:text-slate-400 font-black text-[10px] tracking-widest uppercase transition-all duration-300 group-hover:text-slate-900 border border-slate-200 md:border-transparent px-6 py-3 md:px-0 md:py-0 rounded-xl md:rounded-none"
                  >
                    View Details
                    <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1.5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
