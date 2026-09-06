import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  CalendarCheck,
  BarChart3,
  Save,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Users,
  CalendarDays,
  Activity,
  RefreshCw,
  Lightbulb,
  History,
  CheckCircle2,
  Lock,
  Settings2,
  AlertTriangle,
  FileSpreadsheet,
  ArrowUpDown,
  CalendarRange,
} from "lucide-react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { attendanceServices, getApiError, TallyDimension, TallyCountInput } from "../../../api/attendanceServices";
import { jumuiyaAttendanceService } from "../../../api/jumuiyaAttendanceService";
import { semesterServices, SemesterConfig } from "../../../api/semesterServices";
import { useAuth } from "../../../context/AuthContext";

interface JumuiyaContext {
  group_id: string;
  name: string;
  slug: string;
  color: string | null;
  total_members: number;
  active_members: number;
  register_status: "missing" | "recorded";
  register_count: number | null;
}

interface YearContext {
  year: string;
  label: string;
  color: string;
  total_members: number;
  active_members: number;
}

interface TallyContext {
  date: string;
  isTallyDay: boolean;
  activityType: string | null;
  activityLabel: string | null;
  novena: { id: number; start_date: string; end_date: string; day: number; total_days: number } | null;
  jumuiyas: JumuiyaContext[];
  years: YearContext[];
}

interface SessionRow {
  tally_id: number;
  tally_date: string;
  activity_type: string;
  activity_label: string;
  jumuiya_id: string | null;
  year_of_study: string | null;
  dimension: TallyDimension;
  count: number;
  recorded_by: string;
  recorded_by_name: string;
  recorded_role: "coordinator" | "assistant";
  source: string;
  updated_at: string;
}

interface RecentTallyDay {
  date: string;
  activityType: string;
  activityLabel: string;
  recorded: boolean;
}

interface Trend {
  prev_attendance_count: number;
  prev_tally_days: number;
  prev_rate_vs_total: number;
  prev_rate_vs_active: number;
  delta_vs_total: number;
  delta_vs_active: number;
}

interface DimStat {
  group_key: string;
  name: string;
  color: string;
  rank: number;
  total_members: number;
  active_members: number;
  tally_days: number;
  attendance_count: number;
  avg_per_session: number;
  register_days: number;
  manual_days: number;
  register_coverage: number;
  register_sessions: number;
  register_attendance: number;
  register_avg: number;
  register_attendees: number;
  register_peak: number;
  rate_vs_total: number;
  rate_vs_active: number;
  trend: Trend;
}

interface MeetingConfigRow {
  jumuiya_id: string;
  name: string;
  slug: string;
  color: string;
  meeting_day: number | null;
  meeting_label: string | null;
  recent_registers: { date: string; present_count: number; total_count: number }[];
  last_register_date: string | null;
  stale: boolean;
}

interface NovenaRow {
  id: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at?: string;
}

interface AnalyticsData {
  dimension: TallyDimension;
  period: { from: string; to: string; calendar_days: number; prev_from: string; prev_to: string };
  tally_days: number;
  timeline: { date: string; attendance: number; activity_label: string | null }[];
  cumulative: {
    total_members: number;
    active_members: number;
    attendance_count: number;
    tally_days: number;
    avg_per_session: number;
    rate_vs_total: number;
    rate_vs_active: number;
    register_sessions: number;
    register_attendance: number;
    register_avg: number;
    register_peak: number;
    trend: Trend;
  };
  by_jumuiya: DimStat[];
  by_year: DimStat[];
}

type RecordedRole = "coordinator" | "assistant";

interface HistoryCount {
  tally_id: number;
  kind: "jumuiya" | "year";
  jumuiya_id?: string;
  jumuiya_name?: string;
  jumuiya_color?: string;
  year?: string;
  label?: string;
  color?: string;
  source: string;
  count: number;
}

interface HistoryRow {
  date: string;
  activity_type: string;
  activity_label: string;
  dimension: TallyDimension;
  recorded_role: RecordedRole;
  recorded_by_name: string;
  updated_at: string;
  counts: HistoryCount[];
}

const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// A novena runs 9 days — end date auto-fills to start + 8 (still editable).
const novenaEndFor = (start: string) => {
  if (!start) return "";
  const dt = new Date(start + "T00:00:00");
  if (isNaN(dt.getTime())) return "";
  return fmt(addDays(dt, 8));
};

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const mondayOf = (d: Date) => {
  const x = new Date(d);
  x.setDate(x.getDate() - ((d.getDay() + 6) % 7));
  return x;
};

const todayStr = () => fmt(new Date());

const friendlyDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

type PresetKey =
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "thisSemester"
  | "lastSemester"
  | "thisAcademicYear"
  | "lastAcademicYear"
  | "custom";

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "thisWeek", label: "This Week" },
  { key: "lastWeek", label: "Last Week" },
  { key: "thisMonth", label: "This Month" },
  { key: "lastMonth", label: "Last Month" },
  { key: "thisSemester", label: "This Semester" },
  { key: "lastSemester", label: "Last Semester" },
  { key: "thisAcademicYear", label: "This Academic Year" },
  { key: "lastAcademicYear", label: "Last Academic Year" },
  { key: "custom", label: "Custom Range" },
];

function presetRange(key: PresetKey, now: Date, semester?: SemesterConfig | null): { from: string; to: string } {
  switch (key) {
    case "thisWeek": {
      const m = mondayOf(now);
      return { from: fmt(m), to: fmt(addDays(m, 6)) };
    }
    case "lastWeek": {
      const m = mondayOf(now);
      return { from: fmt(addDays(m, -7)), to: fmt(addDays(m, -1)) };
    }
    case "thisMonth":
      return { from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), to: fmt(new Date(now.getFullYear(), now.getMonth() + 1, 0)) };
    case "lastMonth":
      return { from: fmt(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: fmt(new Date(now.getFullYear(), now.getMonth(), 0)) };
    case "thisSemester": {
      // Prefer the CSA-configured semester window; fall back to the historical month rule.
      if (semester?.start_date && semester?.end_date) {
        return { from: semester.start_date, to: semester.end_date };
      }
      const m = now.getMonth() + 1;
      const y = now.getFullYear();
      if (m >= 6) return { from: fmt(new Date(y, 5, 1)), to: fmt(new Date(y, 11, 31)) };
      return { from: fmt(new Date(y, 0, 1)), to: fmt(new Date(y, 4, 31)) };
    }
    case "lastSemester": {
      if (semester?.start_date && semester?.end_date) {
        // Semester before the configured one, under the same academic model:
        // Sem 2 → Jan–May of the same year; Sem 1 → Jun–Dec of the previous year.
        const start = new Date(semester.start_date + "T00:00:00Z");
        const isSecond = start.getUTCMonth() + 1 >= 6;
        const y = start.getUTCFullYear();
        if (isSecond) return { from: fmt(new Date(y, 0, 1)), to: fmt(new Date(y, 4, 31)) };
        return { from: fmt(new Date(y - 1, 5, 1)), to: fmt(new Date(y - 1, 11, 31)) };
      }
      const m = now.getMonth() + 1;
      const y = now.getFullYear();
      if (m >= 6) return { from: fmt(new Date(y, 0, 1)), to: fmt(new Date(y, 4, 31)) };
      return { from: fmt(new Date(y - 1, 5, 1)), to: fmt(new Date(y - 1, 11, 31)) };
    }
    case "thisAcademicYear":
      return { from: fmt(new Date(now.getFullYear(), 0, 1)), to: fmt(new Date(now.getFullYear(), 11, 31)) };
    case "lastAcademicYear":
      return { from: fmt(new Date(now.getFullYear() - 1, 0, 1)), to: fmt(new Date(now.getFullYear() - 1, 11, 31)) };
    default:
      return { from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), to: fmt(now) };
  }
}

const pct = (rate: number) => `${(rate * 100).toFixed(1)}%`;
const pts = (delta: number) => `${(delta * 100).toFixed(1)} pts`;

const inputCls =
  "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400";

const DAY_OPTIONS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ROLE_LABEL: Record<RecordedRole, string> = {
  coordinator: "Jumuiya Coordinator",
  assistant: "Assistant Jumuiya Coordinator",
};

const YEARS = ["1", "2", "3", "4"];
const YEAR_COLORS: Record<string, string> = {
  "1": "#0ea5e9",
  "2": "#10b981",
  "3": "#f59e0b",
  "4": "#8b5cf6",
};
const yearKey = (y: string) => `y:${y}`;
const yearLabel = (y: string) => `Year ${y}`;

function DimToggle({
  value,
  onChange,
  leftLabel = "Jumuiya",
  rightLabel = "Year of Study",
  size = "md",
}: {
  value: TallyDimension;
  onChange: (v: TallyDimension) => void;
  leftLabel?: string;
  rightLabel?: string;
  size?: "md" | "sm";
}) {
  const base =
    size === "sm"
      ? "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
      : "px-4 py-2 rounded-lg text-sm font-bold transition-colors";
  const active = "bg-indigo-600 text-white shadow-sm";
  const idle = "text-slate-600 hover:text-slate-900";
  return (
    <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1 w-fit">
      <button onClick={() => onChange("jumuiya")} className={`${base} ${value === "jumuiya" ? active : idle}`}>
        {leftLabel}
      </button>
      <button onClick={() => onChange("year")} className={`${base} ${value === "year" ? active : idle}`}>
        {rightLabel}
      </button>
    </div>
  );
}

function TrendBadge({ delta }: { delta: number }) {
  if (delta > 0.0005) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
        <TrendingUp size={13} /> {pts(delta)}
      </span>
    );
  }
  if (delta < -0.0005) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-full px-2.5 py-1">
        <TrendingDown size={13} /> {pts(delta)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-1">
      <Minus size={13} /> 0.0 pts
    </span>
  );
}

export default function AttendanceTallyAdmin() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"tally" | "analytics" | "config" | "history" | "novena">("tally");

  // Take Tally state
  const [date, setDate] = useState<string>(todayStr());
  const [context, setContext] = useState<TallyContext | null>(null);
  const [sessionRows, setSessionRows] = useState<SessionRow[]>([]);
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [tallyDim, setTallyDim] = useState<TallyDimension>("jumuiya");
  const [recordedRole, setRecordedRole] = useState<RecordedRole>("coordinator");
  const [tallyLoading, setTallyLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recentDays, setRecentDays] = useState<RecentTallyDay[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);

  // Analytics state
  const [preset, setPreset] = useState<PresetKey>("thisWeek");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [analyticsDim, setAnalyticsDim] = useState<TallyDimension>("jumuiya");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [rankOrder, setRankOrder] = useState<"desc" | "asc">("desc");

  // Current semester window (CSA-configured)
  const [semester, setSemester] = useState<SemesterConfig | null>(null);

  useEffect(() => {
    semesterServices
      .getCurrent()
      .then((data) => setSemester(data || null))
      .catch(() => setSemester(null));
  }, []);

  // Meeting days config state
  const [configRows, setConfigRows] = useState<MeetingConfigRow[]>([]);
  const [configDrafts, setConfigDrafts] = useState<Record<string, string>>({});
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState<Record<string, boolean>>({});

  // Novena windows state
  const [novenas, setNovenas] = useState<NovenaRow[]>([]);
  const [novenaLoading, setNovenaLoading] = useState(false);
  const [novenaSaving, setNovenaSaving] = useState(false);
  const [novenaDraft, setNovenaDraft] = useState({ start_date: todayStr(), end_date: novenaEndFor(todayStr()), is_active: true });
  const [novenaEditing, setNovenaEditing] = useState<number | null>(null);

  // History state
  const [historyRows, setHistoryRows] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");
  const [historyDim, setHistoryDim] = useState<"all" | TallyDimension>("all");
  const [historyDrafts, setHistoryDrafts] = useState<Record<string, string>>({});
  const [historyRoles, setHistoryRoles] = useState<Record<string, RecordedRole>>({});
  const [historySaving, setHistorySaving] = useState<Record<string, boolean>>({});

  const canEditConfig = useMemo(() => {
    const roles = Array.isArray(user?.role) ? user.role : user?.role ? [user.role] : [];
    return roles.some((r) => String(r).toLowerCase().trim() === "jumuiya_coordinator");
  }, [user]);

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const data = await jumuiyaAttendanceService.getMeetingConfigs();
      const rows = [...(data.configured || []), ...(data.unconfigured || [])].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setConfigRows(rows);
      const drafts: Record<string, string> = {};
      rows.forEach((r) => {
        drafts[r.jumuiya_id] = r.meeting_day != null ? String(r.meeting_day) : "";
      });
      setConfigDrafts(drafts);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "config") loadConfig();
  }, [tab, loadConfig]);

  const loadNovenas = useCallback(async () => {
    setNovenaLoading(true);
    try {
      const rows = await attendanceServices.getNovenas();
      setNovenas(rows);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setNovenaLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "novena") loadNovenas();
  }, [tab, loadNovenas]);

  const handleNovenaSave = async () => {
    const { start_date, end_date, is_active } = novenaDraft;
    if (!start_date || !end_date) {
      toast.error("Pick a start and end date for the novena");
      return;
    }
    if (start_date > end_date) {
      toast.error("Start date must be on or before the end date");
      return;
    }
    setNovenaSaving(true);
    try {
      if (novenaEditing != null) {
        await attendanceServices.updateNovena(novenaEditing, { start_date, end_date, is_active });
        toast.success("Novena updated");
      } else {
        await attendanceServices.createNovena({ start_date, end_date, is_active });
        toast.success("Novena scheduled — every day inside the window is now a tally day");
      }
      setNovenaDraft({ start_date: todayStr(), end_date: novenaEndFor(todayStr()), is_active: true });
      setNovenaEditing(null);
      await loadNovenas();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setNovenaSaving(false);
    }
  };

  const handleNovenaDelete = async (id: number) => {
    if (!window.confirm("Delete this novena? Days inside its window will stop counting as tally days.")) return;
    try {
      await attendanceServices.deleteNovena(id);
      toast.success("Novena deleted");
      if (novenaEditing === id) {
        setNovenaEditing(null);
        setNovenaDraft({ start_date: todayStr(), end_date: novenaEndFor(todayStr()), is_active: true });
      }
      await loadNovenas();
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const handleNovenaEdit = (row: NovenaRow) => {
    setNovenaEditing(row.id);
    setNovenaDraft({ start_date: row.start_date, end_date: row.end_date, is_active: row.is_active });
  };

  const handleNovenaToggle = async (row: NovenaRow) => {
    try {
      await attendanceServices.updateNovena(row.id, {
        start_date: row.start_date,
        end_date: row.end_date,
        is_active: !row.is_active,
      });
      await loadNovenas();
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const rows = await attendanceServices.getHistory({
        from: historyFrom || undefined,
        to: historyTo || undefined,
      });
      setHistoryRows(rows);
      const drafts: Record<string, string> = {};
      const roles: Record<string, RecordedRole> = {};
      rows.forEach((r: any) => {
        r.counts.forEach((c: any) => {
          const key = c.kind === "year" ? yearKey(c.year!) : c.jumuiya_id!;
          drafts[`${r.date}:${key}`] = String(c.count);
        });
        roles[r.date] = r.recorded_role || "coordinator";
      });
      setHistoryDrafts(drafts);
      setHistoryRoles(roles);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setHistoryLoading(false);
    }
  }, [historyFrom, historyTo]);

  useEffect(() => {
    if (tab === "history") loadHistory();
  }, [tab, loadHistory]);

  const handleHistorySave = async (row: HistoryRow) => {
    const role = historyRoles[row.date] || "coordinator";
    const isYear = row.dimension === "year";
    const changed: TallyCountInput[] = [];
    for (const c of row.counts) {
      const key = isYear ? yearKey(c.year!) : c.jumuiya_id!;
      const draft = Number(historyDrafts[`${row.date}:${key}`]);
      if (!Number.isInteger(draft) || draft < 0) {
        toast.error(`Enter a valid count for ${isYear ? c.label : c.jumuiya_name}`);
        return;
      }
      if (draft !== c.count) {
        changed.push(
          isYear ? { year: c.year, count: draft } : { jumuiya_id: c.jumuiya_id, count: draft }
        );
      }
    }
    if (changed.length === 0 && role === row.recorded_role) return;
    setHistorySaving((prev) => ({ ...prev, [row.date]: true }));
    try {
      const res = await attendanceServices.updateHistoryDate(row.date, changed, role);
      const msg =
        res?.data?.locked > 0
          ? `${row.date} updated (${res.data.locked} register-sourced count(s) left unchanged)`
          : `${row.date} tally updated`;
      toast.success(msg);
      loadHistory();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setHistorySaving((prev) => ({ ...prev, [row.date]: false }));
    }
  };

  const handleConfigSave = async (row: MeetingConfigRow) => {
    const val = configDrafts[row.jumuiya_id];
    setConfigSaving((prev) => ({ ...prev, [row.jumuiya_id]: true }));
    try {
      if (val === "" || val === "unset") {
        await jumuiyaAttendanceService.deleteMeetingConfig(row.jumuiya_id);
        toast.success(`${row.name}: no fixed meeting day (any day allowed)`);
      } else {
        const day = Number(val);
        await jumuiyaAttendanceService.updateMeetingConfig(row.jumuiya_id, day);
        toast.success(`${row.name} now meets every ${DAY_OPTIONS[day]}`);
      }
      await loadConfig();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setConfigSaving((prev) => ({ ...prev, [row.jumuiya_id]: false }));
    }
  };

  const loadTally = useCallback(async (target: string) => {
    setTallyLoading(true);
    try {
      const [ctx, session] = await Promise.all([
        attendanceServices.getTallyContext(target),
        attendanceServices.getSession(target),
      ]);
      setContext(ctx);
      setSessionRows(session);
      const next: Record<string, string> = {};
      ctx.jumuiyas.forEach((j: JumuiyaContext) => {
        next[j.group_id] =
          j.register_status === "recorded" && j.register_count != null ? String(j.register_count) : "";
      });
      session.forEach((s: SessionRow) => {
        if (s.dimension === "year" && s.year_of_study) {
          next[yearKey(s.year_of_study)] = String(s.count);
        } else if (s.jumuiya_id) {
          next[s.jumuiya_id] = String(s.count);
        }
      });
      setCounts(next);
      setTallyDim(session[0]?.dimension === "year" ? "year" : "jumuiya");
      const anyRow = session[0];
      setRecordedRole(
        anyRow?.recorded_role === "assistant" || anyRow?.recorded_role === "coordinator"
          ? anyRow.recorded_role
          : "coordinator"
      );
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setTallyLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTally(date);
  }, [date, loadTally]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await attendanceServices.getRecentStatus(14);
        if (mounted) setRecentDays(data.tally_days || []);
      } catch {
        // non-blocking — the strip is a convenience only
      } finally {
        if (mounted) setRecentLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const loadAnalytics = useCallback(async (from: string, to: string, dimension: TallyDimension = analyticsDim) => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const data = await attendanceServices.getAnalytics(from, to, dimension);
      setAnalytics(data);
    } catch (err) {
      setAnalyticsError(getApiError(err));
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsDim]);

  useEffect(() => {
    if (preset === "custom") return;
    const { from, to } = presetRange(preset, new Date(), semester);
    loadAnalytics(from, to, analyticsDim);
  }, [preset, analyticsDim, loadAnalytics, semester]);

  const totalAttendance = useMemo(() => {
    const keys =
      tallyDim === "year"
        ? (context?.years || []).map((yr) => yearKey(yr.year))
        : (context?.jumuiyas || []).map((j) => j.group_id);
    return keys.reduce((sum, k) => sum + (Number(counts[k]) > 0 ? Number(counts[k]) : 0), 0);
  }, [counts, context, tallyDim]);

  const isSaved = sessionRows.length > 0;
  const todayIso = todayStr();
  const semesterActive = !!(semester && todayIso >= semester.start_date && todayIso <= semester.end_date);
  const dateInSemester = !!(semester && date >= semester.start_date && date <= semester.end_date);
  const tallyDisabled = !context?.isTallyDay || tallyLoading || (semester ? !dateInSemester && !isSaved : false);

  const handleSave = async () => {
    if (!context || !context.isTallyDay) return;
    const payload: TallyCountInput[] =
      tallyDim === "year"
        ? context.years.map((yr) => ({
            year: yr.year,
            count: Number(counts[yearKey(yr.year)] || 0) || 0,
          }))
        : context.jumuiyas.map((j) => ({
            jumuiya_id: j.group_id,
            count: Number(counts[j.group_id] || 0) || 0,
          }));
    setSaving(true);
    try {
      await attendanceServices.saveSession(date, payload, recordedRole, tallyDim);
      toast.success(
        `Tally for ${date} saved by ${recordedRole === "assistant" ? "Assistant Jumuiya Coordinator" : "Jumuiya Coordinator"}`
      );
      loadTally(date);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!confirm(`Clear the tally for ${date}? This cannot be undone.`)) return;
    try {
      await attendanceServices.deleteSession(date);
      toast.success(`Tally for ${date} cleared`);
      loadTally(date);
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const handleCustomLoad = () => {
    if (!customFrom || !customTo) {
      toast.error("Select both a start and end date");
      return;
    }
    if (customFrom > customTo) {
      toast.error("Start date must be before end date");
      return;
    }
    loadAnalytics(customFrom, customTo);
  };

  const dimRows = useMemo(
    () => (analytics ? (analytics.dimension === "year" ? analytics.by_year : analytics.by_jumuiya) : []),
    [analytics]
  );

  const sortedDimRows = useMemo(() => {
    const list = [...dimRows];
    list.sort((a, b) => (rankOrder === "asc" ? b.rank - a.rank : a.rank - b.rank));
    return list;
  }, [dimRows, rankOrder]);

  const chartData = useMemo(() => {
    return dimRows.map((j) => ({
      name: j.name.split(/\s+/).slice(0, 2).join(" "),
      current: j.attendance_count,
      previous: j.trend.prev_attendance_count,
      rate: Math.round(j.rate_vs_active * 1000) / 10,
    }));
  }, [dimRows]);

  const timelineData = useMemo(() => {
    if (!analytics) return [];
    return analytics.timeline.map((t) => ({
      label: friendlyDate(t.date),
      date: t.date,
      attendance: t.attendance,
      activity: t.activity_label || "",
    }));
  }, [analytics]);

  const lastRecorded = useMemo(() => {
    if (!sessionRows.length) return null;
    return sessionRows.reduce((a, b) =>
      (b.updated_at || "") > (a.updated_at || "") ? b : a
    );
  }, [sessionRows]);

  const roleLabel = (role: RecordedRole | undefined) =>
    ROLE_LABEL[role === "assistant" ? "assistant" : "coordinator"];

  const quickCheckIssues = useMemo(() => {
    if (!context) return [];
    if (tallyDim === "year") {
      return context.years
        .filter((yr) => {
          const v = Number(counts[yearKey(yr.year)] || 0) || 0;
          return v > yr.active_members;
        })
        .map((yr) => yr.label);
    }
    return context.jumuiyas
      .filter((j) => {
        if (j.register_status === "recorded") return false;
        const v = Number(counts[j.group_id] || 0) || 0;
        return v > j.active_members;
      })
      .map((j) => j.name);
  }, [context, counts, tallyDim]);

  const insights = useMemo(() => {
    const list = dimRows;
    if (!list.length) return null;
    const improving = list.filter((j) => j.trend.delta_vs_active > 0.0005);
    const dropping = list.filter((j) => j.trend.delta_vs_active < -0.0005);
    const stable = list.filter((j) => Math.abs(j.trend.delta_vs_active) <= 0.0005);
    const top = list.find((j) => j.rank === 1) || list[0];
    const mostImproved = [...list].sort(
      (a, b) => b.trend.delta_vs_active - a.trend.delta_vs_active
    )[0];
    const mostDropped = [...list].sort(
      (a, b) => a.trend.delta_vs_active - b.trend.delta_vs_active
    )[0];
    return { improving, dropping, stable, top, mostImproved, mostDropped };
  }, [dimRows]);

  const exportXlsx = async () => {
    if (!analytics) return;
    try {
      const blob = await attendanceServices.exportAnalyticsExcel(
        analytics.period.from,
        analytics.period.to,
        analyticsDim
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-analytics-${analyticsDim}_${analytics.period.from}_${analytics.period.to}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Excel report downloaded");
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const activityStyles =
    context?.activityType === "novena"
      ? "bg-purple-50 border-purple-200 text-purple-700"
      : context?.activityType === "bible_study"
      ? "bg-amber-50 border-amber-200 text-amber-700"
      : "bg-blue-50 border-blue-200 text-blue-700";

  return (
    <div className="min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Attendance Tally & Analytics</h2>
          <p className="text-sm text-slate-500 mt-1">
            Record daily attendance and track which jumuiya is most active and improving.
          </p>
        </div>

        <div className="grid w-full grid-cols-5 gap-1 bg-slate-200/70 rounded-xl p-1 sm:flex sm:w-fit sm:gap-2">
          <button
            onClick={() => setTab("tally")}
            title="Take Tally"
            className={`flex min-w-0 items-center justify-center gap-1 px-1 py-2 rounded-lg text-[10px] font-semibold transition-colors sm:gap-2 sm:px-4 sm:text-sm ${
              tab === "tally" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <CalendarCheck size={16} className="shrink-0" /> <span className="truncate"><span className="sm:hidden">Tally</span><span className="hidden sm:inline">Take Tally</span></span>
          </button>
          <button
            onClick={() => setTab("analytics")}
            title="Analytics"
            className={`flex min-w-0 items-center justify-center gap-1 px-1 py-2 rounded-lg text-[10px] font-semibold transition-colors sm:gap-2 sm:px-4 sm:text-sm ${
              tab === "analytics" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <BarChart3 size={16} className="shrink-0" /> <span className="truncate">Analytics</span>
          </button>
          <button
            onClick={() => setTab("config")}
            title="Meeting Days"
            className={`flex min-w-0 items-center justify-center gap-1 px-1 py-2 rounded-lg text-[10px] font-semibold transition-colors sm:gap-2 sm:px-4 sm:text-sm ${
              tab === "config" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <Settings2 size={16} className="shrink-0" /> <span className="truncate"><span className="sm:hidden">Days</span><span className="hidden sm:inline">Meeting Days</span></span>
          </button>
          <button
            onClick={() => setTab("novena")}
            title="Novena"
            className={`flex min-w-0 items-center justify-center gap-1 px-1 py-2 rounded-lg text-[10px] font-semibold transition-colors sm:gap-2 sm:px-4 sm:text-sm ${
              tab === "novena" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <CalendarRange size={16} className="shrink-0" /> <span className="truncate">Novena</span>
          </button>
          <button
            onClick={() => setTab("history")}
            title="History"
            className={`flex min-w-0 items-center justify-center gap-1 px-1 py-2 rounded-lg text-[10px] font-semibold transition-colors sm:gap-2 sm:px-4 sm:text-sm ${
              tab === "history" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <History size={16} className="shrink-0" /> <span className="truncate">History</span>
          </button>
        </div>
      </div>

      {/* Current semester window banner */}
      {semester && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 text-sm ${
            semesterActive
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-300 bg-amber-50 text-amber-800"
          }`}
        >
          <span className="flex items-center gap-2 font-bold">
            <CalendarDays size={16} className="shrink-0" />
            {semester.label || "Current Semester"}
          </span>
          <span className="font-medium">
            {semester.start_date} → {semester.end_date}
          </span>
          {!semesterActive && (
            <span className="flex items-center gap-1.5 font-semibold sm:ml-auto">
              <AlertTriangle size={14} className="shrink-0" />
              Semester break — new tallies are locked until the window opens.
            </span>
          )}
        </div>
      )}

      {tab === "tally" ? (
        <div className="space-y-6">
          {/* Date + context */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Tally Date</label>
                <input
                  type="date"
                  value={date}
                  max={todayStr()}
                  onChange={(e) => setDate(e.target.value || todayStr())}
                  className={inputCls}
                />
              </div>

              <div className="flex-1">
                {tallyLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 size={16} className="animate-spin" /> Checking schedule…
                  </div>
                ) : context?.isTallyDay ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-2 text-sm font-bold rounded-full border px-4 py-2 ${activityStyles}`}>
                      <Activity size={15} /> {context.activityLabel}
                    </span>
                    {context.novena && (
                      <span className="text-xs text-slate-500">
                        Novena runs {context.novena.start_date} → {context.novena.end_date} — every day is a tally day.
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-2.5">
                    {date} is not a tally day. Tally days are <b>Monday</b> (Rosary), <b>Wednesday</b> (Bible Study),{" "}
                    <b>Thursday</b> (Rosary), or any day of an active novena.
                  </div>
                )}

                {!tallyLoading && context?.isTallyDay && !isSaved && date < todayStr() && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-2.5">
                    This is a <b>past tally day</b> with no tally recorded yet. Enter the counts below to{" "}
                    <b>backfill</b> this day (e.g. after a power outage or missed recording).
                  </div>
                )}
              </div>
            </div>

            {isSaved && !tallyLoading && (
              <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-2.5 flex items-center justify-between gap-3">
                <div>
                  <div>✓ Tally already recorded for this date — update the counts and save to overwrite.</div>
                  {lastRecorded && (
                    <div className="text-xs text-emerald-600 mt-1">
                      Last recorded by <b>{roleLabel(lastRecorded.recorded_role)}</b>
                      {lastRecorded.updated_at
                        ? ` · ${new Date(lastRecorded.updated_at).toLocaleString()}`
                        : ""}
                      {lastRecorded.source === "register" && (
                        <span className="ml-1">(from secretary register)</span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-white border border-rose-200 rounded-lg px-3 py-1.5 hover:bg-rose-50 transition-colors shrink-0"
                >
                  <Trash2 size={13} /> Clear this day
                </button>
              </div>
            )}
          </div>

          {/* Recent tally days (backfill helper) */}
          {!recentLoading && recentDays.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <History size={16} className="text-slate-400" /> Recent Tally Days
                </h3>
                <span className="text-[11px] text-slate-400">Last 14 days — click a day to open or backfill it</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentDays.map((d) => {
                  const active = d.date === date;
                  return (
                    <button
                      key={d.date}
                      onClick={() => setDate(d.date)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                        active
                          ? "border-indigo-400 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                      }`}
                    >
                      <span>{friendlyDate(d.date)}</span>
                      {d.recorded ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                          ✓ Recorded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                          Missing
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Group-by toggle + count inputs */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-800">Count Attendance</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {tallyDim === "year"
                    ? "Tally by Year of Study (Year 1-4) to see how members progress as years go by."
                    : "Tally per jumuiya. Register-sourced counts are set automatically from the secretary register."}
                </p>
              </div>
              <DimToggle value={tallyDim} onChange={setTallyDim} />
            </div>
          </div>

          {tallyLoading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" /> Loading roster…
            </div>
          ) : tallyDim === "year" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {context?.years.map((yr) => {
                const entered = Number(counts[yearKey(yr.year)] || 0) || 0;
                const overActive = entered > yr.active_members;
                const overTotal = entered > yr.total_members;
                return (
                  <div
                    key={yr.year}
                    className={`bg-white rounded-xl border p-4 ${
                      overActive ? "border-amber-300 ring-1 ring-amber-200" : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: yr.color }} />
                      <h4 className="font-semibold text-slate-800 text-sm">{yr.label}</h4>
                      <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5 shrink-0">
                        Manual count
                      </span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={1000}
                      step={1}
                      value={counts[yearKey(yr.year)] ?? ""}
                      onChange={(e) =>
                        setCounts((prev) => ({ ...prev, [yearKey(yr.year)]: e.target.value }))
                      }
                      placeholder="0"
                      disabled={!context?.isTallyDay}
                      className={`${inputCls} text-lg font-bold ${
                        !context?.isTallyDay ? "bg-slate-50 text-slate-300" : ""
                      }`}
                    />
                    <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                      <Users size={11} /> {yr.active_members} active / {yr.total_members} total members
                    </p>
                    {overActive && (
                      <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1">
                        <AlertTriangle size={11} />
                        {overTotal
                          ? `Looks high — only ${yr.total_members} total members in ${yr.label}`
                          : `Looks high — only ${yr.active_members} active members in ${yr.label}`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {context?.jumuiyas.map((j) => {
                const registerRecorded = j.register_status === "recorded";
                const inputDisabled = !context?.isTallyDay || registerRecorded;
                const entered = Number(counts[j.group_id] || 0) || 0;
                const overActive = !registerRecorded && entered > j.active_members;
                const overTotal = !registerRecorded && entered > j.total_members;
                return (
                  <div
                    key={j.group_id}
                    className={`bg-white rounded-xl border p-4 ${
                      registerRecorded
                        ? "border-emerald-200"
                        : overActive
                        ? "border-amber-300 ring-1 ring-amber-200"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: j.color || "#64748b" }} />
                      <h4 className="font-semibold text-slate-800 text-sm truncate">{j.name}</h4>
                      {registerRecorded ? (
                        <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 shrink-0">
                          <CheckCircle2 size={11} /> Register
                        </span>
                      ) : (
                        <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5 shrink-0">
                          No register
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={1000}
                      step={1}
                      value={counts[j.group_id] ?? ""}
                      onChange={(e) =>
                        setCounts((prev) => ({ ...prev, [j.group_id]: e.target.value }))
                      }
                      placeholder="0"
                      disabled={inputDisabled}
                      className={`${inputCls} text-lg font-bold ${
                        inputDisabled
                          ? registerRecorded
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-50 text-slate-300"
                          : ""
                      }`}
                    />
                    {registerRecorded ? (
                      <p className="text-[11px] text-emerald-600 mt-2 flex items-center gap-1">
                        <Lock size={11} /> From secretary register — count set automatically
                      </p>
                    ) : (
                      <>
                        <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                          <Users size={11} /> {j.active_members} active / {j.total_members} total members
                        </p>
                        {overActive && (
                          <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1">
                            <AlertTriangle size={11} />
                            {overTotal
                              ? `Looks high — only ${j.total_members} total members`
                              : `Looks high — only ${j.active_members} active members`}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-600">
                Total attendance:{" "}
                <span className="font-black text-slate-900 text-lg">{totalAttendance}</span>{" "}
                <span className="text-slate-400">
                  across {tallyDim === "year" ? context?.years.length || 0 : context?.jumuiyas.length || 0}{" "}
                  {tallyDim === "year" ? "years of study" : "jumuiyas"}
                </span>
              </div>
              {quickCheckIssues.length > 0 && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2 max-w-md">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>
                    <b>{quickCheckIssues.length}</b> count(s) exceed the active-member baseline (
                    {quickCheckIssues.join(", ")}). Double-check before saving.
                  </span>
                </div>
              )}
              {semester && !dateInSemester && (
                <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-2 max-w-md">
                  <Lock size={14} className="shrink-0" />
                  <span>
                    {date} is outside the current semester ({semester.start_date} → {semester.end_date}).
                    {isSaved
                      ? " You can still edit this tally recorded during the semester."
                      : " New tallies are only recorded within the semester window."}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadTally(date)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <RefreshCw size={15} /> Reset
                </button>
                <button
                  onClick={handleSave}
                  disabled={tallyDisabled || saving}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-colors ${
                    tallyDisabled || saving
                      ? "bg-indigo-300 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/30"
                  }`}
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {saving ? "Saving…" : isSaved ? "Update Tally" : "Save Tally"}
                </button>
              </div>
            </div>

            {/* Who took this tally? — the coordinator and their assistant share one login */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Who took this tally?
              </span>
              <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                <label
                  className={`flex min-w-0 items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold cursor-pointer transition-colors sm:px-4 ${
                    recordedRole === "coordinator"
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                      : "border-slate-200 text-slate-600 hover:border-indigo-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={recordedRole === "coordinator"}
                    onChange={() => setRecordedRole("coordinator")}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
                  />
                  <span className="truncate">Jumuiya Coordinator</span>
                </label>
                <label
                  className={`flex min-w-0 items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold cursor-pointer transition-colors sm:px-4 ${
                    recordedRole === "assistant"
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                      : "border-slate-200 text-slate-600 hover:border-indigo-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={recordedRole === "assistant"}
                    onChange={() => setRecordedRole("assistant")}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
                  />
                  <span className="truncate">Assistant Jumuiya Coordinator</span>
                </label>
              </div>
              <p className="text-xs text-slate-400 sm:ml-auto">
                Check the assistant box when the assistant took this tally — this is saved as who recorded it.
              </p>
            </div>
          </div>
        </div>
      ) : tab === "novena" ? (
        <NovenaTab
          rows={novenas}
          loading={novenaLoading}
          saving={novenaSaving}
          draft={novenaDraft}
          setDraft={setNovenaDraft}
          editing={novenaEditing}
          onSave={handleNovenaSave}
          onDelete={handleNovenaDelete}
          onEdit={handleNovenaEdit}
          onToggle={handleNovenaToggle}
          onCancel={() => {
            setNovenaEditing(null);
            setNovenaDraft({ start_date: todayStr(), end_date: novenaEndFor(todayStr()), is_active: true });
          }}
        />
      ) : tab === "config" ? (
        <MeetingDaysTab
          rows={configRows}
          drafts={configDrafts}
          setDrafts={setConfigDrafts}
          loading={configLoading}
          saving={configSaving}
          canEdit={canEditConfig}
          onSave={handleConfigSave}
        />
      ) : tab === "history" ? (
        <HistoryTab
          rows={historyRows}
          loading={historyLoading}
          from={historyFrom}
          to={historyTo}
          setFrom={setHistoryFrom}
          setTo={setHistoryTo}
          dim={historyDim}
          setDim={setHistoryDim}
          drafts={historyDrafts}
          setDrafts={setHistoryDrafts}
          roles={historyRoles}
          setRoles={setHistoryRoles}
          saving={historySaving}
          onReload={loadHistory}
          onSave={handleHistorySave}
        />
      ) : (
        <div className="space-y-6">
          {/* Period selector */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Period</label>
                <select
                  value={preset}
                  onChange={(e) => setPreset(e.target.value as PresetKey)}
                  className={inputCls}
                >
                  {PRESETS.map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
              </div>

              {preset === "custom" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">From</label>
                    <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">To</label>
                    <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className={inputCls} />
                  </div>
                  <button
                    onClick={handleCustomLoad}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                  >
                    <BarChart3 size={15} /> Load
                  </button>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Breakdown</label>
                <DimToggle value={analyticsDim} onChange={setAnalyticsDim} />
              </div>

              <button
                onClick={exportXlsx}
                disabled={!analytics || analyticsLoading}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg transition-colors md:ml-auto ${
                  !analytics || analyticsLoading
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100"
                }`}
              >
                <FileSpreadsheet size={15} /> Export Excel
              </button>
            </div>

            {analytics && (
              <p className="text-xs text-slate-400 mt-3">
                Comparing {analytics.period.from} → {analytics.period.to} against previous period{" "}
                {analytics.period.prev_from} → {analytics.period.prev_to} · {analytics.tally_days} tally session(s) recorded
              </p>
            )}
          </div>

          {analyticsError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{analyticsError}</div>
          )}

          {analyticsLoading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" /> Computing analytics…
            </div>
          ) : analytics ? (
            <>
              {/* Summary cards (CSA level) */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <SummaryCard label="Attendance" value={String(analytics.cumulative.attendance_count)} icon={<Users size={17} />} />
                <SummaryCard label="Avg / Session" value={String(analytics.cumulative.avg_per_session)} icon={<Activity size={17} />} />
                <SummaryCard label="Active Members" value={String(analytics.cumulative.active_members)} icon={<Users size={17} />} />
                <SummaryCard label="Tally Days" value={String(analytics.cumulative.tally_days)} icon={<CalendarDays size={17} />} />
                <SummaryCard
                  label="Rate vs Active"
                  value={pct(analytics.cumulative.rate_vs_active)}
                  accent
                  icon={<BarChart3 size={17} />}
                />
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Improvement</p>
                  <div className="mt-1.5">
                    <TrendBadge delta={analytics.cumulative.trend.delta_vs_active} />
                  </div>
                </div>
              </div>

              {/* Insights report */}
              {insights && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Lightbulb size={16} className="text-amber-500" /> Analytics Insights
                  </h3>
                  <p className="text-sm text-slate-600 mt-2">
                    Between <b>{analytics.period.from}</b> and <b>{analytics.period.to}</b>, {analytics.tally_days} tally
                    session(s) were recorded with <b>{analytics.cumulative.attendance_count}</b> total attendance (~
                    {analytics.cumulative.avg_per_session} per session) — an average of{" "}
                    <b>{pct(analytics.cumulative.rate_vs_active)}</b> of active members attending each session.
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li>
                      <span className="font-semibold text-slate-800">Top {analyticsDim === "year" ? "year" : "jumuiya"}:</span> <b>{insights.top.name}</b> with{" "}
                      {pct(insights.top.rate_vs_active)} attendance rate ({insights.top.attendance_count} across{" "}
                      {insights.top.tally_days} session(s)).
                    </li>
                    {insights.mostImproved.trend.delta_vs_active > 0.0005 && (
                      <li>
                        <span className="font-semibold text-slate-800">Most improved:</span> <b>{insights.mostImproved.name}</b>{" "}
                        rose {pts(insights.mostImproved.trend.delta_vs_active)} vs the previous period.
                      </li>
                    )}
                    {insights.mostDropped.trend.delta_vs_active < -0.0005 && (
                      <li>
                        <span className="font-semibold text-slate-800">Needs attention:</span> <b>{insights.mostDropped.name}</b>{" "}
                        fell {pts(Math.abs(insights.mostDropped.trend.delta_vs_active))} vs the previous period.
                      </li>
                    )}
                    <li className="flex flex-wrap gap-2 pt-1">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                        <TrendingUp size={12} /> {insights.improving.length} improving
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-1">
                        <Minus size={12} /> {insights.stable.length} stable
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-full px-2.5 py-1">
                        <TrendingDown size={12} /> {insights.dropping.length} dropping
                      </span>
                    </li>
                  </ul>
                </div>
              )}

              {/* Week-by-week trend */}
              {analytics.timeline.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="font-semibold text-slate-800 mb-1">Week-by-Week Trend</h3>
                  <p className="text-xs text-slate-400 mb-4">Total attendance per tally session in this period</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={timelineData}>
                      <defs>
                        <linearGradient id="attnGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                      <Tooltip
                        formatter={(value: any) => [`${value} attendees`, "Attendance"]}
                        labelFormatter={(label: any) => `${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="attendance"
                        name="Attendance"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        fill="url(#attnGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="font-semibold text-slate-800 mb-1">Attendance Trend</h3>
                  <p className="text-xs text-slate-400 mb-4">Current vs previous period, per jumuiya</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} barGap={2} barCategoryGap="22%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="name"
                        interval={0}
                        angle={-18}
                        textAnchor="end"
                        height={60}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                      <Tooltip cursor={{ fill: "#f1f5f9" }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="current" name="Current period" radius={[4, 4, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={dimRows[i]?.color || "#4f46e5"} />
                        ))}
                      </Bar>
                      <Bar dataKey="previous" name="Previous period" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="font-semibold text-slate-800 mb-1">Engagement Rate</h3>
                  <p className="text-xs text-slate-400 mb-4">Attendance rate vs active members (%)</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} barCategoryGap="28%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="name"
                        interval={0}
                        angle={-18}
                        textAnchor="end"
                        height={60}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                      />
                      <YAxis unit="%" tick={{ fontSize: 11, fill: "#64748b" }} />
                      <Tooltip cursor={{ fill: "#f1f5f9" }} formatter={(value: any) => [`${value}%`, "Rate vs active"]} />
                      <Bar dataKey="rate" name="Rate vs active" radius={[4, 4, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={dimRows[i]?.color || "#4f46e5"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ranking table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-slate-800">{analyticsDim === "year" ? "Year of Study Ranking" : "Jumuiya Ranking"}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      Ranked by attendance rate vs total members
                    </span>
                    <button
                      onClick={() => setRankOrder(rankOrder === "desc" ? "asc" : "desc")}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-full px-2.5 py-1 hover:bg-indigo-100 transition-colors"
                      title="Toggle ranking order"
                    >
                      <ArrowUpDown size={11} />
                      {rankOrder === "desc" ? "Top first" : "Bottom first"}
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                        <th className="px-5 py-3.5">#</th>
                        <th className="px-4 py-3.5">{analyticsDim === "year" ? "Year of Study" : "Jumuiya"}</th>
                        <th className="px-4 py-3.5 text-right">Members (act/total)</th>
                        <th className="px-4 py-3.5 text-right">Tally Days</th>
                        <th className="px-4 py-3.5 text-right">Attendance</th>
                        <th className="px-4 py-3.5 text-right">Avg/Session</th>
                        {analyticsDim !== "year" && (
                          <>
                            <th className="px-4 py-3.5 text-right">Reg. Meetings</th>
                            <th className="px-4 py-3.5 text-right">Avg Active (Reg.)</th>
                            <th className="px-4 py-3.5 text-right">Peak Active (Reg.)</th>
                            <th className="px-4 py-3.5 text-right">Distinct Attended</th>
                          </>
                        )}
                        <th className="px-4 py-3.5 text-right">Rate vs Total</th>
                        <th className="px-4 py-3.5 text-right">Rate vs Active</th>
                        <th className="px-4 py-3.5 text-right">vs Prev Period</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedDimRows.map((j) => (
                        <tr key={j.group_key} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                                j.rank === 1
                                  ? "bg-amber-100 text-amber-700"
                                  : j.rank <= 3
                                  ? "bg-slate-200 text-slate-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {j.rank}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: j.color || "#64748b" }} />
                              <span className="font-semibold text-slate-800 whitespace-nowrap">{j.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right text-slate-600 whitespace-nowrap tabular-nums">
                            {j.active_members}<span className="text-slate-400"> / {j.total_members}</span>
                          </td>
                          <td className="px-4 py-3.5 text-right text-slate-600 tabular-nums">{j.tally_days}</td>
                          <td className="px-4 py-3.5 text-right font-bold text-slate-800 tabular-nums">{j.attendance_count}</td>
                          <td className="px-4 py-3.5 text-right text-slate-600 tabular-nums">{j.avg_per_session}</td>
                          {analyticsDim !== "year" && (
                            <>
                              <td className="px-4 py-3.5 text-right text-slate-600 tabular-nums">{j.register_sessions ?? 0}</td>
                              <td className="px-4 py-3.5 text-right font-semibold text-slate-700 tabular-nums">{j.register_avg ?? 0}</td>
                              <td className="px-4 py-3.5 text-right text-slate-600 tabular-nums">{j.register_peak ?? 0}</td>
                              <td className="px-4 py-3.5 text-right text-slate-600 tabular-nums">{j.register_attendees ?? 0}</td>
                            </>
                          )}
                          <td className="px-4 py-3.5 text-right text-slate-600 tabular-nums">{pct(j.rate_vs_total)}</td>
                          <td className="px-4 py-3.5 text-right font-semibold text-slate-700 tabular-nums">{pct(j.rate_vs_active)}</td>
                          <td className="px-4 py-3.5 text-right">
                            <TrendBadge delta={j.trend.delta_vs_active} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-400">
                  Rate vs total = attendance ÷ (total members × tally days) · Rate vs active = attendance ÷ (active
                  members × tally days) · Active members = roster minus flagged-inactive members · Trend
                  compares the current period against the equal-length period before it.
                  {analyticsDim !== "year" && (
                    <span className="block mt-1">
                      Reg. columns come from the secretary registers saved within the period: Avg Active (Reg.) = average
                      present per recorded jumuiya meeting, Peak Active (Reg.) = highest attendance on a single recorded
                      meeting day — compare these with the roster-based Active Members.
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border p-4 ${accent ? "border-indigo-200 bg-indigo-50/40" : "border-slate-200"}`}>
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1 whitespace-nowrap">
        {icon} {label}
      </p>
      <p className={`text-2xl font-black ${accent ? "text-indigo-700" : "text-slate-800"}`}>{value}</p>
    </div>
  );
}

function MeetingDaysTab({
  rows,
  drafts,
  setDrafts,
  loading,
  saving,
  canEdit,
  onSave,
}: {
  rows: MeetingConfigRow[];
  drafts: Record<string, string>;
  setDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  loading: boolean;
  saving: Record<string, boolean>;
  canEdit: boolean;
  onSave: (row: MeetingConfigRow) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <CalendarDays size={16} className="text-slate-400" /> Jumuiya Meeting Days
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          These days drive the <b>secretary attendance register</b>: a register can only be saved on a jumuiya's
          meeting day, and saved registers automatically feed this page's tallies. Jumuiyas with no fixed day accept
          registers on any day. The <b>Recorded Meetings</b> column lists each jumuiya's latest register dates with
          present/total counts.
        </p>
        {!canEdit && (
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Read-only — only the Jumuiya Coordinator can change meeting days.
          </p>
        )}
      </div>

      {rows.some((r) => r.stale) && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div>
            <b>Register follow-up needed:</b>{" "}
            {rows.filter((r) => r.stale).map((r) => r.name).join(", ")} — no attendance register captured in the last 14
            days. Follow up with the respective jumuiya secretaries.
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading meeting days…
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                  <th className="px-5 py-3">Jumuiya</th>
                  <th className="px-3 py-3">Meeting Day</th>
                  <th className="px-3 py-3">Recorded Meetings</th>
                  {canEdit && <th className="px-3 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const isSaving = saving[row.jumuiya_id];
                  const changed = drafts[row.jumuiya_id] !== (row.meeting_day != null ? String(row.meeting_day) : "");
                  return (
                    <tr key={row.jumuiya_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: row.color || "#64748b" }} />
                          <span className="font-semibold text-slate-800 whitespace-nowrap">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={drafts[row.jumuiya_id] ?? ""}
                          onChange={(e) =>
                            setDrafts((prev) => ({ ...prev, [row.jumuiya_id]: e.target.value }))
                          }
                          disabled={!canEdit}
                          className={`${inputCls} max-w-[220px] ${!canEdit ? "bg-slate-50 text-slate-500" : ""}`}
                        >
                          <option value="">No fixed day (any day)</option>
                          {DAY_OPTIONS.map((label, i) => (
                            <option key={label} value={i}>
                              Every {label}
                            </option>
                          ))}
                        </select>
                        {row.meeting_day != null && changed && (
                          <p className="text-[11px] text-slate-400 mt-1">Currently: every {DAY_OPTIONS[row.meeting_day]}</p>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {row.stale && (
                          <div className="mb-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                            <AlertTriangle size={11} />
                            No register in 14+ days
                          </div>
                        )}
                        {row.recent_registers && row.recent_registers.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                            {row.recent_registers.map((r) => {
                              const [y, m, d] = r.date.split("-");
                              const label = `${MONTH_ABBR[Number(m) - 1]} ${Number(d)}`;
                              return (
                                <span
                                  key={r.date}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5"
                                  title={`${label} ${y} · ${r.present_count}/${r.total_count} present`}
                                >
                                  {label}
                                  <span className="text-slate-400 font-normal">·</span>
                                  {r.present_count}/{r.total_count}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">No registers yet</span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="px-3 py-3 text-right">
                          <button
                            onClick={() => onSave(row)}
                            disabled={isSaving || !changed}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors ${
                              isSaving || !changed
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700"
                            }`}
                          >
                            {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                            {isSaving ? "Saving…" : "Save"}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-400">
            Saving "No fixed day (any day)" removes the configured day, allowing a register to be taken any day.
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryTab({
  rows,
  loading,
  from,
  to,
  setFrom,
  setTo,
  dim,
  setDim,
  drafts,
  setDrafts,
  roles,
  setRoles,
  saving,
  onReload,
  onSave,
}: {
  rows: HistoryRow[];
  loading: boolean;
  from: string;
  to: string;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  dim: "all" | TallyDimension;
  setDim: (v: "all" | TallyDimension) => void;
  drafts: Record<string, string>;
  setDrafts: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
  roles: Record<string, RecordedRole>;
  setRoles: (updater: (prev: Record<string, RecordedRole>) => Record<string, RecordedRole>) => void;
  saving: Record<string, boolean>;
  onReload: () => void;
  onSave: (row: HistoryRow) => void;
}) {
  const visibleRows = useMemo(
    () => rows.filter((r) => dim === "all" || r.dimension === dim),
    [rows, dim]
  );

  const jumuiyaColumns = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    rows.forEach((r) =>
      r.counts.forEach((c) => {
        if (c.kind === "jumuiya" && c.jumuiya_id && !map.has(c.jumuiya_id)) {
          map.set(c.jumuiya_id, { name: c.jumuiya_name || "", color: c.jumuiya_color || "" });
        }
      })
    );
    return Array.from(map.entries())
      .map(([id, meta]) => ({ id, ...meta }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const yearColumns = YEARS.map((y) => ({ id: y, name: yearLabel(y), color: YEAR_COLORS[y] }));

  const columns = useMemo(() => {
    const cols: { kind: "jumuiya" | "year"; id: string; name: string; color: string }[] = [];
    if (dim !== "year") jumuiyaColumns.forEach((j) => cols.push({ kind: "jumuiya", id: j.id, name: j.name, color: j.color }));
    if (dim !== "jumuiya") yearColumns.forEach((y) => cols.push({ kind: "year", id: y.id, name: y.name, color: y.color }));
    return cols;
  }, [jumuiyaColumns, yearColumns, dim]);

  const countKey = (row: HistoryRow, c: HistoryCount) =>
    `${row.date}:${c.kind === "year" ? yearKey(c.year!) : c.jumuiya_id!}`;

  const hasChanges = (row: HistoryRow) => {
    const roleChanged = (roles[row.date] || "coordinator") !== (row.recorded_role || "coordinator");
    const countChanged = row.counts.some((c) => {
      const draft = Number(drafts[countKey(row, c)]);
      return Number.isInteger(draft) && draft >= 0 && draft !== c.count;
    });
    return roleChanged || countChanged;
  };

  const rolePill = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
      active
        ? "border-indigo-400 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
        : "border-slate-200 text-slate-500 hover:border-indigo-300"
    }`;

  const dimFilterCls = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
      active ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
    }`;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <History size={16} className="text-slate-400" /> Tally History
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          One entry per tally day — either the 7 jumuiya counts together or the Year of Study counts (Year 1-4), plus
          who recorded it (the coordinator or their assistant). Edit any manual count directly; register-sourced counts
          are read-only (correct those in the secretary register).
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">View</label>
            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1 w-fit">
              <button onClick={() => setDim("all")} className={dimFilterCls(dim === "all")}>All</button>
              <button onClick={() => setDim("jumuiya")} className={dimFilterCls(dim === "jumuiya")}>Jumuiya</button>
              <button onClick={() => setDim("year")} className={dimFilterCls(dim === "year")}>Year</button>
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={onReload}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <RefreshCw size={15} /> Apply
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          One row per tally day. Showing up to the 2,000 most recent tally rows matching the filters.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading tally history…
        </div>
      ) : visibleRows.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          No tally records match these filters.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-3 py-3">Activity</th>
                  {columns.map((j) => (
                    <th key={`${j.kind}:${j.id}`} className="px-2 py-3 text-center min-w-[96px]">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: j.color || "#64748b" }} />
                        {j.kind === "year"
                          ? j.name
                          : j.name.replace("St. ", "St ").replace(/^(St \w+).*$/, "$1")}
                      </span>
                    </th>
                  ))}
                  <th className="px-3 py-3">Recorded By</th>
                  <th className="px-3 py-3">Updated</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleRows.map((row) => {
                  const isSaving = saving[row.date];
                  const changed = hasChanges(row);
                  return (
                    <tr key={row.date} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-700 whitespace-nowrap">
                        {friendlyDate(row.date)}
                      </td>
                      <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{row.activity_label}</td>
                      {columns.map((j) => {
                        const c = row.counts.find(
                          (x) =>
                            j.kind === "year"
                              ? x.kind === "year" && x.year === j.id
                              : x.kind === "jumuiya" && x.jumuiya_id === j.id
                        );
                        if (!c) return <td key={`${j.kind}:${j.id}`} className="px-2 py-3 text-center text-slate-300">—</td>;
                        const readOnly = c.source === "register";
                        return (
                          <td key={`${j.kind}:${j.id}`} className="px-2 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={drafts[countKey(row, c)] ?? ""}
                                onChange={(e) =>
                                  setDrafts((prev) => ({ ...prev, [countKey(row, c)]: e.target.value }))
                                }
                                disabled={readOnly}
                                title={readOnly ? "From secretary register — locked" : "Manual count"}
                                className={`${inputCls} w-20 text-right font-bold ${
                                  readOnly ? "bg-emerald-50 text-emerald-700" : ""
                                }`}
                              />
                              {readOnly && <Lock size={11} className="text-emerald-500 shrink-0" />}
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setRoles((prev) => ({ ...prev, [row.date]: "coordinator" }))}
                            className={rolePill((roles[row.date] || "coordinator") === "coordinator")}
                          >
                            Coordinator
                          </button>
                          <button
                            onClick={() => setRoles((prev) => ({ ...prev, [row.date]: "assistant" }))}
                            className={rolePill((roles[row.date] || "coordinator") === "assistant")}
                          >
                            Assistant
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-500 whitespace-nowrap text-xs">
                        {row.updated_at ? new Date(row.updated_at).toLocaleString() : "—"}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => onSave(row)}
                          disabled={isSaving || !changed}
                          className={`flex items-center gap-1.5 ml-auto px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors ${
                            isSaving || !changed
                              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                              : "bg-indigo-600 hover:bg-indigo-700"
                          }`}
                        >
                          {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                          {isSaving ? "Saving…" : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-400">
            A single save updates the whole day (all counts in the day's mode + who recorded it). Register-sourced
            counts are locked to keep them consistent with the secretary's per-member register.
          </div>
        </div>
      )}
    </div>
  );
}

function NovenaTab({
  rows,
  loading,
  saving,
  draft,
  setDraft,
  editing,
  onSave,
  onDelete,
  onEdit,
  onToggle,
  onCancel,
}: {
  rows: NovenaRow[];
  loading: boolean;
  saving: boolean;
  draft: { start_date: string; end_date: string; is_active: boolean };
  setDraft: React.Dispatch<
    React.SetStateAction<{ start_date: string; end_date: string; is_active: boolean }>
  >;
  editing: number | null;
  onSave: () => void;
  onDelete: (id: number) => void;
  onEdit: (row: NovenaRow) => void;
  onToggle: (row: NovenaRow) => void;
  onCancel: () => void;
}) {
  const fmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const isTodayInRange = rows.some(
    (r) => r.is_active && todayStr() >= r.start_date && todayStr() <= r.end_date
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <CalendarRange size={16} className="text-slate-400" /> Novena Windows
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          Schedule a novena by picking its <b>start date</b> — the end date auto-fills to a 9-day window
          (start + 8 days) and stays editable if the novena is shorter or longer. Every day inside an{" "}
          <b>active</b> window counts as a tally day, so the offline tally app will accept those dates. The
          tally app reads these dates automatically — no setup on the app is needed.
        </p>
        {isTodayInRange ? (
          <p className="mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            A novena window is currently active — today is a valid tally day.
          </p>
        ) : (
          <p className="mt-3 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            No active novena covers today. Tally days are Monday, Wednesday and Thursday (plus any novena
            window you schedule).
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800">
          {editing != null ? "Edit Novena" : "Schedule a Novena"}
        </h3>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Start date</label>
            <input
              type="date"
              value={draft.start_date}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  start_date: e.target.value,
                  end_date: e.target.value ? novenaEndFor(e.target.value) : p.end_date,
                }))
              }
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">End date</label>
            <input
              type="date"
              value={draft.end_date}
              min={draft.start_date}
              onChange={(e) => setDraft((p) => ({ ...p, end_date: e.target.value }))}
              className={inputCls}
            />
          </div>
          <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 cursor-pointer h-fit">
            <input
              type="checkbox"
              checked={draft.is_active}
              onChange={(e) => setDraft((p) => ({ ...p, is_active: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
            />
            Active
          </label>
          <div className="flex gap-2">
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Saving…" : editing != null ? "Update" : "Schedule"}
            </button>
            {editing != null && (
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading novena windows…
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          No novena windows scheduled yet. Schedule one above to make its days tally days.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                  <th className="px-5 py-3">Window</th>
                  <th className="px-3 py-3">Days</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-5 py-3 font-semibold text-slate-700 whitespace-nowrap">
                      {fmt(row.start_date)} → {fmt(row.end_date)}
                    </td>
                    <td className="px-3 py-3 text-slate-500">
                      {Math.round(
                        (new Date(row.end_date + "T00:00:00").getTime() -
                          new Date(row.start_date + "T00:00:00").getTime()) /
                          86400000 +
                          1
                      )}{" "}
                      days
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => onToggle(row)}
                        title={row.is_active ? "Click to deactivate" : "Click to activate"}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          row.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${row.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {row.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEdit(row)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(row.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
