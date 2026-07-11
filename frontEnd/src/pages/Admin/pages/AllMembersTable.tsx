import { useState, useEffect, useMemo, useCallback } from "react";
import { memberService } from "../../../api/jumuiyaMemberService";
import { Users, Search, X, Edit2, Save, Trash2, ChevronLeft, ChevronRight, RefreshCw, Church, ArrowUpDown, ArrowUp, ArrowDown, Download, GraduationCap, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";

const JUMUIYAS = [
  { id: "st-anthony", name: "St. Anthony" },
  { id: "st-augustine", name: "St. Augustine" },
  { id: "st-catherine", name: "St. Catherine" },
  { id: "st-dominic", name: "St. Dominic" },
  { id: "st-elizabeth", name: "St. Elizabeth" },
  { id: "st-maria-goretti", name: "St. Maria Goretti" },
  { id: "st-monica", name: "St. Monica" },
];

function formatJumuiyaName(slugOrUuid: string): string {
  if (!slugOrUuid) return "—";
  const found = JUMUIYAS.find(j => j.id === slugOrUuid);
  if (found) return found.name;
  return slugOrUuid.length > 20 ? slugOrUuid.slice(0, 8) + "…" : slugOrUuid;
}

function getYearOfStudy(reg: string): number {
  const match = (reg || "").match(/(\d{2})\s*$/);
  if (!match) return 0;
  const admissionYear = 2000 + parseInt(match[1]);
  const now = new Date();
  const month = now.getMonth() + 1;
  const cy = now.getFullYear();
  const acaStart = month >= 5 ? cy : cy - 1;
  const year = acaStart - admissionYear + 1;
  return year > 4 ? 4 : year;
}

function isGraduated(reg: string): boolean {
  const match = (reg || "").match(/(\d{2})\s*$/);
  if (!match) return false;
  const admissionYear = 2000 + parseInt(match[1]);
  const now = new Date();
  const month = now.getMonth() + 1;
  const cy = now.getFullYear();
  const acaStart = month >= 5 ? cy : cy - 1;
  return acaStart - admissionYear + 1 > 4;
}

const styles = `
  .hide-scrollbar::-webkit-scrollbar { display: none; }
`;

export default function AllMembersTable({ refreshKey = 0 }: { refreshKey?: number }) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"jumuiya" | "gender">("jumuiya");
  const [sortAsc, setSortAsc] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportColumns, setExportColumns] = useState({
    RegNo: true, Name: true, Gender: true, Course: true,
    Phone: true, Year: true, Jumuiya: true, Source: true,
  });
  const [genderFilter, setGenderFilter] = useState({ Male: true, Female: true });
  const [yearFilter, setYearFilter] = useState({ "1st": true, "2nd": true, "3rd": true, "4th+": true });
  const [pendingGraduates, setPendingGraduates] = useState<string[]>([]);
  const [migrating, setMigrating] = useState(false);
  const itemsPerPage = 25;

  const jumuiyaOrder: Record<string, number> = {
    "St. Anthony": 0,
    "St. Augustine": 1,
    "St. Catherine": 2,
    "St. Dominic": 3,
    "St. Elizabeth": 4,
    "St. Maria Goretti": 5,
    "St. Monica": 6,
  };

  const handleExportMembers = () => {
    try {
      const activeGenders = Object.entries(genderFilter).filter(([, v]) => v).map(([k]) => k);
      const activeYears = Object.entries(yearFilter).filter(([, v]) => v).map(([k]) => k);
      const filteredByGender = members.filter((row: any) => {
        const g = (row.gender || "").toLowerCase();
        if (!((g === "male" && activeGenders.includes("Male")) ||
              (g === "female" && activeGenders.includes("Female")) ||
              (!g && activeGenders.length > 0))) return false;
        const yr = getYearOfStudy(row.member_id || row.id || "");
        const label = yr >= 4 ? "4th+" : yr === 3 ? "3rd" : yr === 2 ? "2nd" : yr === 1 ? "1st" : null;
        return label ? activeYears.includes(label) : activeYears.length > 0;
      });
      const selected = Object.entries(exportColumns).filter(([, v]) => v).map(([k]) => k);
      const mapped = filteredByGender.map((row: any) => {
        const out: any = {};
        selected.forEach(k => {
          if (k === "RegNo") out.RegNo = row.member_id || row.id || "";
          else if (k === "Name") out.Name = row.name || "";
          else if (k === "Gender") out.Gender = row.gender === "male" || row.gender === "Male" ? "Male" : row.gender === "female" || row.gender === "Female" ? "Female" : row.gender || "";
          else if (k === "Course") out.Course = row.course || "";
          else if (k === "Phone") out.Phone = row.phone || "";
          else if (k === "Year") out.Year = row.year || row.year_of_study || "";
          else if (k === "Jumuiya") out.Jumuiya = row.jumuiya_name || formatJumuiyaName(row.jumuiya_id);
          else if (k === "Source") out.Source = row.source === "csa" ? "CSA" : row.source === "jum" ? "Jum" : row.source || "";
        });
        return out;
      });
      const ws = XLSX.utils.json_to_sheet(mapped);
      ws["!cols"] = selected.map(k => ({
        wch: k === "Name" || k === "Email" || k === "Jumuiya" ? 30 : k === "RegNo" || k === "Phone" ? 18 : k === "Year" ? 14 : 10,
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "All Members");
      XLSX.writeFile(wb, "all-csa-members.xlsx");
      setShowExportModal(false);
    } catch (err: any) {
      alert(err?.message || "Export failed");
    }
  };

  const toggleExportColumn = (col: string) => {
    setExportColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const handleMigrateGraduates = async () => {
    if (!confirm(`Migrate ${pendingGraduates.length} graduated member(s) to Associates? They will no longer appear in the active members list.`)) return;
    setMigrating(true);
    try {
      const res = await memberService.migrateToAssociates({ member_ids: pendingGraduates });
      alert(`${res.migrated || 0} member(s) migrated successfully.`);
      setPendingGraduates([]);
      fetchMembers();
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.message || "Migration failed");
    } finally {
      setMigrating(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await memberService.getAllMembersAcrossJumuiyas();
      setMembers(res.data || []);
      const graduated = (res.data || []).filter((m: any) => isGraduated(m.member_id || m.id || "")).map((m: any) => m.member_id || m.id);
      setPendingGraduates(graduated);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to fetch members");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMembers(); }, [refreshKey]);

  const handleEdit = (m: any) => {
    const nameStr = m.name || "";
    const nameParts = nameStr.split(" ");
    const reg = (m.member_id || m.id || "").toString();
    const yr = getYearOfStudy(reg) || parseInt(m.year) || "";
    setEditingId(m.member_id || m.id);
    setEditForm({
      member_id: reg,
      first_name: m.first_name || nameParts[0] || "",
      last_name: m.last_name || nameParts.slice(1).join(" ") || "",
      course: m.course || "",
      phone: m.phone || "",
      gender: m.gender || "",
      year_of_study: yr,
      jumuiya_id: m.jumuiya_id || "",
    });
  };

  const handleSave = async (memberId: string) => {
    setSaving(true);
    try {
      const payload = { ...editForm };
      if (payload.member_id === memberId) delete payload.member_id;
      const res = await memberService.updateMember(memberId, payload);
      setMembers(prev => prev.map(m =>
        (m.member_id === memberId || m.id === memberId)
          ? { ...m, ...res.data, name: res.data.name }
          : m
      ));
      setEditingId(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update member");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (memberId: string) => {
    if (!confirm("Permanently delete this member from the entire system?\n\nThis action cannot be undone.")) return;
    setDeleting(memberId);
    try {
      await memberService.deleteMember(memberId);
      setMembers(prev => prev.filter(m => m.member_id !== memberId && m.id !== memberId));
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete member");
    } finally {
      setDeleting(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const toggleSort = (column: "jumuiya" | "gender") => {
    if (sortBy === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(column);
      setSortAsc(true);
    }
  };

  const filtered = useMemo(() => {
    const activeGenders = Object.entries(genderFilter).filter(([, v]) => v).map(([k]) => k);
    const activeYears = Object.entries(yearFilter).filter(([, v]) => v).map(([k]) => k);
    let result = members.filter(m => {
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        if (!(m.name || "").toLowerCase().includes(q) &&
            !(m.course || "").toLowerCase().includes(q) &&
            !(m.member_id || "").toLowerCase().includes(q)) return false;
      }
      const g = (m.gender || "").toLowerCase();
      if (!((g === "male" || g === "Male") && activeGenders.includes("Male")) &&
          !((g === "female" || g === "Female") && activeGenders.includes("Female")) &&
          !(!g && activeGenders.length > 0)) return false;
      const yr = getYearOfStudy(m.member_id || m.id || "");
      const fallback = parseInt(m.year) || 0;
      const effective = yr || fallback;
      const label = effective >= 4 ? "4th+" : effective === 3 ? "3rd" : effective === 2 ? "2nd" : effective === 1 ? "1st" : null;
      if (label && !activeYears.includes(label)) return false;
      return true;
    });
    result.sort((a, b) => {
      const aJ = jumuiyaOrder[a.jumuiya_name || a.jumuiya_id] ?? 99;
      const bJ = jumuiyaOrder[b.jumuiya_name || b.jumuiya_id] ?? 99;
      const aGen = (a.gender || "").toLowerCase();
      const bGen = (b.gender || "").toLowerCase();
      const aG = aGen === "female" ? 0 : aGen === "male" ? 1 : 2;
      const bG = bGen === "female" ? 0 : bGen === "male" ? 1 : 2;

      if (sortBy === "gender") {
        if (aG !== bG) return sortAsc ? aG - bG : bG - aG;
        return aJ - bJ;
      }
      if (sortBy === "jumuiya") {
        if (aJ !== bJ) return sortAsc ? aJ - bJ : bJ - aJ;
        return aG - bG;
      }
      return 0;
    });
    return result;
  }, [members, debouncedSearch, sortBy, sortAsc, genderFilter, yearFilter]);

  const { paginatedMembers, totalPages } = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return {
      paginatedMembers: filtered.slice(start, end),
      totalPages: Math.ceil(filtered.length / itemsPerPage)
    };
  }, [filtered, currentPage]);

  const totalJum = members.filter(m => m.source === "jum").length;
  const totalCSA = members.filter(m => m.source === "csa").length;

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
      {/* Dashboard summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-3xl font-bold text-slate-800">{members.length}</p>
          <p className="text-xs text-slate-500 font-medium">Total Members</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-3xl font-bold text-indigo-600">{totalJum}</p>
          <p className="text-xs text-slate-500 font-medium">Jum</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-3xl font-bold text-cyan-600">{totalCSA}</p>
          <p className="text-xs text-slate-500 font-medium">CSA Distributed</p>
        </div>
      </div>

      {/* Search + Refresh */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800">All Members Across Jumuiyas</h3>
          <p className="text-xs text-slate-500">
            {members.length} total member(s)
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

      {pendingGraduates.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {pendingGraduates.length} graduated member(s) pending migration
              </p>
              <p className="text-xs text-amber-600">
                These members have completed their 4th year. Migrate them to the Associates table to keep active records clean.
              </p>
            </div>
          </div>
          <button
            onClick={handleMigrateGraduates}
            disabled={migrating}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <GraduationCap size={14} /> {migrating ? "Migrating..." : `Migrate ${pendingGraduates.length} to Associates`}
          </button>
        </div>
      )}

      {members.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Church size={32} className="text-slate-200 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No members found across any Jumuiya.</p>
          <p className="text-slate-300 text-xs mt-1">Members appear here from legacy records, imports, or CSA distribution.</p>
        </div>
      ) : (
        <>
          <style>{styles}</style>
          <div className="rounded-xl border border-slate-200 max-h-[600px] overflow-y-auto hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider w-10">No.</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Reg #</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Name</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    <button onClick={() => toggleSort("jumuiya")} className="flex items-center gap-1 hover:text-slate-700 transition-colors">
                      Jumuiya
                      {sortBy === "jumuiya" ? (sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="opacity-30" />}
                    </button>
                  </th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Source</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    <button onClick={() => toggleSort("gender")} className="flex items-center gap-1 hover:text-slate-700 transition-colors">
                      Gender
                      {sortBy === "gender" ? (sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="opacity-30" />}
                    </button>
                  </th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Course</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Phone</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Year</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMembers.map((m, idx) => {
                  const memberId = m.member_id || m.id;
                  const isEditing = editingId === memberId;
                  const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <tr key={memberId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-slate-400 text-xs">{rowNumber}</td>
                      <td className="py-2.5 px-3">
                        {isEditing ? (
                          <input value={editForm.member_id} onChange={e => {
                            const newReg = e.target.value;
                            setEditForm(p => ({ ...p, member_id: newReg, year_of_study: getYearOfStudy(newReg) || p.year_of_study }));
                          }}
                            className="text-xs border border-slate-200 rounded px-1.5 py-1 w-28 font-mono" />
                        ) : (
                          <span className="font-medium text-slate-800 text-xs">{memberId}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <input value={editForm.first_name} onChange={e => setEditForm(p => ({ ...p, first_name: e.target.value }))}
                              placeholder="First" className="text-xs border border-slate-200 rounded px-1.5 py-1 w-20" />
                            <input value={editForm.last_name} onChange={e => setEditForm(p => ({ ...p, last_name: e.target.value }))}
                              placeholder="Last" className="text-xs border border-slate-200 rounded px-1.5 py-1 w-20" />
                          </div>
                        ) : (
                          <span className="text-slate-700 font-medium text-xs">{m.name}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {isEditing ? (
                          <select value={editForm.jumuiya_id} onChange={e => setEditForm(p => ({ ...p, jumuiya_id: e.target.value }))}
                            className="text-xs border border-slate-200 rounded px-1.5 py-1 w-28">
                            <option value="">— None —</option>
                            {JUMUIYAS.map(j => (
                              <option key={j.id} value={j.id}>{j.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`text-xs ${m.is_active === false ? 'text-red-500 font-semibold' : 'text-slate-600'}`}>{m.jumuiya_name || formatJumuiyaName(m.jumuiya_id)}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${
                          m.source === "jum" ? "bg-indigo-50 text-indigo-700" :
                          m.source === "csa" ? "bg-cyan-50 text-cyan-700" :
                          "bg-slate-50 text-slate-700"
                        }`}>
                          {m.source === "csa" ? "CSA" : "Jum"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {isEditing ? (
                          <select value={editForm.gender} onChange={e => setEditForm(p => ({ ...p, gender: e.target.value }))}
                            className="text-xs border border-slate-200 rounded px-1.5 py-1">
                            <option value="">—</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        ) : (
                          <span className={`text-xs font-semibold ${m.gender === "male" || m.gender === "Male" ? "text-blue-600" : m.gender === "female" || m.gender === "Female" ? "text-pink-600" : "text-slate-400"}`}>
                            {m.gender === "male" || m.gender === "Male" ? "M" : m.gender === "female" || m.gender === "Female" ? "W" : "—"}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {isEditing ? (
                          <input value={editForm.course} onChange={e => setEditForm(p => ({ ...p, course: e.target.value }))}
                            className="text-xs border border-slate-200 rounded px-1.5 py-1 w-24" />
                        ) : (
                          <span className="text-slate-500 text-xs">{m.course || "—"}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {isEditing ? (
                          <input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                            className="text-xs border border-slate-200 rounded px-1.5 py-1 w-20" />
                        ) : (
                          <span className="text-slate-500 text-xs">{m.phone || "—"}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-slate-500 text-xs">{isEditing ? editForm.year_of_study || "—" : m.year || "—"}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex gap-1">
                          {isEditing ? (
                            <>
                              <button onClick={() => handleSave(memberId)} disabled={saving}
                                className="text-xs font-semibold px-2 py-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 disabled:opacity-50">
                                <Save size={12} />
                              </button>
                              <button onClick={handleCancel}
                                className="text-xs font-semibold px-2 py-1 rounded bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200">
                                <X size={12} />
                              </button>
                            </>
                          ) : (
                            <button onClick={() => handleEdit(m)}
                              className="text-xs font-semibold px-2 py-1 rounded bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200">
                              <Edit2 size={12} />
                            </button>
                          )}
                          <button onClick={() => handleDelete(memberId)} disabled={deleting === memberId}
                            className="text-xs font-semibold px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 disabled:opacity-50">
                            {deleting === memberId ? "..." : <Trash2 size={12} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-500 font-medium">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                    let page: number;
                    if (totalPages <= 7) {
                      page = i + 1;
                    } else if (currentPage <= 4) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      page = totalPages - 6 + i;
                    } else {
                      page = currentPage - 3 + i;
                    }
                    const isActive = page === currentPage;
                    return (
                      <button key={page} onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg font-semibold text-xs transition-colors ${
                          isActive ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}>
                        {page}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
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
            <p className="text-xs text-slate-500 mb-4">Select the columns to include in the Excel export.</p>
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Filter by Gender</p>
              <div className="flex gap-3">
                {Object.entries(genderFilter).map(([g, v]) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={v}
                      onChange={() => setGenderFilter(prev => ({ ...prev, [g]: !prev[g] }))}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700 group-hover:text-slate-900 font-medium">{g === "Male" ? "Male" : "Female"}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Filter by Year of Study</p>
              <div className="flex gap-3">
                {Object.entries(yearFilter).map(([y, v]) => (
                  <label key={y} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={v}
                      onChange={() => setYearFilter(prev => ({ ...prev, [y]: !prev[y] }))}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700 group-hover:text-slate-900 font-medium">{y}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4 space-y-3 mb-6">
              {Object.keys(exportColumns).map(col => (
                <label key={col} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={(exportColumns as any)[col]}
                    onChange={() => toggleExportColumn(col)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700 group-hover:text-slate-900 font-medium">{col}</span>
                </label>
              ))}
            </div>
            <button
              onClick={handleExportMembers}
              disabled={!Object.values(exportColumns).some(v => v) || !Object.values(genderFilter).some(v => v) || !Object.values(yearFilter).some(v => v)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download size={14} /> Export to Excel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
