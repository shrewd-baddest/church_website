import { useEffect, useState, useMemo } from "react";
import { apiClient } from "../../../api/axiosInstance";
import apiService from "../../Landing/services/api";
import { CalendarDays, RefreshCcw, Loader2, CheckCircle, XCircle, RotateCcw, MessageCircle, X, MapPin, Clock3, Copy, Check, ChevronDown, ChevronRight, DollarSign, Smartphone, Ban, PackageCheck, Archive } from "lucide-react";
import { toast } from "react-hot-toast";

const STATUS_TABS = [
  "all", "pending", "approved", "paid", "ready_for_pickup",
  "collected", "returned", "cancelled", "rejected",
] as const;
type HireTab = typeof STATUS_TABS[number];

const statusStyle: Record<string, string> = {
  pending:          "bg-amber-100 text-amber-700",
  approved:         "bg-blue-100 text-blue-700",
  paid:             "bg-emerald-100 text-emerald-700",
  ready_for_pickup: "bg-indigo-100 text-indigo-700",
  collected:        "bg-purple-100 text-purple-700",
  returned:         "bg-teal-100 text-teal-700",
  cancelled:        "bg-slate-100 text-slate-600",
  rejected:         "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  pending: "Pending Approval",
  approved: "Approved — Awaiting Payment",
  paid: "Paid — Ready for Pickup",
  ready_for_pickup: "Ready for Pickup",
  collected: "Collected",
  returned: "Returned",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

function normalizePhone(raw: string): string {
  let digits = (raw || "").replace(/[^0-9]/g, "");
  if (digits.startsWith("00")) digits = digits.substring(2);
  if (digits.startsWith("0") && digits.length >= 10) digits = "254" + digits.substring(1);
  if (digits.startsWith("254") && digits.length >= 12) return digits;
  if (digits.length === 12 && !digits.startsWith("254")) return "254" + digits;
  return digits;
}

interface GroupedRequest {
  reference: string;
  customer_name: string;
  phone_number: string;
  email: string | null;
  event_date: string;
  pickup_date: string;
  return_date: string;
  notes: string | null;
  admin_notes: string | null;
  status: string;
  payment_status: string;
  payment_method: string | null;
  mpesa_receipt: string | null;
  paid_at: string | null;
  created_at: string;
  items: any[];
  total_cost: number;
}

interface ActionModal {
  open: boolean;
  type: "approve" | "reject" | "mark-paid" | "collect" | "returned" | "cancel" | "mpesa" | null;
  group: GroupedRequest | null;
  pickupLocation: string;
  pickupTime: string;
  adminNotes: string;
  rejectReason: string;
  sentConfirm: boolean;
}

export default function HireRequestsManager() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<HireTab>("pending");
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedRef, setExpandedRef] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<ActionModal>({
    open: false, type: null, group: null,
    pickupLocation: "", pickupTime: "", adminNotes: "", rejectReason: "", sentConfirm: false,
  });

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await apiService.fetchTableData("hire_requests", true);
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load hire requests");
    } finally {
      setLoading(false);
    }
  };

  // Group by hire_reference
  const groups = useMemo(() => {
    const map = new Map<string, GroupedRequest>();
    for (const r of requests) {
      const ref = r.hire_reference || `legacy-${r.id}`;
      if (!map.has(ref)) {
        map.set(ref, {
          reference: ref,
          customer_name: r.customer_name,
          phone_number: r.phone_number,
          email: r.email,
          event_date: r.event_date,
          pickup_date: r.pickup_date,
          return_date: r.return_date,
          notes: r.notes,
          admin_notes: r.admin_notes,
          status: r.status,
          payment_status: r.payment_status || "pending",
          payment_method: r.payment_method,
          mpesa_receipt: r.mpesa_receipt,
          paid_at: r.paid_at,
          created_at: r.created_at,
          items: [],
          total_cost: 0,
        });
      }
      const g = map.get(ref)!;
      g.items.push(r);
      g.total_cost += Number(r.total_cost) || 0;
      // Use latest status from items
      if (r.status) g.status = r.status;
      if (r.payment_status) g.payment_status = r.payment_status;
      if (r.payment_method) g.payment_method = r.payment_method;
      if (r.mpesa_receipt) g.mpesa_receipt = r.mpesa_receipt;
    }
    return Array.from(map.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [requests]);

  const visible = tab === "all" ? groups : groups.filter(g => g.status === tab);

  const counts: Record<string, number> = {};
  for (const t of STATUS_TABS) {
    if (t === "all") counts.all = groups.length;
    else counts[t] = groups.filter(g => g.status === t).length;
  }

  // Open action modal
  const openAction = (type: ActionModal["type"], group: GroupedRequest) => {
    setActionModal({
      open: true, type, group,
      pickupLocation: group.admin_notes?.startsWith("Pickup:") ? group.admin_notes : "",
      pickupTime: "",
      adminNotes: "",
      rejectReason: "",
      sentConfirm: false,
    });
  };

  const closeActionModal = () => {
    setActionModal({ open: false, type: null, group: null, pickupLocation: "", pickupTime: "", adminNotes: "", rejectReason: "", sentConfirm: false });
  };

  const confirmAction = async () => {
    if (!actionModal.group || !actionModal.type) return;
    const { group, type, pickupLocation, pickupTime, adminNotes, rejectReason } = actionModal;
    setUpdating(group.reference);

    try {
      const body: any = {};
      let notes = adminNotes;
      let waMessage = "";

      switch (type) {
        case "approve":
          body.status = "approved";
          body.payment_status = "pending";
          if (pickupLocation) notes = `Pickup: ${pickupLocation}${pickupTime ? ` at ${pickupTime}` : ""}${notes ? ` | ${notes}` : ""}`;
          if (notes) body.admin_notes = notes;
          waMessage = `Hello ${group.customer_name},\n\nYour hire request (${group.reference}) has been *APPROVED*!\n\n`;
          waMessage += `*Items:*\n${group.items.map(i => `  - ${i.item_name} x${i.quantity}`).join("\n")}\n\n`;
          waMessage += `*Total Cost:* KES ${group.total_cost.toLocaleString()}\n`;
          waMessage += `*Pickup Date:* ${group.pickup_date ? new Date(group.pickup_date).toLocaleDateString() : "TBA"}\n`;
          waMessage += `*Return Date:* ${group.return_date ? new Date(group.return_date).toLocaleDateString() : "TBA"}\n`;
          if (pickupLocation) waMessage += `*Pickup Location:* ${pickupLocation}\n`;
          if (pickupTime) waMessage += `*Pickup Time:* ${pickupTime}\n`;
          waMessage += `\nPlease proceed with payment to confirm your booking.\n`;
          waMessage += `Visit the CSA office or use M-Pesa Paybill to complete payment.`;
          break;
        case "reject":
          body.status = "rejected";
          if (rejectReason) notes = `Reason: ${rejectReason}${notes ? ` | ${notes}` : ""}`;
          if (notes) body.admin_notes = notes;
          waMessage = `Hello ${group.customer_name},\n\nYour hire request (${group.reference}) has been *REJECTED*.\n\n`;
          if (rejectReason) waMessage += `*Reason:* ${rejectReason}\n`;
          waMessage += `\nFeel free to contact us for any questions.`;
          break;
        case "mark-paid":
          body.payment_status = "paid";
          body.payment_method = "cash";
          body.paid_at = new Date().toISOString();
          body.status = "paid";
          waMessage = `Hello ${group.customer_name},\n\nYour payment for hire request (${group.reference}) has been *CONFIRMED*!\n\n`;
          waMessage += `*Amount Paid:* KES ${group.total_cost.toLocaleString()}\n`;
          waMessage += `*Items:*\n${group.items.map(i => `  - ${i.item_name} x${i.quantity}`).join("\n")}\n`;
          waMessage += `\nPlease collect your items from the CSA office.`;
          break;
        case "collect":
          body.status = "collected";
          break;
        case "returned":
          body.status = "returned";
          break;
        case "cancel":
          body.status = "cancelled";
          break;
      }

      await apiClient.patch(`/hire/group/${group.reference}`, body);

      // Reload to get fresh data
      await loadRequests();

      // WhatsApp notification
      if (waMessage) {
        const phone = normalizePhone(group.phone_number);
        if (phone) {
          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(waMessage)}`, "_blank");
        }
      }

      setActionModal(p => ({ ...p, sentConfirm: true }));
    } catch {
      toast.error("Failed to update");
    } finally {
      setUpdating(null);
    }
  };

  // Initiate M-Pesa payment
  const initiateMpesaPayment = async (group: GroupedRequest) => {
    setUpdating(group.reference);
    try {
      const res = await apiClient.post(`/hire/pay/${group.reference}`, {
        phone_number: group.phone_number,
      });
      // Poll for payment status
      pollPayment(group.reference);
    } catch (error: any) {
      alert(error?.response?.data?.error || "Failed to initiate payment");
    } finally {
      setUpdating(null);
    }
  };

  const pollPayment = (reference: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await apiClient.get(`/hire/payment-status/${reference}`);
        const data = res.data;
        if (data.payment_status === "paid" || data.mpesa_status === "paid") {
          clearInterval(interval);
          await loadRequests();
          alert(`Payment confirmed! Receipt: ${data.mpesa_receipt || data.mpesa_receipt_from_provider || "N/A"}`);
        } else if (data.mpesa_status === "failed") {
          clearInterval(interval);
          alert("Payment failed. Please try again.");
        }
      } catch {
        clearInterval(interval);
      }
    }, 3000);
    // Timeout after 2 minutes
    setTimeout(() => clearInterval(interval), 120000);
  };

  const copyMessage = () => {
    const { group, type, pickupLocation, rejectReason } = actionModal;
    if (!group || !type) return;
    let msg = "";
    if (type === "approve") {
      msg = `Hello ${group.customer_name},\n\nYour hire request (${group.reference}) has been *APPROVED*!\n\n`;
      msg += `*Items:*\n${group.items.map(i => `  - ${i.item_name} x${i.quantity}`).join("\n")}\n\n`;
      msg += `*Total Cost:* KES ${group.total_cost.toLocaleString()}\n`;
      msg += `*Pickup Date:* ${group.pickup_date ? new Date(group.pickup_date).toLocaleDateString() : "TBA"}\n`;
      if (pickupLocation) msg += `*Pickup:* ${pickupLocation}\n`;
      msg += `\nPlease proceed with payment.`;
    } else if (type === "reject") {
      msg = `Hello ${group.customer_name},\n\nYour hire request (${group.reference}) has been *REJECTED*.\n\n`;
      if (rejectReason) msg += `*Reason:* ${rejectReason}\n`;
    }
    navigator.clipboard.writeText(msg).then(() => alert("Message copied!"));
  };

  const sendWhatsApp = (phone: string, message: string) => {
    const p = normalizePhone(phone);
    if (p) window.open(`https://wa.me/${p}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
            <CalendarDays size={18} className="text-blue-600" /> Hire Requests
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Manage chair and instrument hire requests</p>
        </div>
        <button onClick={loadRequests} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCcw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { label: "Pending", key: "pending", colour: "bg-amber-500" },
          { label: "Approved", key: "approved", colour: "bg-blue-500" },
          { label: "Paid", key: "paid", colour: "bg-emerald-500" },
          { label: "Collected", key: "collected", colour: "bg-purple-500" },
          { label: "Returned", key: "returned", colour: "bg-teal-500" },
        ].map(c => (
          <button key={c.key} onClick={() => setTab(c.key as HireTab)}
            className={`bg-white rounded-xl border shadow-sm p-3 flex items-center gap-2 hover:shadow-md transition-all ${
              tab === c.key ? "ring-2 ring-blue-400 border-blue-300" : "border-slate-200"
            }`}
          >
            <div className={`${c.colour} w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs`}>
              {counts[c.key] ?? 0}
            </div>
            <div className="text-left">
              <span className="text-slate-600 font-semibold text-[11px] leading-tight block">{c.label}</span>
              <span className="text-[9px] text-slate-400">{tab === c.key ? "active" : ""}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Quick status counts */}
      <div className="flex flex-wrap gap-1">
        {STATUS_TABS.filter(t => t !== "all").map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-2 py-1 text-[10px] font-bold rounded-full transition-all capitalize ${
              tab === t
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {statusLabels[t] || t} ({counts[t] ?? 0})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-slate-400">
            <Loader2 size={24} className="animate-spin mr-2" /> Loading requests...
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <CalendarDays size={28} className="mx-auto mb-2 opacity-30" />
            <p className="font-semibold text-xs">No {tab === "all" ? "" : statusLabels[tab] || tab} hire requests</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visible.map((group) => {
              const isExpanded = expandedRef === group.reference;
              const isUpdating = updating === group.reference;

              return (
                <div key={group.reference} className="hover:bg-slate-50 transition-colors">
                  {/* Group header row */}
                  <div className="flex items-center px-4 py-3 gap-3 cursor-pointer" onClick={() => setExpandedRef(isExpanded ? null : group.reference)}>
                    <div className="flex-1 min-w-0 grid grid-cols-12 gap-2 items-center text-sm">
                      <div className="col-span-2 font-semibold text-slate-800 truncate">{group.customer_name}</div>
                      <div className="col-span-2 text-slate-500 text-xs truncate">{group.phone_number}</div>
                      <div className="col-span-2">
                        <span className="text-xs font-bold text-slate-700">Ref: {group.reference}</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-xs font-bold text-slate-700">KES {group.total_cost.toLocaleString()}</span>
                      </div>
                      <div className="col-span-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold ${statusStyle[group.status] || "bg-slate-100 text-slate-600"}`}>
                          {statusLabels[group.status] || group.status}
                        </span>
                        {group.payment_status === "paid" && (
                          <span className="ml-1 inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            Paid
                          </span>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center gap-1 justify-end">
                        {isUpdating ? (
                          <Loader2 size={16} className="animate-spin text-blue-500" />
                        ) : (
                          <>
                            {group.status === "pending" && (
                              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                <button onClick={() => openAction("approve", group)} title="Approve"
                                  className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors">
                                  <CheckCircle size={14} />
                                </button>
                                <button onClick={() => openAction("reject", group)} title="Reject"
                                  className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors">
                                  <XCircle size={14} />
                                </button>
                                <button onClick={() => sendWhatsApp(group.phone_number, `Hello ${group.customer_name},\n\nWe have received your hire request (${group.reference}). We are reviewing it and will get back to you shortly.`)} title="WhatsApp"
                                  className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors">
                                  <MessageCircle size={14} />
                                </button>
                              </div>
                            )}
                            {group.status === "approved" && (
                              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                <button onClick={() => openAction("mark-paid", group)} title="Mark as Paid (Cash)"
                                  className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors">
                                  <DollarSign size={14} />
                                </button>
                                <button onClick={() => initiateMpesaPayment(group)} title="Process M-Pesa Payment"
                                  className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors">
                                  <Smartphone size={14} />
                                </button>
                                <button onClick={() => openAction("reject", group)} title="Reject"
                                  className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors">
                                  <XCircle size={14} />
                                </button>
                                <button onClick={() => sendWhatsApp(group.phone_number, `Hello ${group.customer_name},\n\nCongratulations! Your hire request (${group.reference}) has been *APPROVED*.\n\nTotal Cost: KES ${group.total_cost.toLocaleString()}\n\nPlease proceed with payment at the CSA office.`) } title="WhatsApp"
                                  className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors">
                                  <MessageCircle size={14} />
                                </button>
                              </div>
                            )}
                            {group.status === "paid" && (
                              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                <button onClick={() => openAction("collect", group)} title="Mark as Collected"
                                  className="p-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors">
                                  <PackageCheck size={14} />
                                </button>
                                <button onClick={() => sendWhatsApp(group.phone_number, `Hello ${group.customer_name},\n\nYour items for hire request (${group.reference}) are ready for pickup at the CSA office.`) } title="WhatsApp"
                                  className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors">
                                  <MessageCircle size={14} />
                                </button>
                              </div>
                            )}
                            {group.status === "collected" && (
                              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                <button onClick={() => openAction("returned", group)} title="Mark as Returned"
                                  className="p-1.5 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded-lg transition-colors">
                                  <Archive size={14} />
                                </button>
                              </div>
                            )}
                            {(group.status === "returned" || group.status === "rejected" || group.status === "cancelled") && (
                              <span className="text-[10px] text-slate-400 italic" onClick={e => e.stopPropagation()}>Done</span>
                            )}
                          </>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setExpandedRef(isExpanded ? null : group.reference); }}
                          className="p-1 text-slate-400 hover:text-slate-600">
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded item details */}
                  {isExpanded && (
                    <div className="bg-slate-50 border-t border-slate-100 px-4 py-3 space-y-2">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">Customer</span>
                          <span className="font-semibold text-slate-800">{group.customer_name}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Phone</span>
                          <span className="font-semibold text-slate-800">{group.phone_number}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Reference</span>
                          <span className="font-semibold text-blue-600">{group.reference}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Event Date</span>
                          <span className="font-semibold text-slate-800">{group.event_date ? new Date(group.event_date).toLocaleDateString() : "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Pickup Date</span>
                          <span className="font-semibold text-slate-800">{group.pickup_date ? new Date(group.pickup_date).toLocaleDateString() : "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Return Date</span>
                          <span className="font-semibold text-slate-800">{group.return_date ? new Date(group.return_date).toLocaleDateString() : "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Total Cost</span>
                          <span className="font-semibold text-emerald-700">KES {group.total_cost.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Items table */}
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-100">
                            <tr>
                              <th className="text-left px-3 py-2 font-bold text-slate-500 uppercase">Item</th>
                              <th className="text-left px-3 py-2 font-bold text-slate-500 uppercase">Category</th>
                              <th className="text-center px-3 py-2 font-bold text-slate-500 uppercase">Qty</th>
                              <th className="text-right px-3 py-2 font-bold text-slate-500 uppercase">Cost</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {group.items.map((item: any) => (
                              <tr key={item.id}>
                                <td className="px-3 py-2 font-semibold text-slate-700">{item.item_name}</td>
                                <td className="px-3 py-2 text-slate-500 capitalize">{item.item_category || "—"}</td>
                                <td className="px-3 py-2 text-center text-slate-600">{item.quantity}</td>
                                <td className="px-3 py-2 text-right font-semibold text-slate-700">KES {Number(item.total_cost || 0).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Payment info */}
                      {group.payment_method && (
                        <div className="flex gap-3 text-[10px]">
                          <span className="text-slate-400">Payment:</span>
                          <span className="font-semibold text-slate-700 capitalize">{group.payment_method}</span>
                          {group.mpesa_receipt && (
                            <><span className="text-slate-400">Receipt:</span><span className="font-semibold text-slate-700">{group.mpesa_receipt}</span></>
                          )}
                          {group.paid_at && (
                            <><span className="text-slate-400">Paid at:</span><span className="font-semibold text-slate-700">{new Date(group.paid_at).toLocaleString()}</span></>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {group.notes && <p className="text-xs text-slate-500"><span className="text-slate-400">Notes:</span> {group.notes}</p>}
                      {group.admin_notes && <p className="text-xs text-amber-600"><span className="text-slate-400">Admin:</span> {group.admin_notes}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionModal.open && actionModal.type && actionModal.group && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className={`px-4 py-3 flex items-center justify-between ${
              actionModal.type === "approve" ? "bg-gradient-to-r from-emerald-500 to-emerald-600" :
              actionModal.type === "reject" || actionModal.type === "cancel" ? "bg-gradient-to-r from-red-500 to-red-600" :
              actionModal.type === "mark-paid" ? "bg-gradient-to-r from-emerald-500 to-teal-500" :
              actionModal.type === "collect" ? "bg-gradient-to-r from-indigo-500 to-purple-500" :
              actionModal.type === "returned" ? "bg-gradient-to-r from-teal-500 to-cyan-500" :
              "bg-gradient-to-r from-blue-500 to-blue-600"
            }`}>
              <div>
                <h2 className="text-white font-black text-sm">
                  {actionModal.sentConfirm ? "Done!" : {
                    approve: "Approve Request",
                    reject: "Reject Request",
                    "mark-paid": "Confirm Cash Payment",
                    collect: "Mark as Collected",
                    returned: "Mark as Returned",
                    cancel: "Cancel Request",
                    mpesa: "Process M-Pesa Payment",
                  }[actionModal.type] || "Action"}
                </h2>
                <p className="text-white/70 text-xs mt-0.5">{actionModal.group.customer_name} — {actionModal.group.reference}</p>
              </div>
              <button onClick={closeActionModal} className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all">
                <X size={16} />
              </button>
            </div>

            {actionModal.sentConfirm ? (
              <div className="p-4 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <Check size={24} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-slate-800 font-black text-sm">Status Updated!</h3>
                  <p className="text-slate-500 text-xs mt-1">WhatsApp has been opened with the notification message.</p>
                </div>
                <button onClick={copyMessage} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5">
                  <Copy size={12} /> Copy Message
                </button>
                <button onClick={closeActionModal} className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs">
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="p-4 space-y-3">
                  <div className="bg-slate-50 rounded-xl p-3 space-y-1">
                    <p className="text-[11px] text-slate-500"><strong>Phone:</strong> {actionModal.group.phone_number}</p>
                    <p className="text-[11px] text-slate-500"><strong>Items:</strong></p>
                    <ul className="text-[11px] text-slate-600 list-disc list-inside">
                      {actionModal.group.items.map((i: any, idx: number) => (
                        <li key={idx}>{i.item_name} x{i.quantity} — KES {Number(i.total_cost || 0).toLocaleString()}</li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-slate-500 mt-0.5"><strong>Total:</strong> KES {actionModal.group.total_cost.toLocaleString()}</p>
                  </div>

                  {(actionModal.type === "approve") && (
                    <>
                      <div>
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 mb-1"><MapPin size={10} /> Pickup Location *</label>
                        <input type="text" value={actionModal.pickupLocation} onChange={e => setActionModal(p => ({ ...p, pickupLocation: e.target.value }))}
                          placeholder="e.g. KYU Main Campus, CSA Office"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 transition" />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 mb-1"><Clock3 size={10} /> Pickup Time</label>
                        <input type="text" value={actionModal.pickupTime} onChange={e => setActionModal(p => ({ ...p, pickupTime: e.target.value }))}
                          placeholder="e.g. Monday 9AM - 12PM"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 transition" />
                      </div>
                    </>
                  )}

                  {(actionModal.type === "reject") && (
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">Rejection Reason *</label>
                      <textarea value={actionModal.rejectReason} onChange={e => setActionModal(p => ({ ...p, rejectReason: e.target.value }))}
                        placeholder="Why is this request being rejected?" rows={2}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400 transition resize-none" />
                    </div>
                  )}

                  <p className="text-[9px] text-slate-400 flex items-center gap-1">
                    <MessageCircle size={8} /> WhatsApp will open with a notification after saving
                  </p>
                </div>

                <div className="px-4 pb-4 flex gap-2">
                  <button onClick={closeActionModal} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors text-xs">
                    Cancel
                  </button>
                  <button
                    onClick={confirmAction}
                    disabled={updating !== null || (actionModal.type === "approve" && !actionModal.pickupLocation.trim()) || (actionModal.type === "reject" && !actionModal.rejectReason.trim())}
                    className={`flex-1 py-2 font-bold rounded-lg transition-colors text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-white ${
                      actionModal.type === "reject" || actionModal.type === "cancel" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {updating !== null ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><MessageCircle size={14} /> Confirm & Notify</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
