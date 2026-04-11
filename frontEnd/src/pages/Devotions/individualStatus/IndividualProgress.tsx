import { useEffect, useState } from "react";
import {LineChart, Line,XAxis, YAxis, Tooltip, ResponsiveContainer} from "recharts";
import { memberProgressData, memberSummaryData } from "../../../api/axiosInstance";
import type { Summary, WeekData } from "../../../interface/api";
import Card from "../components/Card";



export default function MemberDashboard() {
  const [data, setData] = useState<WeekData[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  const chartData = data.map((week) => ({
    week: `Week ${week._id}`,
    accuracy: week.totalAttempts
      ? (week.correctAttempts / week.totalAttempts) * 100
      : 0,
  }));

  useEffect(() => {

    async function fetchData() {
      try {

        const [progressRes, summaryRes] = await Promise.all([
         await memberProgressData(),
         await memberSummaryData()
        ]);

        setData(progressRes.data);
        setSummary(summaryRes.data);
      } catch (err) {
        console.error(err);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Progress</h1>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card title="Total Attempts" value={summary.totalAttempts} />
            <Card title="Correct" value={summary.correctAttempts} />
            <Card
              title="Accuracy"
              value={`${(
                (summary.correctAttempts / (summary.totalAttempts || 1)) *
                100
              ).toFixed(1)}%`}
              highlight
            />
          </div>
        )}

        {/* Chart */}
        <div className="bg-gray-800 p-6 rounded-2xl">
          <h2 className="mb-4">3 Week Performance</h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#3b82f6"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}



