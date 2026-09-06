import { useState, useEffect } from 'react';
import { apiClient } from '../../../api/axiosInstance';
import { useAuth } from '../../../context/AuthContext';
import { memberService } from '../../../api/jumuiyaMemberService';
import { MessageSquare, Trash2, Search, Calendar, User, Mail, RefreshCcw, Loader2, Shield, Reply, CheckCircle, Check, Filter, Clock, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageLoader from '../../../assets/Layouts/PageLoader';

const STATUSES = ['all', 'pending', 'replied', 'approved', 'rejected', 'unmask_requested'] as const;

const STATUS_META: Record<string, { icon: any; active: string; inactive: string }> = {
  all:                { icon: Filter,      active: 'bg-slate-800 text-white border-slate-800 shadow-md',          inactive: 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50' },
  pending:            { icon: Clock,       active: 'bg-amber-600 text-white border-amber-600 shadow-md',          inactive: 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50' },
  replied:            { icon: Reply,       active: 'bg-blue-600 text-white border-blue-600 shadow-md',            inactive: 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50' },
  approved:           { icon: CheckCircle, active: 'bg-emerald-600 text-white border-emerald-600 shadow-md',      inactive: 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50' },
  rejected:           { icon: XCircle,     active: 'bg-rose-600 text-white border-rose-600 shadow-md',            inactive: 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50' },
  unmask_requested:   { icon: Shield,      active: 'bg-purple-600 text-white border-purple-600 shadow-md',        inactive: 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50' },
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  replied: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  unmask_requested: 'bg-purple-50 text-purple-700 border-purple-200',
};

const CATEGORIES = ['general', 'worship', 'progress', 'feedback', 'other', 'officials', 'jumuiya', 'members', 'ideas', 'requests', 'events'] as const;

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-slate-100 text-slate-600 border-slate-200',
  worship: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  progress: 'bg-teal-50 text-teal-600 border-teal-200',
  feedback: 'bg-amber-50 text-amber-600 border-amber-200',
  other: 'bg-slate-100 text-slate-500 border-slate-200',
  officials: 'bg-orange-50 text-orange-600 border-orange-200',
  jumuiya: 'bg-cyan-50 text-cyan-600 border-cyan-200',
  members: 'bg-green-50 text-green-600 border-green-200',
  ideas: 'bg-violet-50 text-violet-600 border-violet-200',
  requests: 'bg-rose-50 text-rose-600 border-rose-200',
  events: 'bg-yellow-50 text-yellow-600 border-yellow-200',
};

const SLUG_NAME_MAP: Record<string, string> = {
  'st-anthony': 'St. Anthony',
  'st-augustine': 'St. Augustine',
  'st-catherine': 'St. Catherine',
  'st-dominic': 'St. Dominic',
  'st-elizabeth': 'St. Elizabeth',
  'st-maria-goretti': 'St. Maria Goretti',
  'st-monica': 'St. Monica',
};


export default function AdminSuggestions() {
  const { user } = useAuth();
  const userRoles = Array.isArray(user?.role) ? user.role : [user?.role].filter(Boolean);
  const isVC = userRoles.some((r: any) =>
    ['csa_vice_chair', 'csa_chair', 'jumuiya_vice_chairperson', 'jumuiya_chairperson', 'admin', 'developer'].includes(r)
  );

  // In the Universal Admin, the suggestion box is strictly for the CSA level.
  // CSA officials (CSA Vice Chair, CSA Chair, Admin, Developer) focus purely on CSA-level suggestions.
  // Jumuiya officials are locked to their own specific jumuiya.
  const isCSAOfficial = userRoles.some((r: any) =>
    ['csa_vice_chair', 'csa_chair', 'admin', 'developer'].includes(r)
  );

  // Only the CSA Vice Chairperson (or admin/developer) can soft-delete CSA suggestions.
  // The CSA Chairperson cannot delete active suggestions; their role is to permanently delete from the bin.
  const canDelete = isCSAOfficial
    ? userRoles.some((r: any) => ['csa_vice_chair', 'admin', 'developer'].includes(r))
    : userRoles.some((r: any) => ['jumuiya_vice_chairperson', 'admin', 'developer'].includes(r));

  const userJumuiyaId = user?.jumuiya_id || '';
  const selectedJumuiya = isCSAOfficial ? 'csa' : userJumuiyaId;

  const [resolvedName, setResolvedName] = useState<string>('');
  useEffect(() => {
    if (isCSAOfficial || !userJumuiyaId) { setResolvedName(''); return; }
    if (SLUG_NAME_MAP[userJumuiyaId]) { setResolvedName(SLUG_NAME_MAP[userJumuiyaId]); return; }
    memberService.getJumuiyaLookup()
      .then((res: any) => {
        const data = res?.data || res || {};
        const entry = data[userJumuiyaId];
        setResolvedName(entry ? (entry.name || entry.fullName || userJumuiyaId) : '');
      })
      .catch(() => setResolvedName(''));
  }, [isCSAOfficial, userJumuiyaId]);

  const displayName = isCSAOfficial ? 'CSA' : (resolvedName || SLUG_NAME_MAP[userJumuiyaId] || (userJumuiyaId ? 'Jumuiya' : 'CSA'));

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [unmaskLoading, setUnmaskLoading] = useState<number | null>(null);

  const loadSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const activeJumuiya = selectedJumuiya || (isCSAOfficial ? 'csa' : userJumuiyaId);
      const params = activeJumuiya ? { jumuiya_id: activeJumuiya } : { jumuiya_id: 'csa' };
      const res = await apiClient.get('/suggestions', { params });
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      const sortedData = data.sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setSuggestions(sortedData);
    } catch (err: any) {
      console.error('Error fetching suggestions:', err);
      setError(err.message || 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, [selectedJumuiya, userJumuiyaId]);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this suggestion? It will be moved to the bin.')) {
      try {
        const adminName = user
          ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || user.name
          : '';
        await apiClient.delete(`/suggestions/${id}`, {
          data: { deleted_by: adminName || undefined }
        });
        toast.success('Suggestion moved to bin');
        loadSuggestions();
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Failed to delete: ' + err.message);
      }
    }
  };

  const handleReply = async (id: number) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      await apiClient.post(`/suggestions/${id}/reply`, { reply: replyText.trim() });
      toast.success('Reply sent');
      setReplyText('');
      setReplyingId(null);
      loadSuggestions();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleCategoryChange = async (id: number, category: string) => {
    try {
      await apiClient.patch(`/suggestions/${id}/category`, { category });
      toast.success(`Categorized as ${category}`);
      loadSuggestions();
    } catch (err: any) {
      toast.error('Failed to update category: ' + err.message);
    }
  };

  const handleRequestUnmask = async (id: number) => {
    if (!window.confirm('Request to unmask this anonymous suggestion? Both designated co-approvers must approve.')) return;
    setUnmaskLoading(id);
    try {
      const res = await apiClient.post(`/suggestions/${id}/request-unmask`);
      toast.success(res.data?.message || 'Unmask request sent to Chair and Liturgist');
      loadSuggestions();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to request unmask');
    } finally {
      setUnmaskLoading(null);
    }
  };

  const filteredSuggestions = suggestions.filter(s => {
    const fullName = `${s.member_first_name || ''} ${s.member_last_name || ''}`.trim();
    const matchesSearch = !searchTerm ||
      s.suggestion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.member_jumuiya?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(s.member_year_of_study || '').includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || (s.category || 'general') === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const countByStatus = (status: string) =>
    status === 'all' ? suggestions.length : suggestions.filter(s => s.status === status).length;

  const countByCategory = (category: string) =>
    category === 'all' ? suggestions.length : suggestions.filter(s => (s.category || 'general') === category).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-white/40 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100 rounded-full blur-3xl -mr-32 -mt-32 opacity-40 pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">{displayName} Suggestions</h2>
          <p className="text-slate-500 font-medium mt-1 uppercase tracking-wider text-xs">
            {isCSAOfficial ? 'Manage CSA-level community feedback and ideas' : 'Manage community feedback and ideas'}
          </p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={loadSuggestions}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin text-indigo-600' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
        <input
          type="text"
          placeholder="Search suggestions, names, or emails..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-6 py-4 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl text-slate-700 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => {
          const meta = STATUS_META[s];
          const Icon = meta.icon;
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                active ? meta.active : meta.inactive
              }`}
            >
              <Icon size={15} />
              {s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
              }`}>
                {countByStatus(s)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category filter — label first, then click a category to see all of them */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1">Categories</span>
        {(['all', ...CATEGORIES] as const).map(c => {
          const active = categoryFilter === c;
          const colorCls = c === 'all'
            ? (active ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')
            : CATEGORY_COLORS[c];
          return (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                active ? `${colorCls} shadow-md ring-2 ring-offset-1 ring-slate-300` : `bg-white ${colorCls.split(' ').slice(1).join(' ')} hover:opacity-80 opacity-90`
              }`}
            >
              {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                active ? 'bg-white/20' : 'bg-white/70 text-slate-500'
              }`}>
                {countByCategory(c)}
              </span>
            </button>
          );
        })}
      </div>

      {loading && suggestions.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200">
          <PageLoader message="Connecting to database" />
        </div>
      ) : filteredSuggestions.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredSuggestions.map((item) => (
            <div key={item.id} className="bg-white hover:bg-slate-50 transition-all duration-300 rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group">
              <div className="p-6 md:p-8 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm">
                      <MessageSquare size={24} />
                    </div>
                    {item.status && (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${STATUS_COLORS[item.status] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    )}
                    {item.category && (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border tracking-wider ${CATEGORY_COLORS[item.category] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {item.category}
                      </span>
                    )}
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      title="Move to bin"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>

                <p className="text-slate-800 text-lg font-medium leading-relaxed mb-6 italic">
                  "{item.suggestion}"
                </p>

                {item.reply && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">
                      <Reply size={14} />
                      Reply from admin
                    </div>
                    <p className="text-slate-700 text-sm">{item.reply}</p>
                    {item.replied_at && (
                      <p className="text-xs text-slate-400 mt-2">{new Date(item.replied_at).toLocaleDateString()}</p>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 border-t border-slate-50 pt-5">
                  {item.name ? (
                    <>
                      <div className="flex items-center gap-2 text-slate-600">
                        <User size={14} className="text-slate-400" />
                        <span className="text-sm font-bold">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail size={14} className="text-slate-400" />
                        <span className="text-sm font-medium">{item.email || 'No email'}</span>
                      </div>
                    </>
                  ) : item.user_id ? (
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-400" />
                        <span className="text-sm font-bold">{item.member_first_name} {item.member_last_name}</span>
                      </div>
                      <span className="text-xs text-slate-300">|</span>
                      <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Year {item.member_year_of_study}</span>
                      <span className="text-xs text-slate-300">|</span>
                      <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{item.member_jumuiya || 'No jumuiya'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400">
                      <User size={14} />
                      <span className="text-sm font-bold">Anonymous</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-400 ml-auto">
                    <Calendar size={14} />
                    <span className="text-xs font-bold uppercase tracking-widest">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {replyingId === item.id ? (
                    <div className="w-full space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-200 focus:border-blue-400 outline-none text-sm resize-none"
                        disabled={submittingReply}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReply(item.id)}
                          disabled={submittingReply || !replyText.trim()}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all"
                        >
                          {submittingReply ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                          Send Reply
                        </button>
                        <button
                          onClick={() => { setReplyingId(null); setReplyText(''); }}
                          disabled={submittingReply}
                          className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                    ) : (
                    <>
                      <button
                        onClick={() => { setReplyingId(item.id); setReplyText(''); }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
                      >
                        <Reply size={14} />
                        Reply
                      </button>
                      {isVC && (
                        <select
                          value={item.category || 'general'}
                          onChange={(e) => handleCategoryChange(item.id, e.target.value)}
                          className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold outline-none focus:border-indigo-400 transition-all cursor-pointer"
                        >
                          {CATEGORIES.map(c => (
                            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                          ))}
                        </select>
                      )}
                      {isVC && !item.name && !item.email && item.status !== 'unmask_requested' && (
                        <button
                          onClick={() => handleRequestUnmask(item.id)}
                          disabled={unmaskLoading === item.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-purple-200 text-purple-600 rounded-xl text-xs font-bold hover:bg-purple-50 transition-all disabled:opacity-50"
                        >
                          {unmaskLoading === item.id ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                          Request Unmask
                        </button>
                      )}
                      {item.status === 'unmask_requested' && (
                        <span className="flex items-center gap-1.5 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-xs font-bold">
                          <Check size={14} />
                          Unmask pending
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200">
          <div className="w-20 h-20 bg-slate-50 flex items-center justify-center rounded-3xl mb-6">
            <MessageSquare size={40} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No suggestions found</h3>
          <p className="text-slate-500 mt-2">
            {categoryFilter !== 'all'
              ? `No suggestions categorized as "${categoryFilter}".`
              : statusFilter !== 'all'
                ? `No suggestions with status "${statusFilter.replace(/_/g, ' ')}".`
                : `When ${displayName} members submit ideas, they'll appear here.`}
          </p>
        </div>
      )}
    </div>
  );
}