import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import ScrollToTop from './utils/ScrollToTop.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { SocketProvider } from './context/SocketContext.tsx'
import { SSEProvider } from './context/SSEContext.tsx'
import { NotificationProvider } from './context/NotificationContext.tsx'
import { AppProvider } from './context/AppContext.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import RouteErrorBoundary from './components/RouteErrorBoundary'
import { isChunkLoadError, reloadForStaleChunk } from './utils/chunkReload'
import { prefetchAll } from './utils/routePrefetch'

const queryClient = new QueryClient()

// Warm lazy route chunks during idle time so in-app navigation is instant
// (devotions tabs, admin pages, jumuiya, projects, etc.). Runs only after the
// initial page has finished loading and the browser is free.
function warmRouteChunks() {
  const ric =
    (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void })
      .requestIdleCallback;
  if (ric) {
    ric(() => { prefetchAll(); }, { timeout: 3000 });
  } else {
    setTimeout(() => prefetchAll(), 3000);
  }
}
if (document.readyState === 'complete') {
  warmRouteChunks();
} else {
  window.addEventListener('load', warmRouteChunks, { once: true });
}

// Auto-recover from stale chunks after a redeploy (see utils/chunkReload.ts).
// This runs before React mounts so it covers every lazy import in the app.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  reloadForStaleChunk();
});
window.addEventListener('error', (event) => {
  if (isChunkLoadError(event.error) || isChunkLoadError(event.message)) {
    event.preventDefault();
    reloadForStaleChunk();
  }
}, { capture: true });
window.addEventListener('unhandledrejection', (event) => {
  if (isChunkLoadError(event.reason)) {
    event.preventDefault();
    reloadForStaleChunk();
  }
});

// Force reload when a new service worker takes control (clears stale caches)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SSEProvider>
          <SocketProvider>
            <NotificationProvider>
              <BrowserRouter>
                <AppProvider>
                  <ScrollToTop />
                  <RouteErrorBoundary>
                    <App />
                  </RouteErrorBoundary>
                </AppProvider>
              </BrowserRouter>
            </NotificationProvider>
          </SocketProvider>
        </SSEProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
)



