import type { AdminUserSummary } from "@team-task-manager/shared";
import { API_ROUTES } from "@team-task-manager/shared";
import { apiClient } from "./client";

export function fetchAdminUsers() {
  return apiClient<{ users: AdminUserSummary[] }>(API_ROUTES.admin.users);
}

export function updateUserRole(userId: string, role: "ADMIN" | "MEMBER") {
  return apiClient<{ user: AdminUserSummary }>(
    `${API_ROUTES.admin.users}/${userId}/role`,
    {
      method: "PATCH",
      body: JSON.stringify({ role }),
    },
  );
}
