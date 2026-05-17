import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { EmptyState } from "../ui/EmptyState";

export function AdminRoute() {
  const { user } = useAuth();

  if (user?.role !== "ADMIN") {
    return (
      <EmptyState
        variant="error"
        title="Access denied"
        description="This area is restricted to administrators."
        action={
          <Link
            to="/dashboard"
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            Back to dashboard
          </Link>
        }
      />
    );
  }

  return <Outlet />;
}
