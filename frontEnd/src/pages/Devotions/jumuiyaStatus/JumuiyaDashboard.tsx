import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3, LayoutDashboard } from "lucide-react";
import type { DashboardProps, JumuiyaStats } from "../../../interface/api";
import { individualJumuiAttemptsData } from "../../../api/axiosInstace";
import Card from "../components/Card";


export default function Dashboard({ jumuiyaId }: DashboardProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [jumuiyaStats, setJumuiyaStats] = useState<JumuiyaStats | null>(null);



  useEffect(() => {
    if (jumuiyaId) {
      const fetchData = async (): Promise<void> => {
        try {
          setLoading(true);
          const res = await individualJumuiAttemptsData(jumuiyaId)
          setJumuiyaStats(res.data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [jumuiyaId]);



  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p className="text-lg animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  if (!jumuiyaStats) {
    return <p className="text-center mt-10">No data available</p>;
  }

  const accuracy: number = jumuiyaStats.totalAttempts
    ? (jumuiyaStats.correctAttempts / jumuiyaStats.totalAttempts) * 100
    : 0;

  const pieData = [
    { name: "Correct", value: jumuiyaStats.correctAttempts },
    {
      name: "Wrong",
      value: jumuiyaStats.totalAttempts - jumuiyaStats.correctAttempts,
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 p-5 hidden md:block">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <LayoutDashboard size={20} /> Admin Panel
        </h2>

        <nav className="space-y-4">
          <div className="flex items-center gap-2 text-blue-400">
            <BarChart3 size={18} /> Dashboard
          </div>
          <div className="text-gray-400">Jumuiya</div>
          <div className="text-gray-400">Members</div>
          <div className="text-gray-400">Settings</div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Jumuiya Dashboard</h1>
          <span className="bg-blue-600 px-3 py-1 rounded-full text-sm">
            {jumuiyaId}
          </span>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card title="Total Attempts" value={jumuiyaStats.totalAttempts} />
          <Card title="Correct Attempts" value={jumuiyaStats.correctAttempts} />
          <Card title="Accuracy" value={`${accuracy.toFixed(2)}%`} highlight />
        </div>

        {/* Chart Section */}
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Performance Overview</h2>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={110}
              >
                <Cell fill="#22c55e" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </main>
    </div>
  );
}

