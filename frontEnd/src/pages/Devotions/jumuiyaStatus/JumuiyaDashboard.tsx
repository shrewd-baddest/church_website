import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { DashboardProps } from "../../../interface/api";
import Card from "../components/Card";

export default function JumuiyaDashboard({ jumuiyaId }: DashboardProps) {
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (jumuiyaId) {
      const fetchData = async (): Promise<void> => {
        try {
          setLoading(true);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [jumuiyaId]);

const jumuiyaStats ={
  "totalAttempts": 80,
  "correctAttempts":50

}


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray text-white">
        <p className="text-lg animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  const accuracy: number = jumuiyaStats?.totalAttempts
    ? (jumuiyaStats?.correctAttempts / jumuiyaStats?.totalAttempts) * 100
    : 0;

  const pieData = [
    { name: "Correct", 
      value: jumuiyaStats?.correctAttempts },
    {
      name: "Wrong",
      value: jumuiyaStats?.totalAttempts - jumuiyaStats?.correctAttempts ,
    },
  ];

  return (
    <div className="flex min-h-screen  text-white">
      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card title="Total Attempts" value={jumuiyaStats.totalAttempts} />
          <Card title="Correct Attempts" value={jumuiyaStats.correctAttempts} />
          <Card title="Accuracy" value={`${accuracy.toFixed(2)}%`} highlight />
        </div>

        {/* Chart Section */}
        <div className="p-3">
          <h2 className="text-lg text-black font-semibold mb-4">Performance Overview</h2>
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

