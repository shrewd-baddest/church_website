import { useState, useEffect, useCallback } from "react";
import { X, Loader2, CheckCircle2, CalendarDays, Armchair, Music, ShoppingBag, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { apiClient } from "../../../api/axiosInstance";
import { useApp } from "../../../context/AppContext";

interface HireModalProps {
  onClose: () => void;
  showEventDate?: boolean;
}

interface AvailabilityResult {
  item_name: string;
  requested_quantity: number;
  total_stock: number;
  booked_quantity: number;
  available_quantity: number;
  can_fulfill: boolean;
  found: boolean;
  daily_rate?: number;
}

export const HireModal = ({ onClose, showEventDate = true }: HireModalProps) => {
  const { hireItems, clearHire } = useApp();
  const today = new Date().toISOString().split("T")[0];

  const returnOptions = (() => {
    const opts: { value: string; label: string }[] = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 1; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      opts.push({
        value: `${y}-${m}-${day}`,
        label: `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${y}`,
      });
    }
    return opts;
  })();

  const defaultReturn = returnOptions[0]?.value || '';

  const [form, setForm] = useState({
    customer_name: "",
    phone_number: "",

    event_date: today,
    pickup_date: today,
    return_date: defaultReturn,
    notes: "",
    agree: false,
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ reference: string } | null>(null);

  // Availability checking
  const [availability, setAvailability] = useState<AvailabilityResult[] | null>(null);
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [availError, setAvailError] = useState("");

  const checkAvailability = useCallback(async () => {
    if (!form.pickup_date || !form.return_date || hireItems.length === 0) {
      setAvailability(null);
      return;
    }

    setCheckingAvail(true);
    setAvailError("");

    try {
      const items = hireItems.map(item => ({
        item_name: item.name,
        quantity: item.quantity,
      }));

      const res = await apiClient.post("/hire/availability/check", {
        items,
        start_date: form.pickup_date,
        end_date: form.return_date,
      });

      setAvailability(res.data.items || []);
    } catch (err: any) {
      setAvailError("Could not check availability. You can still submit.");
      setAvailability(null);
    } finally {
      setCheckingAvail(false);
    }
  }, [form.pickup_date, form.return_date, hireItems]);

  useEffect(() => {
    const timer = setTimeout(() => checkAvailability(), 500);
    return () => clearTimeout(timer);
  }, [checkAvailability]);

  const allAvailable = availability ? availability.every(a => a.can_fulfill) : true;
  const anyChecked = availability !== null;

  const pickupDate = new Date(form.pickup_date);
  const returnDate = new Date(form.return_date);
  const rentalDays = form.pickup_date && form.return_date
    ? Math.max(1, Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  const totalCost = hireItems.reduce((sum, item) => sum + item.price * item.quantity * rentalDays, 0);

  const getIcon = (category?: string) => {
    switch ((category || "").toLowerCase()) {
      case "chairs": return <Armchair size={16} />;
      case "instruments": return <Music size={16} />;
      default: return <ShoppingBag size={16} />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.customer_name.trim()) { setError("Full name is required."); return; }
    if (!form.phone_number.trim()) { setError("Phone number is required."); return; }
    if (!form.event_date) { setError("Event date is required."); return; }
    if (!form.pickup_date) { setError("Pickup date is required."); return; }
    if (!form.return_date) { setError("Return date is required."); return; }
    if (form.return_date < form.pickup_date) { setError("Return date must be after pickup date."); return; }
    if (!form.agree) { setError("Please agree to the terms."); return; }
    if (!allAvailable && anyChecked) { setError("Some items are not available for the selected dates. Adjust quantities or dates."); return; }

    const items = hireItems.map(item => ({
      item_name: item.name,
      item_category: item.category || null,
      quantity: item.quantity,
      price: item.price,
    }));

    setLoading(true);
    try {
      const res = await apiClient.post("/hire/submit", {
        items,
        customer_name: form.customer_name.trim(),
        phone_number: form.phone_number.trim(),

        event_date: form.event_date,
        pickup_date: form.pickup_date,
        return_date: form.return_date,
        notes: form.notes.trim() || null,
      });

      setResult({ reference: res.data.reference });
      clearHire();
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to submit request. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-16">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-white font-black text-lg">Hire Request</h2>
            <p className="text-blue-200 text-sm mt-0.5">{hireItems.length} item{hireItems.length > 1 ? "s" : ""}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          /* ── CONFIRMATION VIEW ── */
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            <h3 className="text-slate-800 font-black text-xl">Request Submitted</h3>
            <div className="mt-5 bg-slate-50 rounded-2xl p-5 text-left space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">Reference</span>
                <span className="font-black text-blue-600 text-lg">{result?.reference}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">Status</span>
                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-black rounded-full">Pending Approval</span>
              </div>
            </div>
            <p className="text-slate-500 text-sm mt-4">
              We'll notify you once your request has been reviewed.
            </p>
            <button onClick={onClose} className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-colors">
              Done
            </button>
          </div>
        ) : (
          /* ── FORM VIEW ── */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Items Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Items to Hire</p>
              {hireItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{getIcon(item.category)}</span>
                    <span className="font-semibold text-slate-700">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">x{item.quantity}</span>
                    <span className="text-slate-400 text-xs">KES {Number(item.price).toLocaleString()}/day</span>
                    <span className="font-bold text-slate-800">KES {(item.price * item.quantity * rentalDays).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between text-sm">
                <span className="font-black text-slate-700">
                  Total for {rentalDays} day{rentalDays > 1 ? 's' : ''}
                </span>
                <span className="font-black text-blue-600">KES {totalCost.toLocaleString()}</span>
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Personal Information</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Full Name *</label>
                  <input name="customer_name" value={form.customer_name} onChange={handleChange} placeholder="John Doe" required className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Phone Number *</label>
                  <input name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="0712 345 678" required className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
                </div>
              </div>
            </div>

            {/* Hire Dates */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Hire Details</p>
              <div className="grid grid-cols-2 gap-3">
                {showEventDate && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5"><CalendarDays size={12} className="inline mr-1" />Event Date *</label>
                    <input name="event_date" type="date" value={form.event_date} onChange={handleChange} min={today} required className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
                  </div>
                )}
                <div className={showEventDate ? '' : 'col-span-2'}>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5"><CalendarDays size={12} className="inline mr-1" />Pickup Date *</label>
                  <input name="pickup_date" type="date" value={form.pickup_date} onChange={handleChange} min={today} required className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5"><CalendarDays size={12} className="inline mr-1" />Return Date *</label>
                  <select name="return_date" value={form.return_date} onChange={handleChange} required className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-white">
                    {returnOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Availability Check Results */}
            {(checkingAvail || availability || availError) && form.pickup_date && form.return_date && (
              <div className={`rounded-2xl p-4 border ${allAvailable ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Availability on Selected Dates
                  {checkingAvail && <Loader2 size={12} className="inline ml-2 animate-spin" />}
                </p>
                {availError && (
                  <p className="text-xs text-amber-600">{availError}</p>
                )}
                {availability && availability.map((a, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      {a.can_fulfill ? (
                        <CheckCircle size={14} className="text-emerald-500" />
                      ) : (
                        <XCircle size={14} className="text-red-500" />
                      )}
                      <span className="font-semibold text-slate-700">{a.item_name}</span>
                    </div>
                    <span className={`text-xs font-bold ${a.can_fulfill ? 'text-emerald-600' : 'text-red-600'}`}>
                      {a.can_fulfill
                        ? `${a.available_quantity} available`
                        : `Only ${a.available_quantity} available (need ${a.requested_quantity})`}
                    </span>
                  </div>
                ))}
                {!allAvailable && !checkingAvail && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <AlertTriangle size={12} /> Some items are not fully available. Adjust quantities or dates.
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Additional Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="E.g., Need the chairs arranged before 8 AM." rows={2} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition resize-none" />
            </div>

            {/* Terms & Conditions */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={12} /> Terms & Conditions
              </p>
              <ul className="text-xs text-amber-700 space-y-1.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>Items must be picked up from and returned to <strong>KYU campus</strong> on the agreed dates.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>You are <strong>fully responsible</strong> for any damage, loss, or theft during the hire period. Repair or replacement costs will be charged.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>Late returns beyond the agreed return date will incur <strong>additional daily charges</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>Items must be returned in <strong>the same clean condition</strong> as received.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>Full payment is due <strong>before pickup</strong> unless other arrangements are approved.</span>
                </li>
              </ul>
              <label className="flex items-start gap-3 cursor-pointer pt-1">
                <input type="checkbox" name="agree" checked={form.agree} onChange={handleChange} className="mt-0.5 w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500" />
                <span className="text-xs text-amber-800 font-semibold">
                  I have read and agree to the terms above
                </span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || checkingAvail || !form.agree || (!allAvailable && anyChecked)}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black rounded-xl transition-colors flex items-center justify-center gap-2 text-sm disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Submitting...</>
              ) : checkingAvail ? (
                <><Loader2 size={18} className="animate-spin" /> Checking availability...</>
              ) : !form.agree ? (
                "Agree to terms to continue"
              ) : !allAvailable && anyChecked ? (
                "Some items unavailable — adjust dates"
              ) : (
                "Submit Request"
              )}
            </button>

            <p className="text-[10px] text-slate-400 text-center">
              Total for {rentalDays} day{rentalDays > 1 ? 's' : ''}: KES {totalCost.toLocaleString()}. Payment will be arranged after approval.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
