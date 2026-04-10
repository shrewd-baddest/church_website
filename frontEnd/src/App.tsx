import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route
} from "react-router-dom";
// import Authorisation from "./assets/Layouts/Authorisation";
// import Reset from "./pages/Authorization/Reset";
// import ResetPasswordPage from "./pages/Authorization/ResetPasswordPage";
import Authorisation from "./assets/Layouts/Authorisation";
import Reset from "./pages/Authorization/Reset";
import ResetPasswordPage from "./pages/Authorization/ResetPasswordPage";
import Pageoulet from "./assets/Layouts/Pageoulet";
import Challenge from "./pages/Devotions/pages/Challenge";
import Rosary from "./pages/Devotions/pages/Rosary";
import Liturgy from "./pages/Devotions/pages/Liturgy";
import Prayer from "./pages/Devotions/pages/Prayer";
import Readings from "./pages/Devotions/pages/Readings";
import Dashboard from "./pages/Devotions/pages/Dashboard";
import Layout from "./pages/Devotions/components/Layout";
import Appadmin from "./pages/Devotions/Adminpage/App"
import AdminPanel from "./pages/officials/AdminPanel";
import PublicView from "./pages/officials/PublicView";
import OfficialProfile from "./pages/officials/OfficialProfile";
import PublicHistoryView from "./pages/officials/PublicHistoryView";
import {
  AboutSection,
  CommunitySection,
  SupportSection,
} from "./pages/Landing/components/sections";
import ActivitiesSection from "./pages/Landing/components/sections/activities";
import GallerySection from "./pages/Landing/components/sections/gallery";
import ProjectsSection from "./pages/Landing/components/sections/projects";
import OfficialsSection from "./pages/Landing/components/sections/officials";
import JumuiyaSection from "./pages/Landing/components/sections/jumuiya";
import ImageSlider from "./pages/Landing/components/ImageSlider";
import JumuiyaLanding from "./pages/Jumuiya/JumuiyaLanding";
import JumuiyaDetail from "./pages/Jumuiya/JumuiyaDetail";
import CommunityHub from "./pages/sacramental/CommunityHub";
import UniversalAdmin from "./pages/Admin/UniversalAdmin";
import AdminDashboard from "./pages/Admin/pages/AdminDashboard";
import AdminSuggestions from "./pages/Admin/pages/AdminSuggestions";
import RecordsExplorer from "./pages/Admin/pages/RecordsExplorer";
import DonationMonitor from "./pages/Admin/pages/DonationMonitor";
import SuggestionBox from "./pages/Landing/components/sections/SuggestionBox";
import GalleryManager from "./pages/Admin/pages/GalleryManager";
import GalleryPage from "./pages/Gallery/index";
import { DataProvider } from "./pages/Jumuiya/context/DataContext";




import { useAuth } from "./context/AuthContext";
import { PublicRoute, ProtectedRoute } from "./Regulator";

// Lazy-loaded component
const Login = lazy(() => import("./pages/Authorization/Login"));

// Fallback component
const FallBack: React.FC = () => <div>🍷 Please wait ...</div>;

const Home: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      <main className="w-full">
        <ImageSlider />
        <AboutSection />
        <CommunitySection />
        <GallerySection />
        <SuggestionBox />
        <SupportSection />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
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
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <UniversalAdmin />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="officials-hub" element={<AdminPanel />} />
          <Route path="devotions-hub" element={<Appadmin />} />
          <Route path="records" element={<RecordsExplorer />} />
          <Route path="donations" element={<DonationMonitor />} />
          <Route path="suggestions" element={<AdminSuggestions />} />
          <Route path="gallery" element={<GalleryManager />} />
          <Route path="settings" element={<div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200">Settings Page Coming Soon</div>} />
        </Route>

        <Route path="/" element={<Pageoulet />}>
          <Route index element={<Home />} />
          <Route path="officials" element={<PublicView />} />
          <Route path="officials/:id" element={<OfficialProfile />} />
          <Route path="officials/history" element={<PublicHistoryView />} />

          <Route
            path="/devotions"
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

          <Route
            path="/jumuiya"
            element={
              <ProtectedRoute>
                <DataProvider>
                  <JumuiyaLanding />
                </DataProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/jumuiya/:id"
            element={
              <ProtectedRoute>
                <DataProvider>
                  <JumuiyaDetail />
                </DataProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/community/:moduleSlug?"
            element={<CommunityHub />}
          />
          <Route path="/gallery" element={<GalleryPage />} />
        </Route>

      </>,
    ),
  );

  return (
    <Suspense fallback={<FallBack />}>
      <RouterProvider router={router} />
    </Suspense>
  );
};

export default App;
