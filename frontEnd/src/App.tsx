import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
} from "react-router-dom";
import Authorisation from "./assets/Layouts/Authorisation";
import Reset from "./Authorization/Reset";
import ResetPasswordPage from "./Authorization/ResetPasswordPage";

// Lazy-loaded component
const Login = lazy(() => import("./Authorization/Login"));
 
// Fallback component
const FallBack: React.FC = () => <div>🍷 Please wait ...</div>;

const App: React.FC = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route element={<Authorisation />}>
        <Route index element={<Login />} />
        <Route path="/reset" element={<Reset />} />
        <Route path="/otp/:reg" element={<ResetPasswordPage />} />
      </Route>
    )
  );

  return (
    <Suspense fallback={<FallBack />}>
      <RouterProvider router={router} />
    </Suspense>
  );
};

export default App;
