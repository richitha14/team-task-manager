import type {
  AppRole,
  ProjectRole,
  TaskPermissions,
  TaskStatus,
} from "@team-task-manager/shared";

export function isTaskOverdue(
  dueDate: Date | null,
  status: TaskStatus,
): boolean {
  if (!dueDate || status === "COMPLETED") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

export function resolveTaskPermissions(
  appRole: AppRole,
  projectRole: ProjectRole,
  userId: string,
  assigneeId: string | null,
): TaskPermissions {
  const isProjectAdmin = appRole === "ADMIN" || projectRole === "ADMIN";
  const isAssignee = assigneeId === userId;

  return {
    canEdit: isProjectAdmin,
    canDelete: isProjectAdmin,
    canAssign: isProjectAdmin,
    canUpdateStatus: isProjectAdmin || isAssignee,
  };
}

export function isProjectAdmin(appRole: AppRole, projectRole: ProjectRole) {
  return appRole === "ADMIN" || projectRole === "ADMIN";
}
