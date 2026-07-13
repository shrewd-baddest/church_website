import { useEffect, useState } from "react";
import apiService from "../../Landing/services/api";
import { Users, RefreshCcw, Loader2, Phone, Mail, ShoppingBag, User, CalendarDays } from "lucide-react";
import PanelHeader from "../components/PanelHeader";
import EmptyState from "../components/EmptyState";

export default function CustomerManager() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadCustomers(); }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const [members, orders, subGroups] = await Promise.all([
        apiService.fetchTableData("members", true),
        apiService.fetchTableData("orders", true),
        apiService.fetchTableData("sub_groups", true),
      ]);
      const membersArr = Array.isArray(members) ? members : [];
      const ordersArr = Array.isArray(orders) ? orders : [];
      const groupsArr = Array.isArray(subGroups) ? subGroups : [];
      const groupMap: Record<string, string> = {};
      groupsArr.forEach((g: any) => { if (g.group_id && g.name) groupMap[g.group_id] = g.name; });
      const enriched = membersArr.map((m: any) => ({
        ...m,
        orderCount: ordersArr.filter((o: any) => o.phone === m.phone || o.user_id === m.id).length,
        jumuiyaName: m.jumuiya_id ? (groupMap[m.jumuiya_id] || m.jumuiya_id) : "—",
      }));
      setCustomers(enriched);
    } catch (err) { console.error(err); setCustomers([]); }
    finally { setLoading(false); }
  };

  const getInitial = (name: string) => (name || "?").charAt(0).toUpperCase();
  const getInitialBg = (name: string) => {
    const colors = ['bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-purple-100 text-purple-700', 'bg-sky-100 text-sky-700', 'bg-rose-100 text-rose-700'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Customer Management"
        subtitle={`View and manage your customers (${customers.length})`}
        icon={Users}
        onRefresh={loadCustomers}
        loading={loading}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <Loader2 size={24} className="animate-spin text-blue-600 mr-3" />
          <span className="text-sm font-medium text-slate-500">Loading customers...</span>
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          subtitle="Customers will appear here once they place orders."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c: any) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm ${getInitialBg(c.name || c.first_name)}`}>
                    {getInitial(c.name || c.first_name)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{c.name || `${c.first_name || ""} ${c.last_name || ""}`.trim() || "—"}</h3>
                    <span className="text-[11px] text-slate-400 font-medium">{c.email || "No email"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-lg">
                  <ShoppingBag size={12} className="text-blue-600" />
                  <span className="text-xs font-bold text-blue-700">{c.orderCount || 0}</span>
                </div>
              </div>
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2.5 text-xs text-slate-500">
                  <Phone size={12} className="shrink-0 text-slate-400" />
                  <span className="font-medium text-slate-700">{c.phone || c.phone_number || "—"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-500">
                  <User size={12} className="shrink-0 text-slate-400" />
                  <span className="font-medium text-slate-700">{c.jumuiyaName}</span>
                </div>
                {c.created_at && (
                  <div className="flex items-center gap-2.5 text-xs text-slate-500">
                    <CalendarDays size={12} className="shrink-0 text-slate-400" />
                    <span className="font-medium text-slate-700">{new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
