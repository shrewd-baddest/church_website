import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Calendar, Award as AwardIcon, Image as ImageIcon, 
  Filter, GraduationCap
} from 'lucide-react';
import { useHistory } from '../../hooks/useHistory';
import { useTerms } from '../../hooks/useTerms';

import { UPLOAD_BASE } from '../../api/config';
const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3Ccircle cx="50" cy="35" r="15" fill="%239ca3af"/%3E%3Cpath d="M20 100 Q20 70 50 70 Q80 70 80 100" fill="%239ca3af"/%3E%3C/svg%3E';

const CATEGORY_COLORS: Record<string, string> = {
  'Executive': 'from-purple-600 to-purple-700',
  'Jumuiya Coordinators': 'from-blue-600 to-blue-700',
  'Bible Coordinators': 'from-green-600 to-green-700',
  'Rosary': 'from-pink-600 to-pink-700',
  'Pamphlet Managers': 'from-orange-600 to-orange-700',
  'Project Managers': 'from-indigo-600 to-indigo-700',
  'Liturgist': 'from-cyan-600 to-cyan-700',
  'Choir Officials': 'from-red-600 to-red-700',
  'Instrument Managers': 'from-blue-600 to-blue-700',
  'Liturgical Dancers': 'from-blue-600 to-blue-700',
  'Catechist': 'from-yellow-600 to-yellow-700'
};

export default function PublicHistoryView() {
  const navigate = useNavigate();
  const [termFilter, setTermFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { terms } = useTerms();
  const { history, meta, isLoading } = useHistory({ 
    termId: termFilter === 'all' ? undefined : termFilter,
    onlyArchived: true,
    page,
    limit,
    mode: 'csa'
  });

  const getPhotoUrl = (photo: string | null | undefined) => {
    if (!photo) return DEFAULT_AVATAR;
    if (photo.startsWith('http') || photo.startsWith('data:')) return photo;
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
                onChange={e => { setTermFilter(e.target.value); setPage(1); }}
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
          <div className="py-24 flex flex-col items-center justify-center gap-4">
             <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
             <p className="text-gray-500 font-bold animate-pulse">Retrieving historical records...</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12">
            {history.map((off) => (
              <article key={off.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                {/* Photo Container */}
                <div className="relative h-48 sm:h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  <img
                    src={getPhotoUrl(off.photo)}
                    alt={off.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-black text-white bg-gradient-to-r ${CATEGORY_COLORS[off.category] || 'from-gray-700 to-gray-800'} shadow-lg backdrop-blur-sm`}>
                    {off.category}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                     <span className="text-white text-xs font-bold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {off.term_year || off.term_of_service}
                     </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 text-center">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{off.name}</h3>
                  <div className="flex flex-col gap-1 mt-2">
                    <span className="text-xs font-black uppercase tracking-tighter text-indigo-500/80">
                      {off.position}
                    </span>
                    <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-gray-400 mt-1">
                       <AwardIcon className="w-3 h-3" />
                       {off.term_year || off.term_of_service}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination Toolbar */}
        {meta && meta.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="text-sm font-bold text-gray-500">
              Showing <span className="text-gray-900">{history.length}</span> of <span className="text-gray-900">{meta.total}</span> records
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={page === 1}
                className="w-12 h-12 flex items-center justify-center border border-gray-100 rounded-xl hover:bg-gray-50 disabled:opacity-20 transition-all shadow-sm bg-white"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-2">
                {[...Array(meta.totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => { setPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`w-12 h-12 rounded-xl text-sm font-black transition-all ${page === i + 1 ? 'bg-indigo-600 text-white shadow-lg scale-110' : 'bg-white text-gray-400 hover:text-gray-900 hover:bg-gray-50 border border-gray-100 shadow-sm'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => { setPage(p => Math.min(meta.totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={page === meta.totalPages}
                className="w-12 h-12 flex items-center justify-center border border-gray-100 rounded-xl hover:bg-gray-50 disabled:opacity-20 transition-all shadow-sm bg-white"
              >
                <ChevronLeft className="w-6 h-6 rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-16 text-center border-t border-gray-100 pt-8 pb-12">
           <p className="text-sm text-gray-400 font-medium">
             &copy; {new Date().getFullYear()} Church Symbols Association. All rights reserved.
           </p>
        </div>
      </div>
    </div>
  );
}
