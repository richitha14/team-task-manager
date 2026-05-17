import type { AdminUserSummary, AppRole } from "@team-task-manager/shared";
import { AppError } from "../middleware/errorHandler.js";
import { prisma } from "../lib/prisma.js";

export async function listUsers(): Promise<AdminUserSummary[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  return users.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
  }));
}

export async function updateUserRole(
  actorId: string,
  targetUserId: string,
  role: AppRole,
): Promise<AdminUserSummary> {
  if (actorId === targetUserId) {
    throw new AppError(400, "You cannot change your own role");
  }

  const user = await prisma.user.update({
    where: { id: targetUserId },
    data: { role },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
  };
}
