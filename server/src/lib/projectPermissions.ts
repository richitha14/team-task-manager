import type { AppRole, ProjectPermissions, ProjectRole } from "@team-task-manager/shared";

export function resolveProjectPermissions(
  appRole: AppRole,
  projectRole: ProjectRole,
): ProjectPermissions {
  const isProjectAdmin = appRole === "ADMIN" || projectRole === "ADMIN";

  return {
    canEdit: isProjectAdmin,
    canDelete: isProjectAdmin,
    canManageMembers: isProjectAdmin,
  };
}
