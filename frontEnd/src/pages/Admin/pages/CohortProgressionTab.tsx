import { useState, useEffect } from "react";
import { memberService } from "../../../api/jumuiyaMemberService";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Layers, RefreshCw, Users } from "lucide-react";

const YEAR_COLORS: Record<number, string> = {
  1: "#22c55e",
  2: "#3b82f6",
  3: "#8b5cf6",
  4: "#ef4444",
};

const YEAR_NAMES: Record<number, string> = {
  1: "Year 1",
  2: "Year 2",
  3: "Year 3",
  4: "Year 4",
};

const COHORT_SEMESTERS = ["1.1", "1.2", "2.1", "2.2", "3.1", "3.2", "4.1", "4.2"];

function getDisplayLabel(c: any): string {
  return `${YEAR_NAMES[c.yearLevel] ?? `Year ${c.yearLevel}`} (${c.admissionYear})`;
}

export default function CohortProgressionTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await memberService.getCohortAnalytics();
      setData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load cohort data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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

  if (!data || !data.cohorts) return null;

  const { cohorts } = data;
  const sorted = [...cohorts].sort((a: any, b: any) => a.yearLevel - b.yearLevel);

  const chartData = COHORT_SEMESTERS.map((sem, semIdx) => {
    const point: any = { semester: sem };
    sorted.forEach((c: any) => {
      // Only show data for semesters this cohort has actually been through
      if (semIdx < c.yearLevel * 2) {
        const semData = c.semesters.find((s: any) => s.sem === sem);
        point[c.label] = semData?.pct;
      } else {
        point[c.label] = undefined;
      }
    });
    return point;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sorted.map((c: any) => {
          const color = YEAR_COLORS[c.yearLevel] ?? "#6366f1";
          return (
            <div
              key={c.label}
              className="bg-white rounded-xl border border-slate-200 p-4"
              style={{ borderTop: `3px solid ${color}` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Layers size={16} style={{ color }} />
                <span className="text-xs text-slate-500 font-medium">{getDisplayLabel(c)}</span>
              </div>
              <p className="text-lg font-bold text-slate-800">{c.currentYear}</p>
              <p className="text-xs text-slate-400">{c.total} members</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers size={18} className="text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-800">Registration Rate by Year Level</h3>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 15, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="semester" tick={{ fontSize: 13, fill: '#475569' }} stroke="#cbd5e1" />
            <YAxis
              tick={{ fontSize: 12, fill: '#334155' }}
              stroke="#cbd5e1"
              domain={[0, 100]}
              width={40}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
              formatter={(value: number, name: string) => [`${value}%`, name]}
              labelStyle={{ fontWeight: 600 }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value: string) => <span style={{ fontSize: '0.8rem', color: '#475569' }}>{value}</span>}
            />
            {sorted.map((c: any) => {
              const color = YEAR_COLORS[c.yearLevel] ?? "#6366f1";
              return (
                <Line
                  key={c.label}
                  type="monotone"
                  dataKey={c.label}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: color, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7 }}
                  connectNulls={false}
                  name={getDisplayLabel(c)}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-800">Cohort Detail — Registered Members per Semester</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Cohort</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Year</th>
                {COHORT_SEMESTERS.map(s => (
                  <th key={s} className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase">{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c: any) => (
                <tr key={c.label} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2.5 font-semibold text-slate-800">{getDisplayLabel(c)}</td>
                  <td className="px-3 py-2.5 text-slate-500">{c.currentYear}</td>
                  {COHORT_SEMESTERS.map((sem, si) => {
                    const semData = c.semesters.find((s: any) => s.sem === sem);
                    const count = semData?.count || 0;
                    const pct = semData?.pct || 0;
                    const isActive = si < c.yearLevel * 2;
                    return (
                      <td key={sem} className={`px-3 py-2.5 text-center ${isActive ? '' : 'opacity-30'}`}>
                        <span className="font-bold text-slate-700">{count}</span>
                        <span className="text-xs text-slate-600 font-semibold ml-1">({pct}%)</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
