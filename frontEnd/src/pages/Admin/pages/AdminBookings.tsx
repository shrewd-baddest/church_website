import { useEffect, useState } from "react";
import { bookingService } from "../../../api/activitiesServices";
import { RefreshCw, Download, Search, CalendarCheck2, Wallet, TrendingUp, Users, UserPlus, X, Coins, Ban, Trash2 } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import toast from "react-hot-toast";

interface Booking {
  id: number;
  member_id: string;
  member_name: string;
  year_of_study: string;
  jumuiya_id: string;
  jumuiya_name: string | null;
  phone: string;
  activity_type: string;
  activity_name: string;
  activity_day: string | null;
  activity_time: string | null;
  fare: string;
  paid_amount: string;
  status: string;
  is_guest: boolean;
  guest_reg: string;

  created_at: string;
  updated_at: string;
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [payFilter, setPayFilter] = useState<"all" | "paid" | "partial" | "unpaid">("all");

  // Pagination (server-side)
  const [page, setPage] = useState(1);
  const [pageSize] = useState(100);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ totalBookings: 0, fullyPaid: 0, totalCollected: 0, totalExpected: 0 });

  // Book-on-behalf modal (CSA OS / chair)
  const { user } = useAuth();
  const userRoles = Array.isArray(user?.role)
    ? user.role.map((r: any) => String(r).toUpperCase())
    : user?.role ? [String(user.role).toUpperCase()] : [];
  const canBookForMember = userRoles.includes("OS") || userRoles.includes("CSA_CHAIR");

  const [showBookModal, setShowBookModal] = useState(false);
  const [paidActivities, setPaidActivities] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<number>(0);
  const [selectedActivityType, setSelectedActivityType] = useState<string>("weekly");
  const [memberQuery, setMemberQuery] = useState("");
  const [memberResults, setMemberResults] = useState<any[]>([]);
  const [memberSearching, setMemberSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [phoneOverride, setPhoneOverride] = useState("");
  const [yearOverride, setYearOverride] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Book mode: registered member vs guest (non-member, event-only)
  const [bookMode, setBookMode] = useState<"member" | "guest">("member");
  const [guestName, setGuestName] = useState("");
  const [guestReg, setGuestReg] = useState("");

  // Export status filter (OS picks what to export)
  const [exportStatus, setExportStatus] = useState("all");

  // Cash payment + cancel
  const [payForId, setPayForId] = useState<number | null>(null);
  const [cashAmount, setCashAmount] = useState("");
  const [submittingPay, setSubmittingPay] = useState(false);
  const [cancelForId, setCancelForId] = useState<number | null>(null);
  const [submittingCancel, setSubmittingCancel] = useState(false);

  useEffect(() => { load(); }, [page]);

  // Reset to the first page when the filters change
  useEffect(() => { setPage(1); }, [search, typeFilter, payFilter]);

  // Debounced member search inside the modal
  useEffect(() => {
    if (!showBookModal) return;
    if (memberQuery.trim().length < 2) { setMemberResults([]); return; }
    const t = setTimeout(async () => {
      setMemberSearching(true);
      try {
        const res = await bookingService.lookupMemberByRegNumber(memberQuery.trim());
        setMemberResults(res || []);
      } catch {
        setMemberResults([]);
      } finally {
        setMemberSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [memberQuery, showBookModal]);

  async function openBookModal() {
    setShowBookModal(true);
    setBookMode("member");
    setMemberQuery("");
    setSelectedMember(null);
    setGuestName("");
    setGuestReg("");
    setPhoneOverride("");
    setYearOverride("");
    try {
      const acts = await bookingService.getPaidActivities();
      setPaidActivities(acts || []);
      if (acts?.length) {
        setSelectedActivity(acts[0].id);
        setSelectedActivityType(acts[0].activity_type);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to load activities");
    }
  }

  function selectMember(m: any) {
    setSelectedMember(m);
    setPhoneOverride(m.phone || "");
    setYearOverride(String(m.year_of_study ?? ""));
    setMemberResults([]);
    setMemberQuery("");
  }

  async function handleCreateBooking() {
    const isGuestMode = bookMode === "guest";
    if (!selectedActivity) { toast.error("Select an activity first"); return; }
    if (isGuestMode) {
      if (!guestName.trim()) { toast.error("Enter the guest's full name"); return; }
    } else if (!selectedMember) {
      toast.error("Search and select a member first");
      return;
    }
    setSubmitting(true);
    try {
      await bookingService.createBookingForMember({
        activity_id: selectedActivity,
        activity_type: selectedActivityType,
        ...(isGuestMode ? { guest_name: guestName.trim(), guest_reg: guestReg.trim() } : { member_id: selectedMember.member_id }),
        phone: phoneOverride,
        year_of_study: yearOverride,
      });
      toast.success(isGuestMode
        ? `Guest "${guestName.trim()}" added to the activity (event only)`
        : `Booking created for ${(selectedMember.first_name + " " + selectedMember.last_name).trim()}`);
      setShowBookModal(false);
      setSelectedMember(null);
      setGuestName("");
      setGuestReg("");
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRecordCash() {
    if (payForId == null) return;
    const amount = Number(cashAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    setSubmittingPay(true);
    try {
      await bookingService.recordCashPayment(payForId, amount);
      toast.success("Cash payment recorded");
      setPayForId(null);
      setCashAmount("");
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to record payment");
    } finally {
      setSubmittingPay(false);
    }
  }

  async function handleCancelBooking() {
    if (cancelForId == null) return;
    setSubmittingCancel(true);
    try {
      await bookingService.cancelBooking(cancelForId);
      toast.success("Booking cancelled");
      setCancelForId(null);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to cancel booking");
    } finally {
      setSubmittingCancel(false);
    }
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingService.getBookings(page, pageSize);
      setBookings(res?.data || []);
      setTotal(res?.total ?? 0);
      if (res?.stats) setStats(res.stats);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Failed to load bookings";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    try {
      const blob = await bookingService.exportBookingsExcel(exportStatus);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "activity_bookings.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Exported ${exportStatus === "all" ? "all bookings" : exportStatus + " bookings"} to Excel`);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Export failed";
      setError(msg);
      toast.error(msg);
    }
  }

  const payStatus = (b: Booking): "paid" | "partial" | "unpaid" => {
    const paid = Number(b.paid_amount || 0);
    const fare = Number(b.fare || 0);
    if (paid >= fare) return "paid";
    if (paid > 0) return "partial";
    return "unpaid";
  };

  const filtered = bookings.filter((b) => {
    if (!search) {
      const termOk = true;
      if (!termOk) return false;
    } else if (!b.member_name?.toLowerCase().includes(search.toLowerCase())
      && !b.member_id?.toLowerCase().includes(search.toLowerCase())
      && !(b.jumuiya_name || "").toLowerCase().includes(search.toLowerCase())
      && !b.activity_name?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (typeFilter !== "all" && b.activity_type !== typeFilter) return false;
    if (b.status === "cancelled" && payFilter !== "all") return false;
    if (payFilter !== "all" && payStatus(b) !== payFilter) return false;
    return true;
  });

  // Group bookings by activity for better organization
  const groupedBookings = filtered.reduce((acc, booking) => {
    const key = `${booking.activity_type}:${booking.activity_name}`;
    if (!acc[key]) {
      acc[key] = {
        activity_type: booking.activity_type,
        activity_name: booking.activity_name,
        bookings: [] as any[]
      };
    }
    acc[key].bookings.push({
      id: booking.id,
      member_id: booking.member_id || "-",
      member_name: booking.member_name,
      year_of_study: booking.year_of_study || "-",
      jumuiya_id: booking.jumuiya_id || "-",
      jumuiya_name: booking.jumuiya_name || null,
      phone: booking.phone || "-",
      activity_type: booking.activity_type,
      activity_name: booking.activity_name,
      fare: booking.fare,
      paid_amount: booking.paid_amount,
      status: booking.status,
      is_guest: booking.is_guest,
      guest_reg: booking.guest_reg,
      created_at: booking.created_at
    });
    return acc;
  }, {} as Record<string, { activity_type: string; activity_name: string; bookings: any[] }>);

  const activityTypes = Array.from(new Set(bookings.map((b) => b.activity_type)));

  const totalBookings = stats.totalBookings;
  const totalCollected = Number(stats.totalCollected || 0);
  const totalExpected = Number(stats.totalExpected || 0);
  const outstanding = totalExpected - totalCollected;
  const fullyPaid = stats.fullyPaid;

  const paidBadge = (b: Booking) => {
    if (b.status === "cancelled") {
      return "bg-slate-100 text-slate-500 border-slate-200 font-medium";
    }
    const numPaid = Number(b.paid_amount || 0);
    const numFare = Number(b.fare || 0);
    if (numPaid === numFare) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold";
    } else if (numPaid > 0) {
      return "bg-amber-50 text-amber-700 border-amber-200 font-medium";
    }
    return "bg-rose-50 text-rose-600 border-rose-200 font-medium";
  };

  return (
    <div>
      <div className="mb-6 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-slate-800">Activity Bookings</h2>
          <p className="text-sm text-slate-500 mt-1">View all member bookings and payments for paid activities.</p>
        </div>
        <div className="flex w-full min-w-0 items-center gap-1.5 sm:w-auto sm:gap-3">
          {canBookForMember && (
            <button onClick={openBookModal} title="Book for Member" aria-label="Book for Member"
              className="flex min-w-0 flex-1 items-center justify-center gap-1 px-2 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors sm:flex-none sm:gap-2 sm:px-4 sm:text-sm">
              <UserPlus size={14} className="shrink-0" /> <span className="truncate"><span className="sm:hidden">Book</span><span className="hidden sm:inline">Book for Member</span></span>
            </button>
          )}
          <select
            value={exportStatus}
            onChange={(e) => setExportStatus(e.target.value)}
            aria-label="Export status"
            className="min-w-0 flex-1 border border-slate-200 rounded-xl px-2 py-2.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 sm:flex-none sm:px-3 sm:text-sm"
          >
            <option value="all">All statuses</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button onClick={handleExport}
            title="Export Excel" aria-label="Export Excel"
            className="flex min-w-0 flex-1 items-center justify-center gap-1 px-2 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors sm:flex-none sm:gap-2 sm:px-4 sm:text-sm">
            <Download size={14} className="shrink-0" /> <span className="truncate"><span className="sm:hidden">Export</span><span className="hidden sm:inline">Export Excel</span></span>
          </button>
          <button onClick={load}
            title="Refresh" aria-label="Refresh"
            className="flex min-w-0 flex-1 items-center justify-center gap-1 px-2 py-2 text-xs text-slate-500 hover:text-slate-700 transition-colors sm:flex-none sm:gap-2 sm:px-0 sm:py-0 sm:text-sm">
            <RefreshCw size={14} className="shrink-0" /> <span className="truncate">Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 shrink-0">
            <CalendarCheck2 size={18} />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800 leading-none">{totalBookings}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Total Bookings</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 shrink-0">
            <Wallet size={18} />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800 leading-none">KES {totalCollected.toLocaleString()}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Collected</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/30 shrink-0">
            <TrendingUp size={18} />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800 leading-none">KES {outstanding.toLocaleString()}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Outstanding</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-violet-500/30 shrink-0">
            <Users size={18} />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800 leading-none">{fullyPaid}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Fully Paid</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or activity..."
            className="w-full max-w-xs border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
        >
          <option value="all">All types</option>
          {activityTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
          {([["all", "All"], ["paid", "Paid"], ["partial", "Partial"], ["unpaid", "Unpaid"]] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setPayFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                payFilter === val ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <p className="text-slate-400 text-sm mb-2">No bookings yet.</p>
          <p className="text-slate-300 text-xs">Bookings will appear here when members book paid activities.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(groupedBookings).map(([key, group]) => (
            <div key={key} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-800 mb-1">{group.activity_name}</h3>
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Type:</span> {group.activity_type} |
                  <span className="font-medium ml-2">Fare @</span> KES {Number(group.bookings[0]?.fare || 0).toLocaleString()} |
                  <span className="font-medium ml-2">Total Bookings:</span> {group.bookings.length}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">#</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Member</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Registration</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Year of Study</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Jumuiya</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Phone No</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600">Paid Amount</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                      {canBookForMember && <th className="text-left px-4 py-3 font-semibold text-slate-600">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {group.bookings.map((booking: any, i: number) => (
                      <tr key={booking.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-400 font-mono text-xs">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{booking.member_name}</div>
                          {booking.status === "cancelled" && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wide">Cancelled</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {booking.is_guest ? (
                            <div className="space-y-0.5">
                              <span className="inline-block px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold uppercase tracking-wide">Guest</span>
                              {booking.guest_reg && <div className="text-xs font-mono text-slate-600">{booking.guest_reg}</div>}
                            </div>
                          ) : (
                            <span className="text-xs font-mono text-slate-600">{booking.member_id}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{booking.year_of_study}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{booking.is_guest ? "—" : (booking.jumuiya_name || booking.jumuiya_id)}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{booking.phone}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold">
                          <span className={`inline-block px-2 py-1 rounded-lg border text-xs ${paidBadge(booking)}`}>
                            KES {Number(booking.paid_amount).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {new Date(booking.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        {canBookForMember && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => { setPayForId(booking.id); setCashAmount(""); }}
                                disabled={booking.status === "cancelled" || booking.status === "paid"}
                                title={booking.status === "paid" ? "Already fully paid" : booking.status === "cancelled" ? "Cancelled" : "Record cash payment"}
                                className="p-1.5 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Wallet size={14} />
                              </button>
                              <button
                                onClick={() => setCancelForId(booking.id)}
                                disabled={booking.status === "cancelled"}
                                title={booking.status === "cancelled" ? "Already cancelled" : "Cancel booking"}
                                className="p-1.5 rounded-lg text-rose-500 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between px-1 py-2">
            <div className="text-xs text-slate-400">
              Showing {filtered.length} on page {page} of {total} total bookings
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1 || loading}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              <span className="text-xs text-slate-500 font-medium">
                {page} / {Math.max(Math.ceil(total / pageSize), 1)}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * pageSize >= total || loading}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book-for-Member modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowBookModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">Book Activity for Member</h3>
                <p className="text-xs text-slate-500">For members who approach you in person.</p>
              </div>
              <button onClick={() => setShowBookModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* 1. Activity */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Activity</label>
                <select
                  value={selectedActivity}
                  onChange={(e) => {
                    const act = paidActivities.find((a) => a.id === Number(e.target.value));
                    setSelectedActivity(Number(e.target.value));
                    if (act) setSelectedActivityType(act.activity_type);
                  }}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                >
                  {paidActivities.length === 0 && <option value={0}>No paid activities available</option>}
                  {paidActivities.map((a) => (
                    <option key={`${a.activity_type}-${a.id}`} value={a.id}>
                      {a.name} — KES {Number(a.fare).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Who is this for? */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Person</label>
                <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                  {([["member", "Registered member"], ["guest", "Guest (not in system)"]] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setBookMode(val)}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        bookMode === val ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  {bookMode === "member"
                    ? "The person is a CSA member — their details are pulled from the system."
                    : "The person is NOT a CSA member — they are added to this event only and will NOT become a member."}
                </p>
              </div>

              {bookMode === "member" ? (
                <>
                  {/* 3. Member search */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Member (search by reg number or name)</label>
                    <div className="relative">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={memberQuery}
                        onChange={(e) => { setMemberQuery(e.target.value); if (selectedMember) setSelectedMember(null); }}
                        placeholder="Type at least 2 characters..."
                        className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      />
                    </div>
                    {memberSearching && <p className="text-xs text-slate-400 mt-1.5">Searching…</p>}
                    {memberResults.length > 0 && (
                      <div className="mt-2 border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-44 overflow-y-auto">
                        {memberResults.map((m) => (
                          <button
                            key={m.member_id}
                            onClick={() => selectMember(m)}
                            className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-800">
                                {m.first_name} {m.last_name}
                              </span>
                              <span className="text-xs font-mono text-slate-500">{m.member_id}</span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {m.jumuiya_name || "No jumuiya"}
                              {m.year_of_study ? ` · Year ${m.year_of_study}` : ""}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4. Selected member */}
                  {selectedMember && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {selectedMember.first_name} {selectedMember.last_name}
                          </p>
                          <p className="text-xs font-mono text-slate-500 mt-0.5">{selectedMember.member_id}</p>
                        </div>
                        <span className="text-xs font-semibold text-blue-700 bg-white border border-blue-200 rounded-full px-2.5 py-1">
                          {selectedMember.jumuiya_name || "No jumuiya"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Phone</label>
                          <input
                            value={phoneOverride}
                            onChange={(e) => setPhoneOverride(e.target.value)}
                            placeholder={selectedMember.phone || "No phone on record"}
                            className="w-full border border-blue-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Year of Study</label>
                          <input
                            value={yearOverride}
                            onChange={(e) => setYearOverride(e.target.value)}
                            placeholder="e.g. 2"
                            className="w-full border border-blue-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Guest details (event-only, never creates a member record) */
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Full name *</label>
                    <input
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Jane Wanjiru"
                      className="w-full border border-violet-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Registration number (optional)</label>
                    <input
                      value={guestReg}
                      onChange={(e) => setGuestReg(e.target.value)}
                      placeholder="e.g. CS-12345"
                      className="w-full border border-violet-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Phone (optional)</label>
                      <input
                        value={phoneOverride}
                        onChange={(e) => setPhoneOverride(e.target.value)}
                        placeholder="e.g. 0712 345 678"
                        className="w-full border border-violet-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Year of Study (optional)</label>
                      <input
                        value={yearOverride}
                        onChange={(e) => setYearOverride(e.target.value)}
                        placeholder="e.g. 2"
                        className="w-full border border-violet-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Submit */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBooking}
                  disabled={submitting || !selectedActivity || (bookMode === "member" ? !selectedMember : !guestName.trim())}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserPlus size={15} /> {submitting ? "Booking…" : "Create Booking"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cash payment modal */}
      {payForId != null && (() => {
        const b = bookings.find((x) => x.id === payForId);
        if (!b) return null;
        const paid = Number(b.paid_amount || 0);
        const fare = Number(b.fare || 0);
        const remaining = Math.max(fare - paid, 0);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setPayForId(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Record Cash Payment</h3>
                  <p className="text-xs text-slate-500">Cash paid directly for {b.member_name}.</p>
                </div>
                <button onClick={() => setPayForId(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 rounded-xl p-3 text-sm space-y-1">
                  <div className="flex justify-between text-slate-600"><span>Booking</span><span className="font-semibold text-slate-800">#{b.id} · {b.activity_name}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Fare</span><span className="font-semibold text-slate-800">KES {fare.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Paid so far</span><span className="font-semibold text-emerald-600">KES {paid.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Remaining</span><span className="font-semibold text-amber-600">KES {remaining.toLocaleString()}</span></div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cash amount (KES)</label>
                  <input
                    type="number"
                    min={1}
                    max={remaining}
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="e.g. 200"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                  <button onClick={() => setPayForId(null)} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">Close</button>
                  <button
                    onClick={handleRecordCash}
                    disabled={submittingPay || !Number(cashAmount) || Number(cashAmount) > remaining}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Coins size={15} /> {submittingPay ? "Recording…" : "Record Payment"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Cancel confirmation modal */}
      {cancelForId != null && (() => {
        const b = bookings.find((x) => x.id === cancelForId);
        if (!b) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setCancelForId(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800">Cancel Booking</h3>
                <button onClick={() => setCancelForId(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-slate-600">
                  Cancel this booking for <span className="font-semibold text-slate-800">{b.member_name}</span> on{" "}
                  <span className="font-semibold text-slate-800">{b.activity_name}</span>? They won't be counted for the event.
                </p>
                <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
                  <button onClick={() => setCancelForId(null)} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">Keep</button>
                  <button
                    onClick={handleCancelBooking}
                    disabled={submittingCancel}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Ban size={15} /> {submittingCancel ? "Cancelling…" : "Yes, Cancel"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
