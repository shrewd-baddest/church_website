import { useState, useEffect, useMemo, useCallback } from "react";
import { memberService } from "../../../api/jumuiyaMemberService";
import { Search, X, RefreshCw, GraduationCap, Download, Undo2 } from "lucide-react";
import * as XLSX from "xlsx";
import { SkeletonTable, SkeletonSummaryBar } from "../../../components/Skeleton";
import { genderCode } from "../../../utils/memberYear";



export default function AssociatesTable({ refreshKey = 0, jumuiyaId, moduleId }: { refreshKey?: number; jumuiyaId?: string; moduleId?: string }) {
  const [associates, setAssociates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [graduationFilter, setGraduationFilter] = useState<Record<string, boolean>>({});
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportColumns, setExportColumns] = useState<Record<string, boolean>>({
    RegNo: true, Name: true, Gender: true, Email: true,
    Phone: true, Jumuiya: true, AdmissionYear: true,
    GraduationYear: true, Source: true, MigratedAt: true,
  });
  const [genderFilter, setGenderFilter] = useState<Record<string, boolean>>({ Male: true, Female: true });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchAssociates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (jumuiyaId) params.jumuiya_id = jumuiyaId;
      if (moduleId) params.module_id = moduleId;
      const res = await memberService.getAssociatesList(params);
      setAssociates(res.data || []);
      const years: Record<string, boolean> = {};
      (res.data || []).forEach((a: any) => {
        if (a.graduation_year) years[String(a.graduation_year)] = true;
      });
      if (Object.keys(years).length > 0) setGraduationFilter(years);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to load associates");
    } finally {
      setLoading(false);
    }
  }, [jumuiyaId, moduleId]);

  useEffect(() => { fetchAssociates(); }, [refreshKey]);

  const graduationYears = useMemo(() => {
    const years = new Set<number>();
    associates.forEach(a => { if (a.graduation_year) years.add(a.graduation_year); });
    return Array.from(years).sort((a, b) => b - a);
  }, [associates]);

  const filtered = useMemo(() => {
    const activeYears = Object.entries(graduationFilter).filter(([, v]) => v).map(([k]) => parseInt(k));
    const activeGenders = Object.entries(genderFilter).filter(([, v]) => v).map(([k]) => k);
    return associates.filter(a => {
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        if (!(a.name || "").toLowerCase().includes(q) &&
            !(a.member_id || "").toLowerCase().includes(q) &&
            !(a.email || "").toLowerCase().includes(q)) return false;
      }
      if (activeYears.length > 0 && !activeYears.includes(a.graduation_year)) return false;
      const g = (a.gender || "").toLowerCase();
      if (!((g === "male" || g === "Male") && activeGenders.includes("Male")) &&
          !((g === "female" || g === "Female") && activeGenders.includes("Female")) &&
          !(!g && activeGenders.length > 0)) return false;
      return true;
    });
  }, [associates, debouncedSearch, graduationFilter, genderFilter]);

  const handleExport = () => {
    try {
      const selected = Object.entries(exportColumns).filter(([, v]) => v).map(([k]) => k);
      const activeGenders = Object.entries(genderFilter).filter(([, v]) => v).map(([k]) => k);
      const activeYears = Object.entries(graduationFilter).filter(([, v]) => v).map(([k]) => parseInt(k));
      const rows = associates.filter(a => {
        const g = (a.gender || "").toLowerCase();
        if (!((g === "male" || g === "Male") && activeGenders.includes("Male")) &&
            !((g === "female" || g === "Female") && activeGenders.includes("Female")) &&
            !(!g && activeGenders.length > 0)) return false;
        if (activeYears.length > 0 && !activeYears.includes(a.graduation_year)) return false;
        return true;
      }).map(a => {
        const out: any = {};
        selected.forEach(k => {
          if (k === "RegNo") out.RegNo = a.member_id || "";
          else if (k === "Name") out.Name = a.name || "";
          else if (k === "Gender") out.Gender = a.gender || "";
          else if (k === "Email") out.Email = a.email || "";
          else if (k === "Phone") out.Phone = a.phone || "";
          else if (k === "Jumuiya") out.Jumuiya = a.jumuiya_name || "";
          else if (k === "AdmissionYear") out.AdmissionYear = a.admission_year || "";
          else if (k === "GraduationYear") out.GraduationYear = a.graduation_year || "";
          else if (k === "Source") out.Source = a.source || "";
          else if (k === "MigratedAt") out.MigratedAt = a.migrated_at ? a.migrated_at.slice(0, 10) : "";
        });
        return out;
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = selected.map(k => ({
        wch: k === "Name" || k === "Email" || k === "Jumuiya" ? 30 : k === "RegNo" || k === "Phone" ? 18 : 14,
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Associates");
      XLSX.writeFile(wb, "associates.xlsx");
      setShowExportModal(false);
    } catch (err: any) {
      alert(err?.message || "Export failed");
    }
  };

  const handleUndo = async (memberId: string) => {
    if (!confirm(`Undo migration for ${memberId}? This will restore them to active members.`)) return;
    try {
      await memberService.undoAssociateMigration(memberId);
      setAssociates(prev => prev.filter(a => a.member_id !== memberId));
    } catch (err: any) {
      alert(err?.message || "Failed to undo migration");
    }
  };

  const toggleExportColumn = (col: string) => {
    setExportColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonSummaryBar count={2} />
        <SkeletonTable rows={8} cols={7} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-3xl font-bold text-slate-800">{associates.length}</p>
          <p className="text-xs text-slate-500 font-medium">Total Associates</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-3xl font-bold text-indigo-600">{graduationYears.length}</p>
          <p className="text-xs text-slate-500 font-medium">Graduation Cohorts</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap size={20} className="text-indigo-500" />
            Associates (Alumni)
          </h3>
          <p className="text-xs text-slate-500">{associates.length} graduated member(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search associates..."
              className="pl-8 pr-8 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 w-48" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
          <button onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <Download size={14} /> Export
          </button>
          <button onClick={fetchAssociates}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {associates.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <GraduationCap size={32} className="text-slate-200 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No associates yet.</p>
          <p className="text-slate-300 text-xs mt-1">Graduated members will appear here after migration.</p>
        </div>
      ) : (
        <>
          {/* Filters */}
          {graduationYears.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Filter by Graduation Year</p>
                <div className="flex flex-wrap gap-2">
                  {graduationYears.map(y => (
                    <label key={y} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={graduationFilter[String(y)] ?? false}
                        onChange={() => setGraduationFilter(prev => ({ ...prev, [y]: !prev[y] }))}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-700 group-hover:text-slate-900 font-medium">{y}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Filter by Gender</p>
                <div className="flex gap-3">
                  {Object.entries(genderFilter).map(([g, v]) => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={v}
                        onChange={() => setGenderFilter(prev => ({ ...prev, [g]: !prev[g] }))}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-slate-700 group-hover:text-slate-900 font-medium">{g === "Male" ? "Male" : "Female"}</span>
                    </label>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-400">{filtered.length} of {associates.length} shown</p>
            </div>
          )}

          {/* Table */}
          <div className="rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase w-10">No.</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase">Reg #</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase">Name</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase">Gender</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase">Jumuiya</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase">Admission</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase">Graduation</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase">Source</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, idx) => (
                  <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400 text-xs">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 text-xs">{a.member_id}</td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium text-xs">{a.name}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-xs font-semibold ${genderCode(a.gender) === "M" ? "text-blue-600" : genderCode(a.gender) === "W" ? "text-pink-600" : "text-slate-400"}`}>
                        {genderCode(a.gender)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-xs">{a.jumuiya_name || "—"}</td>
                    <td className="py-2.5 px-3 text-slate-500 text-xs">{a.admission_year || "—"}</td>
                    <td className="py-2.5 px-3 text-slate-500 text-xs">{a.graduation_year || "—"}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${
                        a.source === "legacy" ? "bg-amber-50 text-amber-700" :
                        a.source === "csa" ? "bg-cyan-50 text-cyan-700" :
                        a.source === "jum" ? "bg-indigo-50 text-indigo-700" : "bg-slate-50 text-slate-700"
                      }`}>
                        {a.source === "legacy" ? "Legacy" : a.source === "csa" ? "CSA" : a.source === "jum" ? "Jum" : "Import"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <button onClick={() => handleUndo(a.member_id)}
                        className="text-xs font-semibold px-2 py-1 rounded bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                        title="Undo migration">
                        <Undo2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowExportModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">Export Associates</h3>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Select columns to include in Excel export.</p>
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Filter by Gender</p>
              <div className="flex gap-3">
                {Object.entries(genderFilter).map(([g, v]) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={v}
                      onChange={() => setGenderFilter(prev => ({ ...prev, [g]: !prev[g] }))}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-slate-700 group-hover:text-slate-900 font-medium">{g === "Male" ? "Male" : "Female"}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4 space-y-3 mb-6">
              {Object.keys(exportColumns).map(col => (
                <label key={col} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={(exportColumns as any)[col]}
                    onChange={() => toggleExportColumn(col)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-slate-700 group-hover:text-slate-900 font-medium">{col}</span>
                </label>
              ))}
            </div>
            <button onClick={handleExport}
              disabled={!Object.values(exportColumns).some(v => v) || !Object.values(genderFilter).some(v => v)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
              <Download size={14} /> Export to Excel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
