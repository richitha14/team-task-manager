import type { AppRole } from "@team-task-manager/shared";
import type { Prisma } from "@prisma/client";

export function projectAccessFilter(
  userId: string,
  appRole: AppRole,
): Prisma.ProjectWhereInput {
  if (appRole === "ADMIN") return {};
  return {
    OR: [{ ownerId: userId }, { members: { some: { userId } } }],
  };
}

export function taskInAccessibleProjectsFilter(
  userId: string,
  appRole: AppRole,
): Prisma.TaskWhereInput {
  return { project: projectAccessFilter(userId, appRole) };
}

export function startOfTodayUtc(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function overdueTaskFilter(): Prisma.TaskWhereInput {
  return {
    status: { not: "COMPLETED" },
    dueDate: { lt: startOfTodayUtc() },
  };
}
