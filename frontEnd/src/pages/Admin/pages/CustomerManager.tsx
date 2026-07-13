import { useEffect, useState } from "react";
import apiService from "../../Landing/services/api";
import { Users, RefreshCcw, Loader2, Phone, Mail, ShoppingBag } from "lucide-react";

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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Users size={22} className="text-blue-600" /> Customer Management
          </h2>
          <p className="text-slate-500 text-sm mt-1">View and manage your customers ({customers.length})</p>
        </div>
        <button onClick={loadCustomers} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50">
          <RefreshCcw size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 size={32} className="animate-spin mr-3" /> Loading customers...
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Name", "Phone", "Email", "Jumuiya", "Orders", "Registered"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-xs">
                          {(c.name || c.first_name || "?").charAt(0).toUpperCase()}
                        </div>
                        {c.name || `${c.first_name || ""} ${c.last_name || ""}`.trim() || "—"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <Phone size={12} className="text-slate-400" /> {c.phone || c.phone_number || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <Mail size={12} className="text-slate-400" /> {c.email || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{c.jumuiyaName}</td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 font-bold text-slate-700">
                        <ShoppingBag size={12} className="text-blue-500" /> {c.orderCount || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
