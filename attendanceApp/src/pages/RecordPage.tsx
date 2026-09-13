import { useCallback, useEffect, useMemo, useState } from "react";
import { Save, Zap, AlertTriangle } from "lucide-react";
import { db, getMeta, setMeta, type AttendanceSession, type TallyJumuiya } from "../db/db";
import { fetchTallyContext, getApiErrorMessage, type NovenaWindow, type TallyYear } from "../api/client";
import { syncPending } from "../sync/sync";

interface Props {
  token: string;
  onSaved: () => void;
}

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Offline heuristic — mirrors the backend's default tally days.
// Mon (1) Rosary, Wed (3) Bible Study, Thu (4) Rosary. Novena days also count
// but are decided server-side, so offline saves are still allowed for any date.
const DAY_ACTIVITY: Record<number, { type: string; label: string }> = {
  1: { type: "rosary", label: "Monday Rosary" },
  3: { type: "bible_study", label: "Wednesday Bible Study" },
  4: { type: "rosary", label: "Thursday Rosary" },
};

const dayActivity = (date: string) => DAY_ACTIVITY[new Date(date + "T12:00:00").getDay()] ?? null;

// Same Year 1-4 universe as the backend. Used when the context can't be fetched.
const FALLBACK_YEARS: TallyYear[] = [
  { year: "1", label: "Year 1", color: "#0ea5e9" },
  { year: "2", label: "Year 2", color: "#10b981" },
  { year: "3", label: "Year 3", color: "#f59e0b" },
  { year: "4", label: "Year 4", color: "#8b5cf6" },
];

const yearKey = (y: string) => `y:${y}`;

const isWithinNovena = (d: string, windows: NovenaWindow[]) =>
  windows.some((n) => d >= n.start_date && d <= n.end_date);

export default function RecordPage({ token, onSaved }: Props) {
  const [date, setDate] = useState(todayISO());
  const [jumuiyas, setJumuiyas] = useState<TallyJumuiya[]>([]);
  const [years, setYears] = useState<TallyYear[]>(FALLBACK_YEARS);
  const [activeNovenas, setActiveNovenas] = useState<NovenaWindow[]>([]);
  const [activity, setActivity] = useState<{ isTallyDay: boolean; type: string; label: string } | null>(null);
  const [canSave, setCanSave] = useState(false);
  const [semester, setSemester] = useState<{ start_date: string; end_date: string } | null>(null);
  const [, setLoadingContext] = useState(false);
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"jumuiya" | "year">("jumuiya");
  const [recordedBy, setRecordedBy] = useState<"coordinator" | "assistant">("coordinator");

  const loadFromCache = useCallback((d: string) => {
    return Promise.all([getMeta<TallyJumuiya[]>("jumuiyas"), getMeta<NovenaWindow[]>("active_novenas")]).then(
      ([j, nov]) => {
        setJumuiyas(j || []);
        setActiveNovenas(nov || []);
        const offline = dayActivity(d);
        const inNovena = isWithinNovena(d, nov || []);
        const offlineTallyDay = !!(offline || inNovena);
        setActivity(
          offlineTallyDay
            ? { isTallyDay: true, type: offline?.type || "novena", label: offline?.label || "Novena day" }
            : { isTallyDay: false, type: "", label: "" }
        );
        setCanSave(offlineTallyDay);
        return j;
      }
    );
  }, []);

  const refreshContext = useCallback(
    async (d: string) => {
      setLoadingContext(true);
      try {
        const ctx = await fetchTallyContext(token, d);
        setJumuiyas(ctx.jumuiyas);
        setYears(ctx.years?.length ? ctx.years : FALLBACK_YEARS);
        setActiveNovenas(ctx.active_novenas || []);
        setActivity({
          isTallyDay: ctx.isTallyDay,
          type: ctx.activityType,
          label: ctx.activityLabel,
        });
        setCanSave(ctx.canSave);
        setSemester(ctx.semester || null);
        await setMeta("jumuiyas", ctx.jumuiyas);
        await setMeta("active_novenas", ctx.active_novenas || []);
        if (ctx.isTallyDay && !ctx.canSave) {
          setMessage({ ok: false, text: `Semester break — tallies for new dates are closed. Existing tallies can still be edited.` });
        } else if (ctx.isTallyDay) {
          setMessage({ ok: true, text: `Tally day: ${ctx.activityLabel} — enter counts below.` });
        }
      } catch {
        await loadFromCache(d);
      } finally {
        setLoadingContext(false);
      }
    },
    [token, loadFromCache]
  );

  useEffect(() => {
    loadFromCache(date);
    refreshContext(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const setCount = (id: string, value: string) => {
    if (value !== "" && !/^\d+$/.test(value)) return;
    setCounts((prev) => ({ ...prev, [id]: value }));
  };

  const validJumuiyas = useMemo(
    () =>
      jumuiyas.filter(
        (j) => counts[j.group_id] !== undefined && counts[j.group_id] !== "" && counts[j.group_id] !== "0"
      ),
    [jumuiyas, counts]
  );

  const validYearCount = useMemo(
    () => years.filter((yr) => {
      const v = counts[yearKey(yr.year)];
      return v !== undefined && v !== "" && v !== "0";
    }).length,
    [years, counts]
  );

  // Server truth when the context was fetched; offline heuristic otherwise.
  // A date is a valid tally day on Mon/Wed/Thu or inside a scheduled novena window.
  const isTallyDay = activity?.isTallyDay ?? (dayActivity(date) != null || isWithinNovena(date, activeNovenas));

  const modeControls = (
    <div className="mode-toggle" style={{ marginBottom: 12, display: "flex", gap: 8 }}>
      <button
        className={mode === "jumuiya" ? "active" : ""}
        onClick={() => setMode("jumuiya")}
        style={{ padding: "6px 12px", fontSize: 12, border: "1px solid currentColor", borderRadius: 6, cursor: "pointer" }}
      >
        Jumuiya
      </button>
      <button
        className={mode === "year" ? "active" : ""}
        onClick={() => setMode("year")}
        style={{ padding: "6px 12px", fontSize: 12, border: "1px solid currentColor", borderRadius: 6, cursor: "pointer" }}
      >
        Year
      </button>
    </div>
  );

  const recordedByControls = (
    <div className="recorded-by-toggle" style={{ marginBottom: 12, display: "flex", gap: 8, justifyContent: "center" }}>
      <button
        className={recordedBy === "coordinator" ? "active" : ""}
        onClick={() => setRecordedBy("coordinator")}
        style={{ padding: "6px 12px", fontSize: 12, border: "1px solid currentColor", borderRadius: 6, cursor: "pointer" }}
      >
        Coordinator
      </button>
      <button
        className={recordedBy === "assistant" ? "active" : ""}
        onClick={() => setRecordedBy("assistant")}
        style={{ padding: "6px 12px", fontSize: 12, border: "1px solid currentColor", borderRadius: 6, cursor: "pointer" }}
      >
        Assistant
      </button>
    </div>
  );

  const saveAll = async () => {
    if (!canSave) {
      setMessage({
        ok: false,
        text: activity?.isTallyDay
          ? `Semester break — tallies for new dates are closed. Existing tallies can still be edited.`
          : `${date} is not a tally day (Mon/Wed/Thu or a scheduled novena), so no tally was saved.`,
      });
      return;
    }

    let sessionCounts: { jumuiyaId: string; jumuiyaName: string; count: number; year?: number }[] = [];
    if (mode === "year") {
      sessionCounts = years
        .map((yr) => ({
          jumuiyaId: "",
          jumuiyaName: yr.label,
          count: Number(counts[yearKey(yr.year)] || 0) || 0,
          year: Number(yr.year),
        }))
        .filter((c) => c.count > 0);
    } else {
      sessionCounts = validJumuiyas.map((j) => ({
        jumuiyaId: j.group_id,
        jumuiyaName: j.name,
        count: Number(counts[j.group_id]),
      }));
    }

    if (sessionCounts.length === 0) {
      setMessage({ ok: false, text: "Enter at least one attendance count" });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const session: AttendanceSession = {
        sessionId: date,
        date,
        activityType: activity?.type || "rosary",
        activityLabel: activity?.label || dayActivity(date)?.label || "Attendance",
        dimension: mode === "year" ? "year" : "jumuiya",
        recordedBy,
        counts: sessionCounts.map((c) => ({
          jumuiyaId: c.jumuiyaId,
          jumuiyaName: c.jumuiyaName,
          count: c.count,
          ...(c.year !== undefined ? { year: c.year } : {}),
        })),
        recordedAt: Date.now(),
        syncedAt: null,
      };
      await db.sessions.put(session);

      const online = navigator.onLine;
      if (online && token) {
        let lastError = "";
        const res = await syncPending(token, (_s, msg) => {
          lastError = msg;
        });
        if (res.pushed > 0) {
          setMessage({ ok: true, text: `Saved ${mode === "year" ? "year tallies" : "tallies"} for ${date} and synced to the server.` });
        } else if (res.failed > 0) {
          setMessage({
            ok: false,
            text: `Server rejected the tally for ${date}: ${lastError}. The data is saved on your device — it will retry when you reopen the app.`,
          });
        }
      } else {
        setMessage({ ok: true, text: `Saved ${date} offline. Will auto-sync when online.` });
      }
      setCounts({});
      onSaved();
    } catch (err) {
      setMessage({ ok: false, text: getApiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString();
  const enteredCount = mode === "year" ? validYearCount : validJumuiyas.length;

  return (
    <div className="space-y-4">
      {message && (
        <div className={`banner ${message.ok ? "online" : "error"}`}>
          {message.ok ? <Zap size={16} /> : <AlertTriangle size={16} />}
          {message.text}
        </div>
      )}

      <div className="card">
        <h2>Record Attendance</h2>
        <p className="sub">Pick the date, then enter the number of attendees.</p>

        <div className="field">
          <label>Activity date</label>
          <input
            type="date"
            className="input"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: 190, padding: "8px 10px", fontSize: 14 }}
          />
        </div>

        {activity?.isTallyDay && activity.label ? (
          <p className="sub" style={{ marginTop: -6 }}>
            Selected: <strong>{activity.label}</strong> on {dateLabel}
          </p>
        ) : (
          <p className="sub" style={{ marginTop: -6 }}>
            {dateLabel} is not a tally day (Mon/Wed/Thu or a scheduled novena), so no tally can be saved.
          </p>
        )}

        {semester && (
          <p className="sub" style={{ marginTop: -8, fontSize: 11 }}>
            Semester: {semester.start_date} → {semester.end_date}
          </p>
        )}

        {modeControls}
      </div>

      {mode === "year" ? (
        <div className="card">
          <h2>Attendees per Year of Study</h2>
          <p className="sub">Leave a year blank or 0 if none attended.</p>
          <div className="space-y-2">
            {years.map((yr) => (
              <div key={yr.year} className="jum-row">
                <div className="jum-dot" style={{ backgroundColor: yr.color }}>
                  {yr.year}
                </div>
                <span className="jum-name">{yr.label}</span>
                <input
                  className="jum-count"
                  inputMode="numeric"
                  placeholder="0"
                  value={counts[yearKey(yr.year)] ?? ""}
                  onChange={(e) => setCount(yearKey(yr.year), e.target.value)}
                />
              </div>
            ))}
          </div>

          {recordedByControls}

          <button className="btn btn-primary" disabled={saving || !canSave} onClick={saveAll} style={{ marginTop: 16, display: "flex", width: "fit-content", marginLeft: "auto", marginRight: "auto", padding: "10px 28px", fontSize: 14 }} title={!canSave ? (activity?.isTallyDay ? "Semester break — new tallies closed" : "Not a tally day") : undefined}>
            <Save size={18} />
            {saving ? "Saving…" : !canSave ? (activity?.isTallyDay ? "Semester break" : "Not a tally day") : `Save${enteredCount ? ` ${enteredCount} Year${enteredCount > 1 ? "s" : ""}` : ""}`}
          </button>
        </div>
      ) : jumuiyas.length === 0 ? (
        <div className="card">
          <p className="sub" style={{ margin: 0 }}>
            No jumuiya list cached yet. Connect once so the app can fetch the tally-day list.
          </p>
        </div>
      ) : (
        <div className="card">
          <h2>Attendees per Jumuiya</h2>
          <p className="sub">Leave a jumuiya blank or 0 if none attended.</p>
          <div className="space-y-2">
            {jumuiyas.map((j) => (
              <div key={j.group_id} className="jum-row">
                <div className="jum-dot" style={{ backgroundColor: j.color || "#6366f1" }}>
                  {initials(j.name)}
                </div>
                <span className="jum-name">{j.name}</span>
                <input
                  className="jum-count"
                  inputMode="numeric"
                  placeholder="0"
                  value={counts[j.group_id] ?? ""}
                  onChange={(e) => setCount(j.group_id, e.target.value)}
                />
              </div>
            ))}
          </div>

          {recordedByControls}

          <button className="btn btn-primary" disabled={saving || !canSave} onClick={saveAll} style={{ marginTop: 16, display: "flex", width: "fit-content", marginLeft: "auto", marginRight: "auto", padding: "10px 28px", fontSize: 14 }} title={!canSave ? (activity?.isTallyDay ? "Semester break — new tallies closed" : "Not a tally day") : undefined}>
            <Save size={18} />
            {saving ? "Saving…" : !canSave ? (activity?.isTallyDay ? "Semester break" : "Not a tally day") : `Save${enteredCount ? ` ${enteredCount} Jumuiya${enteredCount > 1 ? "s" : ""}` : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}

function initials(name: string): string {
  return name
    .replace("St. ", "")
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
