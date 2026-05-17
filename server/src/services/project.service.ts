import type {
  ProjectDetail,
  ProjectMemberSummary,
  ProjectSummary,
} from "@team-task-manager/shared";
import { AppError } from "../middleware/errorHandler.js";
import { resolveProjectPermissions } from "../lib/projectPermissions.js";
import { prisma } from "../lib/prisma.js";
import type {
  AddProjectMemberInput,
  CreateProjectInput,
  UpdateProjectInput,
} from "../validators/project.validator.js";

type AppRole = "ADMIN" | "MEMBER";

function toSummary(
  project: {
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
    _count: { members: number; tasks: number };
    members: { role: "ADMIN" | "MEMBER" }[];
  },
  userId: string,
  appRole: AppRole,
): ProjectSummary {
  const membershipRole =
    project.members[0]?.role ??
    (project.ownerId === userId ? "ADMIN" : "MEMBER");

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    ownerId: project.ownerId,
    role:
      appRole === "ADMIN" && !project.members[0]
        ? "ADMIN"
        : membershipRole,
    memberCount: project._count.members,
    taskCount: project._count.tasks,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

const projectInclude = {
  _count: { select: { members: true, tasks: true } },
  members: {
    select: {
      id: true,
      userId: true,
      role: true,
      joinedAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { joinedAt: "asc" as const },
  },
};

function toMemberSummary(
  member: {
    id: string;
    userId: string;
    role: "ADMIN" | "MEMBER";
    joinedAt: Date;
    user: { id: string; name: string; email: string };
  },
  ownerId: string,
): ProjectMemberSummary {
  return {
    membershipId: member.id,
    userId: member.userId,
    name: member.user.name,
    email: member.user.email,
    role: member.role,
    isOwner: member.userId === ownerId,
    joinedAt: member.joinedAt.toISOString(),
  };
}

function toDetail(
  project: {
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
    _count: { members: number; tasks: number };
    members: {
      id: string;
      userId: string;
      role: "ADMIN" | "MEMBER";
      joinedAt: Date;
      user: { id: string; name: string; email: string };
    }[];
  },
  userId: string,
  appRole: AppRole,
): ProjectDetail {
  const currentMember = project.members.find((m) => m.userId === userId);
  const projectRole =
    appRole === "ADMIN" && !currentMember
      ? "ADMIN"
      : (currentMember?.role ?? "MEMBER");

  const summary = toSummary(
    {
      ...project,
      members: currentMember ? [{ role: currentMember.role }] : [],
    },
    userId,
    appRole,
  );

  return {
    ...summary,
    role: projectRole,
    permissions: resolveProjectPermissions(appRole, projectRole),
    members: project.members.map((m) => toMemberSummary(m, project.ownerId)),
  };
}

function accessFilter(userId: string, appRole: AppRole) {
  if (appRole === "ADMIN") return {};
  return {
    OR: [{ ownerId: userId }, { members: { some: { userId } } }],
  };
}

export async function createProject(
  userId: string,
  input: CreateProjectInput,
): Promise<ProjectSummary> {
  const project = await prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      ownerId: userId,
      members: { create: { userId, role: "ADMIN" } },
    },
    include: {
      _count: { select: { members: true, tasks: true } },
      members: { where: { userId }, select: { role: true } },
    },
  });

  return toSummary(project, userId, "MEMBER");
}

export async function listProjectsForUser(
  userId: string,
  appRole: AppRole,
): Promise<ProjectSummary[]> {
  const projects = await prisma.project.findMany({
    where: accessFilter(userId, appRole),
    include: {
      _count: { select: { members: true, tasks: true } },
      members: { where: { userId }, select: { role: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return projects.map((p) => toSummary(p, userId, appRole));
}

export async function getProjectDetail(
  projectId: string,
  userId: string,
  appRole: AppRole,
): Promise<ProjectDetail> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ...accessFilter(userId, appRole) },
    include: projectInclude,
  });

  if (!project) {
    throw new AppError(404, "Project not found");
  }

  return toDetail(project, userId, appRole);
}

export async function updateProject(
  projectId: string,
  userId: string,
  appRole: AppRole,
  input: UpdateProjectInput,
): Promise<ProjectDetail> {
  await getProjectDetail(projectId, userId, appRole);

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      name: input.name,
      description: input.description ?? null,
    },
    include: projectInclude,
  });

  return toDetail(project, userId, appRole);
}

export async function deleteProject(projectId: string): Promise<void> {
  const existing = await prisma.project.findUnique({ where: { id: projectId } });
  if (!existing) throw new AppError(404, "Project not found");
  await prisma.project.delete({ where: { id: projectId } });
}

export async function listProjectMembers(
  projectId: string,
  userId: string,
  appRole: AppRole,
): Promise<ProjectMemberSummary[]> {
  const detail = await getProjectDetail(projectId, userId, appRole);
  return detail.members;
}

export async function addProjectMember(
  projectId: string,
  input: AddProjectMemberInput,
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true },
  });
  if (!project) throw new AppError(404, "Project not found");

  if (input.userId === project.ownerId) {
    throw new AppError(400, "Project owner is already a member");
  }

  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) throw new AppError(404, "User not found");

  const existing = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId: input.userId },
    },
  });
  if (existing) throw new AppError(409, "User is already a project member");

  const member = await prisma.projectMember.create({
    data: {
      projectId,
      userId: input.userId,
      role: input.role,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return toMemberSummary(member, project.ownerId);
}

export async function updateProjectMemberRole(
  projectId: string,
  targetUserId: string,
  role: "ADMIN" | "MEMBER",
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!project) throw new AppError(404, "Project not found");

  if (targetUserId === project.ownerId && role !== "ADMIN") {
    throw new AppError(400, "Project owner must remain a project admin");
  }

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId: targetUserId },
    },
  });
  if (!membership) throw new AppError(404, "Member not found");

  if (membership.role === "ADMIN" && role === "MEMBER") {
    const adminCount = await prisma.projectMember.count({
      where: { projectId, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      throw new AppError(400, "Project must have at least one admin");
    }
  }

  const updated = await prisma.projectMember.update({
    where: { id: membership.id },
    data: { role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return toMemberSummary(updated, project.ownerId);
}

export async function removeProjectMember(
  projectId: string,
  targetUserId: string,
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!project) throw new AppError(404, "Project not found");

  if (targetUserId === project.ownerId) {
    throw new AppError(400, "Cannot remove the project owner");
  }

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId: targetUserId },
    },
  });
  if (!membership) throw new AppError(404, "Member not found");

  if (membership.role === "ADMIN") {
    const adminCount = await prisma.projectMember.count({
      where: { projectId, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      throw new AppError(400, "Cannot remove the last project admin");
    }
  }

  await prisma.projectMember.delete({ where: { id: membership.id } });
}
