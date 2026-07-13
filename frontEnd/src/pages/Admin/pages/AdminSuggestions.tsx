import { useState, useEffect } from 'react';
import { apiClient } from '../../../api/axiosInstance';
import { useAuth } from '../../../context/AuthContext';
import { MessageSquare, Trash2, Search, Calendar, User, Users, RefreshCcw, Loader2, Eye, EyeOff, Shield, ShieldCheck, Phone, CheckCircle, Clock, Send, Tag, Filter, X } from 'lucide-react';

const STATUSES = ['new', 'under_review', 'acknowledged', 'implemented', 'closed'] as const;
const STATUS_LABELS: Record<string, string> = { new: 'New', under_review: 'Under Review', acknowledged: 'Acknowledged', implemented: 'Implemented', closed: 'Closed' };
const STATUS_COLORS: Record<string, string> = { new: 'bg-slate-100 text-slate-700 border-slate-200', under_review: 'bg-amber-50 text-amber-700 border-amber-200', acknowledged: 'bg-blue-50 text-blue-700 border-blue-200', implemented: 'bg-emerald-50 text-emerald-700 border-emerald-200', closed: 'bg-slate-100 text-slate-500 border-slate-200' };

const CATEGORIES = ['worship', 'facilities', 'events', 'spiritual_growth', 'outreach', 'other'] as const;
const CATEGORY_LABELS: Record<string, string> = { worship: 'Worship', facilities: 'Facilities', events: 'Events', spiritual_growth: 'Spiritual Growth', outreach: 'Outreach', other: 'Other' };
const CATEGORY_COLORS: Record<string, string> = { worship: 'bg-purple-50 text-purple-700 border-purple-200', facilities: 'bg-orange-50 text-orange-700 border-orange-200', events: 'bg-blue-50 text-blue-700 border-blue-200', spiritual_growth: 'bg-emerald-50 text-emerald-700 border-emerald-200', outreach: 'bg-amber-50 text-amber-700 border-amber-200', other: 'bg-slate-50 text-slate-600 border-slate-200' };

export default function AdminSuggestions() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());
  const [responseInputs, setResponseInputs] = useState<Record<number, string>>({});

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
    if (!window.confirm('Delete this suggestion permanently?')) return;
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
      alert('Unmask request sent.');
      loadSuggestions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to request unmask');
    }
  };

  const handleReveal = async (id: number) => {
    try {
      const res = await apiClient.get(`/suggestions/${id}/reveal`);
      setRevealedIds(prev => new Set(prev).add(id));
      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, _revealed: res.data.data } : s));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cannot reveal author');
    }
  };

  const handleSendResponse = async (id: number) => {
    const text = responseInputs[id]?.trim();
    if (!text) return;
    try {
      await apiClient.put(`/suggestions/${id}/respond`, { response: text });
      setResponseInputs(prev => ({ ...prev, [id]: '' }));
      loadSuggestions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send response');
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await apiClient.put(`/suggestions/${id}/status`, { status });
      loadSuggestions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleCategoryChange = async (id: number, category: string | null) => {
    try {
      await apiClient.put(`/suggestions/${id}/category`, { category });
      loadSuggestions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update category');
    }
  };

  const statCounts = (s: string) => s === 'all' ? suggestions.length : suggestions.filter(x => x.status === s).length;

  const filteredSuggestions = suggestions.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!s.suggestion?.toLowerCase().includes(q) && !s.name?.toLowerCase().includes(q) && !s.email?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const getUnmaskBadge = (s: any) => {
    if (!s.is_anonymous) return { label: 'Identified', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: User };
    if (s.unmask_status === 'none') return { label: 'Anonymous', color: 'text-slate-500 bg-slate-50 border-slate-200', icon: EyeOff };
    if (s.unmask_status === 'requested') return { label: 'Unmask Requested', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Shield };
    if (s.unmask_status === 'unmasked') return { label: 'Unmasked', color: 'text-indigo-600 bg-indigo-50 border-indigo-200', icon: ShieldCheck };
    if (s.unmask_status === 'rejected') return { label: 'Unmask Rejected', color: 'text-rose-600 bg-rose-50 border-rose-200', icon: Shield };
    return { label: 'Anonymous', color: 'text-slate-500 bg-slate-50 border-slate-200', icon: EyeOff };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-white/40 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">User Suggestions</h2>
          <p className="text-slate-500 font-medium mt-1 uppercase tracking-wider text-xs">Manage community feedback and ideas</p>
        </div>
        <button onClick={loadSuggestions} disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCcw size={18} className={loading ? 'animate-spin text-indigo-600' : ''} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[{ key: 'all', label: 'All' }, ...STATUSES.map(s => ({ key: s, label: STATUS_LABELS[s] }))].map(({ key, label }) => (
          <button key={key} onClick={() => setStatusFilter(key)}
            className={`p-3 rounded-2xl border text-center transition-all ${statusFilter === key ? 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50'}`}
          >
            <p className="text-lg font-black">{statCounts(key)}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider truncate">{label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Search suggestions, names, or emails..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl text-slate-700 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
          />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          <option value="__null">Uncategorized</option>
        </select>
      </div>

      {/* List */}
      {loading && suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200">
          <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
          <p className="text-slate-500 font-bold">Loading suggestions...</p>
        </div>
      ) : filteredSuggestions.length > 0 ? (
        <div className="space-y-4">
          {filteredSuggestions.map((item) => {
            const badge = getUnmaskBadge(item);
            const BadgeIcon = badge.icon;
            const nextStatusIdx = STATUSES.indexOf(item.status) + 1;
            const nextStatus = nextStatusIdx < STATUSES.length ? STATUSES[nextStatusIdx] : null;

            return (
              <div key={item.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Top bar */}
                <div className="flex items-center justify-between px-6 py-3 bg-slate-50/50 border-b border-slate-100">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${STATUS_COLORS[item.status] || STATUS_COLORS.new}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'new' ? 'bg-slate-500 animate-pulse' : ''}`} />
                      {STATUS_LABELS[item.status] || 'New'}
                    </span>
                    {item.category ? (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other}`}>
                        <Tag size={11} />
                        {CATEGORY_LABELS[item.category] || item.category}
                      </span>
                    ) : null}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.color}`}>
                      <BadgeIcon size={11} />
                      {badge.label}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>

                {/* Body */}
                <div className="p-6">
                  <p className="text-slate-800 text-base font-medium leading-relaxed italic">"{item.suggestion}"</p>

                  {/* Author */}
                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5"><User size={14} className="text-slate-400" /> {item.name || 'Anonymous'}</span>
                    {item.member?.jumuiya && <span className="flex items-center gap-1.5"><Users size={14} className="text-slate-400" /> {item.member.jumuiya}</span>}
                    {item.member?.phone && <span className="flex items-center gap-1.5"><Phone size={14} className="text-slate-400" /> {item.member.phone}</span>}
                  </div>

                  {/* Revealed author (anonymous but unmasked) */}
                  {item.is_anonymous && item._revealed && (
                    <div className="mt-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-sm">
                      <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-1">Revealed Author</p>
                      <p className="font-bold text-slate-800">{item._revealed.first_name} {item._revealed.last_name}</p>
                      <p className="text-slate-500 text-xs">{item._revealed.jumuiya || ''}{item._revealed.phone ? ` · ${item._revealed.phone}` : ''}</p>
                    </div>
                  )}
                </div>

                {/* Response */}
                {item.admin_response && (
                  <div className="mx-6 mb-4 p-4 bg-blue-50/70 rounded-2xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare size={14} className="text-blue-500" />
                      <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">Response</span>
                      {item.responded_by && <span className="text-[11px] text-slate-400">— {item.responded_by}</span>}
                      {item.responded_at && <span className="text-[11px] text-slate-400 ml-auto">{new Date(item.responded_at).toLocaleDateString()}</span>}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{item.admin_response}</p>
                  </div>
                )}

                {/* Actions */}
                {canManage && (
                  <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/30">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Status quick-change */}
                      <select value={item.status} onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>

                      {/* Category quick-change */}
                      <select value={item.category || '__null'} onChange={(e) => handleCategoryChange(item.id, e.target.value === '__null' ? null : e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                      >
                        <option value="__null">No category</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                      </select>

                      {/* Unmask actions */}
                      {item.is_anonymous && item.unmask_status === 'none' && (
                        <button onClick={() => handleRequestUnmask(item.id)}
                          className="px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all"
                        >
                          <Eye size={13} className="inline mr-1" />Request Unmask
                        </button>
                      )}
                      {item.is_anonymous && item.unmask_status === 'unmasked' && !item._revealed && (
                        <button onClick={() => handleReveal(item.id)}
                          className="px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all"
                        >
                          <Eye size={13} className="inline mr-1" />View Author
                        </button>
                      )}
                      {item.is_anonymous && item.unmask_status === 'requested' && (
                        <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                          <Clock size={13} /> Awaiting approval
                        </span>
                      )}

                      {/* Next status quick button */}
                      {nextStatus && (
                        <button onClick={() => handleStatusChange(item.id, nextStatus)}
                          className="px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all"
                        >
                          <CheckCircle size={13} className="inline mr-1" />Mark {STATUS_LABELS[nextStatus]}
                        </button>
                      )}

                      {/* Delete */}
                      <button onClick={() => handleDelete(item.id)}
                        className="px-3 py-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all text-xs font-bold ml-auto"
                      >
                        <Trash2 size={14} className="inline mr-1" />Delete
                      </button>
                    </div>

                    {/* Write response */}
                    <div className="mt-3 flex gap-3">
                      <input type="text" placeholder="Write a response to this suggestion..."
                        value={responseInputs[item.id] || ''}
                        onChange={(e) => setResponseInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendResponse(item.id); }}
                        className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                      />
                      <button onClick={() => handleSendResponse(item.id)} disabled={!responseInputs[item.id]?.trim()}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                      >
                        <Send size={14} /> Send
                      </button>
                    </div>
                  </div>
                )}
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
          <p className="text-slate-500 mt-2">{statusFilter !== 'all' ? `No suggestions with status "${STATUS_LABELS[statusFilter]}"` : 'When users share ideas, they\'ll appear here.'}</p>
        </div>
      )}
    </div>
  );
}
