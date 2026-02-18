import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/useAuth";

export function PublicLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated) {
    return <Navigate to="/inbox" replace />;
  }

  return <Outlet />;
}
