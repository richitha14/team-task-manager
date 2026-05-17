import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function HomeRedirect() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  return (
    <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
  );
}
