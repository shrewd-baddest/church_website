import { useEffect, useState } from 'react';
import { Trash2, Trash, Loader2, MessageSquare, XCircle, Shield, RotateCcw } from 'lucide-react';
import { apiClient } from '../../../api/axiosInstance';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';
import PageLoader from '../../../assets/Layouts/PageLoader';

export default function SuggestionBin() {
  const { user } = useAuth();
  const userRoles = Array.isArray(user?.role) ? user.role : [user?.role].filter(Boolean);
  const isCSAOfficial = userRoles.some((r: any) =>
    ['csa_vice_chair', 'csa_chair', 'admin', 'developer'].includes(r)
  );
  
  // Only the CSA Chairperson (or admin/developer) can permanently delete CSA suggestions.
  // The CSA Vice Chairperson can soft-delete and view/restore from bin, but cannot permanently delete.
  const canPermanentlyDelete = isCSAOfficial
    ? userRoles.some((r: any) => ['csa_chair', 'admin', 'developer'].includes(r))
    : userRoles.some((r: any) => ['jumuiya_chairperson', 'admin', 'developer'].includes(r));

  const jumuiyaTarget = isCSAOfficial ? 'csa' : (user?.jumuiya_id || '');

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | 'all' | null>(null);

  const loadBin = async () => {
    setLoading(true);
    try {
      const params = jumuiyaTarget ? { jumuiya_id: jumuiyaTarget } : { jumuiya_id: 'csa' };
      const res = await apiClient.get('/suggestions/bin', { params });
      setItems(res.data.data || []);
    } catch {
      toast.error('Failed to load suggestion bin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBin(); }, []);

  const handleRestore = async (id: number) => {
    setActionLoading(id);
    try {
      await apiClient.patch(`/suggestions/bin/${id}/restore`);
      toast.success('Suggestion restored to suggestion box');
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to restore');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearOne = async (id: number) => {
    if (!window.confirm('Permanently delete this suggestion? This cannot be undone.')) return;
    setActionLoading(id);
    try {
      await apiClient.delete(`/suggestions/bin/${id}`);
      toast.success('Permanently deleted');
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to delete');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm(`Permanently delete all ${items.length} suggestions from the bin? This cannot be undone.`)) return;
    setActionLoading('all');
    try {
      const params = jumuiyaTarget ? { jumuiya_id: jumuiyaTarget } : { jumuiya_id: 'csa' };
      const res = await apiClient.delete('/suggestions/bin/clear', { params });
      toast.success(res.data?.message || 'Bin cleared');
      setItems([]);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to clear bin');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <PageLoader message="Loading suggestion bin" />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-white/40 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Trash className="w-7 h-7 text-orange-500" />
            Suggestion Bin
          </h2>
          <p className="text-slate-500 font-medium mt-1 uppercase tracking-wider text-xs">
            Suggestions soft-deleted by VC. Only the CSA Chair can permanently delete.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-orange-100 text-orange-800 text-sm font-bold rounded-xl">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
          {items.length > 0 && canPermanentlyDelete && (
            <button onClick={handleClearAll} disabled={actionLoading === 'all'}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
            >
              {actionLoading === 'all' ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
              Clear All
            </button>
          )}
          <button onClick={loadBin} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
          >
            <XCircle size={18} className={loading ? 'animate-spin text-orange-600' : 'rotate-45'} />
            Refresh
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200">
          <div className="w-20 h-20 bg-slate-50 flex items-center justify-center rounded-3xl mb-6">
            <Trash2 size={40} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Bin is empty</h3>
          <p className="text-slate-500 mt-2">No suggestions have been soft-deleted by the VC.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="p-6 hover:bg-slate-50/50 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 text-base font-medium italic leading-relaxed">"{item.suggestion}"</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><MessageSquare size={13} className="text-slate-400" /> {item.name || 'Anonymous'}</span>
                      {item.deleted_by && <span className="flex items-center gap-1"><Trash2 size={13} className="text-orange-400" /> Deleted by {item.deleted_by}</span>}
                      <span className="text-slate-400">{item.deleted_at ? new Date(item.deleted_at).toLocaleDateString() : ''}</span>
                      <span className="text-slate-300">Submitted {new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    {item.status && (
                      <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-200 text-slate-500 bg-slate-50">
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleRestore(item.id)} disabled={actionLoading === item.id}
                      className="px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl text-xs transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                      title="Restore suggestion back to active list"
                    >
                      {actionLoading === item.id ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                      Restore
                    </button>
                    {canPermanentlyDelete ? (
                      <button onClick={() => handleClearOne(item.id)} disabled={actionLoading === item.id}
                        className="px-4 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl text-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {actionLoading === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        Delete
                      </button>
                    ) : (
                      <span className="px-3.5 py-2.5 bg-slate-50 text-slate-400 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200">
                        <Shield size={14} />
                        Chair only
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
