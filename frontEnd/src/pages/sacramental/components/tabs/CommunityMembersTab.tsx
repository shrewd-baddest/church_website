import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../api/axiosInstance';
import { useAuth } from '../../../../context/AuthContext';
import {
  FaUsers,
  FaSearch,
  FaThLarge,
  FaList,
  FaPhoneAlt,
  FaEnvelope,
  FaCheckCircle,
  FaClock,
  FaGraduationCap,
  FaLock,
  FaSignInAlt,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaSortAlphaDown,
  FaMusic,
  FaMars,
  FaVenus,
  FaMale,
  FaFemale,
  FaLayerGroup,
  FaTimes
} from 'react-icons/fa';
import '../../../Jumuiya/components/TabsSystem.css';

interface Props {
  moduleId: string;
  moduleName: string;
  color: string;
  isAdmin?: boolean;
}

const VOICE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Soprano: { bg: '#fdf2f8', text: '#db2777', border: '#fbcfe8' },
  Alto: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  Tenor: { bg: '#f0f9ff', text: '#0284c7', border: '#bae6fd' },
  Bass: { bg: '#eef2ff', text: '#4f46e5', border: '#c7d2fe' },
};

const CommunityMembersTab: React.FC<Props> = ({ moduleId, moduleName, color, isAdmin = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isChoir = moduleId === 'choir' || moduleName.toLowerCase().includes('choir');

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [voiceFilter, setVoiceFilter] = useState<'all' | 'soprano' | 'alto' | 'tenor' | 'bass'>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'year' | 'voice'>('name-asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(18);

  const { data: enrollmentsData = { enrollments: [], stats: { total: 0, approved: 0, pending: 0, rejected: 0 } }, isLoading } = useQuery({
    queryKey: ['enrollments', moduleId],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/community-enrollment/${moduleId}`, { params: { status: 'all' } });
        if (res.data && Array.isArray(res.data.enrollments)) {
          return res.data;
        }
      } catch (e) {
        // fallback
      }
      const res = await apiClient.get('/enrollments');
      const items = Array.isArray(res.data)
        ? res.data.filter((e: any) => e.class_id === moduleId || e.module_id === moduleId)
        : [];
      return {
        enrollments: items,
        stats: {
          total: items.length,
          approved: items.filter((x: any) => (x.status || '').toLowerCase() === 'approved').length,
          pending: items.filter((x: any) => (x.status || '').toLowerCase() === 'pending').length,
          rejected: items.filter((x: any) => (x.status || '').toLowerCase() === 'rejected').length,
        },
      };
    },
    retry: 1,
    staleTime: 60000,
  });

  const allEnrollments = (enrollmentsData.enrollments || []) as any[];

  // Helper to deduce year from registration number like PA106/G/33764/26
  const deduceYearFromReg = (reg: string): string => {
    if (!reg) return '';
    const clean = String(reg).trim();
    const match = clean.match(/\/(\d{2})$/) || clean.match(/\/(\d{2})\b/);
    if (match) {
      const yr = parseInt(match[1], 10);
      if (yr === 26) return '1';
      if (yr === 25) return '2';
      if (yr === 24) return '3';
      if (yr === 23) return '4';
      if (yr <= 22) return 'alumni';
    }
    return '';
  };

  const getYearRaw = (m: any): string => {
    const val = m.year_of_study || m.academic_year || m.year || '';
    if (val) return String(val).toLowerCase();
    const reg = m.reg_number || m.regNumber || m.member_id || m.memberId || '';
    const deduced = deduceYearFromReg(reg);
    if (deduced) return deduced;
    return '';
  };

  const getYearInfo = (m: any) => {
    if (m.year_of_study || m.academic_year || m.year) {
      const val = m.year_of_study || m.academic_year || m.year;
      return typeof val === 'number' || !String(val).toLowerCase().includes('year') ? `Year ${val}` : String(val);
    }
    const reg = m.reg_number || m.regNumber || m.member_id || m.memberId || '';
    const deduced = deduceYearFromReg(reg);
    if (deduced) {
      return deduced === 'alumni' ? 'Alumni' : `Year ${deduced}`;
    }
    if (m.created_at || m.joined_date || m.registration_date) {
      const d = new Date(m.created_at || m.joined_date || m.registration_date);
      if (!isNaN(d.getFullYear())) return `Joined ${d.getFullYear()}`;
    }
    return 'Member';
  };

  // Helper: Extract or assign gender (Gents / Ladies)
  const getGender = (m: any): 'Gent' | 'Lady' => {
    // 1. Explicit voice section takes precedence
    const v = (m.voice_type || m.voiceType || m.voice || m.part || '').toLowerCase();
    if (v.includes('soprano') || v.includes('alto')) return 'Lady';
    if (v.includes('tenor') || v.includes('bass')) return 'Gent';

    // 2. Gender check (MUST check female first because substring 'female' contains 'male'!)
    const g = (m.gender || m.sex || '').toLowerCase().trim();
    if (g.includes('female') || g === 'f' || g.includes('lady') || g.includes('woman') || g.includes('girl')) return 'Lady';
    if (g.includes('male') || g === 'm' || g.includes('gent') || g.includes('man') || g.includes('boy')) return 'Gent';

    return 'Lady';
  };

  // Helper: Extract or assign voice part deterministically respecting SATB gender separation
  const getVoiceType = (m: any): 'Soprano' | 'Alto' | 'Tenor' | 'Bass' => {
    const v = (m.voice_type || m.voiceType || m.voice || m.part || '').toLowerCase();
    if (v.includes('soprano')) return 'Soprano';
    if (v.includes('alto')) return 'Alto';
    if (v.includes('tenor')) return 'Tenor';
    if (v.includes('bass')) return 'Bass';

    const gender = getGender(m);
    const seed = (m.id || m.fullName || m.full_name || 'member').toString();
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 100;

    if (gender === 'Gent') {
      const maleVoices: ('Tenor' | 'Bass')[] = ['Tenor', 'Bass'];
      return maleVoices[hash % 2];
    } else {
      const femaleVoices: ('Soprano' | 'Alto')[] = ['Soprano', 'Alto'];
      return femaleVoices[hash % 2];
    }
  };

  // Regular members only see approved members
  const visibleEnrollments = useMemo(() => {
    if (isAdmin) return allEnrollments;
    return allEnrollments.filter((m) => (m.status || 'Approved').toLowerCase() === 'approved');
  }, [allEnrollments, isAdmin]);

  // Choir Voice Counts
  const choirVoiceCounts = useMemo(() => {
    if (!isChoir) return null;
    let soprano = 0, alto = 0, tenor = 0, bass = 0, gents = 0, ladies = 0;
    visibleEnrollments.forEach((m) => {
      const v = getVoiceType(m);
      if (v === 'Soprano') {
        soprano++;
        ladies++;
      } else if (v === 'Alto') {
        alto++;
        ladies++;
      } else if (v === 'Tenor') {
        tenor++;
        gents++;
      } else if (v === 'Bass') {
        bass++;
        gents++;
      }
    });
    return { soprano, alto, tenor, bass, gents, ladies, total: visibleEnrollments.length };
  }, [visibleEnrollments, isChoir]);

  // Filtered & sorted members
  const filteredAndSorted = useMemo(() => {
    let result = [...visibleEnrollments];

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((m) => {
        const name = (m.fullName || m.full_name || '').toLowerCase();
        const reg = (m.reg_number || m.regNumber || m.member_id || m.memberId || '').toLowerCase();
        const email = isAdmin ? (m.email || '').toLowerCase() : '';
        const phone = isAdmin ? (m.phoneNumber || m.phone || '').toLowerCase() : '';
        const voice = isChoir ? getVoiceType(m).toLowerCase() : '';
        const year = getYearRaw(m);
        return name.includes(q) || reg.includes(q) || email.includes(q) || phone.includes(q) || voice.includes(q) || year.includes(q);
      });
    }

    // Status filter (admin only)
    if (isAdmin && statusFilter !== 'all') {
      result = result.filter((m) => (m.status || 'Pending').toLowerCase() === statusFilter);
    }

    // Year filter
    if (yearFilter !== 'all') {
      result = result.filter((m) => {
        const y = getYearRaw(m);
        if (yearFilter === '1') return y.includes('1');
        if (yearFilter === '2') return y.includes('2');
        if (yearFilter === '3') return y.includes('3');
        if (yearFilter === '4') return y.includes('4');
        if (yearFilter === 'alumni') return y.includes('alumni') || y.includes('post') || y.includes('grad');
        return true;
      });
    }

    // Choir Voice Filter
    if (isChoir && voiceFilter !== 'all') {
      result = result.filter((m) => getVoiceType(m).toLowerCase() === voiceFilter);
    }

    // Choir Gender Filter (Gents / Ladies)
    if (isChoir && genderFilter !== 'all') {
      result = result.filter((m) => {
        const v = getVoiceType(m);
        if (genderFilter === 'male') return v === 'Tenor' || v === 'Bass';
        if (genderFilter === 'female') return v === 'Soprano' || v === 'Alto';
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      const nameA = (a.fullName || a.full_name || '').toLowerCase();
      const nameB = (b.fullName || b.full_name || '').toLowerCase();
      if (sortBy === 'name-asc') return nameA.localeCompare(nameB);
      if (sortBy === 'name-desc') return nameB.localeCompare(nameA);
      if (sortBy === 'year') {
        const yearA = getYearRaw(a);
        const yearB = getYearRaw(b);
        return yearA.localeCompare(yearB);
      }
      if (sortBy === 'voice') {
        const voiceA = getVoiceType(a);
        const voiceB = getVoiceType(b);
        return voiceA.localeCompare(voiceB);
      }
      return 0;
    });

    return result;
  }, [visibleEnrollments, search, statusFilter, yearFilter, voiceFilter, genderFilter, sortBy, isAdmin, isChoir]);

  // Pagination calculation
  const totalItems = filteredAndSorted.length;
  const totalPages = pageSize === 0 ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedMembers = useMemo(() => {
    if (pageSize === 0) return filteredAndSorted;
    const start = (validPage - 1) * pageSize;
    return filteredAndSorted.slice(start, start + pageSize);
  }, [filteredAndSorted, validPage, pageSize]);

  const approvedCount = allEnrollments.filter((m) => (m.status || '').toLowerCase() === 'approved').length;
  const pendingCount = allEnrollments.filter((m) => (m.status || '').toLowerCase() === 'pending').length;

  // ─────────────────────────────────────────────
  // Authentication Wall for Non-Logged-in Users
  // ─────────────────────────────────────────────
  if (!user) {
    return (
      <div className="tab-system-content" style={{ '--jumuiya-color': color } as React.CSSProperties}>
        <div className="max-w-xl mx-auto py-12 px-6 text-center">
          <div
            className="p-8 md:p-12 rounded-3xl shadow-xl border relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #faf8f5 100%)',
              borderColor: `${color}25`,
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md"
              style={{ background: `${color}15`, color }}
            >
              <FaLock size={26} />
            </div>

            <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">
              Member Directory is Private
            </h2>

            <p className="text-slate-600 text-sm leading-relaxed mb-8 max-w-md mx-auto font-medium">
              To protect the privacy of our community members, you need to sign in with your account to view the member directory.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={() =>
                  navigate('/login', {
                    state: { from: location.pathname + (location.search || '?tab=members') },
                  })
                }
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105"
                style={{ background: color }}
              >
                <FaSignInAlt size={14} />
                Sign In to View Members
              </button>

              <button
                onClick={() => navigate(`/community/${moduleId}/join`)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-slate-700 text-sm bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Join This Community
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-system-content" style={{ '--jumuiya-color': color } as React.CSSProperties}>
      {/* Header */}
      <div className="tab-header-wrap">
        <div className="header-text">
          <h1 className="page-title">{isChoir ? 'Choristers Roster & Voice Sections' : isAdmin ? 'Registered Members' : 'Community Directory'}</h1>
          <p className="page-description">
            {isChoir
              ? `Four-part SATB harmony directory for St. Thomas Aquinas Choir (${visibleEnrollments.length} Choristers)`
              : isAdmin
              ? `${allEnrollments.length} registered member${allEnrollments.length !== 1 ? 's' : ''} in ${moduleName}`
              : `${visibleEnrollments.length} joined member${visibleEnrollments.length !== 1 ? 's' : ''} in ${moduleName}`}
          </p>
        </div>
      </div>

      {/* CHOIR VOICE SECTIONS SUMMARY BAR (Interactive Filter Cards) */}
      {isChoir && choirVoiceCounts && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mb-6">
          <button
            type="button"
            onClick={() => {
              setVoiceFilter('all');
              setGenderFilter('all');
              setCurrentPage(1);
            }}
            className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
              voiceFilter === 'all' && genderFilter === 'all'
                ? 'ring-2 ring-blue-500 shadow-md bg-blue-50/70 border-blue-200'
                : 'bg-white border-slate-100 hover:border-slate-300'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Total Choir</span>
            <span className="text-xl font-black text-slate-900 leading-none">{choirVoiceCounts.total}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setVoiceFilter((prev) => (prev === 'soprano' ? 'all' : 'soprano'));
              setGenderFilter('all');
              setCurrentPage(1);
            }}
            className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
              voiceFilter === 'soprano'
                ? 'ring-2 ring-pink-500 shadow-md bg-pink-50/70 border-pink-200'
                : 'bg-white border-slate-100 hover:border-pink-200'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-pink-600 block mb-0.5">Soprano</span>
            <span className="text-xl font-black text-pink-700 leading-none">{choirVoiceCounts.soprano}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setVoiceFilter((prev) => (prev === 'alto' ? 'all' : 'alto'));
              setGenderFilter('all');
              setCurrentPage(1);
            }}
            className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
              voiceFilter === 'alto'
                ? 'ring-2 ring-amber-500 shadow-md bg-amber-50/70 border-amber-200'
                : 'bg-white border-slate-100 hover:border-amber-200'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block mb-0.5">Alto</span>
            <span className="text-xl font-black text-amber-700 leading-none">{choirVoiceCounts.alto}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setVoiceFilter((prev) => (prev === 'tenor' ? 'all' : 'tenor'));
              setGenderFilter('all');
              setCurrentPage(1);
            }}
            className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
              voiceFilter === 'tenor'
                ? 'ring-2 ring-sky-500 shadow-md bg-sky-50/70 border-sky-200'
                : 'bg-white border-slate-100 hover:border-sky-200'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 block mb-0.5">Tenor</span>
            <span className="text-xl font-black text-sky-700 leading-none">{choirVoiceCounts.tenor}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setVoiceFilter((prev) => (prev === 'bass' ? 'all' : 'bass'));
              setGenderFilter('all');
              setCurrentPage(1);
            }}
            className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
              voiceFilter === 'bass'
                ? 'ring-2 ring-indigo-500 shadow-md bg-indigo-50/70 border-indigo-200'
                : 'bg-white border-slate-100 hover:border-indigo-200'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block mb-0.5">Bass</span>
            <span className="text-xl font-black text-indigo-700 leading-none">{choirVoiceCounts.bass}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setGenderFilter((prev) => (prev === 'male' ? 'all' : 'male'));
              setVoiceFilter('all');
              setCurrentPage(1);
            }}
            className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
              genderFilter === 'male'
                ? 'ring-2 ring-blue-600 shadow-md bg-blue-100/70 border-blue-300'
                : 'bg-white border-slate-100 hover:border-blue-200'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block mb-0.5">Gents (T&B)</span>
            <span className="text-xl font-black text-blue-800 leading-none">{choirVoiceCounts.gents}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setGenderFilter((prev) => (prev === 'female' ? 'all' : 'female'));
              setVoiceFilter('all');
              setCurrentPage(1);
            }}
            className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
              genderFilter === 'female'
                ? 'ring-2 ring-rose-500 shadow-md bg-rose-50/70 border-rose-200'
                : 'bg-white border-slate-100 hover:border-rose-200'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 block mb-0.5">Ladies (S&A)</span>
            <span className="text-xl font-black text-rose-700 leading-none">{choirVoiceCounts.ladies}</span>
          </button>
        </div>
      )}

      {/* Admin stats */}
      {isAdmin && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total', value: allEnrollments.length, icon: <FaUsers size={16} />, bg: `${color}12` },
            { label: 'Approved', value: approvedCount, icon: <FaCheckCircle size={16} />, bg: '#10b98115' },
            { label: 'Pending', value: pendingCount, icon: <FaClock size={16} />, bg: '#f59e0b15' },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-2xl p-4 text-center transition-all hover:scale-[1.02]"
              style={{ background: stat.bg, border: `1px solid ${color}15` }}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <span style={{ color }}>{stat.icon}</span>
                <span className="text-2xl font-black" style={{ color: i === 1 ? '#10b981' : i === 2 ? '#f59e0b' : color }}>
                  {stat.value}
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filter Bar: Search + Sorting + View Mode (Voice & Gender dropdowns removed in favor of cards) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Search */}
          <div className="flex-1 relative flex items-center">
            <FaSearch className="absolute left-3.5 text-slate-400 pointer-events-none" size={14} />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={
                isChoir
                  ? 'Search chorister by name, voice part, or year…'
                  : 'Search members by name or year…'
              }
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title="Clear search"
              >
                <FaTimes size={12} />
              </button>
            )}
          </div>

          {/* Sort Selector & View Mode */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <FaSortAlphaDown className="absolute left-3 text-slate-400 pointer-events-none" size={12} />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="pl-8 pr-7 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white cursor-pointer"
              >
                <option value="name-asc">Name (A → Z)</option>
                <option value="name-desc">Name (Z → A)</option>
                {isChoir && <option value="voice">Voice Section (S-A-T-B)</option>}
                <option value="year">Year of Study</option>
              </select>
            </div>

            {/* Page Size Selector */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white cursor-pointer"
              title="Members per page"
            >
              <option value={12}>12 / page</option>
              <option value={18}>18 / page</option>
              <option value={36}>36 / page</option>
              <option value={72}>72 / page</option>
              <option value={0}>All</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex rounded-xl overflow-hidden border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2.5 transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'text-white' : 'text-slate-400 bg-slate-50 hover:bg-slate-100'
                }`}
                style={viewMode === 'grid' ? { background: color } : {}}
                aria-label="Grid view"
              >
                <FaThLarge size={13} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-2.5 transition-all cursor-pointer ${
                  viewMode === 'list' ? 'text-white' : 'text-slate-400 bg-slate-50 hover:bg-slate-100'
                }`}
                style={viewMode === 'list' ? { background: color } : {}}
                aria-label="List view"
              >
                <FaList size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Year Filter Pills & Active Filter Reset */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1 mr-1">
            <FaFilter size={9} /> Year:
          </span>
          {[
            { key: 'all', label: 'All Years' },
            { key: '1', label: 'Year 1' },
            { key: '2', label: 'Year 2' },
            { key: '3', label: 'Year 3' },
            { key: '4', label: 'Year 4' },
            { key: 'alumni', label: 'Alumni / Postgrad' },
          ].map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => {
                setYearFilter(pill.key);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                yearFilter === pill.key
                  ? 'text-white shadow-sm'
                  : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
              }`}
              style={yearFilter === pill.key ? { background: color } : {}}
            >
              {pill.label}
            </button>
          ))}

          {/* Quick Clear Indicator if any filter active */}
          {(voiceFilter !== 'all' || genderFilter !== 'all' || yearFilter !== 'all' || search.trim() !== '') && (
            <button
              type="button"
              onClick={() => {
                setVoiceFilter('all');
                setGenderFilter('all');
                setYearFilter('all');
                setSearch('');
                setCurrentPage(1);
              }}
              className="ml-auto px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
              title="Reset all filters"
            >
              <FaTimes size={9} /> Reset All Filters
            </button>
          )}

          {/* Admin status filters */}
          {isAdmin && (
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[11px] font-bold uppercase text-slate-400">Status:</span>
              {[
                { key: 'all' as const, label: 'All' },
                { key: 'approved' as const, label: 'Approved' },
                { key: 'pending' as const, label: 'Pending' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => {
                    setStatusFilter(f.key);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                    statusFilter === f.key
                      ? 'text-white shadow-xs'
                      : 'text-slate-500 bg-slate-100 hover:bg-slate-200'
                  }`}
                  style={statusFilter === f.key ? { background: color } : {}}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Showing count indicator */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-4 px-1">
          <span>
            Showing{' '}
            <strong className="text-slate-800">
              {pageSize === 0 ? totalItems : Math.min((validPage - 1) * pageSize + 1, totalItems)}–
              {pageSize === 0 ? totalItems : Math.min(validPage * pageSize, totalItems)}
            </strong>{' '}
            of <strong className="text-slate-800">{totalItems}</strong> {isChoir ? 'choristers' : 'members'}
          </span>

          {totalPages > 1 && (
            <span>
              Page {validPage} of {totalPages}
            </span>
          )}
        </div>
      )}

      {/* Member Directory Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-slate-200 rounded-full animate-spin" style={{ borderTopColor: color }} />
        </div>
      ) : paginatedMembers.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {paginatedMembers.map((member: any) => {
              const name = member.fullName || member.full_name || 'Member';
              const initials = name
                .split(' ')
                .filter(Boolean)
                .map((n: string) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              const regNo = member.reg_number || member.regNumber || member.member_id || member.memberId;
              const status = (member.status || 'Approved').toLowerCase();
              const yearTag = getYearInfo(member);
              const voice = isChoir ? getVoiceType(member) : null;
              const gender = isChoir ? getGender(member) : null;
              const vStyle = voice ? VOICE_COLORS[voice] || VOICE_COLORS.Soprano : null;

              return (
                <div
                  key={member.id || member._id || name}
                  className="relative rounded-2xl p-5 bg-white border border-slate-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group flex flex-col justify-between"
                >
                  {isAdmin && (
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{
                        background: status === 'approved' ? '#10b981' : status === 'rejected' ? '#ef4444' : '#f59e0b',
                      }}
                    />
                  )}

                  <div className="flex items-center gap-3.5 mt-1">
                    <div
                      className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-md ring-2 transition-transform group-hover:scale-105"
                      style={{ ringColor: `${color}20`, width: '48px', height: '48px' }}
                    >
                      {member.profile_image ? (
                        <img src={member.profile_image} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center font-black text-sm text-white"
                          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
                        >
                          {initials}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 justify-between">
                        <h3 className="font-bold text-slate-800 text-sm truncate">{name}</h3>
                        {gender && (
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${gender === 'Gent' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'}`}>
                            {gender === 'Gent' ? 'Gent' : 'Lady'}
                          </span>
                        )}
                      </div>

                      {/* Choir Voice Badge */}
                      {voice && vStyle && (
                        <div className="mt-1">
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider"
                            style={{ background: vStyle.bg, color: vStyle.text, border: `1px solid ${vStyle.border}` }}
                          >
                            <FaMusic size={9} />
                            {voice}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md"
                          style={{ background: `${color}0c`, color }}
                        >
                          <FaGraduationCap size={10} />
                          {yearTag}
                        </span>

                        {isAdmin && (
                          <span
                            className={`inline-block text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700'
                                : status === 'rejected'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {member.status || 'Pending'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Admin-only contact links */}
                  {isAdmin && (
                    <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                      {(member.phoneNumber || member.phone) && (
                        <a
                          href={`tel:${member.phoneNumber || member.phone}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:scale-105"
                          style={{ background: `${color}08`, color }}
                        >
                          <FaPhoneAlt size={9} /> Call
                        </a>
                      )}
                      {member.email && (
                        <a
                          href={`mailto:${member.email}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-blue-600 bg-blue-50 transition-all hover:scale-105 truncate max-w-[140px]"
                        >
                          <FaEnvelope size={9} /> Email
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {paginatedMembers.map((member: any) => {
              const name = member.fullName || member.full_name || 'Member';
              const initials = name
                .split(' ')
                .filter(Boolean)
                .map((n: string) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              const regNo = member.reg_number || member.regNumber || member.member_id || member.memberId;
              const status = (member.status || 'Approved').toLowerCase();
              const yearTag = getYearInfo(member);
              const voice = isChoir ? getVoiceType(member) : null;
              const gender = isChoir ? getGender(member) : null;
              const vStyle = voice ? VOICE_COLORS[voice] || VOICE_COLORS.Soprano : null;

              return (
                <div
                  key={member.id || member._id || name}
                  className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-100 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-sm"
                    >
                      {member.profile_image ? (
                        <img src={member.profile_image} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center font-black text-sm text-white"
                          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
                        >
                          {initials}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 text-sm truncate">{name}</h3>
                        {gender && (
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${gender === 'Gent' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'}`}>
                            {gender === 'Gent' ? 'Gent' : 'Lady'}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        {voice && vStyle && (
                          <span
                            className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider"
                            style={{ background: vStyle.bg, color: vStyle.text, border: `1px solid ${vStyle.border}` }}
                          >
                            <FaMusic size={8} /> {voice}
                          </span>
                        )}

                        <span className="text-xs text-slate-500 font-medium">{yearTag}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isAdmin && (
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                          status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : status === 'rejected'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {member.status || 'Pending'}
                      </span>
                    )}

                    {isAdmin && (member.phoneNumber || member.phone) && (
                      <a
                        href={`tel:${member.phoneNumber || member.phone}`}
                        className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-50"
                        title="Call member"
                      >
                        <FaPhoneAlt size={12} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-300">
            {isChoir ? <FaMusic size={28} /> : <FaUsers size={28} />}
          </div>
          <h3 className="text-base font-bold text-slate-700 mb-1">
            {search || yearFilter !== 'all' || (isChoir && (voiceFilter !== 'all' || genderFilter !== 'all'))
              ? 'No matching choristers found'
              : 'No choristers enrolled yet'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            {search || yearFilter !== 'all' || (isChoir && (voiceFilter !== 'all' || genderFilter !== 'all'))
              ? 'Try resetting the voice part or gender filters.'
              : 'Be the first to join and register for this voice section!'}
          </p>
          {(search || yearFilter !== 'all' || (isChoir && (voiceFilter !== 'all' || genderFilter !== 'all'))) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setYearFilter('all');
                setVoiceFilter('all');
                setGenderFilter('all');
                setCurrentPage(1);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm cursor-pointer transition-all hover:opacity-90"
              style={{ background: color }}
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={validPage === 1}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 bg-white border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
            aria-label="Previous page"
          >
            <FaChevronLeft size={10} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
            if (
              pg === 1 ||
              pg === totalPages ||
              (pg >= validPage - 1 && pg <= validPage + 1)
            ) {
              return (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                    validPage === pg
                      ? 'text-white shadow-sm'
                      : 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-50'
                  }`}
                  style={validPage === pg ? { background: color } : {}}
                >
                  {pg}
                </button>
              );
            }
            if (pg === validPage - 2 || pg === validPage + 2) {
              return (
                <span key={pg} className="px-1 text-slate-400 text-xs">
                  …
                </span>
              );
            }
            return null;
          })}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={validPage === totalPages}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 bg-white border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
            aria-label="Next page"
          >
            <FaChevronRight size={10} />
          </button>
        </div>
      )}
    </div>
  );
};

export default CommunityMembersTab;
