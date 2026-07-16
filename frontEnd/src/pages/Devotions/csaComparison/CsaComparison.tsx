import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { fetchPublishedComparison } from "../../../api/axiosInstance";
import type { JumuiData } from "../../../interface/api";

export default function JumuiComparison() {
  const [data, setData] = useState<JumuiData[]>([]);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchPublishedComparison();
        setData(Array.isArray(res.data?.data) ? res.data.data : []);
        setPublishedAt(res.data?.publishedAt || null);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Jumuiya Performance</h1>
          {publishedAt && (
            <span className="text-xs text-gray-400">
              Updated: {new Date(publishedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {data.length === 0 ? (
          <div className="text-gray-400 text-center py-20">
            No published stats yet. Ask an admin to publish progress data.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {data.slice(0, 3).map((j, i) => (
                <div
                  key={j._id}
                  className={`p-4 rounded-xl ${
                    i === 0 ? "bg-yellow-500" : i === 1 ? "bg-gray-400" : "bg-orange-500"
                  }`}
                >
                  <p className="text-sm">#{i + 1}</p>
                  <h2 className="font-bold">{j._id}</h2>
                  <p>{j.accuracy?.toFixed(1)}%</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-800 p-6 rounded-2xl">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="accuracy" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 bg-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">Jumuiya</th>
                    <th className="p-3">Accuracy</th>
                    <th className="p-3">Attempts</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((j, index) => (
                    <tr key={j._id} className="border-t border-gray-700">
                      <td className="p-3">#{index + 1}</td>
                      <td className="p-3">{j._id}</td>
                      <td className="p-3">{j.accuracy?.toFixed(1)}%</td>
                      <td className="p-3">{j.totalAttempts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
