import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function SessionExpiredBanner() {
  const { sessionError } = useAuth();

  if (!sessionError) return null;

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      {sessionError}{" "}
      <Link to="/login" className="font-medium underline">
        Sign in again
      </Link>
    </div>
  );
}
