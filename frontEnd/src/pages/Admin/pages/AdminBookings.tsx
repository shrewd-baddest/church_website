import { useEffect, useState } from "react";
import activitiesService from "../../../api/activitiesServices";
import { RefreshCw, Download, Search } from "lucide-react";

interface Booking {
  id: number;
  member_name: string;
  member_email: string;
  activity_type: string;
  activity_name: string;
  activity_day: string | null;
  activity_time: string | null;
  fare: string;
  paid_amount: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await activitiesService.getAllBookings();
      setBookings(data || []);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Failed to load bookings";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    try {
      const blob = await activitiesService.exportBookingsCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "activity_bookings.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Export failed";
      setError(msg);
    }
  }

  const filtered = bookings.filter((b) =>
    !search || b.member_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.activity_name?.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status: string) => {
    switch (status) {
      case "paid": return "bg-emerald-100 text-emerald-700";
      case "pending": return "bg-amber-100 text-amber-700";
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Activity Bookings</h2>
          <p className="text-sm text-slate-500 mt-1">View all member bookings and payments for paid activities.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport}
            className="flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={load}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or activity..."
          className="w-full max-w-xs border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <p className="text-slate-400 text-sm mb-2">No bookings yet.</p>
          <p className="text-slate-300 text-xs">Bookings will appear here when members book paid activities.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Member</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Activity</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Type</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Fare</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Paid</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, i) => (
                  <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{b.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{b.member_name}</div>
                      <div className="text-xs text-slate-400">{b.member_email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{b.activity_name}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-semibold uppercase text-slate-400">{b.activity_type}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">KES {Number(b.fare).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-600 font-semibold">KES {Number(b.paid_amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${statusBadge(b.status)}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 text-xs text-slate-400 border-t border-slate-100">
            Showing {filtered.length} of {bookings.length} bookings
          </div>
        </div>
      )}
    </div>
  );
}
