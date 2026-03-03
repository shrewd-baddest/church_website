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

// Lazy-loaded component
const Login = lazy(() => import("./pages/Authorization/Login"));
 
// Fallback component
const FallBack: React.FC = () => <div>🍷 Please wait ...</div>;

const App: React.FC = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>

      <Route path="/login" element={<Authorisation />} >
        <Route index element={<Login />} />
        <Route path="reset" element={<Reset />} />
        <Route path="otp/:reg" element={<ResetPasswordPage />} />
      </Route>


      <Route path="/" element={<Pageoulet />}>
        {/* <Route index element={<Home />} /> */}


      
       <Route path="devotions" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="readings" element={<Readings />} />
          <Route path="prayer" element={<Prayer />} />
          <Route path="liturgy" element={<Liturgy />} />
          <Route path="rosary" element={<Rosary />} />
          <Route path="challenge" element={<Challenge />} />
        </Route>

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
