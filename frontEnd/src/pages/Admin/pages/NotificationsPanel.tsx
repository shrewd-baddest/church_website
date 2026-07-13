import { useEffect, useState, useCallback } from "react";
import { Bell, Package, CalendarDays, AlertTriangle, CheckCircle, Clock, DollarSign, ShoppingCart, RefreshCw } from "lucide-react";
import apiService from "../../../pages/Landing/services/api";

type Notification = {
  id: string;
  type: "order" | "hire" | "stock" | "payment";
  title: string;
  message: string;
  severity: "info" | "warning" | "success" | "urgent";
  timestamp: string;
  read: boolean;
  data?: any;
};

const SEVERITY_STYLES: Record<string, string> = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  urgent: "bg-rose-50 border-rose-200 text-rose-800",
};

const TYPE_ICONS: Record<string, any> = {
  order: ShoppingCart,
  hire: CalendarDays,
  stock: AlertTriangle,
  payment: DollarSign,
};

const NotificationsPanel = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [filter, setFilter] = useState<"all" | "order" | "hire" | "stock" | "payment">("all");

  const buildNotifications = useCallback(async () => {
    try {
      const [orders, hireRequests, products] = await Promise.all([
        apiService.fetchTableData("orders", true).catch(() => []),
        apiService.fetchTableData("hire_requests", true).catch(() => []),
        apiService.fetchTableData("products", true).catch(() => []),
      ]);

      const notifs: Notification[] = [];

      // New orders (last 24h)
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      if (Array.isArray(orders)) {
        orders.forEach((order: any) => {
          const created = new Date(order.created_at).getTime();
          const isRecent = created > oneDayAgo;

          if (order.status === "pending" && isRecent) {
            notifs.push({
              id: `order-${order.id}`,
              type: "order",
              title: "New Order Received",
              message: `Order #${String(order.id).slice(0, 8)} — KES ${order.amount || 0} from ${order.phone || "Unknown"}`,
              severity: "urgent",
              timestamp: order.created_at,
              read: false,
              data: order,
            });
          } else if (order.status === "paid" || order.status === "completed") {
            notifs.push({
              id: `order-done-${order.id}`,
              type: "payment",
              title: order.status === "paid" ? "Payment Confirmed" : "Order Completed",
              message: `Order #${String(order.id).slice(0, 8)} — KES ${Number(order.amount || 0).toLocaleString()} (${order.mpesa_receipt || "Paid"})`,
              severity: "success",
              timestamp: order.created_at,
              read: false,
              data: order,
            });
          }
        });
      }

      // New hire requests
      if (Array.isArray(hireRequests)) {
        hireRequests.forEach((hire: any) => {
          const created = new Date(hire.created_at || hire.date).getTime();
          const isRecent = created > oneDayAgo;

          if (isRecent) {
            notifs.push({
              id: `hire-${hire.id}`,
              type: "hire",
              title: "New Booking Request",
              message: `${hire.customer_name || "Customer"} — ${hire.item_name || "Item"} (${hire.quantity || 1}x) ${hire.start_date ? `from ${hire.start_date}` : ""}`,
              severity: hire.status === "pending" ? "warning" : "info",
              timestamp: hire.created_at || hire.date,
              read: false,
              data: hire,
            });
          }
        });
      }

      // Low stock alerts (from products table)
      if (Array.isArray(products)) {
        products.forEach((product: any) => {
          const stock = Number(product.stock ?? 999);
          if (stock <= 5 && stock > 0) {
            notifs.push({
              id: `stock-${product.id}`,
              type: "stock",
              title: "Low Stock Alert",
              message: `"${product.name || product.title}" has only ${stock} left in stock`,
              severity: stock <= 2 ? "urgent" : "warning",
              timestamp: product.updated_at || product.created_at || new Date().toISOString(),
              read: false,
              data: product,
            });
          } else if (stock === 0) {
            notifs.push({
              id: `stock-${product.id}`,
              type: "stock",
              title: "Out of Stock",
              message: `"${product.name || product.title}" is out of stock`,
              severity: "urgent",
              timestamp: product.updated_at || product.created_at || new Date().toISOString(),
              read: false,
              data: product,
            });
          }
        });
      }

      // Sort by timestamp descending
      notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setNotifications(notifs);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to build notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    buildNotifications();
    const interval = setInterval(buildNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [buildNotifications]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = filter === "all" ? notifications : notifications.filter((n) => n.type === filter);

  const stats = {
    total: notifications.length,
    unread: unreadCount,
    orders: notifications.filter((n) => n.type === "order").length,
    hires: notifications.filter((n) => n.type === "hire").length,
    stock: notifications.filter((n) => n.type === "stock").length,
    payments: notifications.filter((n) => n.type === "payment").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <Bell size={20} />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800">Notifications</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Real-time alerts for orders, bookings, payments, and stock.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={buildNotifications}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md">
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, color: "bg-slate-50 text-slate-700", icon: Bell },
          { label: "Unread", value: stats.unread, color: "bg-rose-50 text-rose-700", icon: Clock },
          { label: "Orders", value: stats.orders, color: "bg-blue-50 text-blue-700", icon: ShoppingCart },
          { label: "Bookings", value: stats.hires, color: "bg-amber-50 text-amber-700", icon: CalendarDays },
          { label: "Stock", value: stats.stock, color: "bg-purple-50 text-purple-700", icon: Package },
        ].map((stat, i) => (
          <div key={i} className={`rounded-2xl border border-slate-100 p-4 ${stat.color}`}>
            <p className="text-2xl font-black">{stat.value}</p>
            <p className="text-xs font-semibold uppercase tracking-wider mt-1 opacity-75">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["all", "order", "hire", "stock", "payment"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === type
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {type === "all" ? "All" : type === "order" ? "Orders" : type === "hire" ? "Bookings" : type === "stock" ? "Stock" : "Payments"}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
          <span className="text-sm font-medium text-slate-500">Loading notifications...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <CheckCircle size={40} className="text-emerald-300 mb-3" />
          <p className="text-sm font-semibold text-slate-500">All clear — no notifications right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((notif) => {
            const Icon = TYPE_ICONS[notif.type] || Bell;
            return (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`relative flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-md ${
                  notif.read
                    ? "bg-white border-slate-100"
                    : `${SEVERITY_STYLES[notif.severity]} border-l-4`
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Icon size={18} className={notif.read ? "text-slate-400" : "text-slate-700"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-sm ${notif.read ? "text-slate-600" : "text-slate-900"}`}>
                      {notif.title}
                    </h3>
                    {!notif.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${notif.read ? "text-slate-400" : "text-slate-600"}`}>
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock size={12} className="text-slate-400" />
                    <span className="text-[11px] text-slate-400">
                      {new Date(notif.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Last refreshed */}
      <p className="text-center text-xs text-slate-400">
        Last refreshed: {lastRefresh.toLocaleTimeString()} • Auto-refreshes every 30 seconds
      </p>
    </div>
  );
};

export default NotificationsPanel;
