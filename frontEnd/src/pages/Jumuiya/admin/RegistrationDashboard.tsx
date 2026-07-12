import { useState, useEffect } from "react";
import { memberService } from "../../../api/jumuiyaMemberService";
import { Calendar, Users, CheckCircle, AlertTriangle, Download, Plus, X, GitMerge, RefreshCw, GraduationCap } from "lucide-react";
import * as XLSX from "xlsx";

function getYearOfStudy(reg: string): number {
  const match = (reg || "").match(/(\d{2})\s*$/);
  if (!match) return 0;
  const admissionYear = 2000 + parseInt(match[1]);
  const now = new Date();
  const month = now.getMonth() + 1;
  const cy = now.getFullYear();
  const acaStart = month >= 9 ? cy : cy - 1;
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
  const acaStart = month >= 9 ? cy : cy - 1;
  return acaStart - admissionYear + 1 > 4;
}

interface Props {
  jumuiyaId: string;
  jumuiyaName: string;
  jumuiyaColor: string;
}

const RegistrationDashboard: React.FC<Props> = ({ jumuiyaId, jumuiyaName, jumuiyaColor }) => {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [seasonForm, setSeasonForm] = useState({ season_name: "", start_date: "", end_date: "", status: "planning" });
  const [creating, setCreating] = useState(false);
  const [csaAllocations, setCsaAllocations] = useState<any[]>([]);
  const [csaLoading, setCsaLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportColumns, setExportColumns] = useState({
    RegNo: true, Name: true, Gender: true, Email: true,
    Phone: true, Year: true, Joined: true, Source: true,
  });
  const [genderFilter, setGenderFilter] = useState({ Male: true, Female: true });
  const [yearFilter, setYearFilter] = useState({ "1st": true, "2nd": true, "3rd": true, "4th+": true });
  const [pendingGraduates, setPendingGraduates] = useState<string[]>([]);
  const [migrating, setMigrating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [seasonsRes, statsRes, csaRes, pendingRes] = await Promise.all([
        memberService.getSeasons(jumuiyaId),
        memberService.getStatistics(jumuiyaId),
        memberService.getCsaAllocations(jumuiyaId),
        memberService.getAssociatesPending({ jumuiya_id: jumuiyaId }).catch(() => ({ data: [] })),
      ]);
      setSeasons(seasonsRes.data || []);
      setStats(statsRes.data || null);
      setCsaAllocations(csaRes.data?.members || []);
      setPendingGraduates((pendingRes.data || []).map((m: any) => m.member_id));
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [jumuiyaId]);

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await memberService.createSeason(jumuiyaId, seasonForm);
      setShowSeasonModal(false);
      setSeasonForm({ season_name: "", start_date: "", end_date: "", status: "planning" });
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to create season");
    } finally {
      setCreating(false);
    }
  };

  const handleActivateSeason = async (id: number) => {
    setError(null);
    try {
      await memberService.updateSeason(jumuiyaId, id, { status: "active" });
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to activate season");
    }
  };

  const handleExportMembers = async () => {
    try {
      const res = await memberService.exportMembers(jumuiyaId);
      const activeGenders = Object.entries(genderFilter).filter(([, v]) => v).map(([k]) => k);
      const activeYears = Object.entries(yearFilter).filter(([, v]) => v).map(([k]) => k);
      const labelToNum: Record<string, number> = { "1st": 1, "2nd": 2, "3rd": 3, "4th+": 4 };
      const filteredRows = res.data.filter((row: any) => {
        if (!activeGenders.includes(row.Gender)) return false;
        const yr = getYearOfStudy(row.RegNo);
        const label = yr >= 4 ? "4th+" : yr === 3 ? "3rd" : yr === 2 ? "2nd" : yr === 1 ? "1st" : null;
        return label ? activeYears.includes(label) : activeYears.length > 0;
      });
      const selected = Object.entries(exportColumns).filter(([, v]) => v).map(([k]) => k);
      const filtered = filteredRows.map((row: any) =>
        Object.fromEntries(selected.map(k => [k, row[k]]))
      );
      const ws = XLSX.utils.json_to_sheet(filtered);
      ws["!cols"] = selected.map(k => ({
        wch: k === "Name" || k === "Email" ? 30 : k === "RegNo" || k === "Phone" ? 18 : k === "Year" || k === "Joined" ? 14 : 10,
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Members");
      XLSX.writeFile(wb, `${jumuiyaName.replace(/\s+/g, "-")}-members.xlsx`);
      setShowExportModal(false);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Export failed");
    }
  };

  const toggleExportColumn = (col: string) => {
    setExportColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const handleMigrateGraduates = async () => {
    if (!confirm(`Migrate ${pendingGraduates.length} graduated member(s) to Associates? They will no longer appear in ${jumuiyaName}'s active members.`)) return;
    setMigrating(true);
    try {
      const res = await memberService.migrateToAssociates({ member_ids: pendingGraduates });
      alert(`${res.migrated || 0} member(s) migrated successfully.`);
      setPendingGraduates([]);
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Migration failed");
    } finally {
      setMigrating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-lg w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Registration Dashboard</h3>
          <p className="text-xs text-slate-500">Overview of members, seasons, and registration status.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => setShowSeasonModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={14} /> New Season
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {pendingGraduates.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {pendingGraduates.length} graduated member(s) in {jumuiyaName} pending migration
              </p>
              <p className="text-xs text-amber-600">
                These members have completed their 4th year. Migrate them to the Associates table.
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

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Users size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.totalMembers || 0}</p>
                <p className="text-xs text-slate-500 font-medium">Total Members</p>
              </div>
            </div>
          </div>
          <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Users size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.jum?.total || 0}</p>
                <p className="text-xs text-slate-500 font-medium">Jum Members</p>
              </div>
            </div>
          </div>
          <div className="bg-cyan-50 rounded-xl border border-cyan-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-600">
                <CheckCircle size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.csa?.total || 0}</p>
                <p className="text-xs text-slate-500 font-medium">CSA Members</p>
              </div>
            </div>
          </div>
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                <Users size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.groups?.length || 0}</p>
                <p className="text-xs text-slate-500 font-medium">Groups</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active season banner */}
      {stats?.activeSeason && (
        <div className="rounded-xl px-5 py-4 text-white flex items-center gap-3" style={{ background: `linear-gradient(135deg, ${jumuiyaColor}, ${jumuiyaColor}dd)` }}>
          <Calendar size={20} />
          <div>
            <p className="font-semibold text-sm">Active Season: {stats.activeSeason.season_name}</p>
            <p className="text-xs opacity-80">{stats.activeSeason.start_date?.slice(0, 10)} — {stats.activeSeason.end_date?.slice(0, 10)}</p>
          </div>
        </div>
      )}

      {/* Gender Breakdown */}
      {stats?.genderBreakdown && stats.genderBreakdown.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Gender Breakdown</h4>
          <div className="flex gap-3">
            {stats.genderBreakdown.map((g: any) => (
              <div
                key={g.gender}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  g.gender === "Male" ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-pink-50 text-pink-700 border border-pink-100"
                }`}
              >
                {g.gender}: <strong>{g.count}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seasons Table */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Registration Seasons</h4>
        {seasons.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <Calendar size={32} className="text-slate-200 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No seasons created yet.</p>
            <p className="text-slate-300 text-xs mt-1">Create your first registration season to begin importing members.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Season</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Start Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">End Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {seasons.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800">{s.season_name}</td>
                    <td className="py-3 px-4 text-slate-500">{s.start_date?.slice(0, 10)}</td>
                    <td className="py-3 px-4 text-slate-500">{s.end_date?.slice(0, 10)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        s.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : s.status === "closed"
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {s.status === "planning" && (
                        <button
                          onClick={() => handleActivateSeason(s.id)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CSA Allocations — members assigned from central admissions */}
      {csaAllocations.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <GitMerge size={15} className="text-indigo-500" />
            Allocated from Central Admissions ({csaAllocations.length})
          </h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-2.5 px-3 font-semibold text-slate-500 text-xs uppercase">Name</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-slate-500 text-xs uppercase">Reg #</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-slate-500 text-xs uppercase">Gender</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-slate-500 text-xs uppercase">Phone</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-slate-500 text-xs uppercase">Email</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-slate-500 text-xs uppercase">Academic Year</th>
                </tr>
              </thead>
              <tbody>
                {csaAllocations.map((m: any) => (
                  <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 font-medium text-slate-700">{m.name}</td>
                    <td className="py-2 px-3 text-slate-500">{m.reg_number || "—"}</td>
                    <td className="py-2 px-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.gender === "Male" ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"}`}>
                        {m.gender === "Male" ? "M" : "W"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-500">{m.phone || "—"}</td>
                    <td className="py-2 px-3 text-slate-500">{m.email || "—"}</td>
                    <td className="py-2 px-3 text-slate-500">{m.academic_year || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
                    <span className="text-sm text-slate-700 group-hover:text-slate-900 font-medium">{g === "Male" ? "Male" : "Ladies"}</span>
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

      {/* Create Season Modal */}
      {showSeasonModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowSeasonModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">Create Registration Season</h3>
              <button onClick={() => setShowSeasonModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSeason} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Season Name</label>
                <input
                  required
                  value={seasonForm.season_name}
                  onChange={(e) => setSeasonForm({ ...seasonForm, season_name: e.target.value })}
                  placeholder='e.g., "2026A"'
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Start Date</label>
                <input
                  type="date" required
                  value={seasonForm.start_date}
                  onChange={(e) => setSeasonForm({ ...seasonForm, start_date: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">End Date</label>
                <input
                  type="date" required
                  value={seasonForm.end_date}
                  onChange={(e) => setSeasonForm({ ...seasonForm, end_date: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowSeasonModal(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors">
                  {creating ? "Creating..." : "Create Season"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationDashboard;
