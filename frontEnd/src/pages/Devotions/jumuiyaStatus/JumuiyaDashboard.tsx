import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { fetchPublishedJumuiyaDashboard } from "../../../api/axiosInstance";
import Card from "../components/Card";

interface JumuiyaStats {
  totalAttempts: number;
  correctAttempts: number;
  accuracy?: number;
}

export default function JumuiyaDashboard({ jumuiyaId }: { jumuiyaId: string; jumuiyaName?: string }) {
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<JumuiyaStats | null>(null);

  useEffect(() => {
    if (!jumuiyaId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetchPublishedJumuiyaDashboard(jumuiyaId);
        setStats(res.data || null);
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [jumuiyaId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <p className="text-sm animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  if (!stats || stats.totalAttempts === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <p className="text-sm">No published data yet. Admin needs to publish progress.</p>
      </div>
    );
  }

  const accuracy = stats.totalAttempts
    ? ((stats.correctAttempts / stats.totalAttempts) * 100).toFixed(1)
    : "0.0";

  const pieData = [
    { name: "Correct", value: stats.correctAttempts },
    { name: "Wrong", value: stats.totalAttempts - stats.correctAttempts },
  ];

  return (
    <div className="min-h-screen">
      <main className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card title="Total Attempts" value={stats.totalAttempts} />
          <Card title="Correct Attempts" value={stats.correctAttempts} />
          <Card title="Accuracy" value={`${accuracy}%`} highlight />
        </div>
        <div className="p-3">
          <h2 className="text-lg text-black font-semibold mb-4">Performance Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={110}>
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
