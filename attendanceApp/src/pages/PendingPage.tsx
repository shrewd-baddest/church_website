import { useEffect, useState } from "react";
import {
  RefreshCw,
  WifiOff,
  CheckCircle2,
  Clock,
  Trash2,
  History,
  ClipboardCheck,
  AlertTriangle,
} from "lucide-react";
import {
  getAllSessions,
  getSyncedSessions,
  syncPending,
  pendingCount,
  deleteSession,
  getAuthToken,
} from "../sync/sync";
import {
  checkSessionExists,
  fetchRecentRecorded,
  type ServerRecordedSession,
} from "../api/client";
import { db } from "../db/db";
import type { AttendanceSession } from "../db/db";

type SavedTab = "pending" | "recorded";

const RECORDED_LIMIT = 3;

interface Props {
  token: string;
  pending: number;
  onSynced: (n: number) => void;
}

export default function PendingPage({ token, pending, onSynced }: Props) {
  const [tab, setTab] = useState<SavedTab>("pending");
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [synced, setSynced] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(
    null
  );
  const [serverRecorded, setServerRecorded] = useState<ServerRecordedSession[]>(
    []
  );

  const load = async () => {
    setLoading(true);
    // Load local data first (fast, from IndexedDB)
    try {
      const [allSessions, allSynced] = await Promise.all([
        getAllSessions(),
        getSyncedSessions(),
      ]);
      setSessions(allSessions);
      setSynced(allSynced);
    } catch {
      // IndexedDB error — shouldn't happen, but handle gracefully
    }
    setLoading(false);

    // Fetch server data in background (slow, from API)
    fetchRecentRecorded(RECORDED_LIMIT)
      .then(setServerRecorded)
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const sync = async () => {
    setSyncing(true);
    setStatus(null);
    try {
      const t = await getAuthToken();
      if (!t) {
        const count = await pendingCount();
        if (count > 0) {
          setStatus({
            ok: false,
            text: `You have ${count} unsynced record${count === 1 ? "" : "s"}. Log in online to sync them to the server.`,
          });
        } else {
          setStatus({ ok: true, text: "Nothing to sync" });
        }
        load();
        return;
      }
      const errors: string[] = [];
      const res = await syncPending(t, (_s, msg) => {
        errors.push(`${_s.date}: ${msg}`);
      });
      if (res.pushed > 0 && res.failed === 0) {
        setStatus({
          ok: true,
          text: `Synced ${res.pushed} date${res.pushed === 1 ? "" : "s"}`,
        });
        onSynced(res.pushed);
      } else if (res.pushed > 0 && res.failed > 0) {
        setStatus({
          ok: false,
          text: `Synced ${res.pushed}, but ${res.failed} failed: ${errors[0] || "server error"}`,
        });
        onSynced(res.pushed);
      } else if (res.failed > 0) {
        setStatus({
          ok: false,
          text: `All ${res.failed} failed: ${errors[0] || "server error"}. Check date & try again.`,
        });
      } else {
        setStatus({ ok: true, text: "Nothing to sync" });
      }
      load();
    } catch {
      setStatus({
        ok: false,
        text: "Sync failed — you're likely offline. It will retry automatically.",
      });
    } finally {
      setSyncing(false);
    }
  };

  const removePending = async (s: AttendanceSession) => {
    if (!confirm(`Delete "${s.date}" from your device?`)) return;
    await deleteSession(s.sessionId);
    load();
    onSynced(0);
  };

  const clearAllPending = async () => {
    const pendingSessions = sessions.filter((s) => !s.syncedAt);
    if (pendingSessions.length === 0) return;
    if (
      !confirm(
        `Delete all ${pendingSessions.length} unsynced record${pendingSessions.length === 1 ? "" : "s"}? ` +
          "This cannot be undone."
      )
    )
      return;
    await Promise.all(pendingSessions.map((s) => db.sessions.delete(s.sessionId)));
    load();
    onSynced(0);
  };

  const removeSynced = async (s: AttendanceSession) => {
    if (navigator.onLine) {
      const exists = await checkSessionExists(s.date);
      if (!exists) {
        if (
          !confirm(
            "This session was NOT found on the server. " +
              "It may have failed to sync. Delete it from your device anyway?"
          )
        )
          return;
      } else {
        if (
          !confirm(
            `Delete "${s.date}" from your device? ` +
              "The server copy is safe — you're only removing the local record."
          )
        )
          return;
      }
    } else {
      if (
        !confirm(
          `You're offline. Delete "${s.date}" from your device? ` +
            "Make sure it has already synced."
        )
      )
        return;
    }
    await deleteSession(s.sessionId);
    load();
  };

  const pendingSessions = sessions.filter((s) => !s.syncedAt);
  const latestSynced = synced.slice(0, RECORDED_LIMIT);

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="card">
        <div
          className="flex"
          style={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <h2>Saved Dates</h2>
          <span className={`chip ${pending > 0 ? "pending" : "synced"}`}>
            {pending > 0 ? <Clock size={12} /> : <CheckCircle2 size={12} />}
            {pending > 0 ? `${pending} pending` : "all synced"}
          </span>
        </div>
        <p className="sub">
          Tap Sync Now, or just wait — saved dates auto-sync when internet
          returns.
        </p>
        <button
          className="btn btn-primary btn-block"
          onClick={sync}
          disabled={syncing || pending === 0}
        >
          <RefreshCw size={18} className={syncing ? "spin" : ""} />
          {syncing ? "Syncing…" : "Sync now"}
        </button>
        {pendingSessions.length > 0 && (
          <button
            className="btn btn-ghost btn-block"
            onClick={clearAllPending}
            style={{ marginTop: 8 }}
          >
            <Trash2 size={16} /> Clear all pending
          </button>
        )}
        {status && (
          <div
            className={`banner ${status.ok ? "online" : "error"}`}
            style={{ margin: "12px 0 0" }}
          >
            {status.text}
          </div>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="recorded-by-toggle" style={{ display: "flex", gap: 8 }}>
        <button
          className={tab === "pending" ? "active" : ""}
          onClick={() => setTab("pending")}
          style={{ flex: 1 }}
        >
          <History size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
          Pending
          {pending > 0 && (
            <span
              style={{
                background: "var(--amber)",
                color: "#fff",
                borderRadius: 999,
                fontSize: 10,
                minWidth: 16,
                height: 16,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
                marginLeft: 4,
              }}
            >
              {pending}
            </span>
          )}
        </button>
        <button
          className={tab === "recorded" ? "active" : ""}
          onClick={() => setTab("recorded")}
          style={{ flex: 1 }}
        >
          <ClipboardCheck
            size={14}
            style={{ verticalAlign: -2, marginRight: 4 }}
          />
          Recorded
          {synced.length > 0 && (
            <span
              style={{
                background: "var(--green)",
                color: "#fff",
                borderRadius: 999,
                fontSize: 10,
                minWidth: 16,
                height: 16,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
                marginLeft: 4,
              }}
            >
              {synced.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab content */}
      {loading ? (
        <div className="card">
          <p className="sub" style={{ margin: 0 }}>
            Loading…
          </p>
        </div>
      ) : tab === "pending" ? (
        /* ── Pending tab ── */
        pendingSessions.length === 0 ? (
          <div className="card">
            <div
              style={{
                textAlign: "center",
                color: "var(--muted)",
                padding: "8px 0",
              }}
            >
              <WifiOff
                size={28}
                style={{ margin: "0 auto 8px", opacity: 0.5 }}
              />
              <p style={{ margin: 0, fontSize: 14 }}>
                No unsynced dates — you're all up to date.
              </p>
            </div>
          </div>
        ) : (
          pendingSessions.map((s) => (
            <div key={s.sessionId} className="card">
              <div
                className="flex"
                style={{
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <div>
                  <strong style={{ fontSize: 15 }}>
                    {new Date(s.date + "T00:00:00").toLocaleDateString(
                      undefined,
                      { weekday: "short", month: "short", day: "numeric" }
                    )}
                  </strong>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>
                    {s.activityLabel} · recorded by {s.recordedBy}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="chip pending">
                    <Clock size={12} /> Pending
                  </span>
                  <button
                    onClick={() => removePending(s)}
                    style={{
                      border: 0,
                      background: "transparent",
                      color: "var(--red)",
                      cursor: "pointer",
                      padding: 4,
                    }}
                    aria-label="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {/* Tally breakdown */}
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 8 }}>
                {s.counts.length === 0 ? (
                  <p
                    style={{
                      color: "var(--muted)",
                      fontSize: 12,
                      margin: 0,
                      fontStyle: "italic",
                    }}
                  >
                    No tally data recorded
                  </p>
                ) : (
                  s.counts.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "4px 0",
                        fontSize: 13,
                      }}
                    >
                      <span style={{ color: "var(--ink)" }}>
                        {s.dimension === "year"
                          ? `Year ${c.year}`
                          : c.jumuiyaName || c.jumuiyaId || "Unknown"}
                      </span>
                      <strong>{c.count}</strong>
                    </div>
                  ))
                )}
                {s.counts.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0 0",
                      fontSize: 13,
                      fontWeight: 700,
                      borderTop: "1px solid var(--line)",
                      marginTop: 4,
                    }}
                  >
                    <span>Total</span>
                    <span>{s.counts.reduce((t, c) => t + c.count, 0)}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )
      ) : /* ── Recorded tab ── */
      serverRecorded.length === 0 && latestSynced.length === 0 ? (
        <div className="card">
          <div
            style={{
              textAlign: "center",
              color: "var(--muted)",
              padding: "8px 0",
            }}
          >
            <ClipboardCheck
              size={28}
              style={{ margin: "0 auto 8px", opacity: 0.5 }}
            />
            <p style={{ margin: 0, fontSize: 14 }}>No recorded dates yet.</p>
            <p style={{ margin: "4px 0 0", fontSize: 12 }}>
              Synced tallies appear here for quick reference.
            </p>
          </div>
        </div>
      ) : (
        <div className="card">
          <h2>Recently Synced</h2>
          <p className="sub">
            Latest tallies on the main site. Delete once verified.
          </p>
          <div>
            {serverRecorded.map((s) => (
              <div key={`srv-${s.date}`} className="record-row">
                <div style={{ flex: 1 }}>
                  <strong>
                    {new Date(s.date + "T00:00:00").toLocaleDateString(
                      undefined,
                      { weekday: "short", month: "short", day: "numeric" }
                    )}
                  </strong>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>
                    {s.activityLabel} · {s.totalCount} total
                  </div>
                  <div
                    style={{
                      color: "var(--green)",
                      fontSize: 11,
                      marginTop: 2,
                    }}
                  >
                    On main site
                  </div>
                </div>
                <span className="chip synced">
                  <CheckCircle2 size={12} /> Recorded
                </span>
              </div>
            ))}
            {latestSynced
              .filter((ls) => !serverRecorded.some((sr) => sr.date === ls.date))
              .map((s) => (
                <div key={s.sessionId} className="record-row">
                  <div style={{ flex: 1 }}>
                    <strong>
                      {new Date(s.date + "T00:00:00").toLocaleDateString(
                        undefined,
                        { weekday: "short", month: "short", day: "numeric" }
                      )}
                    </strong>
                    <div style={{ color: "var(--muted)", fontSize: 12 }}>
                      {s.activityLabel} ·{" "}
                      {s.counts.reduce((t, c) => t + c.count, 0)} total
                    </div>
                    <div
                      style={{
                        color: "var(--green)",
                        fontSize: 11,
                        marginTop: 2,
                      }}
                    >
                      Synced{" "}
                      {s.syncedAt
                        ? new Date(s.syncedAt).toLocaleDateString()
                        : ""}
                    </div>
                  </div>
                  <span className="chip synced">
                    <CheckCircle2 size={12} /> Recorded
                  </span>
                  <button
                    onClick={() => removeSynced(s)}
                    style={{
                      border: 0,
                      background: "transparent",
                      color: "var(--red)",
                      cursor: "pointer",
                      padding: 4,
                    }}
                    aria-label="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
