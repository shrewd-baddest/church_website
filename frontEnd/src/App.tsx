import { lazy, Suspense } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Core Infrastructure & Critical Pillars (Standard Imports)
import { Home } from "./pages/Landing/components/page/Home";
import { PublicRoute, ProtectedRoute } from "./Regulator";
import { DataProvider } from "./pages/Jumuiya/context/DataContext";
import Pageoulet from "./assets/Layouts/Pageoulet";
import Authorisation from "./assets/Layouts/Authorisation";
import Login from "./pages/Authorization/Login";
import GalleryPage from "./pages/Landing/components/page/GalleryPage";
import { ProjectsProvider } from "./pages/projects/context/ProjectsProvider";

// Adaptive Discovery Paths (Lazy Loading for Performance)
const Reset = lazy(() => import("./pages/Authorization/Reset"));
const ResetPasswordPage = lazy(() => import("./pages/Authorization/ResetPasswordPage"));
const FirstLoginSetup = lazy(() => import("./pages/Authorization/FirstLoginSetup"));
const VerifyEmail = lazy(() => import("./pages/Authorization/VerifyEmail"));
const PublicView = lazy(() => import("./pages/officials/PublicView"));
const OfficialProfile = lazy(() => import("./pages/officials/OfficialProfile"));
const Layout = lazy(() => import("./pages/Devotions/components/Layout"));
const UniversalAdmin = lazy(() => import("./pages/Admin/UniversalAdmin"));
const ProjectsHome = lazy(() => import("./pages/projects/pages/Home").then((module) => ({ default: module.Home })));
const SacramentalsPage = lazy(() =>
  import("./pages/projects/pages/Sacramentals").then((module) => ({
    default: module.Sacramentals,
  }))
);
const TshirtsPage = lazy(() => import("./pages/projects/pages/Tshirts").then((module) => ({ default: module.Tshirts })));
const ChairsPage = lazy(() => import("./pages/projects/pages/Chairs").then((module) => ({ default: module.Chairs })));
const InstrumentsPage = lazy(() => import("./pages/projects/pages/Instruments").then((module) => ({ default: module.Instruments })));
const OtherProjectsPage = lazy(() => import("./pages/projects/pages/OtherProjects").then((module) => ({ default: module.OtherProjects })));
const ActivitiesPage = lazy(() => import("./pages/Landing/components/page/ActivitiesPage"));
const ProductDetailsPage = lazy(() => import("./pages/projects/pages/ProductDetails"));

// New Admin Pages
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));

// Hire Status / Payment
const HireStatus = lazy(() => import("./pages/HireStatus"));

// Utility pages
const NotFound = lazy(() => import("./pages/NotFound"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));

// Devotions
const Dashboard = lazy(() => import("./pages/Devotions/pages/Dashboard"));
const Readings = lazy(() => import("./pages/Devotions/pages/Readings"));
const Prayer = lazy(() => import("./pages/Devotions/pages/Prayer"));
const Liturgy = lazy(() => import("./pages/Devotions/pages/Liturgy"));
const Rosary = lazy(() => import("./pages/Devotions/pages/Rosary"));
const Challenge = lazy(() => import("./pages/Devotions/pages/Challenge"));
const Appadmin = lazy(() => import("./pages/Devotions/Adminpage/App"));
const JumuiComparison = lazy(() => import("./pages/Devotions/csaComparison/CsaComparison"));
const MemberDashboard = lazy(() => import("./pages/Devotions/individualStatus/IndividualProgress"));

// Officials
const AdminPanel = lazy(() => import("./pages/officials/AdminPanel"));
const PublicHistoryView = lazy(() => import("./pages/officials/PublicHistoryView"));

// Jumuiya
const JumuiyaLanding = lazy(() => import("./pages/Jumuiya/JumuiyaLanding"));
const JumuiyaDetail = lazy(() => import("./pages/Jumuiya/JumuiyaDetail"));

// Admin
const AdminDashboard = lazy(() => import("./pages/Admin/pages/AdminDashboard"));
const ProjectsManager = lazy(() =>
  import("./pages/Admin/pages/ProjectsManager")
);
const DonationMonitor = lazy(() => import("./pages/Admin/pages/DonationMonitor"));
// Admin Components
const CommunityManager = lazy(() => import("./pages/Admin/pages/CommunityManager"));
const WeeklyActivitiesAdmin = lazy(() =>
  import("./pages/Admin/pages/WeeklyActivitiesAdmin")
);

const SemesterActivitiesAdmin = lazy(() =>
  import("./pages/Admin/pages/SemesterActivitiesAdmin")
);

const AnnouncementsAdmin = lazy(() =>
  import("./pages/Admin/pages/AnnouncementsAdmin")
);
const CommunityDetailEditor = lazy(() => import("./pages/Admin/pages/CommunityDetailEditor"));
const AdminSuggestions = lazy(() => import("./pages/Admin/pages/AdminSuggestions"));
const SuggestionBin = lazy(() => import("./pages/Admin/pages/SuggestionBin"));
const UnmaskApproval = lazy(() => import("./pages/Admin/pages/UnmaskApproval"));
const DeletionApproval = lazy(() => import("./pages/Admin/pages/DeletionApproval"));
const GalleryManager = lazy(() => import("./pages/Admin/pages/GalleryManager"));
const SacramentalsBannerManager = lazy(() => import("./pages/Admin/pages/SacramentalsBannerManager"));
const JumuiyaMembersAdmin = lazy(() => import("./pages/Admin/pages/JumuiyaMembersAdmin"));
const SettingsPage = lazy(() => import("./pages/Admin/pages/Settings"));
const CsaSecretaryDashboard = lazy(() => import("./pages/Admin/pages/CsaSecretaryDashboard"));
const ActivityLog = lazy(() => import("./pages/Admin/pages/ActivityLog"));
const AdminBookings = lazy(() => import("./pages/Admin/pages/AdminBookings"));

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
      <Toaster position="top-right" reverseOrder={false} />
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

        {/* First-login-setup must be outside PublicRoute — login() sets user mid-submit,
            which makes PublicRoute redirect to "/" and trump the navigate() call. */}
        <Route path="/login/first-login-setup" element={<FirstLoginSetup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

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
          <Route path="weekly-activities" element={<WeeklyActivitiesAdmin />} />
          <Route path="semester-activities" element={<SemesterActivitiesAdmin />} />
          <Route path="announcements" element={<AnnouncementsAdmin />} />
          <Route path="officials" element={<AdminPanel />} />
          <Route path="devotions" element={<Appadmin />} />
          <Route path="donations" element={<DonationMonitor />} />
          <Route path="community-management" element={<CommunityManager />} />
          <Route path="community-management/:categoryId" element={<CommunityDetailEditor />} />
          <Route path="suggestions" element={<AdminSuggestions />} />
          <Route path="suggestion-bin" element={<SuggestionBin />} />
          <Route path="gallery" element={<GalleryManager />} />
          <Route path="sacramentals-banners" element={<SacramentalsBannerManager />} />
          <Route path="projects" element={<ProjectsManager />} />
          <Route path="jumuiya-members" element={<JumuiyaMembersAdmin />} />
          <Route path="jumuiya-members/:id" element={<JumuiyaMembersAdmin />} />
          <Route path="registered-members" element={<CsaSecretaryDashboard />} />
          <Route path="activity-log" element={<ActivityLog />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Order Confirmation (no layout) */}
        <Route path="/order-confirmation" element={<OrderConfirmation />} />
        <Route path="/hire-status" element={<HireStatus />} />
        <Route path="/suggestions/unmask/:token" element={<UnmaskApproval />} />
        <Route path="/officials/deletion-approval/:token" element={<DeletionApproval />} />

        {/* Public Routes with Page Layout */}
        <Route path="/" element={<Pageoulet />}>
          <Route index element={<Home />} />
          <Route path="officials" element={<PublicView />} />
          <Route path="officials/:id" element={<OfficialProfile />} />
          <Route path="officials/history" element={<PublicHistoryView />} />

          {/* Standalone Landing Pages */}
          <Route path="gallery" element={<ProtectedRoute><GalleryPage /></ProtectedRoute>} />
          <Route element={<ProtectedRoute><ProjectsProvider><Outlet /></ProjectsProvider></ProtectedRoute>}>
            <Route path="projects" element={<ProjectsHome />} />
            <Route path="sacramentals" element={<SacramentalsPage />} />
            <Route path="t-shirts" element={<TshirtsPage />} />
            <Route path="chairs" element={<ChairsPage />} />
            <Route path="instruments" element={<InstrumentsPage />} />
            <Route path="other-projects" element={<OtherProjectsPage />} />
            <Route path="activities" element={<ActivitiesPage />} />
            <Route path="product/:id" element={<ProductDetailsPage />} />
          </Route>
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
            <Route path="comparison" element={<JumuiComparison />} />
            <Route path="progress" element={<MemberDashboard />} />
          </Route>

          {/* Jumuiya (Public with persistent provider wrapper to optimize load speed) */}
          <Route element={<DataProvider><Outlet /></DataProvider>}>
            <Route path="jumuiya" element={<JumuiyaLanding />} />
            <Route path="jumuiya/:id" element={<JumuiyaDetail />} />
          </Route>

          {/* Community Hub with persistent provider wrapper to optimize load speed */}
          <Route element={<CommunityProvider><Outlet /></CommunityProvider>}>
            <Route path="community" element={<Community />} />
            <Route path="community/:moduleId" element={<CommunityDetail />} />
          </Route>

          {/* Legal Pages */}
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />

          {/* 404 - Catch-all for unmatched routes */}
          <Route path="/*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default App;
