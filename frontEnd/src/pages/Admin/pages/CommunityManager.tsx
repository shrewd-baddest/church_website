import { useState, useEffect } from 'react';
import apiService from '../../Landing/services/api';
import { 
  Users, 
  Settings2, 
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Loader2,
  RefreshCcw,
  LayoutGrid
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CommunityManager() {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.fetchTableData('hub_modules');
      setModules(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[CommunityManager] load error:', err);
      setError(err?.message || 'Failed to load community modules');
    } finally {
      setLoading(false);
    }
  };

  const filteredModules = modules.filter(m => 
    m.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
         <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
         <p className="text-slate-500 font-bold">Loading community modules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Community Management</h2>
          <p className="text-slate-500 text-sm mt-1">Manage all church ministries, groups, and sacramental modules.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadModules}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            title="Refresh"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
            <Plus size={20} />
            Create Module
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
              <LayoutGrid size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Modules</p>
              <p className="text-2xl font-black text-slate-800">{modules.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Enrollment</p>
              <p className="text-2xl font-black text-slate-800">42</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
              <Settings2 size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pending Updates</p>
              <p className="text-2xl font-black text-slate-800">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by module name or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredModules.length > 0 ? filteredModules.map((module) => (
          <div key={module.id} className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden flex flex-col">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: module.theme_color || '#3b82f6' }}
                >
                  <i className={`${module.icon_class} text-xl`}></i>
                </div>
                <div className="flex items-center gap-1">
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase">{module.title}</h3>
              <p className="text-xs font-mono text-slate-400 mt-0.5 tracking-tighter">ID: {module.id}</p>
              <p className="text-sm text-slate-500 mt-3 line-clamp-2">
                {module.description}
              </p>
              
              <div className="mt-6 flex flex-wrap gap-2">
                 <div className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{module.location || 'N/A'}</div>
                 <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{module.schedule_label || 'Weekly'}</div>
              </div>
            </div>
            
            <div className="mt-auto p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
               <Link 
                to={`/community/${module.id}`} 
                target="_blank"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
               >
                 <ExternalLink size={14} /> View Public Page
               </Link>
               <Link 
                to={`/admin/community-management/${module.id}`}
                className="text-xs font-bold text-blue-600 hover:underline"
               >
                 Edit Content
               </Link>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <LayoutGrid size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-slate-500 font-bold">No modules found matching your search.</h3>
          </div>
        )}
      </div>
    </div>
  );
}
