import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
} from "react-router-dom";
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
import { useAuth } from "./context/AuthContext";
import { PublicRoute, ProtectedRoute } from "./Regulator";
import CommunityHub from "./pages/sacramental/CommunityHub";

// Lazy-loaded component
const Login = lazy(() => import("./pages/Authorization/Login"));

// Fallback component
const FallBack: React.FC = () => <div>🍷 Please wait ...</div>;

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <main className="flex-grow">
        {/* Show landing page content when NOT logged in */}
        {!user && (
          <>
            <ImageSlider />
            <AboutSection />
            <CommunitySection />
            <GallerySection />
          </>
        )}

        {/* Show all sections when logged in */}
        {user && (
          <>
            <JumuiyaSection />
            <OfficialsSection />
            <ProjectsSection />
            <ActivitiesSection />
            <GallerySection />
          </>
        )}

        {/* Show Support section when NOT logged in */}
        {!user && <SupportSection />}
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
        <Route path="/admin/quiz" element={<Appadmin />}/>

        <Route path="/" element={<Pageoulet />}>
          <Route index element={<Home />} />

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

          <Route path="community-hub" element={<CommunityHub />} />
        </Route>
      </>
    )
  );

  return (
    <Suspense fallback={<FallBack />}>
      <RouterProvider router={router} />
    </Suspense>
  );
};

export default App;
