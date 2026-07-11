import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../../../api/axiosInstance";
import { RefreshCw, Clock, User, Activity, Target, ChevronLeft, ChevronRight, Search, X } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  member_flagged_inactive: "Flagged Inactive",
  member_unflagged: "Unflagged",
  member_id_changed: "Changed Reg Number",
  member_deleted: "Deleted Member",
  batch_approved: "Approved Allocations",
  batch_rejected: "Rejected Allocations",
  batch_finalized: "Finalized Distribution",
};

const ACTION_COLORS: Record<string, string> = {
  member_flagged_inactive: "text-red-600 bg-red-50 border-red-200",
  member_unflagged: "text-emerald-600 bg-emerald-50 border-emerald-200",
  member_id_changed: "text-amber-600 bg-amber-50 border-amber-200",
  member_deleted: "text-red-700 bg-red-100 border-red-300",
  batch_approved: "text-emerald-600 bg-emerald-50 border-emerald-200",
  batch_rejected: "text-red-600 bg-red-50 border-red-200",
  batch_finalized: "text-indigo-600 bg-indigo-50 border-indigo-200",
};

export default function ActivityLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [search, setSearch] = useState("");
  const limit = 30;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit, offset: (page - 1) * limit };
      if (actionFilter) params.action = actionFilter;
      const res = await apiClient.get("/activity-logs", { params });
      const d = res.data;
      setLogs(d.data || []);
      setTotal(d.total || 0);
    } catch (err: any) {
      console.error("Failed to fetch activity logs", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = actionFilter ? logs : search
    ? logs.filter(l => (l.member_name || "").toLowerCase().includes(search.toLowerCase()) || (l.action || "").toLowerCase().includes(search.toLowerCase()))
    : logs;

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Activity size={20} className="text-indigo-600" /> Activity Log
          </h2>
          <p className="text-xs text-slate-500">{total} total entries</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or action..."
              className="pl-8 pr-8 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 w-48" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
          <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
            <option value="">All Actions</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button onClick={fetchLogs} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Activity size={32} className="text-slate-200 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No activity logs found.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {filtered.map((log: any) => (
              <div key={log.id} className="px-5 py-3.5 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={14} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">{log.member_name || log.member_id}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${ACTION_COLORS[log.action] || "text-slate-600 bg-slate-50 border-slate-200"}`}>
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {new Date(log.created_at).toLocaleString()}
                    </span>
                    {log.target_type && (
                      <span className="flex items-center gap-1">
                        <Target size={11} /> {log.target_type}: {log.target_id}
                      </span>
                    )}
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="mt-1.5 text-xs text-slate-500 bg-slate-50 rounded px-2 py-1 inline-block">
                      {Object.entries(log.details).map(([k, v]) => (
                        <span key={k} className="mr-3"><span className="font-medium">{k}:</span> {String(v)}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-500">
                Page {page} of {totalPages} ({total} entries)
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                  className="p-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-slate-600 font-semibold px-2">{page}</span>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                  className="p-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
