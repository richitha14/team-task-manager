import type { TaskSummary, TaskStatus, TaskPriority } from "@team-task-manager/shared";
import { API_ROUTES } from "@team-task-manager/shared";
import { apiClient } from "./client";

export type TaskFilters = {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  q?: string;
};

function buildQuery(filters: TaskFilters) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function fetchTasks(projectId: string, filters: TaskFilters = {}) {
  return apiClient<{ tasks: TaskSummary[] }>(
    `${API_ROUTES.projects.tasks(projectId)}${buildQuery(filters)}`,
  );
}

export function fetchTask(projectId: string, taskId: string) {
  return apiClient<{ task: TaskSummary }>(
    API_ROUTES.projects.task(projectId, taskId),
  );
}

export function createTask(
  projectId: string,
  payload: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string | null;
    assigneeId?: string | null;
  },
) {
  return apiClient<{ task: TaskSummary }>(
    API_ROUTES.projects.tasks(projectId),
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function updateTask(
  projectId: string,
  taskId: string,
  payload: Partial<{
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string | null;
    assigneeId: string | null;
  }>,
) {
  return apiClient<{ task: TaskSummary }>(
    API_ROUTES.projects.task(projectId, taskId),
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export function deleteTask(projectId: string, taskId: string) {
  return apiClient<void>(API_ROUTES.projects.task(projectId, taskId), {
    method: "DELETE",
  });
}
