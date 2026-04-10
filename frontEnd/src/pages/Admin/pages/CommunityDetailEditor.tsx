import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../../Landing/services/api';
import { 
  ArrowLeft,
  Calendar,
  Megaphone,
  UserCheck,
  Users,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react';

type TabType = 'activities' | 'announcements' | 'officials' | 'members';

export default function CommunityDetailEditor() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('activities');
  const [moduleMeta, setModuleMeta] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategoryData();
  }, [categoryId, activeTab]);

  const loadCategoryData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Module Meta if not already loaded
      if (!moduleMeta) {
        const modules = await apiService.fetchTableData('hub_modules');
        const meta = modules.find((m: any) => m.id === categoryId);
        setModuleMeta(meta);
      }

      // 2. Fetch specific tab data
      let tableName = '';
      switch (activeTab) {
        case 'activities': tableName = 'hub_activities'; break;
        case 'announcements': tableName = 'hub_announcements'; break;
        case 'officials': tableName = 'hub_officials'; break;
        case 'members': tableName = 'enrollments'; break;
      }

      const result = await apiService.fetchTableData(tableName);
      // Filter by module_id (or class_id for members)
      const filtered = result.filter((item: any) => 
        (item.module_id === categoryId) || (item.class_id === categoryId)
      );
      setData(filtered);
    } catch (err: any) {
      console.error(`[DetailEditor] Load error for ${activeTab}:`, err);
      setError(`Failed to load ${activeTab} data`);
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'activities', label: 'Semester Activities', icon: Calendar },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'officials', label: 'Officials Management', icon: UserCheck },
    { id: 'members', label: 'Registered Members', icon: Users },
  ];

  if (loading && !moduleMeta) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 size={40} className="text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold">Connecting to {categoryId} dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Breadcrumbs & Header */}
      <div>
        <button 
          onClick={() => navigate('/admin/community-management')}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-bold text-sm mb-4"
        >
          <ArrowLeft size={16} /> Back to Community Management
        </button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl"
              style={{ backgroundColor: moduleMeta?.theme_color || '#3b82f6' }}
            >
              <i className={`${moduleMeta?.icon_class} text-2xl`}></i>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase">{moduleMeta?.title} COMMAND CENTER</h2>
              <p className="text-slate-500 text-sm mt-0.5">Admin Level Access • Manage {categoryId} resources and growth.</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <ExternalLink size={16} /> Public Preview
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 p-1 bg-slate-100/50 border border-slate-200 rounded-2xl w-fit overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {/* Tab Header Controls */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30">
          <div>
            <h3 className="font-black text-slate-800 uppercase tracking-tight">
              Manage {tabs.find(t => t.id === activeTab)?.label}
            </h3>
            <p className="text-xs text-slate-500 font-medium">Results for {categoryId} category</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
            <Plus size={18} />
            Add {activeTab === 'members' ? 'Member' : 'New ' + (activeTab.slice(0, -1))}
          </button>
        </div>

        <div className="p-6">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20">
               <Loader2 size={32} className="text-blue-500 animate-spin mb-4" />
               <p className="text-slate-400 text-sm">Synchronizing table data...</p>
             </div>
          ) : data.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                   {activeTab === 'activities' && <Calendar size={32} />}
                   {activeTab === 'announcements' && <Megaphone size={32} />}
                   {activeTab === 'officials' && <UserCheck size={32} />}
                   {activeTab === 'members' && <Users size={32} />}
                </div>
                <h4 className="text-slate-800 font-bold italic">No records found</h4>
                <p className="text-slate-500 text-sm mt-1">Start by clicking the "Add" button to populate this section.</p>
             </div>
          ) : (
            <div className="overflow-x-auto">
              {activeTab === 'members' ? (
                /* Members Table */
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Full Name</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Voice Type</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Level</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((member) => (
                      <tr key={member.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                              {member.full_name?.substring(0, 2)}
                            </div>
                            <span className="font-bold text-slate-700">{member.full_name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-600 font-medium capitalize">{member.voice_type || 'N/A'}</td>
                        <td className="py-4 px-4 text-sm text-slate-600 font-medium capitalize">{member.music_level || 'N/A'}</td>
                        <td className="py-4 px-4">
                           <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                             member.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                           }`}>
                             {member.status}
                           </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <button className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="Approve">
                                <CheckCircle size={18} />
                             </button>
                             <button className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                                <Trash2 size={18} />
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : activeTab === 'officials' ? (
                /* Officials Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {data.map((official) => (
                     <div key={official.id} className="flex flex-col border border-slate-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow group bg-slate-50/20">
                        <div className="h-48 bg-slate-100 relative overflow-hidden">
                           {official.photo_url ? (
                             <img src={official.photo_url} alt={official.name} className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <ImageIcon size={48} />
                             </div>
                           )}
                           <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-lg text-blue-600 hover:bg-white"><Edit2 size={14} /></button>
                              <button className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-lg text-rose-600 hover:bg-white"><Trash2 size={14} /></button>
                           </div>
                        </div>
                        <div className="p-4 text-center">
                           <h4 className="font-black text-slate-800 uppercase tracking-tight">{official.name}</h4>
                           <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mt-1">{official.role}</p>
                        </div>
                     </div>
                   ))}
                </div>
              ) : (
                /* List View for Activities/Announcements */
                <div className="space-y-4">
                  {data.map((item) => (
                    <div key={item.id} className="p-5 border border-slate-100 rounded-2xl hover:border-blue-200 hover:bg-blue-50/10 transition-all flex items-start justify-between gap-4 group">
                       <div className="flex gap-4">
                          <div className={`p-3 rounded-xl shrink-0 ${activeTab === 'activities' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                             {activeTab === 'activities' ? <Calendar size={20} /> : <Megaphone size={20} />}
                          </div>
                          <div>
                             <h4 className="font-bold text-slate-800 text-lg uppercase tracking-tight">{item.title}</h4>
                             <p className="text-slate-500 text-sm mt-1 leading-relaxed">{item.description || item.content}</p>
                             <div className="flex items-center gap-4 mt-3">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                   <Clock size={14} /> {item.activity_date || item.announcement_date ? new Date(item.activity_date || item.announcement_date).toLocaleDateString() : 'N/A'}
                                </div>
                                {item.location && (
                                   <div className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest">{item.location}</div>
                                )}
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-1 opacity-10 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"><Edit2 size={18} /></button>
                          <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"><Trash2 size={18} /></button>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
