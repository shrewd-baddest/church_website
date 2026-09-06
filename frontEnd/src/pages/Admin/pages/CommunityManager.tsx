import { useState } from 'react';
import { useCachedData } from '../../../hooks/useCachedData';
import { apiClient } from '../../../api/axiosInstance';
import { useAuth } from '../../../context/AuthContext';
import { normalizeRoles, getAllowedCommunityModules } from '../../../utils/adminAccess';
import {
  Search,
  ExternalLink,
  Loader2,
  RefreshCcw,
  LayoutGrid
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ClickableCard from '../../../components/ClickableCard';

const JUMUIYA_CARD_IMAGE_DEFAULT = "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=600";

const COMMUNITY_IMAGES: Record<string, string> = {
  choir: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600",
  dancers: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=600",
  charismatic: "https://images.unsplash.com/photo-1447069387593-a5de0862481e?auto=format&fit=crop&q=80&w=600",
  "st-francis": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=600",
  youth: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&q=80&w=600",
  mentorship: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&q=80&w=600",
  "our-jumuiyas": JUMUIYA_CARD_IMAGE_DEFAULT,
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1438029071396-1e831a7fa6d8?auto=format&fit=crop&q=80&w=600";

export default function CommunityManager() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: modules = [], loading, refetch: loadModules } = useCachedData<any[]>(
    'csa_cache_hub_modules',
    async () => {
      const [modulesRes, settingsRes] = await Promise.all([
        apiClient.get('/hub_modules').catch(() => ({ data: [] })),
        apiClient.get('/settings').catch(() => ({ data: {} })),
      ]);
      const data = Array.isArray(modulesRes.data) ? modulesRes.data : (modulesRes.data?.data || []);
      const allowedIds = ['choir', 'dancers', 'st-francis', 'charismatic', 'youth', 'mentorship'];
      
      const seen = new Set<string>();
      const filtered: any[] = [];
      for (const m of (Array.isArray(data) ? data : [])) {
        const id = m.id?.toLowerCase();
        if (!allowedIds.includes(id)) continue;
        const key = id === 'youth' || id === 'mentorship' ? 'mentorship' : id;
        if (seen.has(key)) continue;
        seen.add(key);
        filtered.push(m);
      }

      const settings = settingsRes.data || {};
      const jumuiyaImg = settings.community_jumuiya_image || settings.explore_jumuiya_image || JUMUIYA_CARD_IMAGE_DEFAULT;
      
      const ourJumuiyasCard = {
        id: 'our-jumuiyas',
        title: 'Our Jumuiyas',
        description: 'Small Christian Communities link card banner',
        saint_image_url: jumuiyaImg,
        theme_color: '#1d4ed8',
        public_url: '/jumuiya',
      };

      return [...filtered, ourJumuiyasCard];
    },
    []
  );

  const { user } = useAuth();
  const scopedModules = (() => {
    const allowed = getAllowedCommunityModules(normalizeRoles(user?.role));
    if (allowed === null) return modules;
    return modules.filter((m: any) => allowed.includes(m.id));
  })();

  const filteredModules = scopedModules.filter(m =>
    m.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSingleModule = scopedModules.length === 1;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
         <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
         <p className="text-slate-500 font-bold">Loading community modules...</p>
      </div>
    );
  }

  if (isSingleModule) {
    const module = scopedModules[0];
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-40 sm:h-56 w-full overflow-hidden relative">
            <img
              src={module.saint_image_url || module.image_url || COMMUNITY_IMAGES[module.id] || DEFAULT_IMAGE}
              alt={module.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{module.title}</h2>
              <p className="text-white/80 text-xs sm:text-sm font-semibold mt-1">Your community admin panel</p>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <Link
              to={`/admin/community-management/${module.id}`}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white shadow-md transition-all hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
            >
              Open Admin Panel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800">Community Management</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Manage church ministries and groups.</p>
        </div>
        <button
          onClick={() => loadModules()}
          className="self-start p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          title="Refresh"
        >
          <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="bg-blue-100 p-2.5 sm:p-3 rounded-xl text-blue-600">
          <LayoutGrid size={20} />
        </div>
        <div>
          <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Active Modules</p>
          <p className="text-xl sm:text-2xl font-black text-slate-800">{scopedModules.length}</p>
        </div>
      </div>

      {scopedModules.length > 1 && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredModules.length > 0 ? filteredModules.map((module) => (
          <ClickableCard
            key={module.id}
            to={`/admin/community-management/${module.id}`}
            ariaLabel={`Manage ${module.title}`}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-200 transition-all duration-300 overflow-hidden flex flex-col group"
          >
            <div className="h-36 sm:h-40 w-full overflow-hidden relative bg-slate-100">
              <img
                src={module.saint_image_url || module.image_url || COMMUNITY_IMAGES[module.id] || DEFAULT_IMAGE}
                alt={module.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent" />
            </div>
            <div className="p-4 sm:p-5 flex-grow flex flex-col justify-between">
              <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight uppercase group-hover:text-blue-600 transition-colors">
                {module.title}
              </h3>
            </div>
            <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
              <Link
                to={module.public_url || `/community/${module.id}`}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
              >
                <ExternalLink size={12} /> View Public Page
              </Link>
            </div>
          </ClickableCard>
        )) : (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <LayoutGrid size={40} className="mx-auto text-slate-200 mb-3" />
            <h3 className="text-slate-500 font-bold text-sm">No modules found.</h3>
          </div>
        )}
      </div>
    </div>
  );
}
