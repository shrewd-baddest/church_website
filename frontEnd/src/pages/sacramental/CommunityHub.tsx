import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommunityData } from './context/CommunityDataContext';

const CommunityHub: React.FC = () => {
  const navigate = useNavigate();
  const { modules } = useCommunityData();

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-16 animate-fade-in text-slate-800">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-800 to-blue-900 text-white py-20 px-4 md:px-8 shadow-inner relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center justify-center p-4 bg-white/10 rounded-full mb-6 backdrop-blur-md shadow-lg border border-white/20">
            <i className="fas fa-church text-4xl text-blue-200"></i>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight drop-shadow-md">Community Hub</h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto font-light leading-relaxed">
            Discover and join our vibrant church ministries. Grow in faith, serve the parish, and find your spiritual family.
          </p>
        </div>
      </div>

      {/* Grid Section */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {modules.map((mod, index) => (
            <div
              key={mod.id}
              onClick={() => navigate(`/community/${mod.id}`)}
              className="group bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 ease-out cursor-pointer overflow-hidden border border-slate-100 hover:-translate-y-2 flex flex-col h-full"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className="h-32 relative overflow-hidden flex items-center justify-center transition-colors duration-500"
                style={{ backgroundColor: mod.color || '#3b82f6' }}
              >
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition"></div>
                <i className={`${mod.icon} text-5xl text-white opacity-90 group-hover:scale-110 transition-transform duration-500 drop-shadow-lg`}></i>
              </div>

              <div className="p-8 flex flex-col flex-grow">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Ministry</span>
                <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">{mod.title}</h3>
                <p className="text-gray-500 flex-grow leading-relaxed">
                  {mod.description}
                </p>

                <div className="mt-6 pt-4 border-t border-slate-100 text-blue-600 font-bold flex items-center justify-between group-hover:text-blue-700 transition-colors">
                  <span>Explore Portal</span>
                  <i className="fas fa-arrow-right group-hover:translate-x-2 transition-transform duration-300"></i>
                </div>
              </div>
            </div>
          ))}
        </div>

        {modules.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-300">
            <i className="fas fa-folder-open text-gray-300 text-6xl mb-4"></i>
            <h3 className="text-2xl font-bold text-gray-500 mb-2">No ministries found</h3>
            <p className="text-gray-400">We couldn't find any active ministry modules at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityHub;
