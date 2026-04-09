import { useState, useEffect } from 'react';
import apiService from '../../Landing/services/api';
import { 
  Users, 
  Heart, 
  Calendar, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCcw
} from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState({
    members: 0,
    donations: 0,
    events: 0,
    activities: [] as any[]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [members, donations, events] = await Promise.all([
        apiService.fetchTableData('members'),
        apiService.fetchTableData('mpesa_request'),
        apiService.fetchTableData('events')
      ]);

      // Log raw responses to browser console for debugging
      console.log('[Dashboard] members raw:', members);
      console.log('[Dashboard] donations raw:', donations);
      console.log('[Dashboard] events raw:', events);

      // Guard: if response is an error object, treat as empty
      const membersArr = Array.isArray(members) ? members : [];
      const donationsArr = Array.isArray(donations) ? donations : [];
      const eventsArr = Array.isArray(events) ? events : [];

      const paidDonations = donationsArr.filter((d: any) => d.status === 'paid');
      const totalDonated = paidDonations.reduce((acc: number, d: any) => acc + Number(d.amount || 0), 0);
      const upcomingEvents = eventsArr.filter((e: any) => {
        const d = new Date(e.date || e.event_date || e.created_at);
        return !isNaN(d.getTime()) && d > new Date();
      });

      setData({
        members: membersArr.length,
        donations: totalDonated,
        events: upcomingEvents.length,
        activities: donationsArr.slice(0, 5)
      });
    } catch (err: any) {
      console.error('[Dashboard] load error:', err);
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { name: 'Total Members', value: data.members.toLocaleString(), icon: Users, change: '+100%', trend: 'up', color: 'bg-blue-500' },
    { name: 'Total Donations', value: `KES ${data.donations.toLocaleString()}`, icon: Heart, change: '+24.1%', trend: 'up', color: 'bg-rose-500' },
    { name: 'Upcoming Events', value: data.events.toString(), icon: Calendar, change: 'Active', trend: 'up', color: 'bg-amber-500' },
    { name: 'System Pulse', value: 'Active', icon: TrendingUp, change: '100%', trend: 'up', color: 'bg-emerald-500' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
         <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
         <p className="text-slate-500 font-bold">Waking up the command center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-2xl flex items-center justify-between">
          <span className="font-bold text-sm">⚠️ Data load error: {error}</span>
          <button onClick={loadDashboardData} className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 bg-rose-100 hover:bg-rose-200 rounded-lg transition-all">
            <RefreshCcw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800">Command Center Overview</h2>
          <p className="text-slate-500 text-sm mt-1">Live stats from your database.</p>
        </div>
        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-xl text-white`}>
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stat.change}
                {stat.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              </div>
            </div>
            <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">{stat.name}</h3>
            <p className="text-2xl font-black text-slate-800 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between text-slate-800 ">
            <h3 className="font-bold">Recent System Activity</h3>
            <button className="text-xs font-bold text-blue-600 hover:text-blue-700">Live Feed</button>
          </div>
          <div className="p-0">
            {data.activities.length > 0 ? data.activities.map((activity, i) => (
              <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 px-6">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    activity.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                }`}>
                   {activity.user_id?.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {activity.status === 'paid' ? 'New Contribution Received' : 'Donation Initialized'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {activity.user_id} • KES {activity.amount} • <span className="capitalize">{activity.status}</span>
                  </p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <p className="text-[10px] text-slate-400 font-medium italic">
                    {new Date(activity.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-slate-400">No recent activity detected.</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl transition-all group">
              <span className="font-bold text-sm">Add New Project</span>
              <div className="bg-white p-1 rounded-md shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ArrowUpRight size={16} />
              </div>
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl transition-all group">
              <span className="font-bold text-sm">Create New Event</span>
              <div className="bg-white p-1 rounded-md shadow-sm group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <ArrowUpRight size={16} />
              </div>
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-700 rounded-xl transition-all group">
              <span className="font-bold text-sm">Upload Gallery Image</span>
              <div className="bg-white p-1 rounded-md shadow-sm group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <ArrowUpRight size={16} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
