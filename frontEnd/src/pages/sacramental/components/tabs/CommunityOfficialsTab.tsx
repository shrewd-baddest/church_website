import React, { useState, useEffect } from 'react';
import type { CommunityModule } from '../../context/CommunityDataContext';
import { apiClient } from '../../../../api/axiosInstance';
import { FaPhoneAlt, FaWhatsapp, FaEnvelope, FaHistory, FaFilter, FaChevronDown } from 'react-icons/fa';
import '../../../Jumuiya/components/TabsSystem.css';

interface Props {
  module: CommunityModule;
  color: string;
  isAdmin?: boolean;
}

interface ArchivedOfficial {
  id: string;
  name: string;
  position: string;
  photo: string | null;
  contact: string | null;
  category: string;
  term_name: string | null;
  term_year: number | null;
}

interface ViewableOfficial {
  id: string;
  name: string;
  position: string;
  photo: string | null;
  phone: string | null;
  email: string | null;
  term_of_service: string | null;
}

const MODULE_TO_CATEGORY: Record<string, string> = {
  choir: 'Choir',
  dancers: 'Dancers',
  charismatic: 'Charismatic',
  'st-francis': 'St. Francis',
  youth: 'Mentorship',
};

// Some community chair/vice-chair roles are stored at the CSA level (the
// `officials` table) rather than in `group_officials`. Their archived history
// must be merged in separately, since /group-officials/term only scans group_officials.
// Note: Instrument Managers / Executive / etc. are standalone CSA categories and are
// NOT community chairs, so they are intentionally excluded here.
const MODULE_TO_CSA_CATEGORY: Record<string, string> = {
  choir: 'Choir Officials',
  dancers: 'Liturgical Dancers',
};

// Order past officials within a term by superiority (chair first … female
// representative last). Positions not listed fall back to the end so other
// communities keep their existing order.
const OFFICIAL_SUPERIORITY_RANK: Record<string, number> = {
  'choir chairperson': 1,
  'dance chairperson': 1,
  'dance coordinator': 1,
  'chairperson': 1,
  'choir vice chairperson': 2,
  'dance vice chairperson': 2,
  'assistant dance coordinator': 2,
  'vice chairperson': 2,
  'choir master': 3,
  'choir mistress': 4,
  'secretary': 5,
  'vice secretary': 6,
  'treasurer': 7,
  'project manager': 8,
  'male representative': 9,
  'female representative': 10,
};

const rankOfficial = (f: any): number =>
  OFFICIAL_SUPERIORITY_RANK[(f.position || '').toString().toLowerCase().trim()] ?? 99;

const Avatar: React.FC<{ name: string; image?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }> = ({ name, image, size = 'md' }) => {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const fontSize = size === 'xs' ? '0.65rem' : size === 'sm' ? '0.85rem' : '1.2rem';

  if (image) {
    return (
      <div className="w-full h-full">
        <img src={image} alt={name} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300" />
      </div>
    );
  }
  return (
    <div
      className="w-full h-full flex items-center justify-center font-bold"
      style={{
        background: 'var(--jumuiya-color)',
        color: 'white',
        fontSize: size === 'lg' ? '2.5rem' : fontSize
      }}
    >
      {initials}
    </div>
  );
};

const CommunityOfficialsTab: React.FC<Props> = ({ module, color }) => {
  const officials = module.officials || [];
  const moduleId = module.id || '';
  const [formerOfficials, setFormerOfficials] = useState<ArchivedOfficial[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<string>('all');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [viewedOfficial, setViewedOfficial] = useState<ViewableOfficial | null>(null);
  const [viewedSource, setViewedSource] = useState<ViewableOfficial[]>([]);

  const _c = (s: string) => color.length > 7 ? color.slice(0, 7) + s : color + s;

  const formatPhone = (phone: string) => phone.replace(/\D/g, '').replace(/^0/, '254');

  useEffect(() => {
    const category = MODULE_TO_CATEGORY[moduleId];
    if (!category) return;

    setLoadingHistory(true);
    const csaCategory = MODULE_TO_CSA_CATEGORY[moduleId];

    const groupReq = apiClient
      .get('/group-officials/term', { params: { only_archived: 'true', category, limit: 100 } })
      .then((res) => (Array.isArray(res.data?.data) ? res.data.data : []) as any[])
      .catch(() => [] as any[]);

    const csaReq = csaCategory
      ? apiClient
          .get('/officials/term', { params: { only_archived: 'true', limit: 200 } })
          .then((res) => {
            const rows = (Array.isArray(res.data?.data) ? res.data.data : []) as any[];
            return rows
              .filter((o) => o.category === csaCategory)
              .map((o) => ({ ...o, id: `csa-${o.id}` }));
          })
          .catch(() => [] as any[])
      : Promise.resolve([] as any[]);

    Promise.all([groupReq, csaReq])
      .then(([groupRows, csaRows]) => {
        setFormerOfficials([...groupRows, ...csaRows]);
      })
      .catch(() => setFormerOfficials([]))
      .finally(() => setLoadingHistory(false));
  }, [moduleId]);

  const filteredHistory = formerOfficials;

  // Prefer the editable term_of_service label; fall back to the derived
  // term_name/term_year (from election_term_id) or "Previous Term".
  const termKey = (f: any) =>
    f.term_of_service || f.term_name || (f.term_year ? `${f.term_year}` : 'Previous Term');

  const historyTerms = [...new Set(filteredHistory.map(termKey))].sort().reverse();

  const allFilteredOfficials = React.useMemo(() => {
    const result: ArchivedOfficial[] = [];
    const terms = historyFilter === 'all' ? historyTerms : [historyFilter];
    for (const term of terms) {
      for (const f of filteredHistory) {
        const t = termKey(f);
        if (t === term) result.push(f);
      }
    }
    return result;
  }, [filteredHistory, historyFilter, historyTerms]);

  const currentViewable: ViewableOfficial[] = React.useMemo(() =>
    officials.map((o: any) => ({
      id: o.id, name: o.name, position: o.role || o.position || '',
      photo: o.photoUrl || o.photo_url || null, phone: o.phoneNumber || o.phone || null,
      email: o.email || null, term_of_service: null,
    })), [officials]);

  const openDetail = (official: ViewableOfficial, source: ViewableOfficial[]) => {
    setViewedSource(source);
    setViewedOfficial(official);
  };

  const viewedIndex = viewedOfficial ? viewedSource.findIndex(f => f.id === viewedOfficial.id) : -1;

  const navigateViewed = (dir: number) => {
    if (viewedIndex < 0 || viewedSource.length === 0) return;
    const len = viewedSource.length;
    const next = (viewedIndex + dir + len) % len;
    setViewedOfficial(viewedSource[next]);
  };

  useEffect(() => {
    if (viewedOfficial) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [viewedOfficial]);

  const isViewing = viewedOfficial !== null;

  return (
    <div className="tab-system-content" style={{ '--jumuiya-color': color } as React.CSSProperties}>
      <div className="tab-header-wrap" style={isViewing ? { display: 'none' } : undefined}>
        <div className="header-text">
          <h1 className="page-title">Leadership Team</h1>
          <p className="page-description">Meet the dedicated leaders who guide and serve the {module.title} community.</p>
        </div>
      </div>

      {/* Inline detail view — replaces list when an official is selected */}
      {isViewing && viewedOfficial && (
        <div
          style={{ animation: 'detailFadeIn 0.3s ease-out' }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') navigateViewed(1);
            else if (e.key === 'ArrowLeft') navigateViewed(-1);
            else if (e.key === 'Escape') setViewedOfficial(null);
          }}
          tabIndex={0}
          ref={(el) => { if (el) el.focus({ preventScroll: true }); }}
        >
          {/* Sticky back button */}
          <div className="sticky top-0 z-10 py-3" style={{ background: 'var(--bg, #f8fafc)' }}>
            <button
              onClick={() => setViewedOfficial(null)}
              className="flex items-center gap-2 text-sm font-semibold transition-colors duration-150 hover:opacity-70 active:opacity-50"
              style={{ color }}
            >
              <FaChevronDown size={14} style={{ transform: 'rotate(90deg)' }} /> Back to all officials
            </button>
          </div>

          <div className="mx-auto w-full px-4 sm:px-0">
          <div className="mx-auto max-w-sm bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-100"
               style={{ animation: 'detailCardIn 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
            {/* Photo */}
            <div className="relative bg-gray-100 overflow-hidden">
              {viewedOfficial.photo ? (
                <img
                  src={viewedOfficial.photo}
                  alt={viewedOfficial.name}
                  className="w-full aspect-[3/4] object-cover object-top"
                />
              ) : (
                <div className="w-full aspect-[3/4] flex items-center justify-center">
                  <Avatar name={viewedOfficial.name} size="lg" />
                </div>
              )}

              {/* Name + position overlay (like mobile cards) */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-10 pb-3 px-4 text-center pointer-events-none">
                <h3 className="font-bold text-lg text-white drop-shadow-sm">{viewedOfficial.name}</h3>
                <span className="inline-block mt-1.5 text-xs font-bold text-white/95 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                  {viewedOfficial.position}
                </span>
              </div>

              {/* Close button */}
              <button
                onClick={() => setViewedOfficial(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 hover:scale-110 active:scale-95 transition-all duration-150 text-lg font-bold backdrop-blur-sm"
              >
                ×
              </button>

              {/* Nav arrows */}
              {viewedSource.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigateViewed(-1); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 hover:scale-110 active:scale-95 transition-all duration-150 text-xl backdrop-blur-sm"
                  >
                    ‹
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigateViewed(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 hover:scale-110 active:scale-95 transition-all duration-150 text-xl backdrop-blur-sm"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {/* Info */}
            <div className="px-5 py-3.5 text-center min-h-[92px] flex flex-col items-center justify-center">
              {viewedOfficial.term_of_service && (
                <p className="text-xs font-semibold text-gray-400">{viewedOfficial.term_of_service}</p>
              )}
              {(viewedOfficial.phone || viewedOfficial.email) ? (
                <div className={`flex justify-center gap-3 ${viewedOfficial.term_of_service ? 'mt-3 pt-3 border-t border-gray-100' : ''}`}>
                  {viewedOfficial.phone && (
                    <>
                      <a
                        href={`tel:${viewedOfficial.phone.replace(/[^+0-9]/g, '')}`}
                        className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 hover:text-white relative overflow-hidden group/btn flex items-center justify-center transition-all shadow-sm"
                        title="Call"
                      >
                        <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity z-0" style={{ background: `linear-gradient(to right, ${_c('cc')}, ${_c('aa')})` }} />
                        <FaPhoneAlt size={14} className="z-10 relative" />
                      </a>
                      <a
                        href={`https://wa.me/${viewedOfficial.phone.replace(/\D/g, '').replace(/^0/, '254')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="w-10 h-10 rounded-xl bg-emerald-50 text-[#25D366] hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-all shadow-sm"
                        title="WhatsApp"
                      >
                        <FaWhatsapp size={17} />
                      </a>
                    </>
                  )}
                  {viewedOfficial.email && (
                    <a
                      href={`mailto:${viewedOfficial.email}`}
                      className="w-10 h-10 rounded-xl bg-gray-50 text-blue-500 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
                      title="Email"
                    >
                      <FaEnvelope size={14} />
                    </a>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* Counter */}
          {viewedSource.length > 1 && (
            <p className="text-center text-xs text-gray-400 mt-4 font-medium">
              {viewedIndex + 1} / {viewedSource.length}
            </p>
          )}
          </div>
        </div>
      )}

      {/* Main list content — hidden when viewing an official detail */}
      {!isViewing && (<>
      {officials.length > 0 ? (<>
        {/* Mobile: compact 2-col grid matching the Jumuiya official cards */}
        <div className="grid grid-cols-2 gap-3.5 sm:hidden">
          {officials.map((official: any) => (
            <article
              key={`m-${official.id}`}
              onClick={() => openDetail({ id: official.id, name: official.name, position: official.role || official.position || '', photo: official.photoUrl || official.photo_url || null, phone: official.phoneNumber || official.phone || null, email: official.email || null, term_of_service: null }, currentViewable)}
              className="group bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer active:scale-[0.97]"
            >
              <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
                <Avatar name={official.name} image={official.photoUrl || official.photo_url} size="lg" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
                  <span className="truncate max-w-[85%] text-[0.68rem] font-bold text-white/95 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 shadow-sm">
                    {official.role || official.position || ''}
                  </span>
                </div>
              </div>
              <div className="p-3 text-center flex flex-col gap-2 bg-white">
                <h3 className="font-bold text-slate-950 text-sm line-clamp-1">{official.name}</h3>
                {(official.phoneNumber || official.phone) ? (
                  <div className="pt-1.5 border-t border-slate-100 flex justify-center gap-2">
                    <a
                      href={`tel:${(official.phoneNumber || official.phone).replace(/[^+0-9]/g, '')}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 hover:text-white relative overflow-hidden group/btn flex items-center justify-center transition-all shadow-sm"
                      title="Call"
                    >
                      <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity z-0" style={{ background: `linear-gradient(to right, ${_c('cc')}, ${_c('aa')})` }} />
                      <FaPhoneAlt size={13} className="z-10 relative" />
                    </a>
                    <a
                      href={`https://wa.me/${formatPhone(official.phoneNumber || official.phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-9 h-9 rounded-xl bg-emerald-50 text-[#25D366] hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-all shadow-sm"
                      title="WhatsApp"
                    >
                      <FaWhatsapp size={17} />
                    </a>
                  </div>
                ) : (
                  <div className="text-[0.7rem] text-slate-400 font-medium">No contact</div>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* Desktop: larger cards with flex-wrap (matching Jumuiya) */}
        <div className="hidden sm:flex flex-wrap justify-center gap-6 sm:gap-8">
          {officials.map((official: any) => (
            <article
              key={`d-${official.id}`}
              onClick={() => openDetail({ id: official.id, name: official.name, position: official.role || official.position || '', photo: official.photoUrl || official.photo_url || null, phone: official.phoneNumber || official.phone || null, email: official.email || null, term_of_service: null }, currentViewable)}
              className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.35rem)] xl:w-[calc(25%-1.5rem)] max-w-[320px] cursor-pointer active:scale-[0.98]"
            >
              <div className="relative h-48 sm:h-56 bg-gray-100 overflow-hidden">
                <Avatar name={official.name} image={official.photoUrl || official.photo_url} size="lg" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="px-3 pt-2.5 pb-3 text-center">
                <h3 className="font-bold text-sm text-gray-900 group-hover:text-[var(--jumuiya-color)] transition-colors truncate">
                  {official.name}
                </h3>
                <p className="text-xs font-semibold mt-1 px-2.5 py-0.5 rounded-full inline-block" style={{ background: `${_c('18')}`, color: _c('cc') }}>
                  {official.role || official.position}
                </p>
                <div className="mt-2 pt-2 border-t border-gray-50 flex justify-center gap-2">
                  {(official.phoneNumber || official.phone) && (
                    <>
                      <a
                        href={`tel:${(official.phoneNumber || official.phone).replace(/[^+0-9]/g, '')}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 hover:text-white relative overflow-hidden group/btn flex items-center justify-center transition-all shadow-sm"
                        title="Call Official"
                      >
                        <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity z-0" style={{ background: `linear-gradient(to right, ${_c('cc')}, ${_c('aa')})` }} />
                        <FaPhoneAlt size={12} className="z-10 relative" />
                      </a>
                      <a
                        href={`https://wa.me/${formatPhone(official.phoneNumber || official.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 rounded-lg bg-gray-50 text-[#25D366] hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-all shadow-sm"
                        title="WhatsApp"
                      >
                        <FaWhatsapp size={15} />
                      </a>
                    </>
                  )}
                  {official.email && (
                    <a
                      href={`mailto:${official.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 rounded-lg bg-gray-50 text-blue-500 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
                      title="Email Official"
                    >
                      <FaEnvelope size={12} />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </>) : (
        <div className="text-center py-16 rounded-3xl" style={{ background: `${color}06`, border: `1px dashed ${color}25` }}>
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: `${color}10` }}>
            <FaHistory style={{ color: `${color}40` }} size={28} />
          </div>
          <p className="font-semibold text-slate-400 text-sm">Leadership team information coming soon.</p>
        </div>
      )}

      {/* Leadership History — collapsible */}
      <div className="mt-20">
        <button
          onClick={() => setHistoryOpen(!historyOpen)}
          className="flex items-center gap-3 w-full group cursor-pointer"
        >
          <FaHistory className="opacity-60" />
          <span className="text-xs font-black uppercase tracking-widest">Leadership History</span>
          <div className="flex-1 h-px bg-gray-200"></div>
          <div className={`flex items-center gap-1.5 text-xs font-semibold text-gray-400 group-hover:text-gray-600 transition-colors ${historyOpen ? 'text-gray-600' : ''}`}>
            {loadingHistory ? 'Loading...' : formerOfficials.length > 0 ? `${formerOfficials.length} past official${formerOfficials.length !== 1 ? 's' : ''}` : 'No records'}
            <FaChevronDown
              size={10}
              className="transition-transform duration-300"
              style={{ transform: historyOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </div>
        </button>

        <div
          className="overflow-hidden transition-all duration-500"
          style={{
            maxHeight: historyOpen ? '2000px' : '0px',
            opacity: historyOpen ? 1 : 0,
          }}
        >

        {loadingHistory ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 text-gray-400 text-sm">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
              Loading history...
            </div>
          </div>
        ) : formerOfficials.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border-2 border-dashed" style={{ background: `${color}08`, borderColor: `${color}20` }}>
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: `${color}12` }}>
              <FaHistory style={{ color: `${color}50` }} size={28} />
            </div>
            <h3 className="text-base font-bold text-gray-500 mb-1">No Past Leadership Records</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">When a leadership term ends and officials are archived, their records will appear here for future reference.</p>
          </div>
        ) : (
          <>
            {/* History term filter */}
            {historyTerms.length > 1 && (
              <div className="flex items-center gap-2 mb-6">
                <FaFilter size={12} className="text-gray-400" />
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setHistoryFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      historyFilter === 'all'
                        ? 'bg-[var(--jumuiya-color)] text-white border-[var(--jumuiya-color)]'
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    All Terms
                  </button>
                  {historyTerms.map(term => (
                    <button
                      key={term}
                      onClick={() => setHistoryFilter(term)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        historyFilter === term
                          ? 'bg-[var(--jumuiya-color)] text-white border-[var(--jumuiya-color)]'
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-10">
              {(historyFilter === 'all' ? historyTerms : [historyFilter]).filter(Boolean).map(term => {
                const termOfficials = filteredHistory
                  .filter(f => (f.term_name || (f.term_year ? `${f.term_year}` : 'Previous Term')) === term)
                  .sort((a, b) => rankOfficial(a) - rankOfficial(b));
                if (termOfficials.length === 0) return null;
                return (
                  <div key={term}>
                    {/* Mobile: inline badge */}
                    <div className="md:hidden mb-4">
                      <span className="px-4 py-1.5 bg-[var(--jumuiya-color)]/10 text-[var(--jumuiya-color)] font-bold rounded-lg text-sm">
                        {term}
                      </span>
                    </div>
                    {/* Desktop: section header */}
                    <div className="hidden md:flex items-center gap-4 mb-6">
                      <span className="px-5 py-2 bg-[var(--jumuiya-color)]/10 text-[var(--jumuiya-color)] font-bold rounded-xl text-sm whitespace-nowrap">
                        {term}
                      </span>
                      <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${color}30, transparent)` }} />
                      <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{termOfficials.length} official{termOfficials.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-0 sm:flex sm:flex-wrap sm:gap-4">
                      {termOfficials.map(f => (
                        <div
                          key={f.id}
                          onClick={() => openDetail(
                            { id: f.id, name: f.name, position: f.position, photo: f.photo || null, phone: f.contact || null, email: null, term_of_service: f.term_of_service || f.term_name || (f.term_year ? `${f.term_year}` : null) },
                            termOfficials.map(t => ({ id: t.id, name: t.name, position: t.position, photo: t.photo || null, phone: t.contact || null, email: null, term_of_service: t.term_of_service || t.term_name || (t.term_year ? `${t.term_year}` : null) }))
                          )}
                          className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3 shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                            <Avatar name={f.name} image={f.photo || undefined} size="sm" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 truncate">{f.name}</h4>
                            <p className="text-xs text-gray-500 truncate">{f.position}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        </div>
      </div>
      </>)}
    </div>
  );
};

export default CommunityOfficialsTab;
