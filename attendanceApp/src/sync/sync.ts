import { db, getSession, setMeta, getMeta, type AttendanceSession } from "../db/db";
import {
  pushSession,
  getApiErrorMessage,
  fetchRecentRecorded,
  type SessionPayload,
  type ServerRecordedSession,
} from "../api/client";
import { BASE_URL } from "../api/client";

export interface SyncResult {
  pushed: number;
  failed: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Retrieves the best available auth token: localStorage first (used by apiClient),
 * then falls back to IndexedDB.
 */
export async function getAuthToken(): Promise<string> {
  const local = localStorage.getItem("csa_attendance_token");
  if (local) return local;
  const dbToken = await getSession("token");
  return dbToken || "";
}

/**
 * Checks whether the server is actually reachable, not just that the
 * browser reports "online".
 */
async function isServerReachable(): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    await fetch(`${BASE_URL}/attendance/tally-context?date=test`, {
      method: "HEAD",
      cache: "no-store",
      signal: ctrl.signal,
    });
    clearTimeout(t);
    return true;
  } catch {
    return false;
  }
}

/**
 * Waits `ms` milliseconds.
 */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Flushes all unsynced attendance sessions to the backend.
 * Each saved date is one POST to /attendance/sessions — the backend replaces
 * that date's tallies atomically, so re-pushing an already-saved date is safe.
 *
 * Retries network errors up to 3 times with exponential backoff.
 * On 401, dispatches `csa:auth-expired` to prompt re-login.
 */
export async function syncPending(
  token: string,
  onError?: (session: AttendanceSession, message: string) => void
): Promise<SyncResult> {
  const pending = await db.sessions.filter((s) => !s.syncedAt).toArray();
  if (pending.length === 0) return { pushed: 0, failed: 0 };

  // The apiClient interceptor reads the token from localStorage. If there's
  // no localStorage token the user isn't properly authenticated for the
  // server, so bail out early — don't waste retries on guaranteed 401/404s.
  const localToken = localStorage.getItem("csa_attendance_token");
  const auth = localToken || token || (await getAuthToken());
  if (!auth) return { pushed: 0, failed: 0 };

  // Verify the server is actually reachable before attempting sync.
  const reachable = await isServerReachable();
  if (!reachable) return { pushed: 0, failed: 0 };

  let pushed = 0;
  let failed = 0;

  for (const s of pending) {
    let attempt = 0;
    let synced = false;

    while (attempt < MAX_RETRIES && !synced) {
      try {
        const isYear = s.dimension === "year";
        await pushSession({
          date: s.date,
          dimension: isYear ? "year" : "jumuiya",
          counts: s.counts.map((c) =>
            isYear
              ? { year: String(c.year ?? 1), count: c.count }
              : { jumuiya_id: c.jumuiyaId!, count: c.count }
          ) as SessionPayload["counts"],
          recordedBy: s.recordedBy || "coordinator",
        });
        await db.sessions.update(s.sessionId, { syncedAt: Date.now() });
        pushed += 1;
        synced = true;
      } catch (err: unknown) {
        const apiError = err as { response?: { status?: number; data?: { message?: string } } };
        const status = apiError?.response?.status;

        // If 401, dispatch auth-expired and stop syncing.
        if (status === 401) {
          window.dispatchEvent(new Event("csa:auth-expired"));
          failed += 1;
          onError?.(s, "Session expired. Please sign in again.");
          break;
        }

        // 404 from requireRole means the token's role doesn't match.
        // Treat like an auth issue — don't retry, it won't help.
        if (status === 404) {
          failed += 1;
          onError?.(s, "Access denied — your session may have expired. Please sign in again.");
          break;
        }

        attempt++;
        if (attempt >= MAX_RETRIES) {
          failed += 1;
          onError?.(s, getApiErrorMessage(err));
        } else {
          await wait(RETRY_DELAY_MS * attempt);
        }
      }
    }
  }

  return { pushed, failed };
}

export async function pendingCount(): Promise<number> {
  return db.sessions.filter((s) => !s.syncedAt).count();
}

export async function recordedCount(): Promise<number> {
  return db.sessions.filter((s) => !!s.syncedAt).count();
}

export async function getAllSessions(): Promise<AttendanceSession[]> {
  return db.sessions.orderBy("recordedAt").reverse().toArray();
}

export async function getSyncedSessions(): Promise<AttendanceSession[]> {
  return db.sessions.orderBy("recordedAt").reverse().filter((s) => !!s.syncedAt).toArray();
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.sessions.delete(sessionId);
}

// ── Recorded data caching for offline display ──

const RECORDED_CACHE_KEY = "recorded_cache";

/**
 * Caches server-recorded data in IndexedDB for offline access.
 */
export async function cacheRecordedSessions(
  sessions: ServerRecordedSession[]
): Promise<void> {
  await setMeta(RECORDED_CACHE_KEY, sessions);
}

/**
 * Loads cached server-recorded data from IndexedDB.
 */
export async function getCachedRecordedSessions(): Promise<
  ServerRecordedSession[]
> {
  const data = await getMeta<ServerRecordedSession[]>(RECORDED_CACHE_KEY);
  return data || [];
}

/**
 * Fetches recent recorded sessions from server and caches them.
 * On network error, returns cached data if available.
 * Returns null if both fetch and cache fail.
 */
export async function fetchAndCacheRecorded(
  limit = 3
): Promise<{ data: ServerRecordedSession[]; fromCache: boolean }> {
  try {
    const data = await fetchRecentRecorded(limit);
    // Cache successful fetch
    await cacheRecordedSessions(data);
    return { data, fromCache: false };
  } catch {
    // Network error — try cache
    const cached = await getCachedRecordedSessions();
    return { data: cached.slice(0, limit), fromCache: true };
  }
}
