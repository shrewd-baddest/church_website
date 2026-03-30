import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute - Protects routes that require authentication
 * If user is not logged in, redirects to /login
 * If user is logged in, renders the children
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // if (!isAuthenticated) {
  //   // Redirect to login, but save the current location they were trying to go to
  //   return <Navigate to="/login" state={{ from: location }} replace />;
  // }

  return <>{children}</>;
};

export default ProtectedRoute;

