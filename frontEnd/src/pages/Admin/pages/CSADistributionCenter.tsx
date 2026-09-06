import { useState, useEffect, useRef, useCallback } from "react";
import { memberService } from "../../../api/jumuiyaMemberService";
import { getYearOfStudy, genderCode, isMale, isFemale } from "../../../utils/memberYear";
import {
  Upload, Plus, Trash2, FileSpreadsheet, CheckCircle,
  AlertTriangle, Users, BarChart3, RefreshCw, X, GitMerge, Filter, Send, ThumbsUp, ThumbsDown, Edit2, Save, QrCode,
} from "lucide-react";
import * as XLSX from "xlsx";
import QRCode from "qrcode";

const JUMUIYAS = [
  { id: "st-anthony", name: "St. Anthony", color: "#8b5cf6" },
  { id: "st-augustine", name: "St. Augustine", color: "#3b82f6" },
  { id: "st-catherine", name: "St. Catherine", color: "#800000" },
  { id: "st-dominic", name: "St. Dominic", color: "#979695ff" },
  { id: "st-elizabeth", name: "St. Elizabeth", color: "#07a414d1" },
  { id: "st-maria-goretti", name: "St. Maria Goretti", color: "#0ea5e9" },
  { id: "st-monica", name: "St. Monica", color: "#ef4444" },
];

// Short-name mapping used in allocation_approvals.target_jumuiya
const SLUG_FROM_SHORT_NAME: Record<string, string> = {
  "St. Anthony": "st-anthony",
  "St. Augustine": "st-augustine",
  "St. Catherine": "st-catherine",
  "St. Dominic": "st-dominic",
  "St. Elizabeth": "st-elizabeth",
  "St. Maria Goretti": "st-maria-goretti",
  "St. Monica": "st-monica",
};

const TEMPLATE_HEADERS = ["Name", "RegistrationNumber", "Gender", "Course", "Phone", "Email"];
const emptyRow = { name: "", regNumber: "", gender: "", course: "", jumuiya: "", phone: "", email: "" };

const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
};

const normalizeHeader = (h: string): string =>
  h.replace(/[\s_-]+/g, "").toLowerCase();

const KNOWN_HEADERS: Record<string, string> = {
  name: "name",
  fullname: "name",
  names: "name",
  registrationnumber: "regNumber",
    regno: "regNumber",
    registration: "regNumber",
  gender: "gender",
  sex: "gender",
  course: "course",
  program: "course",
  degree: "course",
  "programme": "course",
  phone: "phone",
  telephone: "phone",
  mobile: "phone",
  phonenumber: "phone",
  contact: "phone",
  email: "email",
  emailaddress: "email",
  mail: "email",
  "e-mail": "email",
};

const mapRow = (obj: Record<string, string>) => {
  const row: Record<string, string> = {};
  for (const key of Object.keys(obj)) {
    const norm = normalizeHeader(key);
    const mapped = KNOWN_HEADERS[norm];
    if (mapped && !row[mapped]) row[mapped] = obj[key] || "";
  }
  return {
    name: row.name || "",
    regNumber: row.regNumber || "",
    gender: row.gender || "",
    course: row.course || "",
    phone: row.phone || "",
    email: row.email || "",
  };
};

const currentYear = new Date().getFullYear();
const ACADEMIC_YEARS = Array.from({ length: 10 }, (_, i) => {
  const start = currentYear - 7 + i;
  return `${start}-${start + 1}`;
}).filter(y => {
  const s = parseInt(y.split("-")[0]);
  return s >= 2018 && s <= currentYear + 1;
});

export default function CSADistributionCenter() {
  const [mode, setMode] = useState<"manual" | "upload">("manual");
  const [members, setMembers] = useState<any[]>([{ ...emptyRow }]);
  const [memberErrors, setMemberErrors] = useState<Record<number, string[]>>({});
  const [validated, setValidated] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [importYear, setImportYear] = useState(ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1] || "");

  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
  const [jumuiyaStats, setJumuiyaStats] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [filterYear, setFilterYear] = useState("");
  const [filterGender, setFilterGender] = useState("");

  const [preview, setPreview] = useState<any>(null);
  const [distributing, setDistributing] = useState(false);
  const [distributionDone, setDistributionDone] = useState(false);

  // Balance mode: "membership" levels against the full jumuiya membership,
  // "equal" (equal-split) spreads the new intake evenly ignoring seniors.
  const [strategy, setStrategy] = useState<"membership" | "equal">("equal");
  const strategyParam = strategy === "equal" ? "equal-split" : undefined;

  // Approval workflow state
  const [activeBatches, setActiveBatches] = useState<any[]>([]);
  const [approvalStatuses, setApprovalStatuses] = useState<Record<number, any>>({});
  const [finalizing, setFinalizing] = useState<number | null>(null);
  const [reviewingJumuiya, setReviewingJumuiya] = useState<Record<string, boolean>>({});
  const [rejectedMembers, setRejectedMembers] = useState<any[]>([]);
  const [editingRejected, setEditingRejected] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [assigning, setAssigning] = useState<number | null>(null);

  const tableScrollRef = useRef<HTMLDivElement>(null);

  const fetchActiveBatches = async () => {
    try {
      const res = await memberService.csaGetActiveBatches();
      setActiveBatches(res.data?.batches || []);
    } catch { /* ignore */ }
  };

  const fetchBatchStatus = async (batchId: number) => {
    try {
      const res = await memberService.csaGetApprovalStatus(batchId);
      setApprovalStatuses(prev => ({ ...prev, [batchId]: res.data }));
    } catch { /* ignore */ }
  };

  const fetchRejectedMembers = async () => {
    try {
      const res = await memberService.csaGetRejectedMembers();
      setRejectedMembers(res.data || []);
    } catch { /* ignore */ }
  };

  const fetchData = async (year?: string, gender?: string) => {
    setLoadingData(true);
    try {
      const [pendingData, statsData] = await Promise.all([
        memberService.csaGetPendingMembers({
          academic_year: year || undefined,
          gender: gender || undefined,
        }),
        memberService.csaGetJumuiyaStats({ academic_year: year || undefined }),
      ]);
      setPendingMembers(pendingData.data || []);
      setJumuiyaStats(statsData.data || null);
      setDistributionDone(false);
      fetchActiveBatches();
      fetchRejectedMembers();
    } catch {
      setError("Failed to load data");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleMemberChange = (index: number, field: string, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
    setValidated(false);
  };

  const addRow = () => { setMembers([...members, { ...emptyRow }]); setValidated(false); };

  const removeRow = (index: number) => {
    if (members.length > 1) { setMembers(members.filter((_, i) => i !== index)); setValidated(false); }
  };

  const filterEmptyRows = (rows: any[]) =>
    rows.filter(r => r.regNumber?.trim() || r.name?.trim() || r.gender?.trim());

  const parseCSV = useCallback((text: string): any[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row");
    const headers = parseCsvLine(lines[0]);
    const rows = lines.slice(1).map((line) => {
      const values = parseCsvLine(line);
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = values[i] || ""; });
      return mapRow(obj);
    });
    return filterEmptyRows(rows);
  }, []);

  const parseExcel = useCallback((data: ArrayBuffer): any[] => {
    const wb = XLSX.read(data, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
    return filterEmptyRows(rows.map(mapRow));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const isExcel = /\.xlsx?$/i.test(file.name);
    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = parseExcel(evt.target?.result as ArrayBuffer);
          if (parsed.length === 0) { setError("Excel file has no data rows"); return; }
          setMembers(parsed);
          setMemberErrors({});
          setValidated(false);
        } catch (err: any) { setError(err?.message || "Failed to parse Excel file"); }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = parseCSV(evt.target?.result as string);
          if (parsed.length === 0) { setError("CSV has no data rows"); return; }
          setMembers(parsed);
          setMemberErrors({});
          setValidated(false);
        } catch (err: any) { setError(err?.message || "Failed to parse CSV file"); }
      };
      reader.readAsText(file);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, TEMPLATE_HEADERS.map(() => "")]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "csa-member-import-template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleValidate = async () => {
    setError(null);
    setMemberErrors({});
    try {
      const res = await memberService.csaValidateMembers({ members });
      const errMap: Record<number, string[]> = {};
      res.data.results.forEach((r: any) => {
        const issues = [...(r.errors || []), ...(r.warnings || [])];
        if (issues.length > 0) errMap[r.row] = issues;
      });
      setMemberErrors(errMap);
      if (Object.keys(errMap).length === 0) {
        setError(null);
      } else {
        setError(`${Object.keys(errMap).length} row(s) have validation issues. Fix them before importing.`);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Validation failed");
    } finally {
      setValidated(true);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    setImportResult(null);
    try {
      const payload: any = { members, file_name: mode === "upload" ? "csv-upload" : "manual-entry" };
      if (importYear) payload.academic_year = importYear;
      const res = await memberService.csaImportMembers(payload);

      // Separate valid vs error records from the response
      const records: any[] = res.data.records || [];
      const errMap: Record<number, string[]> = {};
      const keptMembers: any[] = [];

      records.forEach((r: any) => {
        if (r.status === "error") {
          const errors = r.validation_errors || [];
          const warnings = r.validation_warnings || [];
          errMap[keptMembers.length] = [...errors, ...warnings];
          keptMembers.push({
            name: r.raw_name || "",
            regNumber: r.raw_reg_number || "",
            gender: r.raw_gender || "",
            course: r.raw_course || "",
            jumuiya: r.raw_jumuiya || "",
            phone: r.raw_phone || "",
            email: r.raw_email || "",
          });
        }
      });

      if (keptMembers.length > 0) {
        setMembers(keptMembers);
        setMemberErrors(errMap);
        setImportResult(res.data);
        setError(`${keptMembers.length} row(s) had errors and need fixing.`);
      } else {
        setMembers([{ ...emptyRow }]);
        setMemberErrors({});
        setImportResult(res.data);
      }
      fetchData(filterYear, filterGender);
      window.dispatchEvent(new CustomEvent("csa_members_updated"));
    } catch (err: any) {
      const raw = err?.response?.data?.error || err?.message || "Import failed";
      const friendly = raw.includes("check constraint")
        ? "Import failed due to a data issue. Please refresh the page and try again."
        : raw;
      setError(friendly);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadQR = async () => {
    const joinUrl = `${window.location.origin}/join`;
    try {
      const dataUrl = await QRCode.toDataURL(joinUrl, {
        width: 400,
        margin: 2,
        color: { dark: "#0f172a", light: "#ffffff" },
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "csa-join-qr-code.png";
      link.click();
    } catch {
      setError("Failed to generate QR code");
    }
  };

  const handleFilterChange = (year: string, gender: string) => {
    setFilterYear(year);
    setFilterGender(gender);
    fetchData(year, gender);
  };

  const handlePreview = async () => {
    setError(null);
    setPreview(null);
    try {
      const payload: any = {};
      if (filterYear) payload.academic_year = filterYear;
      if (strategyParam) payload.strategy = strategyParam;
      const res = await memberService.csaDistributePreview(payload);
      setPreview(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Preview failed");
    }
  };

  const handleSubmitForApproval = async () => {
    setDistributing(true);
    setError(null);
    try {
      const payload: any = {};
      if (filterYear) payload.academic_year = filterYear;
      if (strategyParam) payload.strategy = strategyParam;
      const res = await memberService.csaSubmitForApproval(payload);
      setPreview(null);
      setDistributionDone(false);
      setActiveBatches(prev => [...prev, { ...res.data.batch, total_allocations: res.data.assignments?.length || 0 }]);
      fetchData(filterYear, filterGender);
      window.dispatchEvent(new CustomEvent("csa_members_updated"));
      setError(`Batch #${res.data.batch.id} created with ${res.data.summary.totalMembers} member(s). Click "Check Status" to review and finalize.`);
      // Switch to success-style message
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Submit for approval failed");
    } finally {
      setDistributing(false);
    }
  };

  const handleFinalize = async (batchId: number) => {
    setFinalizing(batchId);
    setError(null);
    try {
      await memberService.csaFinalizeDistribution(batchId);
      setApprovalStatuses(prev => { const n = {...prev}; delete n[batchId]; return n; });
      setActiveBatches(prev => prev.filter(b => b.id !== batchId));
      setDistributionDone(true);
      fetchData(filterYear, filterGender);
      window.dispatchEvent(new CustomEvent("csa_members_updated"));
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Finalize failed");
    } finally {
      setFinalizing(null);
    }
  };

  const handleLoadBatchStatus = async (batchId: number) => {
    await fetchBatchStatus(batchId);
  };

  const handleBatchReview = async (jumuiyaSlug: string, action: 'approved' | 'rejected', batchId: number) => {
    setReviewingJumuiya(prev => ({ ...prev, [jumuiyaSlug]: true }));
    setError(null);
    try {
      await memberService.csaBatchReviewApprovals(jumuiyaSlug, { status: action });
      await fetchBatchStatus(batchId);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Batch review failed");
    } finally {
      setReviewingJumuiya(prev => ({ ...prev, [jumuiyaSlug]: false }));
    }
  };

  const handleEditRejected = (m: any) => {
    setEditingRejected(m.id);
    setEditForm({ name: m.name || "", reg_number: m.reg_number || "", gender: m.gender || "", phone: m.phone || "", email: m.email || "" });
  };

  const handleSaveRejected = async (id: number) => {
    try {
      await memberService.csaUpdateRejectedMember(id, editForm);
      setEditingRejected(null);
      fetchRejectedMembers();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Update failed");
    }
  };

  const handleAssignRejected = async (id: number, jumuiyaName: string) => {
    setAssigning(id);
    try {
      await memberService.csaUpdateRejectedMember(id, { assign_jumuiya: jumuiyaName });
      fetchRejectedMembers();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Assign failed");
    } finally {
      setAssigning(null);
    }
  };

  const handleDeleteRejected = async (id: number) => {
    if (!confirm("Permanently delete this member? This cannot be undone.")) return;
    try {
      await memberService.csaDeleteRejectedMember(id);
      setRejectedMembers(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Delete failed");
    }
  };

  const pendingMale = pendingMembers.filter(m => isMale(m.gender)).length;
  const pendingFemale = pendingMembers.filter(m => isFemale(m.gender)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users size={22} className="text-indigo-500" />
            New Admissions
          </h3>
          <p className="text-sm text-slate-500">
            Admit new members and distribute them across Jumuiyas automatically.
          </p>
        </div>
        <button onClick={() => fetchData(filterYear, filterGender)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-start gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Upload size={16} />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800">Import New Members</h4>
            <p className="text-xs text-slate-400">Add new members to the CSA community (unassigned)</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap items-center">
          <button onClick={() => { setMode("manual"); setError(null); setMemberErrors({}); setImportResult(null); setValidated(false); }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${mode === "manual" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"}`}>
            <Plus size={14} /> Manual Entry
          </button>
          <button onClick={() => { setMode("upload"); setError(null); setMemberErrors({}); setImportResult(null); setValidated(false); }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${mode === "upload" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"}`}>
            <Upload size={14} /> CSV Upload
          </button>
          <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors">
            <FileSpreadsheet size={14} /> Template
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1" />

          {/* Balance mode toggle */}
          <div className="flex items-center gap-1.5" title={
            strategy === "membership"
              ? "New members are placed to level total membership across Jumuiyas (uses current member counts)."
              : "Equal Split: new members are spread evenly across all 7 Jumuiyas, balancing gender — existing member counts are ignored. Best while senior registrations are still incomplete."
          }>
            <span className="text-xs font-medium text-slate-500">Balance:</span>
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button onClick={() => setStrategy("membership")}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${strategy === "membership" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                Full Membership
              </button>
              <button onClick={() => setStrategy("equal")}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${strategy === "equal" ? "bg-violet-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                Equal Split
              </button>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-200 mx-1" />

          {/* Academic Year selector for import */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-slate-500">Import Year:</label>
            <select value={importYear} onChange={(e) => setImportYear(e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
              <option value="">Select</option>
              {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="h-5 w-px bg-slate-200 mx-1" />

          {/* Data filters (year + gender) */}
          <Filter size={14} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">Filter:</span>
          <select value={filterYear} onChange={(e) => handleFilterChange(e.target.value, filterGender)}
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
            <option value="">All Years</option>
            {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterGender} onChange={(e) => handleFilterChange(filterYear, e.target.value)}
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
            <option value="">All Members</option>
            <option value="Male">Gents</option>
            <option value="Female">Ladies</option>
          </select>
          {(filterYear || filterGender) && (
            <button onClick={() => handleFilterChange("", "")} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap">
              Clear
            </button>
          )}
          <span className="ml-auto text-xs text-slate-400 whitespace-nowrap">
            {loadingData ? "..." : `${pendingMembers.length} pending`}
          </span>
        </div>

        {mode === "upload" && (
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center mb-4">
            <Upload size={24} className="text-slate-300 mx-auto mb-2" />
            <input type="file" accept=".csv,.txt,.xlsx,.xls" onChange={handleFileUpload} className="mb-2 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100" />
            <p className="text-xs text-slate-400">Supports: CSV (.csv), Excel (.xlsx / .xls). Headers: Name, RegistrationNumber, Gender, Course, Phone, Email</p>
          </div>
        )}

        {/* Scrollable Member Table */}
        <div className="rounded-lg border border-slate-200 mb-4">
          <div ref={tableScrollRef} className="max-h-64 overflow-y-auto" style={{ scrollBehavior: "smooth" }}>
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-2.5 px-3 font-semibold text-slate-500 text-xs uppercase">#</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-slate-500 text-xs uppercase">Reg #</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-slate-500 text-xs uppercase">Name</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-slate-500 text-xs uppercase">Gender</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-slate-500 text-xs uppercase">Course</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-slate-500 text-xs uppercase">Phone</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-slate-500 text-xs uppercase">Email</th>
                  <th className="py-2.5 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => {
                  const errs = memberErrors[i] || [];
                  const hasErr = errs.length > 0;
                  return (
                  <tr key={i} className={`border-b border-slate-100 hover:bg-slate-50 ${hasErr ? "bg-red-50" : ""}`}>
                    <td className="py-1.5 px-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="py-1.5 px-3">
                      <input value={m.regNumber} onChange={(e) => { handleMemberChange(i, "regNumber", e.target.value); if (hasErr) { const next = {...memberErrors}; delete next[i]; setMemberErrors(next); } }} placeholder="CS01/A/2024/01"
                        className={`w-32 border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${hasErr ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-indigo-400"}`} />
                    </td>
                    <td className="py-1.5 px-3">
                      <input value={m.name} onChange={(e) => { handleMemberChange(i, "name", e.target.value); if (hasErr) { const next = {...memberErrors}; delete next[i]; setMemberErrors(next); } }} placeholder="Full name"
                        className={`w-36 border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${hasErr ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-indigo-400"}`} />
                      {hasErr && <div className="text-[10px] text-red-500 mt-0.5 leading-tight">{errs.join("; ")}</div>}
                    </td>
                    <td className="py-1.5 px-3">
                      <select value={m.gender} onChange={(e) => { handleMemberChange(i, "gender", e.target.value); if (hasErr) { const next = {...memberErrors}; delete next[i]; setMemberErrors(next); } }}
                        className={`w-24 border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${hasErr ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-indigo-400"}`}>
                        <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
                      </select>
                    </td>
                    <td className="py-1.5 px-3">
                      <input value={m.course} onChange={(e) => { handleMemberChange(i, "course", e.target.value); if (hasErr) { const next = {...memberErrors}; delete next[i]; setMemberErrors(next); } }} placeholder="e.g. Nursing"
                        className={`w-28 border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${hasErr ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-indigo-400"}`} />
                    </td>
                    <td className="py-1.5 px-3">
                      <input value={m.phone} onChange={(e) => { handleMemberChange(i, "phone", e.target.value); if (hasErr) { const next = {...memberErrors}; delete next[i]; setMemberErrors(next); } }} placeholder="+254..."
                        className={`w-28 border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${hasErr ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-indigo-400"}`} />
                    </td>
                    <td className="py-1.5 px-3">
                      <input value={m.email} onChange={(e) => { handleMemberChange(i, "email", e.target.value); if (hasErr) { const next = {...memberErrors}; delete next[i]; setMemberErrors(next); } }} placeholder="email"
                        className={`w-32 border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${hasErr ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-indigo-400"}`} />
                    </td>
                    <td className="py-1.5 px-3"><button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button></td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex w-full min-w-0 gap-1.5 sm:gap-2">
          {mode === "manual" && (
            <button onClick={addRow} title="Add Row" aria-label="Add Row" className="flex min-w-0 flex-1 items-center justify-center gap-1 px-2 py-2 text-xs sm:text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors">
              <Plus size={14} className="shrink-0" /> <span className="truncate"><span className="sm:hidden">Add</span><span className="hidden sm:inline">Add Row</span></span>
            </button>
          )}
          <button onClick={handleValidate}
            title="Validate" aria-label="Validate" className="flex min-w-0 flex-1 items-center justify-center gap-1 px-2 py-2 text-xs sm:text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg transition-colors">
            <CheckCircle size={14} className="shrink-0" /> <span className="truncate">Validate</span>
          </button>
          <button onClick={handleImport} disabled={importing || Object.keys(memberErrors).length > 0 || !validated}
            title="Import to CSA" aria-label="Import to CSA" className="flex min-w-0 flex-1 items-center justify-center gap-1 px-2 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-lg transition-colors">
            <span className="truncate">{importing ? "Importing..." : <><span className="sm:hidden">Import</span><span className="hidden sm:inline">Import to CSA</span></>}</span>
          </button>
          <button onClick={handleDownloadQR}
            title="Download QR" aria-label="Download QR" className="flex min-w-0 flex-1 items-center justify-center gap-1 px-2 py-2 text-xs sm:text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors">
            <QrCode size={14} className="shrink-0" /> <span className="truncate"><span className="sm:hidden">QR</span><span className="hidden sm:inline">Download QR</span></span>
          </button>
        </div>

        {importResult && (
          <div className={`mt-4 border rounded-lg p-4 ${importResult.summary.errors > 0 ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"}`}>
            <div className={`flex items-center gap-2 font-semibold mb-1 ${importResult.summary.errors > 0 ? "text-amber-700" : "text-emerald-700"}`}>
              {importResult.summary.errors > 0 ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
              {importResult.summary.errors > 0 ? "Import completed with errors" : "Import Complete"}
            </div>
            <p className={`text-sm ${importResult.summary.errors > 0 ? "text-amber-700" : "text-emerald-700"}`}>
              {importResult.summary.valid > 0 && (
                <>{importResult.summary.valid} member{importResult.summary.valid !== 1 ? "s" : ""} added to All Members and ready to log in. </>
              )}
              {importResult.summary.errors > 0 && (
                <>· {importResult.summary.errors} row{importResult.summary.errors !== 1 ? "s" : ""} had errors.</>
              )}
              {Object.keys(memberErrors).length > 0 && (
                <span className="ml-1">Fix the highlighted rows below and click <strong>Validate</strong> then <strong>Import</strong> again.</span>
              )}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-5">
          <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-indigo-500" />
            {filterYear ? filterYear : "All Time"}
          </h4>
          {loadingData ? (
            <div className="space-y-3">
              <div className="h-8 skeleton-shimmer rounded w-1/2" />
              <div className="h-4 skeleton-shimmer rounded w-3/4" />
            </div>
          ) : (
            <>
              <div className="flex gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-400">Total Pending</p>
                  <p className="text-3xl font-bold text-slate-800">{pendingMembers.length}</p>
                </div>
              </div>
              <div className="flex gap-3 text-sm mb-4">
                <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-medium flex items-center gap-1">♂ {pendingMale} <span className="font-normal text-blue-400">Men</span></span>
                <span className="text-pink-600 bg-pink-50 px-3 py-1 rounded-full font-medium flex items-center gap-1">♀ {pendingFemale} <span className="font-normal text-pink-400">Women</span></span>
              </div>
              {pendingMembers.length > 0 && (
                <button onClick={handlePreview}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg transition-colors w-full justify-center">
                  <GitMerge size={14} /> Preview Distribution
                </button>
              )}
            </>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <Users size={16} className="text-indigo-500" />
            Current Member Distribution {filterYear ? `(${filterYear})` : "(All Time)"}
          </h4>
          {loadingData ? (
            <div className="space-y-2.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-6 skeleton-shimmer rounded-full" />
              ))}
            </div>
          ) : jumuiyaStats?.jumuiyas ? (
            <div className="space-y-2">
              {jumuiyaStats.jumuiyas.map((j: any) => {
                const jColor = JUMUIYAS.find(x => x.id === j.slug)?.color || "#6b7280";
                const maxCount = Math.max(...jumuiyaStats.jumuiyas.map((x: any) => x.total), 1);
                const pct = (j.total / maxCount) * 100;
                return (
                  <div key={j.slug} className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 w-28 truncate leading-5">{j.name}</span>
                    <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, 3)}%`, background: jColor }} />
                    </div>
                    <div className="text-right shrink-0 leading-tight">
                      <div className="text-sm font-bold text-slate-800">{j.total}</div>
                      <div className="flex gap-1.5 justify-end">
                        <span className="text-[11px] bg-blue-50 text-blue-600 px-1.5 py-[1px] rounded font-semibold whitespace-nowrap">M {j.male_count}</span>
                        <span className="text-[11px] bg-pink-50 text-pink-600 px-1.5 py-[1px] rounded font-semibold whitespace-nowrap">W {j.female_count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-sm text-slate-400">No data available.</p>}
        </div>
      </div>

      {preview && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle size={16} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Distribution Preview</h4>
              <p className="text-xs text-slate-400">
                {preview.summary.totalMembers} members (M {preview.summary.maleCount}, W {preview.summary.femaleCount}) to be distributed
                <span className={`ml-2 px-1.5 py-0.5 rounded font-semibold ${preview.data?.strategy === "equal-split" ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-500"}`}>
                  {preview.data?.strategy === "equal-split" ? "Equal Split (new members only)" : "Full Membership balance"}
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-4">
            {preview.summary.perJumuiya.map((pj: any) => {
              const j = JUMUIYAS.find(x => x.id === pj.slug);
              return (
                <div key={pj.slug} className="rounded-lg border border-slate-200 p-3 text-center" style={{ borderTop: `3px solid ${j?.color || "#6b7280"}` }}>
                  <p className="text-xs font-semibold text-slate-600 truncate">{j?.name || pj.name}</p>
                  <p className="text-xl font-bold text-slate-800">{pj.newMembers}</p>
                  <p className="text-xs text-slate-400">{pj.existingTotal} → <strong>{pj.newTotal}</strong></p>
                </div>
              );
            })}
          </div>

          {/* Scrollable Assignment Table */}
          <div className="rounded-lg border border-slate-200 mb-4">
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-semibold text-slate-500 text-xs uppercase w-10">No.</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-500 text-xs uppercase">Member</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-500 text-xs uppercase">Gender</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-500 text-xs uppercase">Assigned To</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.assignments.map((a: any, i: number) => {
                    const j = JUMUIYAS.find(x => x.id === a.target_slug);
                    return (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-1.5 px-3 text-slate-400 text-xs">{i + 1}</td>
                        <td className="py-1.5 px-3 font-medium text-slate-700">{a.member_name}</td>
                        <td className="py-1.5 px-3">{(() => { const g = genderCode(a.member_gender); return g === "—" ? <span className="text-xs text-slate-400">—</span> : <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${g === "M" ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"}`}>{g}</span>; })()}</td>
                        <td className="py-1.5 px-3"><span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${j?.color}15`, color: j?.color }}>{a.target_name}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleSubmitForApproval} disabled={distributing}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-lg transition-colors">
              {distributing ? "Submitting..." : <><Send size={14} /> Submit for Approval</>}
            </button>
            <button onClick={() => setPreview(null)} className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {activeBatches.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-slate-800 flex items-center gap-2">
            <ThumbsUp size={16} className="text-amber-500" />
            Approval Status — {activeBatches.length} active batch(es)
          </h4>
          {activeBatches.map(batch => {
            const status = approvalStatuses[batch.id];
            const loaded = !!status;
            const totalApproved = loaded ? status.summary.approved : (batch.approved_count || 0);
            const totalPending = loaded ? status.summary.pending : (batch.pending_count || 0);
            const totalRejected = loaded ? status.summary.rejected : (batch.rejected_count || 0);
            const totalAll = loaded ? status.summary.total : (batch.total_allocations || 0);
            return (
              <div key={batch.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-semibold text-slate-800">Batch #{batch.id}</span>
                    <span className="text-xs text-slate-400 ml-2">
                      {batch.academic_year || "All years"} · Created {new Date(batch.created_at).toLocaleDateString()}
                    </span>
                    <span className={`ml-3 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      batch.status === 'all_approved' ? 'bg-emerald-100 text-emerald-700' :
                      batch.status === 'partially_approved' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {batch.status === 'all_approved' ? 'All Approved' :
                       batch.status === 'partially_approved' ? 'Partially Approved' :
                       'Pending Approval'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {!loaded && (
                      <button onClick={() => handleLoadBatchStatus(batch.id)}
                        className="text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                        Check Status
                      </button>
                    )}
                    {loaded && status.summary.total > 0 && (
                      <button onClick={() => handleFinalize(batch.id)} disabled={finalizing === batch.id}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 px-3 py-1.5 rounded-lg transition-colors">
                        {finalizing === batch.id ? "Finalizing..." : <><CheckCircle size={12} /> Finalize Distribution</>}
                      </button>
                    )}
                  </div>
                </div>

                {loaded && status.jumuiyas && (
                  <div className="space-y-2 mt-3">
                    {status.jumuiyas.map((j: any) => {
                      return (
                        <div key={j.name} className="flex items-center gap-3">
                          <span className="text-xs font-medium text-slate-600 w-28 truncate">{j.name}</span>
                          <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden flex">
                            {j.approved > 0 && <div className="bg-emerald-400 h-full" style={{ width: `${(j.approved / j.total) * 100}%` }} />}
                            {j.pending > 0 && <div className="bg-blue-300 h-full" style={{ width: `${(j.pending / j.total) * 100}%` }} />}
                            {j.rejected > 0 && <div className="bg-red-300 h-full" style={{ width: `${(j.rejected / j.total) * 100}%` }} />}
                          </div>
                          <span className="text-xs text-slate-500 w-20 text-right shrink-0">
                            {j.approved}/{j.total}
                            {j.pending > 0 && <span className="text-blue-500 ml-1">·{j.pending} pend</span>}
                            {j.rejected > 0 && <span className="text-red-500 ml-1">·{j.rejected} rej</span>}
                          </span>
                          {loaded && j.pending > 0 && (() => {
                            const slug = SLUG_FROM_SHORT_NAME[j.name];
                            return slug ? (
                              <div className="flex gap-1">
                                <button onClick={() => handleBatchReview(slug, 'approved', batch.id)} disabled={reviewingJumuiya[slug]}
                                  className="text-[10px] font-semibold px-2 py-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 disabled:opacity-50 transition-colors">
                                  {reviewingJumuiya[slug] ? "..." : "Approve"}
                                </button>
                                <button onClick={() => handleBatchReview(slug, 'rejected', batch.id)} disabled={reviewingJumuiya[slug]}
                                  className="text-[10px] font-semibold px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 disabled:opacity-50 transition-colors">
                                  {reviewingJumuiya[slug] ? "..." : "Reject"}
                                </button>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      );
                    })}
                  </div>
                )}

                {!loaded && (
                  <div className="flex gap-3 text-xs text-slate-500 mt-2">
                    <span className="text-emerald-600 font-medium">{totalApproved} approved</span>
                    <span className="text-blue-600 font-medium">{totalPending} pending</span>
                    {totalRejected > 0 && <span className="text-red-600 font-medium">{totalRejected} rejected</span>}
                    <span className="text-slate-400">· {totalAll} total</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {rejectedMembers.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 p-5">
          <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <ThumbsDown size={16} className="text-red-500" />
            Rejected Members ({rejectedMembers.length})
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-semibold text-slate-500 text-xs uppercase w-10">No.</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-500 text-xs uppercase">Name</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-500 text-xs uppercase">Reg #</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-500 text-xs uppercase">Gender</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-500 text-xs uppercase">Phone</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-500 text-xs uppercase">Year</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-500 text-xs uppercase">Reason</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-500 text-xs uppercase">Assign To</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-500 text-xs uppercase w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rejectedMembers.map((m, idx) => {
                  const isEditing = editingRejected === m.id;
                  return (
                    <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-400 text-xs">{idx + 1}</td>
                      <td className="py-2 px-3">
                        {isEditing ? (
                          <input value={editForm.name} onChange={e => setEditForm((p: any) => ({ ...p, name: e.target.value }))}
                            className="text-xs border border-slate-200 rounded px-1.5 py-1 w-28" />
                        ) : (
                          <span className="text-slate-700 font-medium">{m.name}</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {isEditing ? (
                          <input value={editForm.reg_number} onChange={e => setEditForm((p: any) => ({ ...p, reg_number: e.target.value }))}
                            className="text-xs border border-slate-200 rounded px-1.5 py-1 w-24" />
                        ) : (
                          <span className="text-slate-600">{m.reg_number || "—"}</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {isEditing ? (
                          <select value={editForm.gender} onChange={e => setEditForm((p: any) => ({ ...p, gender: e.target.value }))}
                            className="text-xs border border-slate-200 rounded px-1.5 py-1">
                            <option value="">—</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        ) : (
                          <span className={`text-xs font-semibold ${genderCode(m.gender) === "M" ? "text-blue-600" : genderCode(m.gender) === "W" ? "text-pink-600" : "text-slate-400"}`}>
                            {genderCode(m.gender)}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {isEditing ? (
                          <input value={editForm.phone} onChange={e => setEditForm((p: any) => ({ ...p, phone: e.target.value }))}
                            className="text-xs border border-slate-200 rounded px-1.5 py-1 w-24" />
                        ) : (
                          <span className="text-slate-600">{m.phone || "—"}</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{getYearOfStudy(m.reg_number || m.member_id || "") || "—"}</td>
                      <td className="py-2 px-3">
                        <span className="text-xs text-red-500">{m.rejection_reason || "Rejected"}</span>
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value=""
                          onChange={e => { if (e.target.value) handleAssignRejected(m.id, e.target.value); }}
                          disabled={assigning === m.id}
                          className="text-xs border border-slate-200 rounded px-1.5 py-1 w-28">
                          <option value="">{assigning === m.id ? "Assigning..." : "— Choose —"}</option>
                          {JUMUIYAS.map(j => (
                            <option key={j.id} value={j.name}>{j.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-1">
                          {isEditing ? (
                            <button onClick={() => handleSaveRejected(m.id)}
                              className="text-xs font-semibold px-2 py-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200">
                              <Save size={12} />
                            </button>
                          ) : (
                            <button onClick={() => handleEditRejected(m)}
                              className="text-xs font-semibold px-2 py-1 rounded bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200">
                              <Edit2 size={12} />
                            </button>
                          )}
                          <button onClick={() => handleDeleteRejected(m.id)}
                            className="text-xs font-semibold px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {distributionDone && !preview && pendingMembers.length === 0 && activeBatches.length === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
          <CheckCircle size={32} className="text-emerald-500 mx-auto mb-2" />
          <h4 className="font-semibold text-emerald-700 text-lg">All members distributed</h4>
          <p className="text-sm text-emerald-600">No unassigned members remaining.</p>
        </div>
      )}
    </div>
  );
}