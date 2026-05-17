import type { UserSearchResult } from "@team-task-manager/shared";
import { API_ROUTES } from "@team-task-manager/shared";
import { apiClient } from "./client";

export function searchUsers(query: string, excludeProjectId?: string) {
  const params = new URLSearchParams({ q: query, limit: "10" });
  if (excludeProjectId) {
    params.set("excludeProjectId", excludeProjectId);
  }
  return apiClient<{ users: UserSearchResult[] }>(
    `${API_ROUTES.users.search}?${params.toString()}`,
  );
}
