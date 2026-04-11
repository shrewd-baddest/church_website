import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

interface PublicRouteProps {
  children: ReactNode;
}

/**
 * PublicRoute - For routes only accessible when LOGGED OUT (like /login).
 * If authenticated, redirects the user back to where they came from or Home.
 */

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    // If user is already logged in, redirect them back to where they came from
    const from = location.state?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;

