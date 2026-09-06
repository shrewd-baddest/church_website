import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCachedData } from '../../../hooks/useCachedData';
import apiService from '../../../services/api';
import { apiClient } from '../../../api/axiosInstance';
import { memberService } from '../../../api/jumuiyaMemberService';
import {
  Users,
  HandCoins,
  HeartHandshake,
  Receipt,
  Wallet,
  ClipboardCheck,
  ClipboardList,
  Calendar,
  ArrowUpRight,
  Loader2,
  RefreshCcw,
  Clock,
  Megaphone,
  BookOpen,
  MessageSquare,
  ShoppingCart,
  Wrench,
  ChevronRight,
  Sparkles,
  LayoutDashboard,
  Activity,
} from 'lucide-react';

const JUMUIYAS = [
  { id: 'st-anthony', name: 'St. Anthony', color: '#8b5cf6' },
  { id: 'st-augustine', name: 'St. Augustine', color: '#3b82f6' },
  { id: 'st-catherine', name: 'St. Catherine', color: '#800000' },
  { id: 'st-dominic', name: 'St. Dominic', color: '#979695' },
  { id: 'st-elizabeth', name: 'St. Elizabeth', color: '#07a414' },
  { id: 'st-maria-goretti', name: 'St. Maria Goretti', color: '#0ea5e9' },
  { id: 'st-monica', name: 'St. Monica', color: '#ef4444' },
];

function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 8 ? clean.slice(0, 6) : clean;
  if (full.length !== 6) return `rgba(100, 116, 139, ${alpha})`;
  const n = parseInt(full, 16);
  if (isNaN(n)) return `rgba(100, 116, 139, ${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getEventDate(e: any): Date | null {
  const raw = e?.event_date || e?.date || e?.date_time || e?.start_date;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function formatEventDate(d: Date | null): string {
  if (!d) return '';
  return d.toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' });
}

const FALLBACK = {
  jumuiyas: JUMUIYAS.map((j) => ({ ...j, total: 0 })),
  totalMembers: 0,
  paidCount: 0,
  totalDonated: 0,
  pendingOrders: 0,
  pendingHires: 0,
  pendingPayments: 0,
  suggestions: 0,
  upcoming: [] as any[],
  activity: [] as any[],
};

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
          <Icon size={18} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-slate-800 leading-tight truncate">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-400 font-medium truncate">{subtitle}</p>}
        </div>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 whitespace-nowrap px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-all"
        >
          {actionLabel} <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { data, loading, error, refetch: loadDashboardData } = useCachedData(
    'csa_cache_dashboard_overview_v2',
    async () => {
      const [batchStats, donations, events, orders, hires, pendingRes, suggestionsRes] = await Promise.all([
        memberService.getBatchStatistics().catch(() => null),
        apiService.fetchTableData('mpesa_request'),
        apiService.fetchTableData('events'),
        apiService.fetchTableData('orders'),
        apiService.fetchTableData('hire_requests'),
        memberService.getPendingPayments().catch(() => null),
        apiClient.get('/suggestions', { params: { jumuiya_id: 'csa' } }).catch(() => ({ data: [] })),
      ]);

      const statsMap = batchStats?.data || {};
      const donationsArr = Array.isArray(donations) ? donations : [];
      const eventsArr = Array.isArray(events) ? events : [];
      const ordersArr = Array.isArray(orders) ? orders : [];
      const hiresArr = Array.isArray(hires) ? hires : [];
      const pendingArr = Array.isArray(pendingRes?.data) ? pendingRes.data : [];
      const suggestionsData = suggestionsRes?.data;
      const suggestionsArr = Array.isArray(suggestionsData?.data)
        ? suggestionsData.data
        : (Array.isArray(suggestionsData) ? suggestionsData : []);

      const paid = donationsArr.filter((d: any) => d.status === 'paid');
      const totalDonated = paid.reduce((acc: number, d: any) => acc + Number(d.amount || 0), 0);
      const pendingPayments = pendingArr.filter((p: any) => p.status === 'pending').length;
      const pendingOrders = ordersArr.filter((o: any) => o.status === 'pending').length;
      const pendingHires = hiresArr.filter((h: any) => h.status === 'pending').length;

      const jumuiyas = JUMUIYAS.map((j) => ({
        ...j,
        total: Number(statsMap[j.id]?.totalMembers || 0),
      }));
      const totalMembers = jumuiyas.reduce((sum, j) => sum + j.total, 0);

      const now = Date.now();
      const upcoming = eventsArr
        .map((e: any) => ({ e, d: getEventDate(e) }))
        .filter((x: any) => x.d && x.d.getTime() >= now - 86400000)
        .sort((a: any, b: any) => a.d.getTime() - b.d.getTime())
        .slice(0, 3)
        .map((x: any) => ({ ...x.e, _date: x.d }));

      const activity: any[] = [];
      paid.slice(0, 6).forEach((d: any) =>
        activity.push({
          type: 'donation',
          title: 'New Contribution Received',
          detail: `${d.user_id || 'Unknown'} • KES ${Number(d.amount || 0).toLocaleString()}`,
          date: d.created_at,
        })
      );
      pendingArr
        .filter((p: any) => p.status === 'pending')
        .slice(0, 4)
        .forEach((p: any) =>
          activity.push({
            type: 'payment',
            title: 'Registration Payment Pending',
            detail: `${p.member_name || 'Member'} • ${p.jumuiya_name || ''} • KES ${Number(p.amount || 0).toLocaleString()}`,
            date: p.created_at,
          })
        );
      upcoming.forEach((e: any) =>
        activity.push({
          type: 'event',
          title: e.title || e.name || 'Upcoming Event',
          detail: `Scheduled • ${formatEventDate(e._date)}`,
          date: e._date.toISOString(),
        })
      );
      activity.sort(
        (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
      );

      return {
        jumuiyas,
        totalMembers,
        paidCount: paid.length,
        totalDonated,
        pendingOrders,
        pendingHires,
        pendingPayments,
        suggestions: suggestionsArr.length,
        upcoming,
        activity: activity.slice(0, 8),
      };
    },
    FALLBACK
  );

  const stats = useMemo(
    () => [
      {
        name: 'Total Members',
        value: Number(data?.totalMembers || 0).toLocaleString(),
        icon: Users,
        chip: 'from-blue-500 to-indigo-600 shadow-blue-500/40',
        sub: 'Across 7 Jumuiyas',
        link: '/admin/registered-members',
      },
      {
        name: 'Total Donations',
        value: `KES ${Number(data?.totalDonated || 0).toLocaleString()}`,
        icon: HandCoins,
        chip: 'from-rose-400 to-pink-600 shadow-rose-500/40',
        sub: `${Number(data?.paidCount || 0)} paid contributions`,
        link: '/admin/donations',
      },
      {
        name: 'Pending Payments',
        value: String(data?.pendingPayments || 0),
        icon: Wallet,
        chip: 'from-amber-400 to-orange-500 shadow-amber-500/40',
        sub: 'awaiting settlement',
        link: '/admin/registered-members',
      },
      {
        name: 'Pending Actions',
        value: String((data?.pendingOrders || 0) + (data?.pendingHires || 0)),
        icon: ClipboardCheck,
        chip: 'from-purple-500 to-fuchsia-600 shadow-purple-500/40',
        sub: `${data?.pendingOrders || 0} orders • ${data?.pendingHires || 0} hires`,
        link: '/admin/projects',
      },
    ],
    [data]
  );

  const quickActions = useMemo(
    () => [
      { label: 'Registered Members', desc: 'Manage members & payments', icon: ClipboardList, chip: 'from-blue-500 to-indigo-600', path: '/admin/registered-members' },
      { label: 'Announcements', desc: 'Post CSA / Jumuiya notices', icon: Megaphone, chip: 'from-rose-500 to-pink-600', path: '/admin/announcements' },
      { label: 'Devotions & AI', desc: 'Liturgy & prayers', icon: BookOpen, chip: 'from-emerald-500 to-teal-600', path: '/admin/devotions' },
      { label: 'User Suggestions', desc: `${data?.suggestions || 0} new suggestions`, icon: MessageSquare, chip: 'from-cyan-500 to-sky-600', path: '/admin/suggestions' },
    ],
    [data]
  );

  const attentionItems = useMemo(
    () => [
      { label: 'Pending Payments', value: data?.pendingPayments || 0, icon: Wallet, chip: 'from-amber-500 to-orange-600', path: '/admin/registered-members' },
      { label: 'Pending Orders', value: data?.pendingOrders || 0, icon: ShoppingCart, chip: 'from-blue-500 to-indigo-600', path: '/admin/projects' },
      { label: 'Pending Hires', value: data?.pendingHires || 0, icon: Wrench, chip: 'from-purple-500 to-fuchsia-600', path: '/admin/projects' },
      { label: 'Upcoming Events', value: data?.upcoming?.length || 0, icon: Calendar, chip: 'from-emerald-500 to-teal-600', path: '/admin/weekly-activities' },
      { label: 'New Suggestions', value: data?.suggestions || 0, icon: MessageSquare, chip: 'from-cyan-500 to-sky-600', path: '/admin/suggestions' },
    ],
    [data]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold">Waking up the command center...</p>
      </div>
    );
  }

  const maxJumuiya = Math.max(1, ...(data?.jumuiyas || []).map((j: any) => j.total || 0));
  const attentionCount = attentionItems.reduce((sum, item) => sum + Number(item.value || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-2xl flex items-center justify-between">
          <span className="font-bold text-sm">Data load error: {String(error)}</span>
          <button onClick={() => loadDashboardData()} className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 bg-rose-100 hover:bg-rose-200 rounded-lg transition-all">
            <RefreshCcw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center shadow-lg ring-1 ring-white/10 shrink-0">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 leading-tight">Command Center</h2>
            <p className="text-slate-500 text-sm">Live overview of the association.</p>
          </div>
        </div>
        <button
          onClick={() => loadDashboardData()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <button
            key={stat.name}
            onClick={() => navigate(stat.link)}
            className="group relative bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-200 text-left overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent group-hover:via-blue-200 transition-all" />
            <div className="flex items-center justify-between mb-4">
              <div className={`relative bg-gradient-to-br ${stat.chip} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ring-1 ring-inset ring-white/30 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                <stat.icon size={26} strokeWidth={2.2} />
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white">
                <ArrowUpRight size={16} />
              </div>
            </div>
            <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{stat.name}</h3>
            <p className="text-2xl font-black text-slate-800 mt-1">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Jumuiya Membership */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-3">
            <SectionHeader
              icon={Users}
              title="Jumuiya Membership"
              subtitle="Registered members per Jumuiya"
              actionLabel="View All Members"
              onAction={() => navigate('/admin/registered-members')}
            />
          </div>
          <div className="p-6 space-y-5">
            {(data?.jumuiyas || []).map((j: any) => (
              <div key={j.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0"
                      style={{ backgroundColor: j.color }}
                    >
                      {j.name.replace('St. ', '').charAt(0)}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">{j.name}</span>
                  </div>
                  <span className="text-sm font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg">
                    {Number(j.total || 0).toLocaleString()}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${((Number(j.total || 0) / maxJumuiya) * 100).toFixed(1)}%`,
                      background: `linear-gradient(90deg, ${withAlpha(j.color, 0.7)}, ${j.color})`,
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-sm font-semibold text-slate-500">Total Registered</span>
              <span className="text-lg font-black text-blue-600">
                {Number(data?.totalMembers || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="mb-6">
            <SectionHeader icon={Sparkles} title="Quick Actions" subtitle="Jump straight to work" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="group flex flex-col items-start gap-3 p-4 bg-slate-50 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 border border-transparent text-slate-700 rounded-xl transition-all duration-200"
              >
                <div className={`bg-gradient-to-br ${action.chip} w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ring-1 ring-inset ring-white/30 shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                  <action.icon size={18} strokeWidth={2.2} />
                </div>
                <div className="min-w-0 text-left">
                  <p className="font-bold text-sm text-slate-800 truncate">{action.label}</p>
                  <p className="text-[11px] text-slate-400 truncate leading-snug">{action.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-3">
            <SectionHeader
              icon={Activity}
              title="Recent System Activity"
              subtitle="Latest donations, payments & events"
              actionLabel="View All"
              onAction={() => navigate('/admin/donations')}
            />
          </div>
          <div className="p-0">
            {(data?.activity || []).length > 0 ? (
              (data?.activity || []).map((activity: any, i: number) => {
                const meta =
                  activity.type === 'donation'
                    ? { icon: HeartHandshake, bg: 'from-emerald-400 to-green-600 shadow-emerald-500/40' }
                    : activity.type === 'payment'
                    ? { icon: Receipt, bg: 'from-amber-400 to-orange-500 shadow-amber-500/40' }
                    : { icon: Calendar, bg: 'from-blue-400 to-indigo-600 shadow-blue-500/40' };
                return (
                  <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 px-6">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${meta.bg} flex items-center justify-center text-white shadow-md ring-1 ring-inset ring-white/30 shrink-0`}>
                      <meta.icon size={18} strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{activity.title}</p>
                      <p className="text-xs text-slate-500 truncate">{activity.detail}</p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className="text-[10px] text-slate-400 font-medium italic">
                        {activity.date ? new Date(activity.date).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center text-slate-400">No recent activity detected.</div>
            )}
          </div>
        </div>

        {/* Needs Attention */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <SectionHeader icon={Clock} title="Needs Attention" subtitle={`${attentionCount} item(s) waiting`} />
          </div>
          <div className="space-y-2.5">
            {attentionItems.map((item) => {
              const active = Number(item.value || 0) > 0;
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all duration-200 group ${
                    active
                      ? 'border-amber-200/80 bg-gradient-to-r from-amber-50/80 to-orange-50/40 hover:border-amber-300 hover:from-amber-50 hover:to-orange-50'
                      : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.chip} flex items-center justify-center text-white shadow-md ring-1 ring-inset ring-white/30 shrink-0`}>
                      <item.icon size={17} strokeWidth={2.2} />
                    </div>
                    <span className={`font-semibold text-sm truncate ${active ? 'text-slate-800' : 'text-slate-500'}`}>
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`min-w-[26px] text-center text-xs font-black rounded-full px-2 py-0.5 ${
                        active ? 'bg-amber-500 text-white shadow-sm shadow-amber-300' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {item.value}
                    </span>
                    <ChevronRight size={15} className={`transition-transform duration-200 group-hover:translate-x-0.5 ${active ? 'text-amber-500' : 'text-slate-300'}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
