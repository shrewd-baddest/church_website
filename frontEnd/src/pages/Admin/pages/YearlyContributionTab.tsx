import { useState, useEffect } from "react";
import { memberService } from "../../../api/jumuiyaMemberService";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { Trophy, Users, RefreshCw, Calendar, Church } from "lucide-react";

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 4 }, (_, i) => currentYear - 3 + i);

function getJumuiyaLabel(name: string): string {
  return name.replace("St. ", "");
}

export default function YearlyContributionTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [year, setYear] = useState(currentYear);

  const fetchData = async (y: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await memberService.getYearlyContribution({ year: y });
      setData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load yearly data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(year); }, [year]);

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
        <button onClick={() => fetchData(year)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  if (!data || !data.jumuiyas) return null;

  const { totalRegistered, totalMembers, topContributor, jumuiyas } = data;

  const chartData = jumuiyas.map((j: any) => ({
    name: getJumuiyaLabel(j.jumuiyaName),
    count: j.registeredCount,
    total: j.totalMembers,
    pct: totalRegistered > 0 ? Math.round((j.registeredCount / totalRegistered) * 100) : 0,
    color: j.jumuiyaColor,
    slug: j.jumuiyaSlug,
  }));

  return (
    <div className="space-y-6">
      {/* Year Selector + Top Years */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-slate-200 p-3">
        <Calendar size={16} className="text-slate-400" />
        <span className="text-sm font-semibold text-slate-700">Registration Year</span>
        <select
          value={year}
          onChange={e => setYear(parseInt(e.target.value))}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {YEAR_OPTIONS.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <div className="flex items-center gap-2 ml-auto">
          {data.topYears?.map((ty: any) => (
            <button
              key={ty.year}
              onClick={() => setYear(ty.year)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                year === ty.year
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              }`}
            >
              <Trophy size={12} />
              <span>{ty.year}</span>
              <span className={year === ty.year ? 'text-blue-200' : 'text-amber-500'}>{ty.registered}/{ty.total}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="flex flex-wrap gap-2">
        <div className="bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl p-3 text-white min-w-[180px] flex-1 max-w-[240px]">
          <div className="flex items-center gap-1.5 mb-1">
            <Users size={14} className="text-yellow-200" />
            <span className="text-[10px] text-yellow-200 font-medium uppercase tracking-wider">Registered in {year}</span>
          </div>
          <p className="text-2xl font-bold">
            {totalRegistered}
            <span className="text-base text-yellow-200/70 font-medium"> / {totalMembers}</span>
          </p>
        </div>

        {topContributor && (
          <div
            className="rounded-xl p-3 text-white min-w-[160px] flex-1 max-w-[220px]"
            style={{ backgroundColor: topContributor.jumuiyaColor || "#6366f1" }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Trophy size={14} className="text-white/70" />
              <span className="text-[10px] text-white/70 font-medium uppercase tracking-wider">Top — {year}</span>
            </div>
            <p className="text-2xl font-bold">
              {topContributor.registeredCount}
              <span className="text-base text-white/60 font-medium"> / {topContributor.totalMembers}</span>
            </p>
            <p className="text-[10px] text-white/70 mt-0.5">
              {getJumuiyaLabel(topContributor.jumuiyaName)} —{' '}
              {totalRegistered > 0 ? Math.round((topContributor.registeredCount / totalRegistered) * 100) : 0}%
            </p>
          </div>
        )}
      </div>

      {/* Ranked Bar Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-1">
          <Church size={18} className="text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-800">Jumuiya Contribution — {year}</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">Ranked from highest to lowest registered members</p>
        <div className="space-y-3">
          {chartData.map((j: any, idx: number) => {
            const barWidth = totalRegistered > 0 ? (j.count / Math.max(...chartData.map((d: any) => d.count))) * 100 : 0;
            return (
              <div key={j.slug}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}.</span>
                    <span className="text-sm font-semibold text-slate-700">{j.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800">
                    {j.count}
                    <span className="text-xs text-slate-600 font-semibold ml-1">/ {j.total} ({j.pct}%)</span>
                  </span>
                </div>
                <div className="relative h-7 w-full bg-slate-100 rounded-lg overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full rounded-lg transition-all duration-700 flex items-center justify-end px-2"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: j.color,
                      opacity: 0.85,
                    }}
                  >
                    <span className="text-[10px] font-bold text-white drop-shadow-sm">
                      {barWidth > 15 ? `${j.count}` : ''}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
