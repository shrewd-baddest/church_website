import { Link } from "react-router-dom";
import { footerSections, footerSocialMedia } from "./footerRoutes";

const Footers = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-transparent text-gray-600 py-20 px-6 sm:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-12 pt-4">
        
        {/* Slogan Section - Spans 2 on Mobile */}
        <section className="col-span-2 lg:col-span-1 flex flex-col items-center text-center lg:items-start lg:text-left space-y-5">
          <div className="flex flex-col items-center lg:items-start">
            <div className="h-1.5 w-10 bg-blue-600 rounded-full mb-4"></div>
            <p className="text-base sm:text-lg font-black italic text-gray-950 leading-tight">
              "Growing Together in Faith and Service."
            </p>
          </div>
          <p className="text-[12px] sm:text-sm leading-relaxed max-w-xs font-medium text-gray-500">
            Empowering students through spiritual guidance and community hubs.
          </p>
        </section>

        {/* Dynamic Navigation Sections */}
        {footerSections.map((section, idx) => (
          <section key={idx} className="flex flex-col items-center text-center lg:items-start lg:text-left space-y-8">
            <h3 className="text-[10px] sm:text-[11px] font-black text-gray-950 uppercase tracking-[0.4em]">
              {section.title}
            </h3>
            <ul className="space-y-4">
              {section.routes.map((route, rIdx) => (
                <li key={rIdx}>
                  <Link 
                    to={route.path} 
                    className={`${section.hoverColor} transition-colors text-xs sm:text-sm font-medium text-gray-600`}
                  >
                    {route.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {/* Social Icons - Centered below all categories */}
        <div className="col-span-2 lg:col-span-4 flex flex-col items-center gap-6 mt-8">
           <div className="h-[1px] w-full max-w-xs bg-gray-100"></div>
           <div className="flex justify-center gap-6">
            {footerSocialMedia.map((platform, index) => (
              <a 
                key={index} 
                href={platform.url} 
                target="_blank" 
                rel="noreferrer"
                className="w-11 h-11 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-gray-950 hover:text-white hover:shadow-2xl transition-all duration-500 group"
              >
                <span className="text-lg transform group-hover:scale-125 transition-transform">
                  <platform.icon />
                </span>
              </a>
            ))}
          </div>
        </div>

      </div>

      {/* Copyright Bar */}
      <div className="max-w-7xl mx-auto pt-16 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
        <p>© {currentYear}. Crafted for the Catholic Community.</p>
        <div className="flex gap-6">
           <a href="#" className="hover:text-gray-950 transition-colors">Privacy</a>
           <a href="#" className="hover:text-gray-900 transition-colors text-gray-200">•</a>
           <a href="#" className="hover:text-gray-900 transition-colors text-gray-200">Terms</a>
        </div>
      </div>
    </footer>
  );
};

export default Footers;
