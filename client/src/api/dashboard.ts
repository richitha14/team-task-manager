import type { DashboardStats } from "@team-task-manager/shared";
import { API_ROUTES } from "@team-task-manager/shared";
import { apiClient } from "./client";

export function fetchDashboardStats() {
  return apiClient<{ stats: DashboardStats }>(API_ROUTES.dashboard);
}
