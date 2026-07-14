import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Package, Home, ShoppingBag, Clock, MapPin, Truck, MessageCircle, Phone } from "lucide-react";

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [method, setMethod] = useState<"mpesa" | "cash">("mpesa");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    const id = searchParams.get("order_id");
    const m = searchParams.get("method");
    const phone = searchParams.get("phone");
    if (id) setOrderId(id);
    if (m === "cash") setMethod("cash");
    if (phone) { setContactPhone(phone); return; }
    // Fallback: try fetching setting, else use fallback number
    if (m === "cash") {
      setContactPhone('254112051739');
      import("../api/axiosInstance").then(({ apiClient }) => {
        apiClient.get('/settings').then(res => {
          if (res.data?.cash_phone) setContactPhone(res.data.cash_phone);
        }).catch(() => {});
      });
    }
  }, [searchParams]);

  const isMpesa = method === "mpesa";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-center">
          {/* Header */}
          <div className={`px-6 py-10 ${isMpesa ? "bg-gradient-to-r from-emerald-500 to-emerald-600" : "bg-gradient-to-r from-amber-500 to-amber-600"}`}>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              {isMpesa ? <CheckCircle2 size={48} className="text-white" /> : <Clock size={48} className="text-white" />}
            </div>
            <h1 className="text-white text-2xl font-black">{isMpesa ? "Order Successful" : "Order Received"}</h1>
            <p className="text-white/80 text-sm mt-1">
              {isMpesa ? "Thank you for your payment" : "Thank you for your order"}
            </p>
          </div>

          {/* Order Details */}
          <div className="p-6 space-y-4">
            {orderId && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Order Number</p>
                <p className="text-2xl font-black text-slate-800 font-mono">{orderId}</p>
              </div>
            )}

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Payment</span>
                <span className={`font-bold ${isMpesa ? "text-emerald-600" : "text-amber-600"}`}>
                  {isMpesa ? "Paid — M-Pesa" : "Cash on Pickup"}
                </span>
              </div>
              {!isMpesa && (
                <p className="text-xs text-amber-600">Please pay when collecting your order.</p>
              )}
            </div>

            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <p className="text-sm text-blue-800 font-semibold flex items-center gap-2">
                <MapPin size={16} /> Pick up at CSA Church Bookshop — KYU Campus
              </p>
              <p className="text-xs text-blue-600 mt-1">Monday — Saturday, 8:00 AM – 5:00 PM</p>
            </div>

            {!isMpesa && contactPhone && (
              <a
                href={`https://wa.me/${contactPhone}?text=Hello%2C%20I%20have%20placed%20an%20order%20(%23${orderId})%20and%20would%20like%20to%20follow%20up.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-emerald-50 rounded-2xl p-4 border border-emerald-200 hover:bg-emerald-100 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <MessageCircle size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-emerald-800">Contact us on WhatsApp</p>
                  <p className="text-xs text-emerald-600">{contactPhone}</p>
                </div>
              </a>
            )}

            <div className="space-y-2">
              <p className="text-sm text-slate-500">
                {isMpesa
                  ? "Your order is now being processed. We'll notify you when it's ready for collection."
                  : "We'll prepare your order. You'll be notified when it's ready for pickup."}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => navigate("/sacramentals")}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
              >
                <ShoppingBag size={16} /> Continue Shopping
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Home size={16} /> Back to Home
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          CSA Kirinyaga Chapter &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
