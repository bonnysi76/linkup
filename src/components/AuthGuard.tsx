import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/src/hooks/useAuth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile?.isSetupComplete && location.pathname !== "/setup") {
    return <Navigate to="/setup" replace />;
  }

  if (location.pathname === "/") {
    return <Navigate to="/feed" replace />;
  }

  return <>{children}</>;
}
