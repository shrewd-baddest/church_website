import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FaPhoneAlt, FaWhatsapp } from 'react-icons/fa'
import { Users, ChevronRight } from 'lucide-react'
import { useSocket } from '../../context/SocketContext'

import apiService from '../../services/api'
import { getSafeImageUrl } from '../../api/config'
import { getAvatarForCategory } from './constants/positionInfo'
import PageLoader from '../../assets/Layouts/PageLoader'

const CATEGORY_ORDER = [
  'Executive','Jumuiya Coordinators','Bible Coordinators','Rosary Coordinators',
  'Pamphlet Managers','Project Managers','Instrument Managers',
  'Choir Officials','Liturgical Dancers','Liturgists','Catechist'
]

const CATEGORY_ALIAS_MAP: Record<string, string> = {
  'Bible Coordinator': 'Bible Coordinators',
  'Bible Study Coordinator': 'Bible Coordinators',
  'Rosary': 'Rosary Coordinators',
  'Rosary Coordinator': 'Rosary Coordinators',
  'Pamphlet Manager': 'Pamphlet Managers',
  'Jumuiya Coordinator': 'Jumuiya Coordinators',
  'Project Manager': 'Project Managers',
  'Instrument Manager': 'Instrument Managers',
  'Choir Official': 'Choir Officials',
  'Liturgical Dance': 'Liturgical Dancers',
  'Liturgical Dancer': 'Liturgical Dancers',
  'Liturgist': 'Liturgists',
}

const CATEGORY_COLORS: Record<string, string> = {
  'Executive': 'from-purple-600 to-purple-700',
  'Jumuiya Coordinators': 'from-blue-600 to-blue-700',
  'Bible Coordinators': 'from-emerald-600 to-emerald-700',
  'Rosary Coordinators': 'from-pink-600 to-rose-700',
  'Pamphlet Managers': 'from-amber-600 to-orange-700',
  'Project Managers': 'from-indigo-600 to-indigo-700',
  'Liturgists': 'from-cyan-600 to-cyan-700',
  'Choir Officials': 'from-red-600 to-red-700',
  'Instrument Managers': 'from-sky-600 to-blue-700',
  'Liturgical Dancers': 'from-violet-600 to-purple-700',
  'Catechist': 'from-yellow-600 to-amber-700',
}

interface OfficialCardProps {
  off: any;
  cat: string;
  navigate: (path: string) => void;
  threeCol?: boolean;
}

function OfficialCard({ off, cat, navigate, threeCol }: OfficialCardProps) {
  const defaultAvatar = getAvatarForCategory(cat);
  const initialPhotoUrl = off.photo ? getSafeImageUrl(off.photo) : defaultAvatar;
  const [imgSrc, setImgSrc] = React.useState(initialPhotoUrl);

  React.useEffect(() => {
    setImgSrc(off.photo ? getSafeImageUrl(off.photo) : defaultAvatar);
  }, [off.photo, cat, defaultAvatar]);

  return (
    <>
      <article
        onClick={() => navigate(`/officials/${off.id}`)}
        className="sm:hidden group bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer active:scale-95 transform-gpu"
        title={`View ${off.name}'s profile`}
      >
        {/* Portrait image — aspect 4:5, aligned to top so faces aren't cropped */}
        <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
          <img
            src={imgSrc}
            onError={() => setImgSrc(defaultAvatar)}
            alt={off.name}
            loading="lazy"
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          {/* Bottom vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-80" />
          {/* Position badge */}
          <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
            <span className="truncate max-w-[85%] text-[0.68rem] font-bold text-white/95 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 shadow-sm">
              {off.position || off.category}
            </span>
            <span className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Name + contact */}
        <div className="p-3 text-center flex flex-col gap-2 bg-white">
          <h3 className="font-bold text-slate-950 text-sm line-clamp-1">{off.name}</h3>
          {off.contact ? (
            <div className="pt-1.5 border-t border-slate-100 flex justify-center gap-2">
              <a
                href={`tel:${off.contact.replace(/[^+0-9]/g, '')}`}
                onClick={(e) => e.stopPropagation()}
                className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 hover:text-white relative overflow-hidden group/btn flex items-center justify-center transition-all shadow-sm"
                title="Call"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${CATEGORY_COLORS[cat] || 'from-gray-600 to-gray-700'} opacity-0 group-hover/btn:opacity-100 transition-opacity z-0`} />
                <FaPhoneAlt size={13} className="z-10 relative" />
              </a>
              <a
                href={`https://wa.me/${off.contact.replace(/[^+0-9]/g, '')}`}
                target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-9 h-9 rounded-xl bg-emerald-50 text-[#25D366] hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-all shadow-sm"
                title="WhatsApp"
              >
                <FaWhatsapp size={17} />
              </a>
            </div>
          ) : (
            <div className="text-[0.7rem] text-slate-400 font-medium">Tap to view info</div>
          )}
        </div>
      </article>

      <article
        onClick={() => navigate(`/officials/${off.id}`)}
        className="hidden sm:block group bg-white border border-slate-200 rounded-[1.75rem] shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer"
        style={{ width: threeCol ? 'calc(33.333% - 1rem)' : 'calc(50% - 0.5rem)', maxWidth: threeCol ? '240px' : '220px' }}
        title={`View ${off.name}'s profile`}
      >
        <div className="relative h-44 md:h-52 bg-slate-100 overflow-hidden">
          <img
            src={imgSrc}
            onError={() => setImgSrc(defaultAvatar)}
            alt={off.name}
            loading="lazy"
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
          />
          {/* Colour tint overlay on hover */}
          <div className={`absolute inset-0 bg-gradient-to-t ${CATEGORY_COLORS[cat] || 'from-gray-600 to-gray-700'} opacity-0 group-hover:opacity-25 transition-opacity duration-300`} />
          {/* "View profile" pill that slides in on hover */}
          <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="mx-auto max-w-fit rounded-full bg-slate-950/80 px-4 py-2 text-[0.72rem] font-bold uppercase tracking-[0.05em] text-white shadow-lg backdrop-blur-md">
              View profile
            </div>
          </div>
        </div>

        {/* Name below the image */}
        <div className="p-4 text-center">
          <h3 className="font-bold text-slate-950 text-sm group-hover:text-purple-700 transition-colors line-clamp-2 leading-snug">
            {off.name}
          </h3>
          {off.position && (
            <p className="text-slate-500 text-xs mt-1 line-clamp-1">{off.position}</p>
          )}
          {off.contact && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-center gap-2">
              <a
                href={`tel:${off.contact.replace(/[^+0-9]/g, '')}`}
                onClick={(e) => e.stopPropagation()}
                className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all shadow-sm"
                title="Call"
              >
                <FaPhoneAlt size={13} />
              </a>
              <a
                href={`https://wa.me/${off.contact.replace(/[^+0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-9 h-9 rounded-xl bg-emerald-50 text-[#25D366] hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-all shadow-sm"
                title="WhatsApp"
              >
                <FaWhatsapp size={17} />
              </a>
            </div>
          )}
        </div>
      </article>
    </>
  );
}

export default function PublicView() {
  const navigate  = useNavigate()
  const { socket } = useSocket()
  const [data, setData]             = React.useState<any[]>([])
  const [loading, setLoading]       = React.useState(true)
  const [fetchError, setFetchError] = React.useState('')
  const [activeCategory, setActiveCategory] = React.useState<string>('Executive')

  React.useEffect(() => { fetchOfficials() }, [])

  React.useEffect(() => {
    if (!socket) {
      const interval = setInterval(() => {
        fetchOfficials(true)
      }, 15000)
      return () => clearInterval(interval)
    }

    const handleUpdate = () => {
      fetchOfficials(true)
    }

    socket.on('officialsUpdated', handleUpdate)
    return () => {
      socket.off('officialsUpdated', handleUpdate)
    }
  }, [socket])

  async function fetchOfficials(bypassCache: any = false) {
    const isEvent = bypassCache && typeof bypassCache === 'object' && 'preventDefault' in bypassCache;
    const actualBypass = isEvent ? true : !!bypassCache;

    const cached = localStorage.getItem('csa_cache_officials');
    
    if (!actualBypass || !cached) {
      if (cached) {
        try {
          setData(JSON.parse(cached));
          setLoading(false);
        } catch (e) {
          setLoading(true);
        }
      } else {
        setLoading(true);
      }
    }
    setFetchError('')

    try {
      const shouldBypass = actualBypass || !!cached;
      const officials = await apiService.getOfficials(shouldBypass);
      setData(officials || [])
    } catch (e) {
      if (!cached) {
        setFetchError((e as Error).message || 'Failed to load officials')
      }
    } finally { 
      setLoading(false) 
    }
  }

  const getPositionRank = (pos: string) => {
    const p = (pos || '').toLowerCase();
    if (p.includes('chairperson') || p.includes('chairman')) return p.includes('vice') ? 2 : 1;
    if (p.includes('secretary')) {
      if (p.includes('organizing') || p.includes('organising')) return 3;
      if (p.includes('assistant') || p.includes('vice')) return 5;
      return 4;
    }
    if (p.includes('treasurer')) return 6;
    if (p.includes('coordinator') || p.includes('manager') || p.includes('liturgist') || p.includes('catechist')) {
       return p.includes('assistant') || p.includes('vice') ? 12 : 11;
    }
    return 100;
  };

  const grouped = React.useMemo(() => {
    const map: Record<string, any[]> = {}
    CATEGORY_ORDER.forEach(cat => { map[cat] = []; });

    data
      .filter(d => d.status !== 'archived')
      .forEach(d => {
        let c = d.category || 'Other';
        if (CATEGORY_ALIAS_MAP[c]) c = CATEGORY_ALIAS_MAP[c];
        if (!map[c]) map[c] = [];
        map[c].push(d);
      })
    
    Object.keys(map).forEach(c => {
      map[c].sort((a, b) => getPositionRank(a.position) - getPositionRank(b.position));
    });

    return map
  }, [data])

  const groupedCategories = React.useMemo(() => {
    const explicitPairs: Record<string, string> = {
      'Project Managers': 'Instrument Managers',
      'Choir Officials': 'Liturgical Dancers',
      'Liturgists': 'Catechist'
    };
    const isPairedRight = Object.values(explicitPairs);

    const rows: any[] = [];
    let currentSmallRow: string[] = [];

    CATEGORY_ORDER.forEach(cat => {
      if (explicitPairs[cat]) {
        if (currentSmallRow.length > 0) {
          rows.push({ type: 'small-group', categories: currentSmallRow });
          currentSmallRow = [];
        }
        rows.push({ type: 'small-group', categories: [cat, explicitPairs[cat]] });
      } else if (isPairedRight.includes(cat)) {
        // Skip, handled by the left side
      } else {
        const members = grouped[cat] || [];
        if (cat === 'Executive' || members.length > 2) {
          if (currentSmallRow.length > 0) {
            rows.push({ type: 'small-group', categories: currentSmallRow });
            currentSmallRow = [];
          }
          rows.push({ type: 'large', category: cat });
        } else {
          // Always add small category section so section ID element is rendered in DOM
          currentSmallRow.push(cat);
          if (currentSmallRow.length === 2) {
            rows.push({ type: 'small-group', categories: currentSmallRow });
            currentSmallRow = [];
          }
        }
      }
    });

    if (currentSmallRow.length > 0) {
      rows.push({ type: 'small-group', categories: currentSmallRow });
    }

    return rows;
  }, [grouped]);

  // Scroll observer to update active category button as user scrolls
  React.useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const matchCat = CATEGORY_ORDER.find(
              (cat) => `category-${cat.replace(/\s+/g, '-')}` === id
            );
            if (matchCat) {
              setActiveCategory(matchCat);
            }
          }
        });
      },
      { rootMargin: '-20% 0px -50% 0px', threshold: 0 }
    );

    CATEGORY_ORDER.forEach((cat) => {
      const el = document.getElementById(`category-${cat.replace(/\s+/g, '-')}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [groupedCategories, loading]);

  const scrollToCategory = (cat: string) => {
    setActiveCategory(cat);
    const el = document.getElementById(`category-${cat.replace(/\s+/g, '-')}`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const renderOfficialsSection = (cat: string, list: any[]) => {
    if (list.length === 0) {
      return (
        <div className="w-full bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-6 sm:p-8 text-center shadow-sm">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-slate-900 font-bold text-base mb-1">No officials assigned yet</h4>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Official details for {cat} will be published once updated by leadership.
          </p>
        </div>
      );
    }

    const renderGrid = (items: any[], threeCol?: boolean) => (
      <div className={`grid ${threeCol ? 'grid-cols-3' : 'grid-cols-2'} gap-3.5 sm:hidden`}>
        {items.map((off) => (
          <OfficialCard key={off.id} off={off} cat={cat} navigate={navigate} />
        ))}
      </div>
    );

    const renderDesktopFlex = (items: any[], threeCol?: boolean) => (
      <div className="hidden sm:flex flex-wrap justify-center gap-4 sm:gap-6">
        {items.map((off) => (
          <OfficialCard key={off.id} off={off} cat={cat} navigate={navigate} threeCol={threeCol} />
        ))}
      </div>
    );

    if (cat === 'Executive') {
      return (
        <div>
          {renderGrid(list)}
          {renderDesktopFlex(list, true)}
        </div>
      );
    }

    return (
      <>
        {renderGrid(list)}
        {renderDesktopFlex(list)}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/20 pb-16">
      {/* Hero Header Section */}
      <div className="relative bg-slate-950 text-white overflow-hidden border-b border-slate-900/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.12)] mb-10">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-72 hero-wave hero-wave-1" />
          <div className="absolute inset-x-0 bottom-8 h-80 hero-wave hero-wave-2" />
          <div className="absolute inset-x-0 bottom-16 h-88 hero-wave hero-wave-3" />
          <div className="absolute inset-x-0 bottom-24 h-96 hero-wave hero-wave-4" />
          <div className="absolute inset-0 bg-slate-950/70" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl" />
          <div className="absolute top-12 -left-24 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-10 sm:py-16 text-center">
          
          <h1
            className="font-bold mb-3 relative z-10 text-white tracking-tight"
            style={{
              fontSize: 'clamp(1.85rem, 4vw, 3rem)',
              lineHeight: 1.15,
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            Our CSA Officials
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto relative z-10 font-normal">
            Discover the dedicated leaders guiding our Catholic Students Association through faith, service, and spiritual growth.
          </p>

          {/* Desktop Category Navigation Ribbon (sm:flex) */}
          <div className="hidden sm:flex flex-wrap justify-center gap-2 mt-8 relative z-10 max-w-5xl mx-auto">
             {CATEGORY_ORDER.map(cat => {
               const count = (grouped[cat] || []).length;
               const isActive = activeCategory === cat;

               return (
                 <button 
                    key={`nav-desktop-${cat}`}
                    onClick={() => scrollToCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 shadow-md flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-white text-slate-950 shadow-white/10 scale-105'
                        : 'bg-slate-900/90 text-slate-300 border border-slate-700/60 hover:bg-slate-800 hover:text-white'
                    }`}
                 >
                   <span>{cat}</span>
                   {count > 0 && (
                     <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${isActive ? 'bg-purple-100 text-purple-900 font-extrabold' : 'bg-slate-800 text-slate-300'}`}>
                       {count}
                     </span>
                   )}
                 </button>
               );
             })}
          </div>

          {/* Mobile Horizontal Touch Ribbon Navigation (sm:hidden) */}
          <div className="sm:hidden relative w-full mt-6 z-10">
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-slate-950 to-transparent z-20 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-slate-950 to-transparent z-20 pointer-events-none" />
            
            <div className="flex overflow-x-auto no-scrollbar gap-2 px-3 py-1.5 scroll-smooth">
              {CATEGORY_ORDER.map(cat => {
                const count = (grouped[cat] || []).length;
                const isActive = activeCategory === cat;

                return (
                  <button 
                    key={`nav-mobile-${cat}`}
                    onClick={() => scrollToCategory(cat)}
                    className={`whitespace-nowrap px-3.5 py-2 rounded-full text-xs font-bold transition-all duration-200 shadow-sm flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-white text-slate-950 shadow-md scale-105'
                        : 'bg-slate-900/90 text-slate-300 border border-slate-700/60 active:bg-slate-800'
                    }`}
                  >
                    <span>{cat}</span>
                    {count > 0 && (
                      <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${isActive ? 'bg-purple-100 text-purple-900 font-extrabold' : 'bg-slate-800 text-slate-300'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-slate-800">

          {fetchError ? (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center gap-4">
            <div className="text-sm text-red-700">Unable to load officials: {fetchError}</div>
            <button onClick={fetchOfficials} className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-bold">Retry</button>
          </div>
        ) : loading ? (
          <PageLoader message="Loading officials" />
        ) : (
          <>
            {groupedCategories.map((row, index) => {
              if (row.type === 'large') {
                const cat = row.category;
                const members = grouped[cat] || [];
                return (
                  <section key={cat} id={`category-${cat.replace(/\s+/g, '-')}`} className="mb-14 sm:mb-16 scroll-mt-24">
                    {/* Category Header */}
                    <div className="mb-6 sm:mb-8 text-center">
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <div className={`h-1 w-8 sm:w-12 bg-gradient-to-r ${CATEGORY_COLORS[cat] || 'from-gray-600 to-gray-700'} rounded-full`}></div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">{cat}</h2>
                        <div className={`h-1 w-8 sm:w-12 bg-gradient-to-l ${CATEGORY_COLORS[cat] || 'from-gray-600 to-gray-700'} rounded-full`}></div>
                      </div>
                      <div className="flex justify-center">
                        <span className={`inline-block px-3.5 py-0.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${CATEGORY_COLORS[cat] || 'from-gray-600 to-gray-700'} shadow-sm`}>
                          {members.length} member{members.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Cards */}
                    {renderOfficialsSection(cat, members)}
                  </section>
                );
              } else {
                return (
                  <div key={`small-group-${index}`} className="flex flex-col md:flex-row gap-10 md:gap-8 mb-14 sm:mb-16 items-start justify-center">
                    {row.categories.map((cat: string) => {
                      const members = grouped[cat] || [];
                      return (
                        <section key={cat} id={`category-${cat.replace(/\s+/g, '-')}`} className="flex-1 scroll-mt-24 w-full">
                          {/* Category Header */}
                          <div className="mb-6 sm:mb-8 text-center">
                            <div className="flex items-center justify-center gap-3 mb-3">
                              <div className={`h-1 w-8 sm:w-12 bg-gradient-to-r ${CATEGORY_COLORS[cat] || 'from-gray-600 to-gray-700'} rounded-full`}></div>
                              <h2 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">{cat}</h2>
                              <div className={`h-1 w-8 sm:w-12 bg-gradient-to-l ${CATEGORY_COLORS[cat] || 'from-gray-600 to-gray-700'} rounded-full`}></div>
                            </div>
                            <div className="flex justify-center">
                              <span className={`inline-block px-3.5 py-0.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${CATEGORY_COLORS[cat] || 'from-gray-600 to-gray-700'} shadow-sm`}>
                                {members.length} member{members.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>

                          {/* Cards */}
                          {renderOfficialsSection(cat, members)}
                        </section>
                      );
                    })}
                  </div>
                );
              }
            })}
          </>
        )}

        {/* View Past Officials */}
        <div className="mt-16 mb-10 flex flex-col items-center">
          <div className="w-full max-w-lg h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent mb-8"></div>
          <p className="text-slate-500 text-sm font-medium mb-4">Want to see our leadership history?</p>
          <button
            onClick={() => navigate('/officials/history')}
            className="group flex items-center gap-3 px-6 py-3.5 sm:px-8 sm:py-4 bg-slate-950 text-white border border-slate-900/40 rounded-2xl shadow-md hover:shadow-xl hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-300 font-bold text-sm sm:text-base active:scale-95"
          >
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span>View Past Officials History</span>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
)
}


