import { useEffect, useState } from "react";
import apiService from "../../Landing/services/api";
import { BarChart3, RefreshCcw, Loader2, Download, TrendingUp, DollarSign, ShoppingCart, CalendarDays } from "lucide-react";

interface Props { typeFilter: "sale" | "hire" }

export default function Reports({ typeFilter }: Props) {
  const [data, setData] = useState<any>({ orders: [], hireRequests: [], products: [], members: [] });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "week" | "month" | "year">("month");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orders, hireRequests, products, members] = await Promise.all([
        apiService.fetchTableData("orders", false),
        apiService.fetchTableData("hire_requests", false),
        apiService.fetchTableData("products", false),
        apiService.fetchTableData("members", false),
      ]);
      setData({
        orders: Array.isArray(orders) ? orders : [],
        hireRequests: Array.isArray(hireRequests) ? hireRequests : [],
        products: Array.isArray(products) ? products : [],
        members: Array.isArray(members) ? members : [],
      });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const now = new Date();
  const periodStart = new Date(now);
  if (period === "today") periodStart.setHours(0, 0, 0, 0);
  else if (period === "week") periodStart.setDate(now.getDate() - 7);
  else if (period === "month") periodStart.setMonth(now.getMonth() - 1);
  else periodStart.setFullYear(now.getFullYear() - 1);

  const saleCategories = ["sacramentals", "tshirts"];
  const hireCategories = ["chairs", "instruments"];

  const sectionProducts = data.products.filter((p: any) =>
    typeFilter === "sale"
      ? saleCategories.includes(p.category)
      : hireCategories.includes(p.category)
  );

  const saleOrders = data.orders.filter((o: any) => {
    if (!o.created_at) return false;
    if (new Date(o.created_at) < periodStart) return false;
    let items: any[] = [];
    try { items = typeof o.items === "string" ? JSON.parse(o.items) : o.items || []; } catch { items = []; }
    return items.some((i: any) => saleCategories.includes(i.category || i.item_category));
  });

  const hireRequests = data.hireRequests.filter((h: any) => {
    if (!h.created_at) return false;
    return new Date(h.created_at) >= periodStart;
  });

  const paidOrders = saleOrders.filter((o: any) => o.status === "paid" || o.payment_status === "paid");
  const totalRevenue = paidOrders.reduce((sum: number, o: any) => sum + Number(o.amount || 0), 0);

  const paidHire = hireRequests.filter((h: any) => h.status === "paid" || h.payment_status === "paid");
  const totalHireRevenue = paidHire.reduce((sum: number, h: any) => sum + Number(h.total_cost || 0), 0);

  const exportCSV = () => {
    const isSale = typeFilter === "sale";
    const headers = isSale
      ? ["ID", "Reference", "Amount", "Phone", "Status", "Date", "Receipt"]
      : ["ID", "Reference", "Customer", "Phone", "Items", "Total", "Status", "Date"];
    const rows = isSale
      ? saleOrders.map((o: any) => [o.id, o.order_reference || "", o.amount, o.phone, o.status, o.created_at, o.mpesa_receipt || ""])
      : hireRequests.map((h: any) => [h.id, h.hire_reference || "", h.customer_name, h.phone_number, h.item_name || "", h.total_cost, h.status, h.created_at]);
    const csv = [headers.join(","), ...rows.map((r: any) => r.map((v: any) => `"${String(v || "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${isSale ? "sales" : "hire"}-report-${period}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const topProducts = sectionProducts
    .sort((a: any, b: any) => (b.stock || 0) - (a.stock || 0))
    .slice(0, 5);

  const isSale = typeFilter === "sale";

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
            <BarChart3 size={18} className={isSale ? "text-blue-600" : "text-purple-600"} />
            {isSale ? "Sales Reports & Analytics" : "Hire Reports & Analytics"}
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            {isSale ? "Sacramentals & T-Shirts sales performance" : "Chairs & Instruments hire performance"}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm">
            <Download size={12} /> Export CSV
          </button>
          <button onClick={loadData} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <RefreshCcw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-1.5">
        {(["today", "week", "month", "year"] as const).map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${period === p ? "bg-blue-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300"}`}>
            {p === "today" ? "Today" : p === "week" ? "This Week" : p === "month" ? "This Month" : "This Year"}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {isSale ? (
          <>
            <StatCard label="Total Revenue" value={`KES ${totalRevenue.toLocaleString()}`} icon={DollarSign} color="bg-emerald-500" />
            <StatCard label="Sale Orders" value={String(saleOrders.length)} icon={ShoppingCart} color="bg-blue-500" />
            <StatCard label="Paid Orders" value={String(paidOrders.length)} icon={TrendingUp} color="bg-purple-500" />
          </>
        ) : (
          <>
            <StatCard label="Hire Revenue" value={`KES ${totalHireRevenue.toLocaleString()}`} icon={DollarSign} color="bg-emerald-500" />
            <StatCard label="Total Requests" value={String(hireRequests.length)} icon={CalendarDays} color="bg-blue-500" />
            <StatCard label="Paid / Approved" value={String(paidHire.length)} icon={TrendingUp} color="bg-purple-500" />
          </>
        )}
      </div>

      {/* Tables */}
      {loading ? (
        <div className="flex items-center justify-center py-10 text-slate-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading reports...
        </div>
      ) : (
        <div className="grid xl:grid-cols-2 gap-4">
          {/* Recent Orders / Hire Requests */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-xs">{isSale ? "Recent Sale Orders" : "Recent Hire Requests"}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {isSale
                      ? ["#", "Amount", "Phone", "Status"].map(h => <th key={h} className="text-left px-3 py-2 text-[10px] font-bold text-slate-500 uppercase">{h}</th>)
                      : ["Ref", "Customer", "Items", "Status"].map(h => <th key={h} className="text-left px-3 py-2 text-[10px] font-bold text-slate-500 uppercase">{h}</th>)
                    }
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(isSale ? saleOrders : hireRequests).slice(0, 10).map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      {isSale ? (
                        <>
                          <td className="px-3 py-2 font-mono text-[11px] text-slate-400">#{r.id}</td>
                          <td className="px-3 py-2 font-bold text-slate-800 text-xs">KES {Number(r.amount || 0).toLocaleString()}</td>
                          <td className="px-3 py-2 text-slate-600 text-xs">{r.phone || "—"}</td>
                          <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2 font-mono text-[11px] text-slate-400">{r.hire_reference || `#${r.id}`}</td>
                          <td className="px-3 py-2 font-semibold text-slate-800 text-xs">{r.customer_name || "—"}</td>
                          <td className="px-3 py-2 text-slate-600 text-xs">{r.item_name || "—"}</td>
                          <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                        </>
                      )}
                    </tr>
                  ))}
                  {(isSale ? saleOrders : hireRequests).length === 0 && <tr><td colSpan={4} className="text-center py-6 text-slate-400 text-xs">No records in this period</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-xs">{isSale ? "Top Sale Products" : "Top Hire Products"}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {["Name", "Category", "Price", "Stock"].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-[10px] font-bold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {topProducts.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-semibold text-slate-800 text-xs">{p.name}</td>
                      <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">{p.category}</span></td>
                      <td className="px-3 py-2 font-bold text-slate-800 text-xs">KES {Number(p.price || 0).toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${Number(p.stock) <= 5 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{p.stock || 0}</span>
                      </td>
                    </tr>
                  ))}
                  {topProducts.length === 0 && <tr><td colSpan={4} className="text-center py-6 text-slate-400 text-xs">No products found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
      <div className={`${color} w-10 h-10 rounded-lg flex items-center justify-center text-white`}><Icon size={18} /></div>
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-base font-black text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-700",
    completed: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
    rejected: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colorMap[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}
