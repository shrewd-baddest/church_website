import { useState, useEffect } from "react";
import { memberService } from "../../../api/jumuiyaMemberService";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  TrendingUp, Users, Church, GraduationCap, CreditCard, Smartphone, Wallet,
  RefreshCw, Calendar, ArrowUpRight, CheckCircle2, Clock, XCircle,
  X, ChevronDown, Loader2, ExternalLink,
  Layers, GitCompare, Activity, Trophy
} from "lucide-react";
import toast from "react-hot-toast";
import CohortProgressionTab from "./CohortProgressionTab";
import CrossComparisonTab from "./CrossComparisonTab";
import JumuiyaProgressionTab from "./JumuiyaProgressionTab";
import YearlyContributionTab from "./YearlyContributionTab";

const JUMUIYA_COLORS: Record<string, string> = {
  "St. Anthony": "#8b5cf6",
  "St. Augustine": "#3b82f6",
  "St. Catherine": "#800000",
  "St. Dominic": "#979695ff",
  "St. Elizabeth": "#07a414d1",
  "St. Maria Goretti": "#0ea5e9",
  "St. Monica": "#ef4444",
};

const SEMESTER_LABELS = ["1.1", "1.2", "2.1", "2.2", "3.1", "3.2", "4.1", "4.2"];
const PIE_COLORS = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#8b5cf6", "#ef4444", "#22c55e", "#3b82f6", "#f97316", "#06b6d4"];
const STATUS_OPTIONS = ["pending", "success", "failed", "cancelled"];

function formatMonth(month: string): string {
  const [y, m] = month.split("-");
  const date = new Date(parseInt(y), parseInt(m) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return d; }
}

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  success: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle2 },
  pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: Clock },
  failed: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: XCircle },
  cancelled: { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200", icon: XCircle },
};

export default function AnalyticsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Payment modal state
  const [showPayments, setShowPayments] = useState(false);
  const [paymentsFilter, setPaymentsFilter] = useState<string>("pending");
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "cohort" | "cross" | "jumuiya" | "yearly">("overview");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await memberService.getAnalytics();
      setData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const displayData = data;

  const openPayments = async (status: string) => {
    setPaymentsFilter(status);
    setShowPayments(true);
    setPaymentsLoading(true);
    try {
      const res = await memberService.getPayments({ status });
      setPayments(res.data || []);
    } catch {
      setPayments([]);
    }
    setPaymentsLoading(false);
  };

  const updatePaymentStatus = async (paymentId: number, newStatus: string) => {
    setUpdatingId(paymentId);
    try {
      await memberService.updatePaymentStatus(paymentId, { status: newStatus });
      toast.success(`Payment #${paymentId} updated to ${newStatus}`);
      setPayments(prev => prev.filter(p => p.id !== paymentId));
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to update");
    }
    setUpdatingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500 text-sm">{error}</p>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  if (!displayData) return null;

  const { overview, registrationTrends, jumuiyaComparison, semesterFillRates, coursesBreakdown, yearBreakdown, genderBreakdown, recentRegistrations, paymentSummary } = displayData;

  const trendData = registrationTrends.map((t: any) => ({ month: formatMonth(t.month), count: t.count }));
  const jumuiyaData = jumuiyaComparison.map((j: any) => ({
    name: (j.jumuiya_name || "").replace("St. ", ""),
    fullName: j.jumuiya_name,
    count: j.count,
    color: j.jumuiya_color || "#6b7280",
  }));
  const semesterData = SEMESTER_LABELS.map((label, i) => ({ semester: label, count: semesterFillRates[`sem_${i + 1}`] || 0 }));
  const courseData = coursesBreakdown.map((c: any) => ({ name: c.course || "Unknown", value: c.count }));
  const yearData = yearBreakdown
    .filter((y: any) => y.year && !isNaN(parseInt(y.year)))
    .map((y: any) => {
      const admissionYear = parseInt(y.year);
      const currentYear = new Date().getFullYear();
      const yearNum = currentYear - admissionYear + 1;
      return { name: `Year ${yearNum}`, count: y.count };
    })
    .filter((y: any) => y.name !== "Year NaN")
    .sort((a: any, b: any) => a.name.localeCompare(b.name));
  const genderData = genderBreakdown.map((g: any) => ({
    name: g.gender?.charAt(0).toUpperCase() + g.gender?.slice(1).toLowerCase() || "Unknown",
    value: g.count,
  }));

  const paymentCards = [
    { key: "success", label: "Successful", count: paymentSummary.successful || 0, color: "emerald", icon: CheckCircle2 },
    { key: "pending", label: "Pending", count: paymentSummary.pending || 0, color: "amber", icon: Clock },
    { key: "failed", label: "Failed", count: paymentSummary.failed || 0, color: "red", icon: XCircle },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit overflow-x-auto">
        <button
          onClick={() => setActiveSubTab("overview")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
            activeSubTab === "overview"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Activity size={16} /> Overview
        </button>
        <button
          onClick={() => setActiveSubTab("cohort")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
            activeSubTab === "cohort"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Layers size={16} /> Cohort Progression
        </button>
        <button
          onClick={() => setActiveSubTab("cross")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
            activeSubTab === "cross"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <GitCompare size={16} /> Years Comparison
        </button>
        <button
          onClick={() => setActiveSubTab("jumuiya")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
            activeSubTab === "jumuiya"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Church size={16} /> Jumuiya Progression
        </button>
        <button
          onClick={() => setActiveSubTab("yearly")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
            activeSubTab === "yearly"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Trophy size={16} /> Yearly Contribution
        </button>
      </div>

      {activeSubTab === "cohort" ? (
        <CohortProgressionTab />
      ) : activeSubTab === "cross" ? (
        <CrossComparisonTab />
      ) : activeSubTab === "jumuiya" ? (
        <JumuiyaProgressionTab />
      ) : activeSubTab === "yearly" ? (
        <YearlyContributionTab />
      ) : (
      <>
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Users size={18} className="text-blue-200" />
            <span className="text-[11px] text-blue-200 font-medium">Total Registered</span>
          </div>
          <p className="text-3xl font-bold">{overview.totalRegistered}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Church size={18} className="text-purple-500" />
            <span className="text-[11px] text-slate-500 font-medium">Total Members</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">{overview.totalMembers}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-emerald-500" />
            <span className="text-[11px] text-slate-500 font-medium">Registration Rate</span>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{overview.registrationRate}%</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone size={16} className="text-emerald-200" />
            <span className="text-[11px] text-emerald-200 font-medium">M-Pesa</span>
          </div>
          <p className="text-2xl font-bold">KES {Number(paymentSummary.mpesa_success_amount || 0).toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={16} className="text-yellow-200" />
            <span className="text-[11px] text-yellow-200 font-medium">Manual (Cash)</span>
          </div>
          <p className="text-2xl font-bold">KES {Number(paymentSummary.manual_success_amount || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={18} className="text-amber-500" />
            <span className="text-[11px] text-slate-500 font-medium">Grand Total</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">KES {Number(paymentSummary.total_amount || 0).toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{paymentSummary.total_transactions || 0} transactions</p>
        </div>
      </div>

      {/* Payment Status Row — clickable */}
      <div className="grid grid-cols-3 gap-3">
        {paymentCards.map(card => {
          const styles = STATUS_STYLES[card.key] || STATUS_STYLES.pending;
          return (
            <button
              key={card.key}
              onClick={() => openPayments(card.key)}
              className={`${styles.bg} rounded-xl p-3 flex items-center gap-3 hover:ring-2 hover:ring-offset-1 hover:ring-blue-300 transition-all text-left group`}
            >
              <card.icon size={20} className={styles.text} />
              <div className="flex-1">
                <p className={`text-lg font-bold ${styles.text}`}>{card.count}</p>
                <p className={`text-[10px] ${styles.text} font-medium`}>{card.label}</p>
              </div>
              <ExternalLink size={14} className={`${styles.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
            </button>
          );
        })}
      </div>

      {/* Registration Trends + Jumuiya Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-blue-500" />
            <h3 className="text-sm font-bold text-slate-800">Registration Trends</h3>
          </div>
          {trendData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">No registration data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData} margin={{ bottom: 5, left: 10, right: 15, top: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#475569' }} stroke="#cbd5e1" />
                <YAxis tick={{ fontSize: 12, fill: '#334155' }} stroke="#cbd5e1" allowDecimals={false} width={40} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.15 / 10) * 10]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} labelStyle={{ fontWeight: 600 }} />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} name="Registrations" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Church size={18} className="text-purple-500" />
            <h3 className="text-sm font-bold text-slate-800">Jumuiya Comparison</h3>
          </div>
          {jumuiyaData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={jumuiyaData} margin={{ bottom: 35, left: 10, right: 15, top: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} stroke="#cbd5e1" angle={-40} textAnchor="end" interval={0} height={75} />
                <YAxis tick={{ fontSize: 12, fill: '#334155' }} stroke="#cbd5e1" allowDecimals={false} width={40} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.15 / 10) * 10]} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(value: number, _: string, props: any) => [`${value} members`, props.payload.fullName]}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Members" barSize={42} label={{ position: 'top', fontSize: 11, fontWeight: 600, fill: '#475569' }}>
                  {jumuiyaData.map((entry: any, index: number) => <Cell key={index} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Semester Fill Rates + Gender + Year */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-amber-500" />
            <h3 className="text-sm font-bold text-slate-800">Semester Fill Rates</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={semesterData} margin={{ bottom: 5, left: 10, right: 15, top: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="semester" tick={{ fontSize: 12, fill: '#475569' }} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 12, fill: '#334155' }} stroke="#cbd5e1" allowDecimals={false} width={40} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.15 / 10) * 10]} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Members" barSize={28} label={{ position: 'top', fontSize: 11, fontWeight: 600, fill: '#475569' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-pink-500" />
            <h3 className="text-sm font-bold text-slate-800">Gender Breakdown</h3>
          </div>
          {genderData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {genderData.map((_: any, index: number) => <Cell key={index} fill={["#6366f1", "#ec4899", "#94a3b8"][index] || "#94a3b8"} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap size={18} className="text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800">Year of Study</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={yearData} margin={{ bottom: 5, left: 10, right: 15, top: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 12, fill: '#334155' }} stroke="#cbd5e1" allowDecimals={false} width={40} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.15 / 10) * 10]} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Members" barSize={28} label={{ position: 'top', fontSize: 11, fontWeight: 600, fill: '#475569' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Course Breakdown + Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap size={18} className="text-teal-500" />
            <h3 className="text-sm font-bold text-slate-800">Top Courses</h3>
          </div>
          {courseData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">No data</p>
          ) : (
            <div className="space-y-2">
              {courseData.map((c: any, i: number) => {
                const maxVal = courseData[0]?.value || 1;
                const pct = Math.round((c.value / maxVal) * 100);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-24 truncate font-mono">{c.name}</span>
                    <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 w-8 text-right">{c.value}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpRight size={18} className="text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-800">Recent Registrations</h3>
          </div>
          {recentRegistrations.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">No registrations yet</p>
          ) : (
            <div className="space-y-2">
              {recentRegistrations.map((r: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                    {r.first_name?.[0]}{r.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{r.first_name} {r.last_name || ""}</p>
                    <p className="text-[10px] text-slate-400">{r.jumuiya_name || "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">
                      {r.registration_date ? new Date(r.registration_date).toLocaleDateString("en-KE", { month: "short", day: "numeric" }) : "—"}
                    </p>
                    {r.serial_no && <p className="text-[10px] font-mono text-slate-400">#{r.serial_no}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Payment Status Modal ── */}
      {showPayments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowPayments(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">Manage Payments</h3>
                <p className="text-xs text-slate-400 mt-0.5">Showing {paymentsFilter} payments — click a status to change it</p>
              </div>
              <button onClick={() => setShowPayments(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X size={20} className="text-slate-400" /></button>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-1 px-5 pt-3 pb-2">
              {STATUS_OPTIONS.map(s => {
                const st = STATUS_STYLES[s];
                return (
                  <button
                    key={s}
                    onClick={() => { setPaymentsFilter(s); setPaymentsLoading(true); memberService.getPayments({ status: s }).then(r => { setPayments(r.data || []); setPaymentsLoading(false); }).catch(() => setPaymentsLoading(false)); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      paymentsFilter === s ? `${st.bg} ${st.text} ring-1 ring-offset-1 ${st.border}` : "text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                );
              })}
            </div>

            {/* Payments List */}
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              {paymentsLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
              ) : payments.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-12">No {paymentsFilter} payments</p>
              ) : (
                <div className="space-y-2 mt-2">
                  {payments.map(p => {
                    const targetStatuses = STATUS_OPTIONS.filter(s => s !== paymentsFilter);
                    return (
                      <div key={p.id} className="border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800">KES {Number(p.amount).toLocaleString()}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status]?.bg} ${STATUS_STYLES[p.status]?.text}`}>
                            {p.status}
                          </span>
                        </div>
                        {p.first_name ? (
                          <p className="text-xs font-semibold text-slate-700 mt-1">{p.first_name} {p.last_name || ""}</p>
                        ) : (
                          <p className="text-xs text-slate-400 italic mt-1">Unknown member</p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          {p.reg_number && <span className="text-[10px] font-mono text-slate-400">{p.reg_number}</span>}
                          {p.jumuiya_name && <span className="text-[10px] text-slate-400">· {p.jumuiya_name}</span>}
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{p.phone || "No phone"}</p>
                        {p.mpesa_receipt && <p className="text-[10px] text-slate-400 font-mono">Receipt: {p.mpesa_receipt}</p>}
                        <p className="text-[10px] text-slate-400">{formatDate(p.created_at)}</p>
                      </div>
                        <div className="flex flex-col gap-1">
                          {targetStatuses.map(ts => {
                            const tsStyle = STATUS_STYLES[ts];
                            return (
                              <button
                                key={ts}
                                disabled={updatingId === p.id}
                                onClick={() => updatePaymentStatus(p.id, ts)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${tsStyle.bg} ${tsStyle.text} hover:ring-1 hover:ring-offset-1 ${tsStyle.border} transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1`}
                              >
                                {updatingId === p.id ? <Loader2 size={10} className="animate-spin" /> : null}
                                → {ts.charAt(0).toUpperCase() + ts.slice(1)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
