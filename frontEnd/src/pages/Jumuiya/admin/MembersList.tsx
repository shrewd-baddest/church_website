import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { memberService } from "../../../api/jumuiyaMemberService";
import { RefreshCw, Users, Search, X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";

interface Props {
  jumuiyaId: string;
  jumuiyaName: string;
}

// Memoized table row component
const MemberRow = memo(({ m, idx }: { m: any; idx: number }) => (
  <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
    <td className="py-3 px-4 text-slate-400 text-xs">{idx + 1}</td>
    <td className="py-3 px-4 font-medium text-slate-800">{m.member_id}</td>
    <td className="py-3 px-4 text-slate-700"><span className={m.is_active === false ? 'text-red-500 font-semibold' : ''}>{m.first_name} {m.last_name}</span></td>
    <td className="py-3 px-4">
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${
        m.source === "jum" ? "bg-indigo-50 text-indigo-700" :
        m.source === "csa" ? "bg-cyan-50 text-cyan-700" :
        "bg-slate-50 text-slate-700"
      }`}>
        {m.source === "csa" ? "CSA" : "Jum"}
      </span>
    </td>
    <td className="py-3 px-4">
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
        m.gender === "male" ? "bg-blue-50 text-blue-700" :
        m.gender === "female" ? "bg-pink-50 text-pink-700" :
        "bg-slate-50 text-slate-500"
      }`}>
        {m.gender === "male" ? "M" : m.gender === "female" ? "W" : m.gender || "—"}
      </span>
    </td>
    <td className="py-3 px-4 text-slate-500">{m.email || "—"}</td>
    <td className="py-3 px-4 text-slate-500">{m.phone || "—"}</td>
    <td className="py-3 px-4 text-slate-500">{m.year_of_study || "—"}</td>
    <td className="py-3 px-4 text-slate-400 text-xs">{m.join_date ? m.join_date.slice(0, 10) : "—"}</td>
  </tr>
));

MemberRow.displayName = "MemberRow";

const MembersList: React.FC<Props> = ({ jumuiyaId, jumuiyaName }) => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [yearFilter, setYearFilter] = useState({ "1st": true, "2nd": true, "3rd": true, "4th+": true });
  const [genderFilter, setGenderFilter] = useState({ Male: true, Female: true });
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportColumns, setExportColumns] = useState({
    RegNo: true, Name: true, Gender: true, Email: true,
    Phone: true, Year: true, Source: true, Joined: true,
  });

  function yosLabel(y: any): string | null {
    const ys = String(y || "");
    if (ys === "1") return "1st";
    if (ys === "2") return "2nd";
    if (ys === "3") return "3rd";
    if (ys === "4") return "4th+";
    return null;
  }

  // Debounce search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await memberService.getMembers(jumuiyaId);
      setMembers(res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to fetch members");
    } finally {
      setLoading(false);
    }
  }, [jumuiyaId]);

  useEffect(() => { 
    fetchMembers(); 
  }, [jumuiyaId]);

  // Memoized filtered results
  const filtered = useMemo(() => {
    const activeGenders = Object.entries(genderFilter).filter(([, v]) => v).map(([k]) => k);
    const activeYears = Object.entries(yearFilter).filter(([, v]) => v).map(([k]) => k);
    return members.filter(m => {
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        if (!`${m.first_name} ${m.last_name}`.toLowerCase().includes(q) &&
            !(m.member_id || "").toLowerCase().includes(q) &&
            !(m.email || "").toLowerCase().includes(q)) return false;
      }
      const g = (m.gender || "").toLowerCase();
      if (!((g === "male" && activeGenders.includes("Male")) ||
            (g === "female" && activeGenders.includes("Female")) ||
            (!g && activeGenders.length > 0))) return false;
      const label = yosLabel(m.year_of_study);
      return label ? activeYears.includes(label) : activeYears.length > 0;
    });
  }, [members, debouncedSearch, genderFilter, yearFilter]);

  // Memoized pagination calculations
  const { paginatedMembers, totalPages } = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return {
      paginatedMembers: filtered.slice(start, end),
      totalPages: Math.ceil(filtered.length / itemsPerPage)
    };
  }, [filtered, currentPage]);

  const handleExport = () => {
    try {
      const activeGenders = Object.entries(genderFilter).filter(([, v]) => v).map(([k]) => k);
      const activeYears = Object.entries(yearFilter).filter(([, v]) => v).map(([k]) => k);
      const f = members.filter((m: any) => {
        const g = (m.gender || "").toLowerCase();
        if (!((g === "male" && activeGenders.includes("Male")) ||
              (g === "female" && activeGenders.includes("Female")) ||
              (!g && activeGenders.length > 0))) return false;
        const label = yosLabel(m.year_of_study);
        return label ? activeYears.includes(label) : activeYears.length > 0;
      });
      const selected = Object.entries(exportColumns).filter(([, v]) => v).map(([k]) => k);
      const mapped = f.map((row: any) => {
        const out: any = {};
        selected.forEach(k => {
          if (k === "RegNo") out.RegNo = row.member_id || "";
          else if (k === "Name") out.Name = `${row.first_name || ""} ${row.last_name || ""}`.trim();
          else if (k === "Gender") out.Gender = row.gender === "male" ? "Male" : row.gender === "female" ? "Ladies" : row.gender || "";
          else if (k === "Email") out.Email = row.email || "";
          else if (k === "Phone") out.Phone = row.phone || "";
          else if (k === "Year") out.Year = row.year_of_study || "";
          else if (k === "Source") out.Source = row.source === "csa" ? "CSA" : "Jum";
          else if (k === "Joined") out.Joined = row.join_date ? row.join_date.slice(0, 10) : "";
        });
        return out;
      });
      const ws = XLSX.utils.json_to_sheet(mapped);
      ws["!cols"] = selected.map(k => ({
        wch: k === "Name" || k === "Email" ? 30 : k === "RegNo" || k === "Phone" ? 18 : 10,
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Members");
      XLSX.writeFile(wb, `members-${jumuiyaId}.xlsx`);
      setShowExportModal(false);
    } catch (err: any) {
      alert(err?.message || "Export failed");
    }
  };

  const toggleExportColumn = (col: string) => {
    setExportColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-lg w-1/4" />
        <div className="h-48 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800">All Members</h3>
          <p className="text-xs text-slate-500">
            {members.length} member(s) in <span className="font-semibold text-indigo-600">{jumuiyaName}</span>
            {debouncedSearch && <span> • {filtered.length} matching</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              className="pl-8 pr-8 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 w-48" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
          <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <Download size={14} /> Export
          </button>
          <button onClick={fetchMembers} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Year & Gender Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Year of Study</p>
          <div className="flex gap-2">
            {Object.entries(yearFilter).map(([y, v]) => (
              <label key={y} className="flex items-center gap-1.5 cursor-pointer group">
                <input type="checkbox" checked={v}
                  onChange={() => setYearFilter(prev => ({ ...prev, [y]: !prev[y] }))}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-xs text-slate-600 group-hover:text-slate-800 font-medium">{y}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="w-px h-8 bg-slate-200" />
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Gender</p>
          <div className="flex gap-2">
            {Object.entries(genderFilter).map(([g, v]) => (
              <label key={g} className="flex items-center gap-1.5 cursor-pointer group">
                <input type="checkbox" checked={v}
                  onChange={() => setGenderFilter(prev => ({ ...prev, [g]: !prev[g] }))}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-xs text-slate-600 group-hover:text-slate-800 font-medium">{g}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {members.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Users size={32} className="text-slate-200 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No members yet.</p>
          <p className="text-slate-300 text-xs mt-1">Members appear here from legacy records, imports, or CSA distribution.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider w-10">No.</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Reg #</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Source</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Gender</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Phone</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Year</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMembers.map((m, idx) => (
                  <MemberRow key={m.member_id} m={m} idx={(currentPage - 1) * itemsPerPage + idx} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-500 font-medium">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;
                    const isActive = page === currentPage;
                    const isVisible = Math.abs(page - currentPage) <= 2 || page === 1 || page === totalPages;
                    
                    if (!isVisible) return null;
                    if (!isActive && Math.abs(page - currentPage) === 3) {
                      return <span key={`dots-${i}`} className="text-slate-400">...</span>;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg font-semibold text-xs transition-colors ${
                          isActive
                            ? "bg-indigo-600 text-white"
                            : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Export Column Picker Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowExportModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">Export Columns</h3>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Select columns and filters for the Excel export.</p>
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Filter by Gender</p>
              <div className="flex gap-3">
                {Object.entries(genderFilter).map(([g, v]) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={v}
                      onChange={() => setGenderFilter(prev => ({ ...prev, [g]: !prev[g] }))}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-slate-700 group-hover:text-slate-900 font-medium">{g}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Filter by Year of Study</p>
              <div className="flex gap-3">
                {Object.entries(yearFilter).map(([y, v]) => (
                  <label key={y} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={v}
                      onChange={() => setYearFilter(prev => ({ ...prev, [y]: !prev[y] }))}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-slate-700 group-hover:text-slate-900 font-medium">{y}</span>
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
              disabled={!Object.values(exportColumns).some(v => v) || !Object.values(genderFilter).some(v => v) || !Object.values(yearFilter).some(v => v)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
              <Download size={14} /> Export to Excel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersList;