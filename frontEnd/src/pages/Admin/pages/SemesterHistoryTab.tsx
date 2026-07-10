import { useState, useEffect, useMemo } from "react";
import { memberService } from "../../../api/jumuiyaMemberService";
import { Search, RefreshCw, Loader2, Check, X } from "lucide-react";

const SEMESTERS = [
  { label: "1.1", dbCol: "sem_1", year: 1 },
  { label: "1.2", dbCol: "sem_2", year: 1 },
  { label: "2.1", dbCol: "sem_3", year: 2 },
  { label: "2.2", dbCol: "sem_4", year: 2 },
  { label: "3.1", dbCol: "sem_5", year: 3 },
  { label: "3.2", dbCol: "sem_6", year: 3 },
  { label: "4.1", dbCol: "sem_7", year: 4 },
  { label: "4.2", dbCol: "sem_8", year: 4 },
];

export default function SemesterHistoryTab() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterJumuiya, setFilterJumuiya] = useState<string>("all");
  const [filterAdmissionFrom, setFilterAdmissionFrom] = useState("");
  const [filterAdmissionTo, setFilterAdmissionTo] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterAdmissionFrom) params.from_year = parseInt(filterAdmissionFrom);
      if (filterAdmissionTo) params.to_year = parseInt(filterAdmissionTo);
      const res = await memberService.getSemesterHistory(params);
      setData(res.data || []);
    } catch (err) {
      console.error("Failed to fetch semester history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    let result = [...data];
    if (filterJumuiya !== "all") {
      result = result.filter(m => m.jumuiya_slug === filterJumuiya);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(m =>
        (m.name || "").toLowerCase().includes(q) ||
        (m.reg_number || "").toLowerCase().includes(q) ||
        (m.course || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [data, search, filterJumuiya]);

  const jumuiyas = useMemo(() => {
    const set = new Set<string>();
    data.forEach(m => { if (m.jumuiya_slug) set.add(m.jumuiya_slug); });
    return Array.from(set).sort();
  }, [data]);

  const admissionYears = useMemo(() => {
    const set = new Set<number>();
    data.forEach(m => { if (m.admission_year) set.add(m.admission_year); });
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  const currentYear = useMemo(() => {
    const month = new Date().getMonth();
    const isSecondSem = month < 4;
    return isSecondSem ? "2nd Semester" : "1st Semester";
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Semester Registration History</h3>
          <p className="text-xs text-slate-400">Current: {currentYear}</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or reg number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <select
          value={filterJumuiya}
          onChange={e => setFilterJumuiya(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
        >
          <option value="all">All Jumuiyas</option>
          {jumuiyas.map(slug => (
            <option key={slug} value={slug}>{slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
        <select
          value={filterAdmissionFrom}
          onChange={e => { setFilterAdmissionFrom(e.target.value); setTimeout(fetchData, 0); }}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
        >
          <option value="">From Year</option>
          {admissionYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={filterAdmissionTo}
          onChange={e => { setFilterAdmissionTo(e.target.value); setTimeout(fetchData, 0); }}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
        >
          <option value="">To Year</option>
          {admissionYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wider">Reg #</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wider">Course</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wider">Jumuiya</th>
                <th className="px-3 py-2.5 text-center font-semibold text-slate-500 uppercase tracking-wider">Yr</th>
                <th className="px-3 py-2.5 text-center font-semibold text-slate-500 uppercase tracking-wider">Adm</th>
                {SEMESTERS.map(s => (
                  <th key={s.dbCol} className="px-2 py-2.5 text-center font-semibold text-slate-500 uppercase tracking-wider">{s.label}</th>
                ))}
                <th className="px-3 py-2.5 text-center font-semibold text-slate-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-4 py-12 text-center text-slate-400">No records found</td>
                </tr>
              ) : (
                filtered.map((m, i) => (
                  <tr key={m.reg_number} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-blue-50/50 transition-colors`}>
                    <td className="px-3 py-2 font-mono text-[11px] text-slate-600">{m.reg_number}</td>
                    <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">{m.name}</td>
                    <td className="px-3 py-2 text-slate-500">{m.course || "—"}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{m.jumuiya_name || "—"}</td>
                    <td className="px-3 py-2 text-center text-slate-600">{m.year_of_study}</td>
                    <td className="px-3 py-2 text-center text-slate-600">{m.admission_year}</td>
                    {SEMESTERS.map(s => {
                      const registered = m.semesters?.[s.dbCol] === true;
                      return (
                        <td key={s.dbCol} className="px-2 py-2 text-center">
                          {registered ? (
                            <Check size={14} className="inline text-green-500" />
                          ) : (
                            <X size={14} className="inline text-slate-200" />
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        m.total_semesters === 8
                          ? "bg-green-100 text-green-700"
                          : m.total_semesters === 0
                          ? "bg-red-100 text-red-600"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {m.total_semesters}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
            Showing {filtered.length} of {data.length} members
          </div>
        </div>
      )}
    </div>
  );
}