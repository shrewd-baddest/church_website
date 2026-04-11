import { useEffect, useState } from "react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart
} from "recharts";
import { memberProgressData, memberSummaryData } from "../../../api/axiosInstance";
import type { Summary, WeekData } from "../../../interface/api";
import { Target, CheckCircle2, TrendingUp, Activity, AlertCircle } from "lucide-react";

export default function MemberDashboard() {
  const [data, setData] = useState<WeekData[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const chartData = data.map((week) => ({
    name: `W${week._id}`,
    fullName: `Week ${week._id}`,
    accuracy: week.totalAttempts
      ? Math.round((week.correctAttempts / week.totalAttempts) * 100)
      : 0,
    attempts: week.totalAttempts,
    correct: week.correctAttempts
  }));

  useEffect(() => {
    async function fetchData() {
      try {
        const [progressRes, summaryRes] = await Promise.all([
          memberProgressData(),
          memberSummaryData()
        ]);
        setData(progressRes.data || []);
        setSummary(summaryRes.data || null);
      } catch (err) {
        console.error("Failed to load progress data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  const accuracy = summary?.totalAttempts
    ? ((summary.correctAttempts / summary.totalAttempts) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-32">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-12 sm:pt-20 relative z-10">
        
        {/* Header */}
        <div className="mb-12 animate-in fade-in slide-in-from-top-6 duration-700">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-2xl bg-white border border-slate-100 shadow-sm text-slate-400 text-[9px] font-black tracking-[0.4em] uppercase mb-6">
            <Activity size={14} className="text-blue-500" />
            Performance Analytics
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            My <span className="text-blue-600">Progress</span>
          </h1>
          <p className="text-slate-500 font-medium mt-3 max-w-xl leading-relaxed">
            Track your individual weekly milestones, accuracy scores, and total attempts over time.
          </p>
        </div>

        {summary ? (
          <>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              
              {/* Card 1: Total Attempts */}
              <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-2xl -mr-16 -mt-16 transition-all group-hover:bg-blue-50"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 border border-blue-100/50">
                    <Target size={24} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Attempts</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{summary.totalAttempts}</h3>
                </div>
              </div>

              {/* Card 2: Correct Attempts */}
              <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -mr-16 -mt-16 transition-all group-hover:bg-emerald-100"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 border border-emerald-100/50 shadow-inner">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Correct Hits</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{summary.correctAttempts}</h3>
                </div>
              </div>

              {/* Card 3: Accuracy Highlight */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 border border-indigo-500 shadow-xl shadow-blue-900/20 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 transform scale-[1.02]">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all"></div>
                
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white mb-6 border border-white/20 shadow-inner">
                    <TrendingUp size={24} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-2">Overall Accuracy</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-black text-white tracking-tighter">{accuracy}</h3>
                    <span className="text-xl font-bold text-blue-200">%</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Performance Chart */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 border border-white shadow-[0_8px_40px_rgb(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Weekly Trajectory</h2>
                  <p className="text-xs font-bold text-slate-400 mt-1">Accuracy trends over previous weeks</p>
                </div>
                <div className="px-4 py-2 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Live Data</span>
                </div>
              </div>

              {chartData.length > 0 ? (
                <div className="h-[350px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                        dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '16px', 
                          border: 'none', 
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                          padding: '12px 20px',
                          fontWeight: 700
                        }}
                        itemStyle={{ color: '#0f172a', fontWeight: 900 }}
                        formatter={(value) => [`${value}%`, 'Accuracy']}
                        labelStyle={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="accuracy" 
                        stroke="#2563eb" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorAccuracy)" 
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#1d4ed8', filter: 'drop-shadow(0 0 8px rgba(37,99,235,0.8))' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
                  <AlertCircle size={32} className="text-slate-300 mb-4" />
                  <h3 className="text-lg font-black text-slate-800">No Weekly Data Yet</h3>
                  <p className="text-sm font-medium text-slate-500 max-w-sm mt-2">
                    Participate in questions to establish your weekly accuracy trajectory.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm animate-in fade-in zoom-in duration-700">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mb-6 drop-shadow-sm">
              <Activity size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-900">No Progress Recorded</h3>
            <p className="text-slate-500 font-medium mt-3 max-w-sm">
              You haven't made any attempts yet. Start answering to build your dashboard.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
