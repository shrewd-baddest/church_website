import { useState, useEffect } from "react";
import { memberService } from "../../../api/jumuiyaMemberService";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Church, RefreshCw, Users, Calendar } from "lucide-react";

const SEMESTERS = ["1.1", "1.2", "2.1", "2.2", "3.1", "3.2", "4.1", "4.2"];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 15 }, (_, i) => currentYear - 14 + i);

function getJumuiyaLabel(j: any): string {
  return j.jumuiyaName.replace("St. ", "");
}

export default function JumuiyaProgressionTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromYear, setFromYear] = useState(currentYear - 3);
  const [toYear, setToYear] = useState(currentYear);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await memberService.getJumuiyaProgression({ from: fromYear, to: toYear });
      setData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load jumuiya data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [fromYear, toYear]);

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

  if (!data || !data.jumuiyas) return null;

  const { jumuiyas } = data;
  const sorted = [...jumuiyas].sort((a: any, b: any) => a.jumuiyaName.localeCompare(b.jumuiyaName));

  const chartData = SEMESTERS.map((sem) => {
    const point: any = { semester: sem };
    sorted.forEach((j: any) => {
      const semData = j.semesters.find((s: any) => s.sem === sem);
      point[j.jumuiyaName] = semData?.pct;
    });
    return point;
  });

  return (
    <div className="space-y-6">
      {/* Year Range Filter */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-slate-200 p-3">
        <Calendar size={16} className="text-slate-400" />
        <span className="text-sm font-semibold text-slate-700">Admission Year</span>
        <select
          value={fromYear}
          onChange={e => setFromYear(parseInt(e.target.value))}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {YEAR_OPTIONS.filter(y => y <= toYear).map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <span className="text-sm text-slate-400">to</span>
        <select
          value={toYear}
          onChange={e => setToYear(parseInt(e.target.value))}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {YEAR_OPTIONS.filter(y => y >= fromYear).map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        {(fromYear !== currentYear - 3 || toYear !== currentYear) && (
          <button
            onClick={() => { setFromYear(currentYear - 3); setToYear(currentYear); }}
            className="px-3 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sorted.map((j: any) => (
          <div
            key={j.jumuiyaSlug}
            className="bg-white rounded-xl border border-slate-200 p-4"
            style={{ borderTop: `3px solid ${j.jumuiyaColor}` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Church size={16} style={{ color: j.jumuiyaColor }} />
              <span className="text-xs text-slate-500 font-medium">{getJumuiyaLabel(j)}</span>
            </div>
            <p className="text-lg font-bold text-slate-800">{j.total}</p>
            <p className="text-xs text-slate-400">registered members</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Church size={18} className="text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-800">Registration Rate by Jumuiya</h3>
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
            {sorted.map((j: any) => (
              <Line
                key={j.jumuiyaSlug}
                type="monotone"
                dataKey={j.jumuiyaName}
                stroke={j.jumuiyaColor}
                strokeWidth={2.5}
                dot={{ r: 5, fill: j.jumuiyaColor, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7 }}
                connectNulls={false}
                name={getJumuiyaLabel(j)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-800">Jumuiya Detail — Registered Members per Semester</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Jumuiya</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Total</th>
                {SEMESTERS.map(s => (
                  <th key={s} className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase">{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((j: any) => (
                <tr key={j.jumuiyaSlug} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2.5 font-semibold text-slate-800">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: j.jumuiyaColor }} />
                      {getJumuiyaLabel(j)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-500 font-medium">{j.total}</td>
                  {SEMESTERS.map((sem) => {
                    const semData = j.semesters.find((s: any) => s.sem === sem);
                    const count = semData?.count || 0;
                    const pct = semData?.pct || 0;
                    return (
                      <td key={sem} className="px-3 py-2.5 text-center">
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
