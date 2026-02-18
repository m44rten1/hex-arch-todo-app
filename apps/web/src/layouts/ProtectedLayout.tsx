import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import { AppShell } from "@/components/AppShell";

export function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
