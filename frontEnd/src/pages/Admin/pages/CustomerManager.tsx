import { useEffect, useState } from "react";
import apiService from "../../Landing/services/api";
import { Users, RefreshCcw, Loader2, Phone, ShoppingBag, Package } from "lucide-react";
import PanelHeader from "../components/PanelHeader";
import EmptyState from "../components/EmptyState";

export default function CustomerManager() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadCustomers(); }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const orders = await apiService.fetchTableData("orders", true);
      const ordersArr = Array.isArray(orders) ? orders : [];
      const grouped: Record<string, { name: string; phone: string; items: string[]; count: number; total: number }> = {};
      ordersArr.forEach((o: any) => {
        const phone = o.phone || o.customer_phone || "";
        if (!phone) return;
        if (!grouped[phone]) grouped[phone] = { name: o.customer_name || "Unknown", phone, items: [], count: 0, total: 0 };
        grouped[phone].name = o.customer_name || grouped[phone].name;
        grouped[phone].count += 1;
        grouped[phone].total += Number(o.amount || 0);
        let parsed: any[] = [];
        try { parsed = typeof o.items === "string" ? JSON.parse(o.items) : (Array.isArray(o.items) ? o.items : []); } catch { parsed = []; }
        parsed.forEach((item: any) => {
          const product = item.item || item;
          const name = product.name || "Item";
          const qty = item.quantity || 1;
          const label = `${name} x${qty}`;
          if (!grouped[phone].items.includes(label)) grouped[phone].items.push(label);
        });
      });
      setCustomers(Object.values(grouped));
    } catch (err) { console.error(err); setCustomers([]); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <PanelHeader
        title="Customer Orders"
        subtitle={`Customers who have placed orders (${customers.length})`}
        icon={Users}
        onRefresh={loadCustomers}
        loading={loading}
      />

      {loading ? (
        <div className="flex items-center justify-center py-12 bg-white rounded-xl border border-slate-200">
          <Loader2 size={16} className="animate-spin text-blue-600 mr-2" />
          <span className="text-xs font-medium text-slate-500">Loading customers...</span>
        </div>
      ) : customers.length === 0 ? (
        <EmptyState icon={Users} title="No customers found" subtitle="Customers will appear here once they place orders." />
      ) : (
        <div className="space-y-2">
          {customers.map((c: any) => (
            <div key={c.phone} className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 hover:shadow-md transition-all duration-200 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-black text-xs">
                {(c.name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-slate-800 text-xs truncate">{c.name}</h3>
                  <span className="shrink-0 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{c.count} order{c.count !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Phone size={10} className="text-slate-400 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-600">{c.phone}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {c.items.slice(0, 3).map((item: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded-md text-[9px] font-semibold text-slate-600">
                      <Package size={8} />
                      {item}
                    </span>
                  ))}
                  {c.items.length > 3 && (
                    <span className="text-[9px] font-bold text-slate-400 px-1.5 py-0.5">+{c.items.length - 3} more</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
