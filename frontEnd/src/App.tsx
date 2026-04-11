import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

// Standard imports (Optimized for performance)
import { Home } from "./pages/Landing/components/page/Home";
import { PublicRoute, ProtectedRoute } from "./Regulator";
import { DataProvider } from "./pages/Jumuiya/context/DataContext";
import Pageoulet from "./assets/Layouts/Pageoulet";
import Authorisation from "./assets/Layouts/Authorisation";
import Login from "./pages/Authorization/Login";
import Reset from "./pages/Authorization/Reset";
import ResetPasswordPage from "./pages/Authorization/ResetPasswordPage";
import PublicView from "./pages/officials/PublicView";
import OfficialProfile from "./pages/officials/OfficialProfile";
import GalleryPage from "./pages/Landing/components/page/GalleryPage";

// Layouts (Complex ones stay lazy)
const Layout = lazy(() => import("./pages/Devotions/components/Layout"));
const UniversalAdmin = lazy(() => import("./pages/Admin/UniversalAdmin"));

// Landing standalone pages
const ProjectsPage = lazy(() => import("./pages/Landing/components/page/ProjectsPage"));
const ActivitiesPage = lazy(() => import("./pages/Landing/components/page/ActivitiesPage"));

// Utility pages
const NotFound = lazy(() => import("./pages/NotFound"));

// Devotions
const Dashboard = lazy(() => import("./pages/Devotions/pages/Dashboard"));
const Readings = lazy(() => import("./pages/Devotions/pages/Readings"));
const Prayer = lazy(() => import("./pages/Devotions/pages/Prayer"));
const Liturgy = lazy(() => import("./pages/Devotions/pages/Liturgy"));
const Rosary = lazy(() => import("./pages/Devotions/pages/Rosary"));
const Challenge = lazy(() => import("./pages/Devotions/pages/Challenge"));
const Appadmin = lazy(() => import("./pages/Devotions/Adminpage/App"));

// Officials
const AdminPanel = lazy(() => import("./pages/officials/AdminPanel"));
const PublicHistoryView = lazy(() => import("./pages/officials/PublicHistoryView"));

// Jumuiya
const JumuiyaLanding = lazy(() => import("./pages/Jumuiya/JumuiyaLanding"));
const JumuiyaDetail = lazy(() => import("./pages/Jumuiya/JumuiyaDetail"));

// Admin
const AdminDashboard = lazy(() => import("./pages/Admin/pages/AdminDashboard"));
const RecordsExplorer = lazy(() => import("./pages/Admin/pages/RecordsExplorer"));
const DonationMonitor = lazy(() => import("./pages/Admin/pages/DonationMonitor"));
const CommunityManager = lazy(() => import("./pages/Admin/pages/CommunityManager"));
const CommunityDetailEditor = lazy(() => import("./pages/Admin/pages/CommunityDetailEditor"));
const AdminSuggestions = lazy(() => import("./pages/Admin/pages/AdminSuggestions"));
const GalleryManager = lazy(() => import("./pages/Admin/pages/GalleryManager"));

// Sacramental / Community
import { CommunityProvider } from "./pages/sacramental/context/CommunityDataContext";
const Community = lazy(() => import("./pages/sacramental/Community"));
const CommunityDetail = lazy(() => import("./pages/sacramental/CommunityDetail"));
const NotificationPage = lazy(() => import("./pages/Devotions/pages/NotificationPage"));

// Fallback component
const FallBack: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="text-xl font-medium text-slate-600 animate-pulse">
      🍷 Please wait ...
    </div>
  </div>
);


const App: React.FC = () => {
  return (
    <Suspense fallback={<FallBack />}>
      <Routes>
        {/* Authentication Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Authorisation />
            </PublicRoute>
          }
        >
          <Route index element={<Login />} />
          <Route path="reset" element={<Reset />} />
          <Route path="otp/:reg" element={<ResetPasswordPage />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <UniversalAdmin />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="officials" element={<AdminPanel />} />
          <Route path="devotions" element={<Appadmin />} />
          <Route path="records" element={<RecordsExplorer />} />
          <Route path="donations" element={<DonationMonitor />} />
          <Route path="community-management" element={<CommunityManager />} />
          <Route path="community-management/:categoryId" element={<CommunityDetailEditor />} />
          <Route path="suggestions" element={<AdminSuggestions />} />
          <Route path="gallery" element={<GalleryManager />} />
          <Route path="settings" element={<div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200">Settings Page Coming Soon</div>} />
        </Route>

        {/* Public Routes with Page Layout */}
        <Route path="/" element={<Pageoulet />}>
          <Route index element={<Home />} />
          <Route path="officials" element={<PublicView />} />
          <Route path="officials/:id" element={<OfficialProfile />} />
          <Route path="officials/history" element={<PublicHistoryView />} />

          {/* Standalone Landing Pages */}
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
          <Route path="activities" element={<ProtectedRoute><ActivitiesPage /></ProtectedRoute>} />
          
          {/* show notification to all */}
          <Route path="Notification" element={<ProtectedRoute><NotificationPage /></ProtectedRoute>} />
          {/* Devotions (Protected) */}
          <Route
            path="devotions"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="readings" element={<Readings />} />
            <Route path="prayer" element={<Prayer />} />
            <Route path="liturgy" element={<Liturgy />} />
            <Route path="rosary" element={<Rosary />} />
            <Route path="challenge" element={<Challenge />} />
          </Route>

          {/* Jumuiya (Protected) */}
          <Route
            path="jumuiya"
            element={
              <ProtectedRoute>
                <DataProvider>
                  <JumuiyaLanding />
                </DataProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="jumuiya/:id"
            element={
              <ProtectedRoute>
                <DataProvider>
                  <JumuiyaDetail />
                </DataProvider>
              </ProtectedRoute>
            }
          />

          {/* Community Hub */}
          <Route
            path="community"
            element={
              <CommunityProvider>
                <Community />
              </CommunityProvider>
            }
          />
          <Route
            path="community/:moduleId"
            element={
              <CommunityProvider>
                <CommunityDetail />
              </CommunityProvider>
            }
          />

          {/* 404 - Catch-all for unmatched routes */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default App;
