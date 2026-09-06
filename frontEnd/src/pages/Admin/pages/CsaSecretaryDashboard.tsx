import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import { memberService } from "../../../api/jumuiyaMemberService";
import { semesterServices } from "../../../api/semesterServices";
import { serialConfigService, SerialConfig } from "../../../api/serialConfigService";
import { semNumFromConfig, semColForYearSem } from "../../../utils/semester";
import { Users, Search, RefreshCw, Download, Church, GraduationCap, Calendar, X, Check, UserPlus, Loader2, BarChart3, List, Clock, DollarSign, Hash, Settings2, History } from "lucide-react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import AnalyticsDashboard from "./AnalyticsDashboard";

const JUMUIYAS = [
  { id: "st-anthony", name: "St. Anthony", color: "#8b5cf6" },
  { id: "st-augustine", name: "St. Augustine", color: "#3b82f6" },
  { id: "st-catherine", name: "St. Catherine", color: "#800000" },
  { id: "st-dominic", name: "St. Dominic", color: "#979695ff" },
  { id: "st-elizabeth", name: "St. Elizabeth", color: "#07a414d1" },
  { id: "st-maria-goretti", name: "St. Maria Goretti", color: "#0ea5e9" },
  { id: "st-monica", name: "St. Monica", color: "#ef4444" },
];

const SEMESTERS = [
  { label: "1.1", dbCol: "sem_1_reg" },
  { label: "1.2", dbCol: "sem_2_reg" },
  { label: "2.1", dbCol: "sem_3_reg" },
  { label: "2.2", dbCol: "sem_4_reg" },
  { label: "3.1", dbCol: "sem_5_reg" },
  { label: "3.2", dbCol: "sem_6_reg" },
  { label: "4.1", dbCol: "sem_7_reg" },
  { label: "4.2", dbCol: "sem_8_reg" },
];

function getJumuiyaColor(slug: string): string {
  const j = JUMUIYAS.find(j => j.id === slug);
  return j ? j.color : "#6b7280";
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
  } catch { return d; }
}

function getYearSemLabel(m: any): string {
  for (let i = 8; i >= 1; i--) {
    const col = `sem_${i}_reg`;
    if (m[col]) {
      const sem = SEMESTERS[i - 1];
      return sem ? sem.label : "";
    }
  }
  return "—";
}

export default function CsaSecretaryDashboard() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string>("jumuiya_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filterJumuiya, setFilterJumuiya] = useState<string>("all");
  const [filterSemester, setFilterSemester] = useState<string>("all");
  const [showExport, setShowExport] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [regSearch, setRegSearch] = useState("");
  const [regResults, setRegResults] = useState<any[]>([]);
  const [regSearching, setRegSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [regJumuiya, setRegJumuiya] = useState("");
  const [regSemesters, setRegSemesters] = useState<string[]>([]);
  const [regSerialNo, setRegSerialNo] = useState("");
  const [regAmount, setRegAmount] = useState("");
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"members" | "analytics" | "pending" | "history">("members");

  const [histSearch, setHistSearch] = useState("");
  const [histJumuiya, setHistJumuiya] = useState("all");

  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [csaPaymentFilter, setCsaPaymentFilter] = useState<"pending" | "all">("pending");

  const [semester, setSemester] = useState<any>(null);
  const [serialConfig, setSerialConfig] = useState<SerialConfig | null>(null);
  const [serialSeed, setSerialSeed] = useState<string>("");
  const [serialSaving, setSerialSaving] = useState(false);

  useEffect(() => {
    semesterServices
      .getCurrent()
      .then((data) => setSemester(data || null))
      .catch(() => setSemester(null));
  }, []);

  useEffect(() => {
    serialConfigService.get()
      .then((res) => {
        if (res?.data) {
          setSerialConfig(res.data);
          setSerialSeed(String(res.data.next_serial));
        }
      })
      .catch(() => {});
  }, []);

  const semNum: 1 | 2 = semNumFromConfig(semester);

  const EXPORT_COLUMNS = [
    { key: "row_no", label: "No" },
    { key: "serial_no", label: "Serial No" },
    { key: "reg_number", label: "Reg Number" },
    { key: "name", label: "Name" },
    { key: "jumuiya_name", label: "Jumuiya" },
    { key: "course", label: "Course" },
    { key: "year_sem", label: "Year.Sem" },
    { key: "registration_date", label: "Registration Date" },
    { key: "sem_1_reg", label: "1.1" },
    { key: "sem_2_reg", label: "1.2" },
    { key: "sem_3_reg", label: "2.1" },
    { key: "sem_4_reg", label: "2.2" },
    { key: "sem_5_reg", label: "3.1" },
    { key: "sem_6_reg", label: "3.2" },
    { key: "sem_7_reg", label: "4.1" },
    { key: "sem_8_reg", label: "4.2" },
  ];

  const filterSemDbCol = useMemo(() => {
    if (filterSemester === "all" || filterSemester === "current") return null;
    return SEMESTERS.find(s => s.label === filterSemester)?.dbCol ?? null;
  }, [filterSemester]);

  const availableColumns = useMemo(() => {
    return EXPORT_COLUMNS.filter(c => {
      if (c.key === "jumuiya_name" && filterJumuiya !== "all") return false;
      if (filterSemDbCol && c.key === filterSemDbCol) return false;
      return true;
    });
  }, [filterJumuiya, filterSemDbCol]);

  const [selectedCols, setSelectedCols] = useState<string[]>([]);

  useEffect(() => {
    setSelectedCols(availableColumns.map(c => c.key));
  }, [availableColumns]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await memberService.getAllRegisteredMembers();
      setMembers(res.data || []);
    } catch (err) {
      console.error("Failed to fetch registered members", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingPayments = useCallback(async (status?: string) => {
    setLoadingPending(true);
    try {
      const res = await memberService.getPendingPayments({ status: status || csaPaymentFilter } as any);
      setPendingPayments(res.data || []);
    } catch { setPendingPayments([]); }
    setLoadingPending(false);
  }, [csaPaymentFilter]);

  useEffect(() => {
    fetchData();
    const handleUpdated = () => fetchData();
    window.addEventListener("csa_members_updated", handleUpdated);
    return () => window.removeEventListener("csa_members_updated", handleUpdated);
  }, [fetchData]);
  useEffect(() => { fetchPendingPayments(); }, [fetchPendingPayments]);

  const jumuiyaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    members.forEach(m => {
      const slug = m.jumuiya_slug || "unknown";
      counts[slug] = (counts[slug] || 0) + 1;
    });
    return counts;
  }, [members]);

  const filtered = useMemo(() => {
    let result = [...members];
    if (filterJumuiya !== "all") {
      result = result.filter(m => (m.jumuiya_slug || m.jumuiya_id) === filterJumuiya);
    }
    if (filterSemester === "current") {
      result = result.filter(m => {
        const col = semColForYearSem(m.year_of_study, semNum);
        return col && (m[col] === true || m[col] === "true" || m[col] === 1 || m[col] === "1");
      });
    } else if (filterSemester !== "all") {
      const sem = SEMESTERS.find(s => s.label === filterSemester);
      if (sem) result = result.filter(m => m[sem.dbCol] === true || m[sem.dbCol] === "true" || m[sem.dbCol] === 1 || m[sem.dbCol] === "1");
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(m =>
        (m.first_name || "").toLowerCase().includes(q) ||
        (m.last_name || "").toLowerCase().includes(q) ||
        (m.reg_number || "").toLowerCase().includes(q) ||
        (m.course || "").toLowerCase().includes(q) ||
        (m.jumuiya_name || "").toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      const aVal = (a[sortKey] || "").toString().toLowerCase();
      const bVal = (b[sortKey] || "").toString().toLowerCase();
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return result;
  }, [members, search, sortKey, sortDir, filterJumuiya, filterSemester, semNum]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const doExport = useCallback(() => {
    const colMeta = EXPORT_COLUMNS.filter(c => selectedCols.includes(c.key));
    const data = filtered.map(m => {
      const fullName = `${m.first_name || ""} ${m.last_name || ""}`.trim();
      const row: Record<string, any> = {};
      colMeta.forEach(c => {
        if (c.key.startsWith("sem_")) {
          row[c.label] = m[c.key] ? "Yes" : "";
        } else if (c.key === "registration_date") {
          row[c.label] = formatDate(m[c.key]);
        } else if (c.key === "name") {
          row[c.label] = fullName;
        } else if (c.key === "year_sem") {
          row[c.label] = getYearSemLabel(m);
        } else if (c.key === "course") {
          row[c.label] = m.course || "—";
        } else if (c.key === "serial_no") {
          row[c.label] = m.serial_no ?? "—";
        } else if (c.key === "row_no") {
          row[c.label] = m.row_no ?? "—";
        } else {
          row[c.label] = m[c.key] ?? "—";
        }
      });
      return row;
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = colMeta.map(c => ({
      wch: c.key === "name" || c.key === "jumuiya_name" || c.key === "course" ? 30
        : c.key === "reg_number" || c.key === "serial_no" ? 18
        : c.key === "row_no" ? 8
        : c.key === "year_sem" ? 12
        : c.key === "registration_date" ? 16
        : 10,
    }));
    XLSX.utils.book_append_sheet(wb, ws, "Registered Members");
    XLSX.writeFile(wb, "csa-registered-members.xlsx");
    setShowExport(false);
  }, [filtered, selectedCols]);

  const searchMember = async (q: string) => {
    setRegSearch(q);
    if (q.trim().length < 2) { setRegResults([]); return; }
    setRegSearching(true);
    try {
      const res = await memberService.lookupMemberByRegNumber(q.trim());
      setRegResults(res.data || []);
    } catch { setRegResults([]); }
    setRegSearching(false);
  };

  const toggleSem = (col: string) => {
    setRegSemesters(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  const submitRegistration = async () => {
    if (!selectedMember || !regJumuiya) return;
    setRegSubmitting(true);
    try {
      const newSemCount = regSemesters.filter(s => !selectedMember[s]).length;
      await memberService.manualRegisterMember({
        member_id: selectedMember.member_id,
        jumuiya_id: regJumuiya,
        semesters: regSemesters,
        serial_no: regSerialNo ? parseInt(regSerialNo) : undefined,
        amount: newSemCount * 50,
      });
      toast.success(`${selectedMember.first_name} registered successfully`);
      setShowRegister(false);
      resetRegisterForm();
      fetchData();
      window.dispatchEvent(new CustomEvent("csa_members_updated"));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Registration failed");
    }
    setRegSubmitting(false);
  };

  const resetRegisterForm = () => {
    setRegSearch("");
    setRegResults([]);
    setSelectedMember(null);
    setRegJumuiya("");
    setRegSemesters([]);
    setRegSerialNo("");
    setRegAmount("");
  };

  // Auto-calculate display amount based on selected semesters (50 KES each)
  useEffect(() => {
    const uniqCount = selectedMember
      ? regSemesters.filter(s => !selectedMember[s]).length
      : 0;
    setRegAmount(String(uniqCount * 50));
  }, [regSemesters, selectedMember]);

  const shouldGroup = filterSemester !== "all";

  const histFiltered = useMemo(() => {
    let result = members;
    if (histJumuiya !== "all") {
      result = result.filter(m => (m.jumuiya_slug || m.jumuiya_id) === histJumuiya);
    }
    if (!histSearch.trim()) return result;
    const q = histSearch.toLowerCase();
    return result.filter(m =>
      `${m.first_name || ""} ${m.last_name || ""}`.toLowerCase().includes(q) ||
      (m.reg_number || "").toLowerCase().includes(q) ||
      (m.course || "").toLowerCase().includes(q) ||
      (m.jumuiya_name || "").toLowerCase().includes(q)
    );
  }, [members, histSearch, histJumuiya]);

  const renderHistRow = (m: any, i: number) => (
    <tr key={m.registration_id || `h${i}`} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="px-3 py-2.5 text-xs font-mono text-slate-400">{m.row_no ?? "—"}</td>
      <td className="px-3 py-2.5 text-xs font-mono text-slate-500">{m.serial_no ?? "—"}</td>
      <td className="px-3 py-2.5 font-medium text-slate-800 whitespace-nowrap">{`${m.first_name || ""} ${m.last_name || ""}`.trim()}</td>
      <td className="px-3 py-2.5">
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
          style={{
            backgroundColor: getJumuiyaColor(m.jumuiya_slug || m.jumuiya_id) + "18",
            color: getJumuiyaColor(m.jumuiya_slug || m.jumuiya_id),
          }}
        >
          {m.jumuiya_name || "—"}
        </span>
      </td>
      <td className="px-3 py-2.5">
        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
          {getYearSemLabel(m)}
        </span>
      </td>
      <td className="px-3 py-2.5 text-slate-500 text-xs whitespace-nowrap">{formatDate(m.registration_date)}</td>
      {SEMESTERS.map(s => {
        const regd = m[s.dbCol] === true || m[s.dbCol] === "true" || m[s.dbCol] === 1 || m[s.dbCol] === "1";
        return (
          <td key={s.dbCol} className="px-1.5 py-2.5 text-center">
            {regd ? (
              <span className="inline-flex w-6 h-6 rounded-md bg-emerald-50 border border-emerald-200 items-center justify-center" title={`Registered ${s.label}`}>
                <Check size={14} className="text-emerald-600" strokeWidth={3} />
              </span>
            ) : (
              <span className="inline-block w-6 h-6 rounded-md bg-slate-50 border border-slate-100"></span>
            )}
          </td>
        );
      })}
    </tr>
  );

  const currentYear = new Date().getFullYear();

  const groupedData = useMemo(() => {
    if (!shouldGroup) return [];
    const groups: Record<string, any[]> = {};
    filtered.forEach(m => {
      const yos = m.year_of_study;
      if (yos && parseInt(yos) >= 1 && parseInt(yos) <= 4) {
        if (!groups[yos]) groups[yos] = [];
        groups[yos].push(m);
      }
    });
    return Object.entries(groups)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([yos, members]) => ({
        yearLevel: parseInt(yos),
        admissionYear: currentYear - parseInt(yos) + 1,
        members,
      }));
  }, [filtered, shouldGroup]);

  const renderRow = (m: any, i: number) => (
    <tr key={m.registration_id || `r${i}`} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3 text-xs font-mono text-slate-400">{m.row_no ?? "—"}</td>
      <td className="px-4 py-3 text-xs font-mono text-slate-500">{m.serial_no ?? "—"}</td>
      <td className="px-4 py-3 font-medium text-slate-800">{`${m.first_name || ""} ${m.last_name || ""}`.trim()}</td>
      <td className="px-4 py-3">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: getJumuiyaColor(m.jumuiya_slug || m.jumuiya_id) + "18",
            color: getJumuiyaColor(m.jumuiya_slug || m.jumuiya_id),
          }}
        >
          <Church size={12} />
          {m.jumuiya_name || "—"}
        </span>
      </td>
      <td className="px-4 py-3 text-slate-600 text-sm">{m.course || "—"}</td>
      <td className="px-4 py-3">
        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
          {getYearSemLabel(m)}
        </span>
      </td>
      <td className="px-4 py-3 text-slate-500 text-xs">
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="text-slate-400" />
          {formatDate(m.registration_date)}
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Tab Navigation */}
      <div className="grid w-full grid-cols-4 gap-1 bg-slate-100 rounded-xl p-1 sm:flex sm:w-fit sm:gap-2">
        <button
          onClick={() => setActiveTab("members")}
          title="Members"
          className={`flex min-w-0 items-center justify-center gap-1 px-1 py-2 rounded-lg text-[10px] font-semibold transition-all sm:gap-2 sm:px-4 sm:text-sm ${
            activeTab === "members"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <List size={16} className="shrink-0" /> <span className="truncate">Members</span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          title="Registration History"
          className={`flex min-w-0 items-center justify-center gap-1 px-1 py-2 rounded-lg text-[10px] font-semibold transition-all sm:gap-2 sm:px-4 sm:text-sm ${
            activeTab === "history"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <History size={16} className="shrink-0" /> <span className="truncate"><span className="sm:hidden">History</span><span className="hidden sm:inline">Registration History</span></span>
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          title="Reports & Analytics"
          className={`flex min-w-0 items-center justify-center gap-1 px-1 py-2 rounded-lg text-[10px] font-semibold transition-all sm:gap-2 sm:px-4 sm:text-sm ${
            activeTab === "analytics"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <BarChart3 size={16} className="shrink-0" /> <span className="truncate"><span className="sm:hidden">Reports</span><span className="hidden sm:inline">Reports & Analytics</span></span>
        </button>
        <button
          onClick={() => { setActiveTab("pending"); fetchPendingPayments(); }}
          title="Jumuiya Pending"
          className={`flex min-w-0 items-center justify-center gap-1 px-1 py-2 rounded-lg text-[10px] font-semibold transition-all sm:gap-2 sm:px-4 sm:text-sm ${
            activeTab === "pending"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Clock size={16} className="shrink-0" /> <span className="truncate"><span className="sm:hidden">Pending</span><span className="hidden sm:inline">Jumuiya Pending</span></span>
          {pendingPayments.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingPayments.length}</span>
          )}
        </button>
      </div>

      {activeTab === "analytics" ? (
        <AnalyticsDashboard />
      ) : activeTab === "history" ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Registration History</h2>
              <p className="text-xs text-slate-400 mt-0.5">Semester-by-semester registration record for every CSA member.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={histJumuiya}
                onChange={e => setHistJumuiya(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Jumuiyas</option>
                {JUMUIYAS.map(j => (
                  <option key={j.id} value={j.id}>{j.name}</option>
                ))}
              </select>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search member..."
                  value={histSearch}
                  onChange={e => setHistSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["No", "Serial No", "Name", "Jumuiya", "Year.Sem", "Registered"].map(label => (
                      <th key={label} className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{label}</th>
                    ))}
                    <th colSpan={8} className="px-2 py-2 text-center text-xs font-semibold text-indigo-500 uppercase tracking-wider border-l border-slate-200">
                      Semesters
                    </th>
                  </tr>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px]">
                    <th className="px-3"></th>
                    <th className="px-3"></th>
                    <th className="px-3"></th>
                    <th className="px-3"></th>
                    <th className="px-3"></th>
                    <th className="px-3"></th>
                    {SEMESTERS.map(s => (
                      <th key={s.dbCol} className="px-1.5 py-1.5 text-center font-bold text-slate-400 border-l border-slate-100 first:border-l-0">{s.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {histFiltered.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="px-4 py-12 text-center text-slate-400">
                        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No members found
                      </td>
                    </tr>
                  ) : (
                    histFiltered.map((m, i) => renderHistRow(m, i))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
              Showing {histFiltered.length} of {members.length} CSA members
            </div>
          </div>
        </>
      ) : activeTab === "pending" ? (
        <>
        <div className="flex min-w-0 items-center justify-between flex-wrap gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            <h2 className="text-lg font-bold text-slate-800">Jumuiya Payments</h2>
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
              <button onClick={() => { setCsaPaymentFilter("pending"); fetchPendingPayments("pending"); }}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${csaPaymentFilter === "pending" ? "bg-white text-slate-700 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                Pending {pendingPayments.filter(p => p.status === "pending").length > 0 && `(${pendingPayments.filter(p => p.status === "pending").length})`}
              </button>
              <button onClick={() => { setCsaPaymentFilter("all"); fetchPendingPayments("all"); }}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${csaPaymentFilter === "all" ? "bg-white text-slate-700 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                History
              </button>
            </div>
          </div>
          <button onClick={() => fetchPendingPayments()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
        {loadingPending ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-3 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : pendingPayments.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
            <Clock size={32} className="text-slate-200 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No pending payments from Jumuiya Secretaries</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Group by jumuiya */}
            {(() => {
              const groups: Record<string, any[]> = {};
              pendingPayments.forEach((p: any) => {
                const key = p.jumuiya_name || p.jumuiya_id || "Unknown";
                if (!groups[key]) groups[key] = [];
                groups[key].push(p);
              });
              return Object.entries(groups).map(([jumuiyaName, payments]) => (
                <div key={jumuiyaName} className="border-b border-slate-200 last:border-b-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200 sm:px-5">
                    <div className="flex min-w-0 items-center gap-2">
                      <Church size={15} className="text-slate-500" />
                      <h3 className="max-w-[12rem] truncate font-bold text-sm text-slate-700">{jumuiyaName}</h3>
                      <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded-full">{payments.length} pending</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-semibold">
                        Total: KES {payments.reduce((sum, p) => sum + (p.amount || 0), 0)}
                      </span>
                      {payments.some(p => p.status === "pending") && (
                        <button
                          onClick={async () => {
                            if (!confirm(`Settle all pending payments for ${jumuiyaName}?`)) return;
                            try {
                              await memberService.batchSettlePendingPayments({ jumuiya_id: payments[0].jumuiya_id });
                              toast.success(`Payments settled`);
                              fetchPendingPayments();
                            } catch (err: any) {
                              toast.error(err?.response?.data?.message || "Batch settle failed");
                            }
                          }}
                          className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          Settle All
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left py-2 px-4 font-semibold text-slate-500 text-xs uppercase">Member</th>
                          <th className="text-left py-2 px-4 font-semibold text-slate-500 text-xs uppercase">Amount</th>
                          <th className="text-left py-2 px-4 font-semibold text-slate-500 text-xs uppercase">Semesters</th>
                          <th className="text-left py-2 px-4 font-semibold text-slate-500 text-xs uppercase">Registered By</th>
                          <th className="text-left py-2 px-4 font-semibold text-slate-500 text-xs uppercase">Date</th>
                          <th className="text-left py-2 px-4 font-semibold text-slate-500 text-xs uppercase">Status</th>
                          <th className="text-left py-2 px-4 font-semibold text-slate-500 text-xs uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p: any) => (
                          <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="py-2.5 px-4 font-medium text-slate-700">{p.member_name}</td>
                            <td className="py-2.5 px-4 text-slate-600 font-semibold">KES {p.amount}</td>
                            <td className="py-2.5 px-4 text-slate-500">{(p.semester_labels || []).join(", ") || (p.semesters || []).join(", ")}</td>
                            <td className="py-2.5 px-4 text-slate-500">{p.registered_by_name || "—"}</td>
                            <td className="py-2.5 px-4 text-slate-500">{formatDate(p.created_at)}</td>
                            <td className="py-2.5 px-4">
                              {p.status === "paid" ? (
                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Paid</span>
                              ) : p.status === "cancelled" ? (
                                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Cancelled</span>
                              ) : (
                                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Pending</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4">
                              {p.status === "pending" ? (
                                <button
                                  onClick={async () => {
                                    try {
                                      await memberService.settlePendingPayment(p.id);
                                      toast.success(`${p.member_name} payment settled`);
                                      fetchPendingPayments();
                                    } catch (err: any) {
                                      toast.error(err?.response?.data?.message || "Settle failed");
                                    }
                                  }}
                                  className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors"
                                >
                                  <DollarSign size={12} /> Settle
                                </button>
                              ) : (
                                <span className="text-xs text-slate-300">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
        </>
      ) : (
        <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <button
          type="button"
          onClick={() => setFilterJumuiya("all")}
          aria-pressed={filterJumuiya === "all"}
          className={`text-left bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-3 text-white transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${
            filterJumuiya === "all" ? "ring-2 ring-blue-300 ring-offset-2" : "opacity-85"
          }`}
        >
          <p className="text-2xl font-bold">{members.length}</p>
          <p className="text-[10px] text-blue-100 font-medium mt-0.5">Total</p>
        </button>
        {JUMUIYAS.map(j => {
          const count = jumuiyaCounts[j.id] || 0;
          return (
            <button
              key={j.id}
              type="button"
              onClick={() => setFilterJumuiya(j.id)}
              aria-pressed={filterJumuiya === j.id}
              aria-label={`Show ${j.name} registered members`}
              className={`bg-white rounded-xl border p-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${
                filterJumuiya === j.id
                  ? "border-blue-400 ring-2 ring-blue-100 ring-offset-1"
                  : "border-slate-200"
              }`}
            >
              <p className="text-xl font-bold" style={{ color: j.color }}>{count}</p>
              <p className="text-[10px] text-slate-500 font-medium truncate">{j.name.replace("St. ", "")}</p>
            </button>
          );
        })}
      </div>

      {/* Serial Number Config */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-slate-600">
          <Hash size={16} />
          <span className="text-sm font-semibold">Auto-generate serial numbers from:</span>
        </div>
        <input
          type="number"
          value={serialSeed}
          onChange={(e) => setSerialSeed(e.target.value)}
          placeholder="e.g. 7250"
          className="w-32 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <button
          onClick={async () => {
            const val = parseInt(serialSeed, 10);
            if (!val || val < 1) {
              toast.error("Enter a valid positive number");
              return;
            }
            setSerialSaving(true);
            try {
              const res = await serialConfigService.update(val);
              setSerialConfig(res.data);
              toast.success(`Serial numbers will now auto-generate from ${val}`);
            } catch (err: any) {
              toast.error(err?.response?.data?.error || "Failed to update");
            } finally {
              setSerialSaving(false);
            }
          }}
          disabled={serialSaving}
          className="px-4 py-1.5 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
        >
          {serialSaving ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Settings2 size={13} />}
          {serialSaving ? "Saving..." : "Save"}
        </button>
        {serialConfig && (
          <span className="text-[11px] text-slate-400">
            Current: #{serialConfig.next_serial} &middot; Updated {formatDate(serialConfig.updated_at)}
          </span>
        )}
        <p className="w-full text-[11px] text-slate-400 -mt-2">
          New first-years get physical card serial numbers starting from this value. The "No" column is auto-counted. Existing members keep their physical card serial numbers.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex w-full items-center gap-3 sm:contents">
        <div className="relative min-w-0 flex-1 sm:order-1 sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        <button
          onClick={() => setShowRegister(true)}
          className="flex shrink-0 items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors sm:order-5"
        >
          <UserPlus size={16} /> Register Member
        </button>
        </div>
        <div className="flex w-full items-center gap-3 sm:contents">
        <select
          value={filterJumuiya}
          onChange={e => setFilterJumuiya(e.target.value)}
          className="min-w-0 flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:order-2 sm:flex-none"
        >
          <option value="all">All Jumuiyas</option>
          {JUMUIYAS.map(j => (
            <option key={j.id} value={j.id}>{j.name}</option>
          ))}
        </select>
        <select
          value={filterSemester}
          onChange={e => setFilterSemester(e.target.value)}
          className="min-w-0 flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:order-3 sm:flex-none"
        >
          <option value="all">All Semesters</option>
          <option value="current">Current Semester</option>
          <option disabled>──────────────</option>
          {SEMESTERS.map(s => (
            <option key={s.label} value={s.label}>{s.label}</option>
          ))}
        </select>
        </div>
        <div className="flex w-full items-center gap-3 sm:contents">
        <button
          onClick={() => setShowExport(true)}
          className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors sm:order-4 sm:flex-none"
        >
          <Download size={16} /> Export
        </button>
        <button
          onClick={fetchData}
          className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors sm:order-6 sm:flex-none"
        >
          <RefreshCw size={16} /> Refresh
        </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {[
                  { key: "row_no", label: "No" },
                  { key: "serial_no", label: "Serial No" },
                  { key: "name", label: "Name" },
                  { key: "jumuiya_name", label: "Jumuiya" },
                  { key: "course", label: "Course" },
                  { key: "year_sem", label: "Year.Sem" },
                  { key: "registration_date", label: "Registered" },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && (
                        <span className="text-blue-500">{sortDir === "asc" ? "▲" : "▼"}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No registered members found
                  </td>
                </tr>
              ) : shouldGroup ? (
                groupedData.map(group => (
                  <Fragment key={group.yearLevel}>
                    <tr className="bg-indigo-50/60 border-b border-indigo-100">
                      <td colSpan={6} className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-2">
                          <GraduationCap size={15} className="text-indigo-500" />
                          <span className="font-semibold text-sm text-slate-700">Year {group.yearLevel}</span>
                          <span className="text-xs text-slate-400">(admitted {group.admissionYear})</span>
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{group.members.length}</span>
                        </span>
                      </td>
                    </tr>
                    {group.members.map((m, i) => renderRow(m, i))}
                  </Fragment>
                ))
              ) : (
                filtered.map((m, i) => renderRow(m, i))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
          Showing {filtered.length} of {members.length} registered members
        </div>
      </div>

      {/* Export Column Picker Modal */}
      {showExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowExport(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Select Columns to Export</h3>
              <button onClick={() => setShowExport(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {availableColumns.map(c => (
                <label key={c.key} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                    selectedCols.includes(c.key) ? "bg-blue-600 border-blue-600" : "border-slate-300"
                  }`}>
                    {selectedCols.includes(c.key) && <Check size={14} className="text-white" />}
                  </div>
                  <span className="text-sm text-slate-700">{c.label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
              <button onClick={() => setSelectedCols(availableColumns.map(c => c.key))} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Select All</button>
              <button onClick={() => setSelectedCols([])} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Clear All</button>
              <button onClick={doExport} disabled={selectedCols.length === 0} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Export ({filtered.length} rows)</button>
            </div>
          </div>
        </div>
      )}

      {/* Register Member Modal */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setShowRegister(false); resetRegisterForm(); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {selectedMember ? "Confirm Registration" : "Search Member"}
              </h3>
              <button onClick={() => { setShowRegister(false); resetRegisterForm(); }} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {!selectedMember ? (
              <>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by reg number or name..."
                    value={regSearch}
                    onChange={e => searchMember(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  {regSearching && <span className="absolute right-3 top-1/2 w-4 h-4 -translate-y-1/2 border-2 border-blue-100 border-t-blue-500 rounded-full animate-spin" />}
                </div>
                {regResults.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {regResults.map((m: any) => (
                      <button
                        key={m.member_id}
                        onClick={() => {
                          setSelectedMember(m);
                          setRegJumuiya(m.jumuiya_id || "");
                          const alreadyRegd = SEMESTERS.filter(s => m[s.dbCol] === true).map(s => s.dbCol);
                          setRegSemesters(alreadyRegd);
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <p className="font-semibold text-slate-800 text-sm">{m.first_name} {m.last_name || ""}</p>
                        <p className="text-xs text-slate-500 font-mono">{m.member_id}</p>
                        {m.jumuiya_name && <p className="text-xs text-slate-400 mt-0.5">{m.jumuiya_name}</p>}
                      </button>
                    ))}
                  </div>
                ) : regSearch.trim().length >= 2 && !regSearching ? (
                  <p className="text-sm text-slate-400 text-center py-8">No unregistered members found</p>
                ) : null}
              </>
            ) : (
              <>
                <div className="bg-slate-50 rounded-xl p-4 mb-4">
                  <p className="font-bold text-slate-800">{selectedMember.first_name} {selectedMember.last_name || ""}</p>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">{selectedMember.member_id}</p>
                  {selectedMember.email && <p className="text-xs text-slate-400">{selectedMember.email}</p>}
                </div>

                {!selectedMember.jumuiya_id && (
                  <>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Assign Jumuiya</label>
                    <select
                      value={regJumuiya}
                      onChange={e => setRegJumuiya(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">Select Jumuiya</option>
                      {JUMUIYAS.map(j => (
                        <option key={j.id} value={j.id}>{j.name}</option>
                      ))}
                    </select>
                  </>
                )}

                <label className="block text-sm font-semibold text-slate-700 mb-2">Semesters to Register</label>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {SEMESTERS.map(s => {
                    const isExisting = selectedMember?.[s.dbCol] === true;
                    return (
                      <label
                        key={s.label}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition-colors ${
                          regSemesters.includes(s.dbCol)
                            ? isExisting
                              ? "bg-green-100 text-green-700 border-green-300 cursor-default"
                              : "bg-blue-600 text-white border-blue-600 cursor-pointer"
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 cursor-pointer"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={regSemesters.includes(s.dbCol)}
                          onChange={() => toggleSem(s.dbCol)}
                          disabled={isExisting}
                          className="sr-only"
                        />
                        {s.label}
                        {isExisting && <Check size={12} className="text-green-600" />}
                      </label>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mb-4 -mt-3">
                  Green = already registered. Check only the semesters you want to register now.
                </p>

                <label className="block text-sm font-semibold text-slate-700 mb-1">Serial No (from physical card)</label>
                <input
                  type="number"
                  value={regSerialNo}
                  onChange={e => setRegSerialNo(e.target.value)}
                  placeholder="Leave blank to auto-assign"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />

                <label className="block text-sm font-semibold text-slate-700 mb-1">Amount Paid (KES)</label>
                <input
                  type="text"
                  value={`KES ${regAmount}`}
                  readOnly
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm mb-4 bg-slate-50 text-slate-700 font-semibold"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => { setSelectedMember(null); setRegResults([]); }}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={submitRegistration}
                    disabled={!regJumuiya || regSubmitting}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {regSubmitting ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <UserPlus size={16} />}
                    {regSubmitting ? "Registering..." : "Register Member"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
