import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { memberService } from "../../../api/jumuiyaMemberService";
import { GraduationCap, RefreshCw, Undo2, X, Search } from "lucide-react";

interface Props {
  jumuiyaId: string;
  jumuiyaName: string;
}

const AssociateRow = memo(({ a, onUndo }: { a: any; onUndo: (id: string) => void }) => (
  <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
    <td className="py-3 px-4 font-medium text-slate-800 text-xs">{a.member_id}</td>
    <td className="py-3 px-4 text-slate-700 text-sm">{a.name}</td>
    <td className="py-3 px-4">
      <span className={`text-xs font-semibold ${a.gender === "Male" ? "text-blue-600" : a.gender === "Female" ? "text-pink-600" : "text-slate-400"}`}>
        {a.gender === "Male" ? "M" : a.gender === "Female" ? "W" : "—"}
      </span>
    </td>
    <td className="py-3 px-4 text-slate-500 text-xs">{a.admission_year || "—"}</td>
    <td className="py-3 px-4 text-slate-500 text-xs">{a.graduation_year || "—"}</td>
    <td className="py-3 px-4">
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${
        a.source === "legacy" ? "bg-amber-50 text-amber-700" :
        a.source === "csa" ? "bg-cyan-50 text-cyan-700" :
        a.source === "jum" ? "bg-indigo-50 text-indigo-700" : "bg-slate-50 text-slate-700"
      }`}>
        {a.source === "legacy" ? "Legacy" : a.source === "csa" ? "CSA" : a.source === "jum" ? "Jum" : "Import"}
      </span>
    </td>
    <td className="py-3 px-4">
      <button onClick={() => onUndo(a.member_id)}
        className="text-xs font-semibold px-2 py-1 rounded bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
        title="Undo migration">
        <Undo2 size={12} />
      </button>
    </td>
  </tr>
));

AssociateRow.displayName = "AssociateRow";

const AssociatesList: React.FC<Props> = ({ jumuiyaId, jumuiyaName }) => {
  const [associates, setAssociates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [graduationFilter, setGraduationFilter] = useState<string>("");
  const [genderFilter, setGenderFilter] = useState({ Male: true, Female: true });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const years: Record<string, boolean> = {};
    associates.forEach(a => { if (a.graduation_year) years[String(a.graduation_year)] = true; });
    if (Object.keys(years).length > 0) setGraduationFilter(prev => Object.keys(prev).length === 0 ? years : prev);
  }, [associates]);

  const fetchAssociates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await memberService.getAssociatesList({ jumuiya_id: jumuiyaId });
      setAssociates(res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to load associates");
    } finally {
      setLoading(false);
    }
  }, [jumuiyaId]);

  useEffect(() => { fetchAssociates(); }, [jumuiyaId]);

  const graduationYears = useMemo(() => {
    const years = new Set<number>();
    associates.forEach(a => { if (a.graduation_year) years.add(a.graduation_year); });
    return Array.from(years).sort((a, b) => b - a);
  }, [associates]);

  const filtered = useMemo(() => {
    const activeGenders = Object.entries(genderFilter).filter(([, v]) => v).map(([k]) => k);
    return associates.filter(a => {
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        if (!(a.name || "").toLowerCase().includes(q) &&
            !(a.member_id || "").toLowerCase().includes(q)) return false;
      }
      if (graduationFilter && a.graduation_year !== parseInt(graduationFilter)) return false;
      const g = (a.gender || "").toLowerCase();
      if (!((g === "male") && activeGenders.includes("Male")) &&
          !((g === "female") && activeGenders.includes("Female")) &&
          !(!g && activeGenders.length > 0)) return false;
      return true;
    });
  }, [associates, debouncedSearch, graduationFilter, genderFilter]);

  const handleUndo = async (memberId: string) => {
    if (!confirm(`Undo migration for ${memberId}? This will restore them as an active member.`)) return;
    try {
      await memberService.undoAssociateMigration(memberId);
      setAssociates(prev => prev.filter(a => a.member_id !== memberId));
    } catch (err: any) {
      alert(err?.message || "Failed to undo migration");
    }
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
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap size={20} className="text-indigo-500" />
            Associates (Alumni) — {jumuiyaName}
          </h3>
          <p className="text-xs text-slate-500">{associates.length} graduated member(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-8 pr-8 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 w-48" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
          <button onClick={fetchAssociates}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {graduationYears.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[180px]">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Graduation Year</p>
              <select value={graduationFilter} onChange={e => setGraduationFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white max-h-[200px]">
                <option value="">All Years</option>
                {graduationYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Gender</p>
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
          </div>
          <p className="text-xs text-slate-400">{filtered.length} of {associates.length} shown</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {associates.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <GraduationCap size={32} className="text-slate-200 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No associates for this jumuiya.</p>
          <p className="text-slate-300 text-xs mt-1">Graduated members appear here after migration.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-400 text-sm">No associates match the current filters.</p>
          <p className="text-slate-300 text-xs mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Reg #</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Gender</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Admission</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Graduation</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Source</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <AssociateRow key={a.id || a.member_id} a={a} onUndo={handleUndo} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AssociatesList;
