import { useEffect, useState } from "react";
import { PencilLine, History, Wifi, WifiOff, Download, LogOut } from "lucide-react";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { getSession, clearSession } from "./db/db";
import { syncPending, getAuthToken } from "./sync/sync";
import LoginPage from "./pages/LoginPage";
import RecordPage from "./pages/RecordPage";
import PendingPage from "./pages/PendingPage";
import InstallButton from "./components/InstallButton";

type Tab = "record" | "pending";

type Splash = "show" | "fade" | "gone";

export default function App() {
  const network = useNetworkStatus();
  const [token, setToken] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("record");
  const [pending, setPending] = useState(0);
  const [syncMsg, setSyncMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [splash, setSplash] = useState<Splash>("show");
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const t1 = window.setTimeout(() => setSplash("fade"), 1200);
    const t2 = window.setTimeout(() => setSplash("gone"), 1700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const loadAuth = async () => {
    const t = await getSession("token");
    setToken(t);
    if (!t) {
      // Offline-unlocked session from a previous local sign-in
      const mode = await getSession("mode");
      if (mode === "offline") setOfflineMode(true);
    }
    setReady(true);
  };

  const refreshPendingCount = async () => {
    const { pendingCount } = await import("./sync/sync");
    setPending(await pendingCount());
  };

  const handleLogout = async () => {
    if (!confirm("Sign out? Pending records will stay on this device.")) return;
    localStorage.removeItem("csa_attendance_token");
    await clearSession();
    setToken(null);
    setOfflineMode(false);
    setTab("record");
  };

  useEffect(() => {
    loadAuth();
  }, []);

  useEffect(() => {
    const onAuthExpired = async () => {
      const mode = await getSession("mode");
      setToken(null);
      setSyncMsg(null);
      // If this device was offline-unlocked, stay in the app instead of
      // dead-ending on a login screen that needs internet.
      if (mode === "offline") setOfflineMode(true);
    };
    window.addEventListener("csa:auth-expired", onAuthExpired);
    return () => window.removeEventListener("csa:auth-expired", onAuthExpired);
  }, []);

  useEffect(() => {
    const onUpdate = () => setUpdateAvailable(true);
    window.addEventListener("csa:update-available", onUpdate);
    return () => window.removeEventListener("csa:update-available", onUpdate);
  }, []);

  useEffect(() => {
    if (ready) refreshPendingCount();
  }, [ready]);

  // Auto-sync the moment connectivity returns (and on first load when online).
  useEffect(() => {
    if (network !== "online") return;
    let cancelled = false;
    const doSync = async () => {
      const auth = await getAuthToken();
      const res = await syncPending(auth);
      if (cancelled) return;
      if (res.pushed > 0) {
        setSyncMsg({
          ok: true,
          text: `Synced ${res.pushed} record${res.pushed === 1 ? "" : "s"} to the server`,
        });
        refreshPendingCount();
      } else if (res.failed > 0) {
        setSyncMsg({
          ok: false,
          text: `${res.failed} record${res.failed === 1 ? "" : "s"} failed to sync. Open Saved tab to retry.`,
        });
        refreshPendingCount();
      } else if (!getAuthToken()) {
        const { pendingCount: pc } = await import("./sync/sync");
        const count = await pc();
        if (count > 0) {
          setSyncMsg({
            ok: false,
            text: `${count} unsynced record${count === 1 ? "" : "s"}. Log in online to sync them.`,
          });
        }
      }
    };
    doSync();
    const timers = window.setTimeout(() => setSyncMsg(null), 6000);
    return () => {
      cancelled = true;
      clearTimeout(timers);
    };
  }, [network]);

  return (
    <>
      {splash !== "gone" && (
        <div className={`splash ${splash === "fade" ? "fade" : ""}`}>
          <div className="splash-logo">
            <img src="/icons/app-icon-512.png" alt="CSA Attendance" className="splash-logo-img" />
          </div>
          <div className="splash-name">CSA Attendance</div>
        </div>
      )}

      {!ready ? (
        <div className="app-shell">
          <main className="app-main">Loading…</main>
        </div>
      ) : !token && !offlineMode ? (
        <LoginPage
          onLogin={(newToken) => {
            if (newToken) {
              setToken(newToken);
              setOfflineMode(false);
            } else {
              setOfflineMode(true);
            }
            setTab("record");
            refreshPendingCount();
          }}
        />
      ) : (
        <div className="app-shell">
      <main className="app-main">
        <div className={`banner ${network}`}>
          {network === "online" ? <Wifi size={16} /> : <WifiOff size={16} />}
          {network === "online"
            ? offlineMode
              ? "Offline session — sign in again to re-sync with the server"
              : "Online — new records sync automatically"
            : "Offline — records are saved on this device and will sync later"}
        </div>
        {syncMsg && (
          <div className={`banner ${syncMsg.ok ? "online" : "error"}`}>{syncMsg.text}</div>
        )}
        {updateAvailable && (
          <div
            className="banner"
            style={{ background: "#eff6ff", color: "#2563eb", cursor: "pointer" }}
            onClick={() => window.location.reload()}
          >
            <Download size={16} />
            New version available — tap to refresh
          </div>
        )}

        <InstallButton />

        {tab === "record" ? (
          <RecordPage token={token || ""} onSaved={refreshPendingCount} />
        ) : (
          <PendingPage
            token={token || ""}
            pending={pending}
            onSynced={(n) => {
              if (n > 0) setSyncMsg({ ok: true, text: `Synced ${n} records` });
              refreshPendingCount();
            }}
          />
        )}
      </main>

      <nav className="bottom-nav">
        <button className={tab === "record" ? "active" : ""} onClick={() => setTab("record")}>
          <PencilLine size={20} />
          Record
        </button>
        <button className={tab === "pending" ? "active" : ""} onClick={() => setTab("pending")}>
          <History size={20} />
          Saved
          {pending > 0 && <span className="badge">{pending > 99 ? "99+" : pending}</span>}
        </button>
        <button onClick={handleLogout}>
          <LogOut size={20} />
          Sign out
        </button>
      </nav>
        </div>
      )}
    </>
  );
}