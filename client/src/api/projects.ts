import type {
  ProjectDetail,
  ProjectMemberSummary,
  ProjectSummary,
} from "@team-task-manager/shared";
import { API_ROUTES } from "@team-task-manager/shared";
import { apiClient } from "./client";

export function fetchProjects() {
  return apiClient<{ projects: ProjectSummary[] }>(API_ROUTES.projects.list);
}

export function fetchProject(id: string) {
  return apiClient<{ project: ProjectDetail }>(API_ROUTES.projects.detail(id));
}

export function createProject(payload: { name: string; description?: string }) {
  return apiClient<{ project: ProjectSummary }>(API_ROUTES.projects.create, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProject(
  id: string,
  payload: { name: string; description?: string },
) {
  return apiClient<{ project: ProjectDetail }>(API_ROUTES.projects.detail(id), {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteProject(id: string) {
  return apiClient<void>(API_ROUTES.projects.detail(id), {
    method: "DELETE",
  });
}

export function addProjectMember(
  projectId: string,
  payload: { userId: string; role: "ADMIN" | "MEMBER" },
) {
  return apiClient<{ member: ProjectMemberSummary }>(
    API_ROUTES.projects.members(projectId),
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function updateProjectMemberRole(
  projectId: string,
  userId: string,
  role: "ADMIN" | "MEMBER",
) {
  return apiClient<{ member: ProjectMemberSummary }>(
    API_ROUTES.projects.member(projectId, userId),
    {
      method: "PATCH",
      body: JSON.stringify({ role }),
    },
  );
}

export function removeProjectMember(projectId: string, userId: string) {
  return apiClient<void>(API_ROUTES.projects.member(projectId, userId), {
    method: "DELETE",
  });
}
