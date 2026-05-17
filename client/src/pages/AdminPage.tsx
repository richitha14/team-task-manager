import { useEffect, useState } from "react";
import type { AdminUserSummary } from "@team-task-manager/shared";
import { fetchAdminUsers, updateUserRole } from "../api/admin";
import { ApiError } from "../api/client";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export function AdminPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdminUsers()
      .then((data) => {
        if (!cancelled) setUsers(data.users);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Failed to load users",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRoleChange(targetId: string, role: "ADMIN" | "MEMBER") {
    try {
      const { user: updated } = await updateUserRole(targetId, role);
      setUsers((current) =>
        current.map((u) => (u.id === updated.id ? updated : u)),
      );
      showToast(`Updated ${updated.name} to ${role}`, "success");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not update role",
        "error",
      );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Spinner />
        Loading users…
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Could not load users"
        description={error}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Admin</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage application roles. Signed in as {user?.name} ({user?.role}).
        </p>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                <td className="px-4 py-3 text-slate-600">{row.email}</td>
                <td className="px-4 py-3">
                  {row.id === user?.id ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">
                      {row.role} (you)
                    </span>
                  ) : (
                    <select
                      value={row.role}
                      onChange={(e) =>
                        void handleRoleChange(
                          row.id,
                          e.target.value as "ADMIN" | "MEMBER",
                        )
                      }
                      className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="MEMBER">MEMBER</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
