import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

interface PublicRouteProps {
  children: ReactNode;
}

/**
 * PublicRoute - Protects routes that should be accessible only when NOT logged in
 * If user is already logged in, redirects to home /
 * If user is not logged in, renders the children
 */
const PublicRoute = ({ children }: PublicRouteProps) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // If already logged in, redirect to home
  if (isAuthenticated && location.pathname.includes("/login")) {
    // Check if there's a location to redirect back to after logout
    const from = location.state?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;

