import { useState, useEffect } from 'react';
import { apiClient } from '../../../api/axiosInstance';
import { useAuth } from '../../../context/AuthContext';
import { MessageSquare, Trash2, Search, Calendar, User, Mail, RefreshCcw, Loader2, Eye, EyeOff, Shield, ShieldCheck, ExternalLink, Phone, Users } from 'lucide-react';

export default function AdminSuggestions() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());

  const userRoles = Array.isArray(user?.role) ? user.role : user?.role ? [user.role] : [];
  const normalized = userRoles.map(r => String(r).toUpperCase().trim());
  const isVC = normalized.includes("CSA_VICE_CHAIR");
  const isSuperAdmin = normalized.some(r => r === "CSA_CHAIR" || r.includes("ADMIN") || r.includes("SUPREME"));
  const canManage = isVC || isSuperAdmin;

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/suggestions/admin');
      setSuggestions(res.data.data || []);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSuggestions(); }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this suggestion?')) return;
    try {
      await apiClient.delete(`/suggestions/${id}`);
      loadSuggestions();
    } catch (err: any) {
      alert('Failed to delete: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRequestUnmask = async (id: number) => {
    if (!window.confirm('Send unmask request to CSA Chair and Liturgist?')) return;
    try {
      await apiClient.post(`/suggestions/${id}/request-unmask`);
      alert('Unmask request sent. The Chair and Liturgist will receive an email to review.');
      loadSuggestions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to request unmask');
    }
  };

  const handleReveal = async (id: number) => {
    try {
      const res = await apiClient.get(`/suggestions/${id}/reveal`);
      setRevealedIds(prev => new Set(prev).add(id));
      // Store the revealed data in the suggestions array
      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, _revealed: res.data.data } : s));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cannot reveal author');
    }
  };

  const filteredSuggestions = suggestions.filter(s =>
    s.suggestion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUnmaskBadge = (s: any) => {
    if (!s.is_anonymous) return { label: 'Identified', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: User };
    if (s.unmask_status === 'none') return { label: 'Anonymous', color: 'text-slate-500 bg-slate-50 border-slate-200', icon: EyeOff };
    if (s.unmask_status === 'requested') return { label: 'Unmask Requested', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Shield };
    if (s.unmask_status === 'unmasked') return { label: 'Unmasked', color: 'text-indigo-600 bg-indigo-50 border-indigo-200', icon: ShieldCheck };
    if (s.unmask_status === 'rejected') return { label: 'Unmask Rejected', color: 'text-rose-600 bg-rose-50 border-rose-200', icon: Shield };
    return { label: 'Anonymous', color: 'text-slate-500 bg-slate-50 border-slate-200', icon: EyeOff };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-white/40 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100 rounded-full blur-3xl -mr-32 -mt-32 opacity-40 pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">User Suggestions</h2>
          <p className="text-slate-500 font-medium mt-1 uppercase tracking-wider text-xs">Manage community feedback and ideas</p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={loadSuggestions} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin text-indigo-600' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
        <input type="text" placeholder="Search suggestions, names, or emails..."
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-6 py-4 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl text-slate-700 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
        />
      </div>

      {loading && suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200">
          <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
          <p className="text-slate-500 font-bold">Loading suggestions...</p>
        </div>
      ) : filteredSuggestions.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredSuggestions.map((item) => {
            const badge = getUnmaskBadge(item);
            const BadgeIcon = badge.icon;
            return (
              <div key={item.id} className="bg-white hover:bg-slate-50 transition-all duration-300 rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group">
                <div className="p-6 md:p-8 flex-1">
                  <div className="flex items-start justify-between mb-6">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm">
                      <MessageSquare size={24} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${badge.color}`}>
                        <BadgeIcon size={13} />
                        {badge.label}
                      </span>
                      <button onClick={() => handleDelete(item.id)}
                        className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-800 text-lg font-medium leading-relaxed mb-8 italic">
                    "{item.suggestion}"
                  </p>

                  {/* Author info section */}
                  {!item.is_anonymous && item.member ? (
                    <div className="border-t border-slate-50 pt-6 space-y-2">
                      <span className="text-xs font-black text-emerald-600 tracking-widest uppercase">Author</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="flex items-center gap-3 text-slate-600">
                          <User size={16} className="text-slate-400" />
                          <span className="text-sm font-bold">{item.member.first_name} {item.member.last_name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                          <Users size={16} className="text-slate-400" />
                          <span className="text-sm font-medium">{item.member.jumuiya || '—'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                          <Phone size={16} className="text-slate-400" />
                          <span className="text-sm font-medium">{item.member.phone || '—'}</span>
                        </div>
                      </div>
                    </div>
                  ) : item.is_anonymous && canManage ? (
                    <div className="border-t border-slate-50 pt-6">
                      {/* Revealed data */}
                      {item._revealed ? (
                        <div className="space-y-2">
                          <span className="text-xs font-black text-indigo-600 tracking-widest uppercase">Author Revealed</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="flex items-center gap-3 text-slate-600">
                              <User size={16} className="text-slate-400" />
                              <span className="text-sm font-bold">{item._revealed.first_name} {item._revealed.last_name}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                              <Users size={16} className="text-slate-400" />
                              <span className="text-sm font-medium">{item._revealed.jumuiya || '—'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                              <Phone size={16} className="text-slate-400" />
                              <span className="text-sm font-medium">{item._revealed.phone || '—'}</span>
                            </div>
                          </div>
                        </div>
                      ) : item.unmask_status === 'none' ? (
                        <button onClick={() => handleRequestUnmask(item.id)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all"
                        >
                          <Eye size={15} />
                          Request Unmask
                        </button>
                      ) : item.unmask_status === 'unmasked' ? (
                        <button onClick={() => handleReveal(item.id)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all"
                        >
                          <Eye size={15} />
                          View Author
                        </button>
                      ) : item.unmask_status === 'rejected' ? (
                        <span className="text-xs font-bold text-rose-500">Unmask request was rejected</span>
                      ) : (
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-amber-600">Awaiting approvals...</span>
                          <div className="flex gap-4 text-xs text-slate-500">
                            <span className={`flex items-center gap-1 ${item.unmask_chair_approved === true ? 'text-emerald-600' : item.unmask_chair_responded ? 'text-rose-500' : 'text-slate-400'}`}>
                              Chair: {item.unmask_chair_approved === true ? '✓' : item.unmask_chair_responded === false ? '✗' : '…'}
                            </span>
                            <span className={`flex items-center gap-1 ${item.unmask_liturgist_approved === true ? 'text-emerald-600' : item.unmask_liturgist_responded ? 'text-rose-500' : 'text-slate-400'}`}>
                              Liturgist: {item.unmask_liturgist_approved === true ? '✓' : item.unmask_liturgist_responded === false ? '✗' : '…'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Meta info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-50 pt-6 mt-6">
                    <div className="flex items-center gap-3 text-slate-600">
                      <User size={16} className="text-slate-400" />
                      <span className="text-sm font-bold truncate">{item.name || 'Anonymous'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <Mail size={16} className="text-slate-400" />
                      <span className="text-sm font-medium truncate">{item.email || 'No email provided'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <Calendar size={16} className="text-slate-400" />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200">
          <div className="w-20 h-20 bg-slate-50 flex items-center justify-center rounded-3xl mb-6">
            <MessageSquare size={40} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No suggestions found</h3>
          <p className="text-slate-500 mt-2">When users share ideas, they'll appear here.</p>
        </div>
      )}
    </div>
  );
}
