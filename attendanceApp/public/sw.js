/* CSA Attendance — offline-first service worker with auto-update. */
const CACHE = "csa-attendance-v5";
const SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/version.json",
  "/icons/app-icon-192.png",
  "/icons/app-icon-512.png",
  "/icons/app-icon-maskable-192.png",
  "/icons/app-icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

/* ── Install: cache the app shell and activate immediately ── */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate: purge ALL old caches and claim all clients ── */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

/* ── Message handler: respond to version check requests ── */
self.addEventListener("message", (event) => {
  const { type } = event.data || {};
  if (type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/* ── Fetch strategy ── */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only handle same-origin requests.
  if (url.origin !== self.location.origin) return;

  // API calls: never cache.
  if (url.pathname.startsWith("/api")) return;

  // version.json: network-only (never cache, always fresh).
  if (url.pathname === "/version.json") {
    event.respondWith(fetch(request));
    return;
  }

  // Navigations: network-first, fall back to cached shell.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches
            .open(CACHE)
            .then((c) => c.put("/index.html", copy))
            .catch(() => {});
          return res;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Static assets (JS, CSS, images): network-first.
  // This ensures new builds are always fetched fresh.
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches
            .open(CACHE)
            .then((c) => c.put(request, copy))
            .catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});
