import type { UserSearchResult } from "@team-task-manager/shared";
import { prisma } from "../lib/prisma.js";

export async function searchUsers(
  query: string,
  limit: number,
  excludeProjectId?: string,
): Promise<UserSearchResult[]> {
  let excludeIds: string[] = [];
  if (excludeProjectId) {
    const members = await prisma.projectMember.findMany({
      where: { projectId: excludeProjectId },
      select: { userId: true },
    });
    excludeIds = members.map((m) => m.userId);
  }

  const users = await prisma.user.findMany({
    where: {
      AND: [
        excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {},
        {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
      ],
    },
    select: { id: true, name: true, email: true },
    take: limit,
    orderBy: { name: "asc" },
  });

  return users;
}
