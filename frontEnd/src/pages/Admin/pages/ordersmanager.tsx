import { useEffect, useState } from "react";
import apiService from "../../../services/api";
import { apiClient } from "../../../api/axiosInstance";
import { Package, RefreshCcw, Loader2, CheckCircle, MessageCircle, Ban, Archive, CookingPot, ShoppingBag } from "lucide-react";
import Skeleton from "../../../components/Skeleton";
import { toast } from "react-hot-toast";

const STATUS_TABS = ["all", "pending", "paid", "preparing", "ready_for_pickup", "completed", "cancelled", "failed"] as const;
type StatusTab = typeof STATUS_TABS[number];

const statusLabels: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  preparing: "Preparing",
  ready_for_pickup: "Ready for Pickup",
  completed: "Completed",
  cancelled: "Cancelled",
  failed: "Failed",
};

const statusStyle: Record<string, string> = {
  pending:         "bg-amber-100 text-amber-700",
  paid:            "bg-emerald-100 text-emerald-700",
  preparing:       "bg-blue-100 text-blue-700",
  ready_for_pickup: "bg-indigo-100 text-indigo-700",
  completed:       "bg-teal-100 text-teal-700",
  cancelled:       "bg-slate-100 text-slate-800",
  failed:          "bg-red-100 text-red-700",
};

function normalizePhone(raw: string): string {
  let digits = (raw || "").replace(/[^0-9]/g, "");
  if (digits.startsWith("00")) digits = digits.substring(2);
  if (digits.startsWith("0") && digits.length >= 10) digits = "254" + digits.substring(1);
  if (digits.startsWith("254") && digits.length >= 12) return digits;
  return digits;
}

interface OrdersManagerProps {
  typeFilter?: 'sale' | 'hire';
  readOnly?: boolean;
}

export default function OrdersManager({ typeFilter, readOnly }: OrdersManagerProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<StatusTab>("all");
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, [typeFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const endpoint = typeFilter ? `/orders?type=${typeFilter}` : '/orders';
      const res = await apiClient.get(endpoint);
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setOrders(data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    setUpdating(id);
    try {
      await apiService.updateRecord("orders", id, { status });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      toast.success(`Order #${id} updated to ${status}`);
    } catch {
      toast.error("Failed to update order");
    } finally {
      setUpdating(null);
    }
  };

  const sendWhatsApp = (order: any, message: string) => {
    const phone = normalizePhone(order.phone || order.customer_phone || "");
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
    }
  };

  const visible = tab === "all" ? orders : orders.filter(o => o.status === tab);

  const stats = {
    pending:         orders.filter(o => o.status === "pending").length,
    paid:            orders.filter(o => o.status === "paid").length,
    preparing:       orders.filter(o => o.status === "preparing").length,
    ready_for_pickup: orders.filter(o => o.status === "ready_for_pickup").length,
    completed:       orders.filter(o => o.status === "completed").length,
    cancelled:       orders.filter(o => o.status === "cancelled").length,
    failed:          orders.filter(o => o.status === "failed").length,
  };

  const formatItems = (items: any): string => {
    if (!items) return "—";
    const parsed = typeof items === "string" ? JSON.parse(items) : items;
    if (Array.isArray(parsed)) {
      return parsed.map((i: any) => {
        const product = i.item || i;
        return `${product.name || "Item"} x${i.quantity || 1}`;
      }).join(", ");
    }
    return String(items);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
            <Package size={18} className="text-blue-600" /> Orders Management
          </h2>
          <p className="text-slate-700 text-xs mt-0.5">Track and manage all customer orders</p>
        </div>
        <button onClick={loadOrders} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCcw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { label: "Pending", key: "pending", colour: "bg-amber-500" },
          { label: "Paid", key: "paid", colour: "bg-emerald-500" },
          { label: "Preparing", key: "preparing", colour: "bg-blue-500" },
          { label: "Ready", key: "ready_for_pickup", colour: "bg-indigo-500" },
          { label: "Completed", key: "completed", colour: "bg-teal-500" },
          { label: "Cancelled", key: "cancelled", colour: "bg-slate-500" },
          { label: "Failed", key: "failed", colour: "bg-red-500" },
        ].map(card => (
          <button key={card.key} onClick={() => setTab(card.key as StatusTab)}
            className={`bg-white rounded-xl border shadow-sm p-2 flex items-center gap-1.5 hover:shadow-md transition-all ${
              tab === card.key ? "ring-2 ring-blue-400 border-blue-300" : "border-slate-200"
            }`}
          >
            <div className={`${card.colour} w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-[10px]`}>
              {stats[card.key as keyof typeof stats] ?? 0}
            </div>
            <span className="text-slate-800 font-semibold text-[10px] leading-tight">{card.label}</span>
          </button>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap border-b border-slate-200 pb-1.5">
        {STATUS_TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-2 py-1 text-[10px] font-bold rounded-lg capitalize transition-all ${
              tab === t
                ? "bg-blue-600 text-white"
                : "text-slate-700 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            {t === "all" ? "All" : statusLabels[t] || t}
            {t !== "all" && <span className="ml-1 text-[9px] opacity-70">({(stats as any)[t] ?? 0})</span>}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className={`h-3 ${i === 0 ? 'w-24' : i === 4 ? 'w-20' : 'w-16'}`} />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                {Array.from({ length: 7 }).map((_, j) => (
                  <Skeleton key={j} className={`h-3 ${j === 0 ? 'w-24' : j === 4 ? 'w-20' : 'w-16'}`} />
                ))}
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-10 text-slate-700">
            <Package size={28} className="mx-auto mb-2 opacity-30" />
            <p className="font-semibold text-xs">No {tab === "all" ? "" : statusLabels[tab] || tab} orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Order #", "Customer", "Phone", "Items", "Amount", "Payment", "Status", ...(readOnly ? [] : ["Actions"])].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((o: any) => (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">
                        {o.order_reference || `#${o.id}`}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {o.customer_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-800 text-xs">{o.phone || "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-800 max-w-[180px] truncate" title={formatItems(o.items)}>
                        {formatItems(o.items)}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800 text-xs whitespace-nowrap">
                        KES {Number(o.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full font-bold ${
                          o.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-800"
                        }`}>
                          <ShoppingBag size={10} />
                          {o.status === "paid" ? "M-Pesa" : "M-Pesa Pending"}
                        </span>
                        {o.mpesa_receipt && <p className="text-[10px] text-slate-700 mt-0.5">Receipt: {o.mpesa_receipt}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold ${statusStyle[o.status] || "bg-slate-100 text-slate-800"}`}>
                          {statusLabels[o.status] || o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {updating === o.id ? (
                          <Loader2 size={16} className="animate-spin text-blue-500" />
                        ) : !readOnly ? (
                          <div className="flex gap-1 flex-wrap">
                            {o.status === "pending" && (
                              <button
                                onClick={() => {
                                  const receipt = prompt("Enter M-Pesa receipt number (e.g. QLS123456):");
                                  if (receipt && receipt.trim()) {
                                    apiService.updateRecord("orders", o.id, { status: "paid", mpesa_receipt: receipt.trim(), payment_method: "mpesa" })
                                      .then(() => {
                                        setOrders(prev => prev.map(ord => ord.id === o.id ? { ...ord, status: "paid", mpesa_receipt: receipt.trim(), payment_method: "mpesa" } : ord));
                                        alert("Order marked as paid with receipt: " + receipt.trim());
                                      })
                                      .catch(() => alert("Failed to update order"));
                                  }
                                }}
                                className="flex items-center gap-1 px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-[10px] font-bold transition-colors"
                              >
                                <CheckCircle size={10} /> Confirm M-Pesa
                              </button>
                            )}
                            {o.status === "paid" && (
                              <button onClick={() => updateStatus(o.id, "preparing")}
                                className="flex items-center gap-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-[10px] font-bold transition-colors">
                                <CookingPot size={10} /> Prepare
                              </button>
                            )}
                            {o.status === "preparing" && (
                              <button onClick={() => updateStatus(o.id, "ready_for_pickup")}
                                className="flex items-center gap-1 px-2 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-[10px] font-bold transition-colors">
                                <Package size={10} /> Ready for Pickup
                              </button>
                            )}
                            {o.status === "ready_for_pickup" && (
                              <button onClick={() => updateStatus(o.id, "completed")}
                                className="flex items-center gap-1 px-2 py-1 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded-lg text-[10px] font-bold transition-colors">
                                <Archive size={10} /> Complete
                              </button>
                            )}
                            {(o.status === "pending" || o.status === "paid" || o.status === "preparing") && (
                              <button onClick={() => updateStatus(o.id, "cancelled")}
                                className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-bold transition-colors">
                                <Ban size={10} /> Cancel
                              </button>
                            )}
                            {o.status === "completed" && (
                              <span className="text-[10px] text-slate-700 italic">Done</span>
                            )}
                            {/* WhatsApp button for non-cancelled/non-completed orders */}
                            {(o.status === "paid" || o.status === "preparing" || o.status === "ready_for_pickup") && (
                              <button
                                onClick={() => {
                                  const msg = o.status === "ready_for_pickup"
                                    ? `Hello ${o.customer_name || "Customer"},\n\nYour order ${o.order_reference || `#${o.id}`} is ready for pickup!\n\nPickup Location: CSA Church Bookshop\nOpening Hours: Mon–Sat, 8AM–5PM\n\nThank you for supporting CSA Kirinyaga.`
                                    : o.status === "preparing"
                                    ? `Hello ${o.customer_name || "Customer"},\n\nYour order ${o.order_reference || `#${o.id}`} is being prepared. We'll notify you when it's ready for pickup.\n\nThank you for your patience.`
                                    : `Hello ${o.customer_name || "Customer"},\n\nYour payment of KES ${Number(o.amount).toLocaleString()} for order ${o.order_reference || `#${o.id}`} has been received.\n\nWe are now preparing your order.`;
                                  sendWhatsApp(o, msg);
                                }}
                                className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                                title="WhatsApp Customer"
                              >
                                <MessageCircle size={12} />
                              </button>
                            )}
                          </div>
                        ) : null}
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
