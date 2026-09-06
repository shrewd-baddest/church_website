import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLoader from '../../assets/Layouts/PageLoader';
import { 
  ChevronLeft, Image as ImageIcon, 
  Filter, GraduationCap, Heart
} from 'lucide-react';
import { DEFAULT_CLOSING_TRIBUTE } from './constants/adminConstants';
import { useHistory } from '../../hooks/useHistory';
import { useTerms } from '../../hooks/useTerms';

import { UPLOAD_BASE } from '../../api/config';
const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3Ccircle cx="50" cy="35" r="15" fill="%239ca3af"/%3E%3Cpath d="M20 100 Q20 70 50 70 Q80 70 80 100" fill="%239ca3af"/%3E%3C/svg%3E';

const CATEGORY_COLORS: Record<string, string> = {
  'Executive': 'from-purple-600 to-purple-700',
  'Jumuiya Coordinators': 'from-blue-600 to-blue-700',
  'Bible Coordinators': 'from-green-600 to-green-700',
  'Rosary': 'from-pink-600 to-pink-700',
  'Rosary Coordinators': 'from-pink-600 to-pink-700',
  'Pamphlet Managers': 'from-orange-600 to-orange-700',
  'Project Managers': 'from-indigo-600 to-indigo-700',
  'Liturgist': 'from-cyan-600 to-cyan-700',
  'Liturgists': 'from-cyan-600 to-cyan-700',
  'Choir Officials': 'from-red-600 to-red-700',
  'Instrument Managers': 'from-blue-600 to-blue-700',
  'Liturgical Dancers': 'from-blue-600 to-blue-700',
  'Catechist': 'from-yellow-600 to-yellow-700'
};

export default function PublicHistoryView() {
  const navigate = useNavigate();
  const [termFilter, setTermFilter] = useState('all');
  // Single-page view: fetch every record for the selected term at once
  const limit = 60;

  const { terms } = useTerms();
  const { history, meta, isLoading } = useHistory({ 
    termId: termFilter === 'all' ? undefined : termFilter,
    onlyArchived: true,
    limit,
    mode: 'csa'
  });

  const getPhotoUrl = (photo: string | null | undefined) => {
    if (!photo) return DEFAULT_AVATAR;
    if (photo.startsWith('http') || photo.startsWith('data:') || photo.startsWith('blob:')) return photo;
    return `${UPLOAD_BASE}${photo.startsWith('/') ? '' : '/'}${photo}`;
  };

  const selectedTermYear = terms.find(t => t.id.toString() === termFilter)?.year || 'All Years';

  return (
    <div className="h-full bg-transparent p-4 sm:pt-6 sm:px-8 pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation & Header */}
        <div className="mb-10">
          <div className="flex justify-start mb-6">
            <button 
              onClick={() => navigate('/officials')}
              className="group flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-bold transition-all bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100 text-sm"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back
            </button>
          </div>

          <header className="text-center relative">
            <div className="inline-flex items-center justify-center p-2.5 bg-indigo-50 rounded-2xl text-indigo-600 mb-3 shadow-sm border border-indigo-100">
               <GraduationCap className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-indigo-800 bg-clip-text text-transparent tracking-tight mb-2">
               CSA Leadership History
            </h1>
            <div className="w-16 h-1 bg-indigo-500 mx-auto rounded-full mb-5"></div>
            <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
               Honoring the dedicated service of our previous church leadership teams.
            </p>
          </header>
        </div>

        {/* Filters & Stats Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select 
                value={termFilter} 
                onChange={e => setTermFilter(e.target.value)}
                className="pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none hover:bg-white transition-all text-sm font-bold text-gray-800 min-w-[200px]"
              >
                <option value="all">All Election Terms</option>
                {terms
                  .filter(t => Number(t.archived_csa_count || 0) > 0)
                  .map(t => (
                    <option key={t.id} value={t.id}>Term: {t.year}</option>
                ))}
              </select>
            </div>
            
            <div className="hidden sm:flex flex-col">
               <span className="text-[10px] uppercase tracking-widest font-black text-gray-400">Current View</span>
               <span className="text-sm font-bold text-indigo-600">{selectedTermYear}</span>
            </div>
          </div>

          <div className="flex items-center gap-8 w-full md:w-auto justify-center md:justify-end border-t md:border-t-0 pt-4 md:pt-0">
             <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-gray-900">{meta?.total || 0}</span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Total Records</span>
             </div>
             <div className="w-px h-8 bg-gray-100"></div>
             <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-gray-900">{terms.filter(t => (t as any).archived_count > 0 || (t as any).archived_csa_count > 0).length}</span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Past Terms</span>
             </div>
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="py-24">
            <PageLoader message="Retrieving historical records" />
          </div>
        ) : history.length === 0 ? (
          <div className="py-24 bg-white rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center px-6">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <ImageIcon className="w-10 h-10 text-gray-300" />
             </div>
             <h3 className="text-xl font-bold text-gray-900 mb-2">No Records Found</h3>
             <p className="text-gray-500 max-w-sm">
                We couldn't find any archived officials for the selected criteria.
             </p>
          </div>
        ) : (
          <>
            {/* Mobile: compact 2-col grid with overlaid badges */}
            <div className="grid grid-cols-2 gap-3.5 sm:hidden mb-12">
              {history.map((off) => (
                <article key={`m-${off.id}`} className="group bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                  <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
                    <img
                      src={getPhotoUrl(off.photo)}
                      alt={off.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
                      <span className="truncate max-w-[85%] text-[0.68rem] font-bold text-white/95 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 shadow-sm">
                        {off.position || off.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 text-center bg-white">
                    <h3 className="font-bold text-slate-950 text-sm line-clamp-1">{off.name}</h3>
                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-black text-white bg-gradient-to-r ${CATEGORY_COLORS[off.category] || 'from-gray-600 to-gray-700'}`}>
                      {off.category}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {/* Desktop: larger cards with progressive columns */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12">
              {history.map((off) => (
                <article key={`d-${off.id}`} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                  <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    <img
                      src={getPhotoUrl(off.photo)}
                      alt={off.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black text-white bg-gradient-to-r ${CATEGORY_COLORS[off.category] || 'from-gray-700 to-gray-800'} shadow-sm mb-2`}>
                      {off.category}
                    </span>
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{off.name}</h3>
                    <div className="flex flex-col gap-1 mt-2">
                      <span className="text-xs font-black uppercase tracking-tighter text-indigo-500/80">
                        {off.position}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {/* Closing Note */}
        {!isLoading && history.length > 0 && (() => {
          const tribute = (termFilter !== 'all' && (history[0] as any)?.closing_message) || DEFAULT_CLOSING_TRIBUTE;
          return (
            <div className="text-center pb-6">
              <div className="w-16 h-1 bg-indigo-200 mx-auto rounded-full mb-5"></div>
              <p className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto font-medium italic leading-relaxed flex flex-col items-center gap-2">
                <Heart className="w-4 h-4 text-indigo-400 fill-indigo-100" />
                {tribute}
              </p>
            </div>
          );
        })()}


      </div>
    </div>
  );
}
