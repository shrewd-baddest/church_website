function AboutSection() {
  return (
    <section id="about" className="max-w-7xl mx-auto px-4 py-12 md:px-6 md:py-20 lg:px-8 relative">
      {/* Background ambient light - Subtler near-white */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-slate-50/20 blur-[120px] -z-10 rounded-full hidden md:block" />

      <div className="text-center max-w-3xl mx-auto mb-12 md:mb-20">
        <h2 className="text-slate-400 font-bold tracking-[0.2em] uppercase text-[10px] mb-4">Who We Are</h2>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mb-6 tracking-tight">
          Welcome to CSA Kirinyaga University
        </h1>
        <p className="text-slate-500 text-base md:text-lg leading-relaxed font-medium max-w-2xl mx-auto">
          St. Thomas Aquinas welcomes you to our Catholic movement which is
          aimed at spreading the Gospel and enriching the Catholic faith to members
          through prayers and upholding Catholic principles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mt-8 max-w-5xl mx-auto">
        {/* Mission */}
        <div id="mission" className="group relative bg-slate-50 hover:bg-white p-8 md:p-12 rounded-[2rem] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] border border-transparent hover:border-slate-100 hover:shadow-[0_30px_70px_-20px_rgba(0,0,0,0.04)] cursor-default overflow-hidden">
          {/* Faded Background Depth Accent */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-100/20 rounded-full blur-3xl group-hover:bg-blue-100/30 transition-colors duration-1000"></div>
          
          {/* Intense Lightning Light Sweep */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-[1200ms] skew-x-12"></div>

          <div className="flex flex-col items-center text-center relative z-10">
            <div className="text-white mb-8 p-5 bg-gradient-to-br from-[#2563eb] via-[#3b82f6] to-[#60a5fa] rounded-2xl shadow-lg shadow-blue-500/10 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            </div>
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-500 rounded-full text-[9px] font-black tracking-[0.2em] uppercase mb-3">PURPOSE</span>
            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight group-hover:text-primary transition-colors duration-300">
              Our Mission
            </h3>
            <p className="text-slate-500 font-medium text-base md:text-lg leading-relaxed max-w-sm">
              Achieving greater heights spiritually in the Catholic faith through prayers as an instrument of hope to humanity.
            </p>
          </div>
        </div>

        {/* Vision */}
        <div id="vision" className="group relative bg-slate-50 hover:bg-white p-8 md:p-12 rounded-[2rem] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] border border-transparent hover:border-slate-100 hover:shadow-[0_30px_70px_-20px_rgba(0,0,0,0.04)] cursor-default overflow-hidden">
          {/* Faded Background Depth Accent */}
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-100/20 rounded-full blur-3xl group-hover:bg-emerald-100/30 transition-colors duration-1000"></div>
          
          {/* Intense Lightning Light Sweep */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-[1200ms] skew-x-12"></div>

          <div className="flex flex-col items-center text-center relative z-10">
            <div className="text-white mb-8 p-5 bg-gradient-to-br from-[#059669] via-[#10b981] to-[#34d399] rounded-2xl shadow-lg shadow-emerald-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-500 rounded-full text-[9px] font-black tracking-[0.2em] uppercase mb-3">FUTURE</span>
            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight group-hover:text-primary transition-colors duration-300">
              Our Vision
            </h3>
            <p className="text-slate-500 font-medium text-base md:text-lg leading-relaxed max-w-sm">
              To produce spiritually and morally upright Christians who will actively spread the Gospel throughout the world.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
