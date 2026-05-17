import type { AppRole, ProjectRole, TaskSummary } from "@team-task-manager/shared";
import { AppError } from "../middleware/errorHandler.js";
import {
  isProjectAdmin,
  isTaskOverdue,
  resolveTaskPermissions,
} from "../lib/taskPermissions.js";
import { prisma } from "../lib/prisma.js";
import type {
  CreateTaskInput,
  ListTasksQuery,
  UpdateTaskInput,
} from "../validators/task.validator.js";

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
} as const;

type TaskRecord = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: Date | null;
  assigneeId: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  assignee: { id: string; name: string; email: string } | null;
  createdBy: { id: string; name: string; email: string };
};

function parseDueDate(value: string | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

function formatDueDate(value: Date | null): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

function toTaskSummary(
  task: TaskRecord,
  userId: string,
  appRole: AppRole,
  projectRole: ProjectRole,
): TaskSummary {
  return {
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: formatDueDate(task.dueDate),
    isOverdue: isTaskOverdue(task.dueDate, task.status),
    assigneeId: task.assigneeId,
    assignee: task.assignee,
    createdById: task.createdById,
    createdBy: task.createdBy,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    permissions: resolveTaskPermissions(
      appRole,
      projectRole,
      userId,
      task.assigneeId,
    ),
  };
}

async function assertProjectAccess(
  projectId: string,
  userId: string,
  appRole: AppRole,
): Promise<ProjectRole> {
  if (appRole === "ADMIN") return "ADMIN";

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!membership) {
    throw new AppError(403, "You do not have access to this project");
  }
  return membership.role;
}

async function assertAssigneeIsMember(
  projectId: string,
  assigneeId: string | null | undefined,
) {
  if (!assigneeId) return;

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: assigneeId } },
  });
  if (!member) {
    throw new AppError(400, "Assignee must be a member of this project");
  }
}

export async function listTasks(
  projectId: string,
  userId: string,
  appRole: AppRole,
  query: ListTasksQuery,
): Promise<TaskSummary[]> {
  const projectRole = await assertProjectAccess(projectId, userId, appRole);

  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: "insensitive" } },
              { description: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: taskInclude,
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
  });

  return tasks.map((t) => toTaskSummary(t, userId, appRole, projectRole));
}

export async function getTask(
  projectId: string,
  taskId: string,
  userId: string,
  appRole: AppRole,
): Promise<TaskSummary> {
  const projectRole = await assertProjectAccess(projectId, userId, appRole);

  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId },
    include: taskInclude,
  });
  if (!task) throw new AppError(404, "Task not found");

  return toTaskSummary(task, userId, appRole, projectRole);
}

export async function createTask(
  projectId: string,
  userId: string,
  appRole: AppRole,
  projectRole: ProjectRole,
  input: CreateTaskInput,
): Promise<TaskSummary> {
  if (!isProjectAdmin(appRole, projectRole)) {
    throw new AppError(403, "Only project admins can create tasks");
  }

  await assertAssigneeIsMember(projectId, input.assigneeId ?? null);

  const task = await prisma.task.create({
    data: {
      projectId,
      title: input.title,
      description: input.description ?? null,
      status: input.status,
      priority: input.priority,
      dueDate: parseDueDate(input.dueDate),
      assigneeId: input.assigneeId ?? null,
      createdById: userId,
    },
    include: taskInclude,
  });

  return toTaskSummary(task, userId, appRole, projectRole);
}

export async function updateTask(
  projectId: string,
  taskId: string,
  userId: string,
  appRole: AppRole,
  projectRole: ProjectRole,
  input: UpdateTaskInput,
): Promise<TaskSummary> {
  const existing = await prisma.task.findFirst({
    where: { id: taskId, projectId },
  });
  if (!existing) throw new AppError(404, "Task not found");

  const admin = isProjectAdmin(appRole, projectRole);

  if (!admin) {
    const isAssignee = existing.assigneeId === userId;
    if (!isAssignee) {
      throw new AppError(403, "You can only update tasks assigned to you");
    }

    const allowedKeys = new Set(["status"]);
    const inputKeys = Object.keys(input);
    const hasDisallowed = inputKeys.some((k) => !allowedKeys.has(k));
    if (hasDisallowed || inputKeys.length !== 1 || input.status === undefined) {
      throw new AppError(
        403,
        "Members can only update status on their assigned tasks",
      );
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { status: input.status },
      include: taskInclude,
    });
    return toTaskSummary(task, userId, appRole, projectRole);
  }

  if (input.assigneeId !== undefined) {
    await assertAssigneeIsMember(projectId, input.assigneeId);
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.dueDate !== undefined
        ? { dueDate: parseDueDate(input.dueDate) }
        : {}),
      ...(input.assigneeId !== undefined
        ? { assigneeId: input.assigneeId }
        : {}),
    },
    include: taskInclude,
  });

  return toTaskSummary(task, userId, appRole, projectRole);
}

export async function deleteTask(
  projectId: string,
  taskId: string,
  _userId: string,
  appRole: AppRole,
  projectRole: ProjectRole,
): Promise<void> {
  if (!isProjectAdmin(appRole, projectRole)) {
    throw new AppError(403, "Only project admins can delete tasks");
  }

  const existing = await prisma.task.findFirst({
    where: { id: taskId, projectId },
  });
  if (!existing) throw new AppError(404, "Task not found");

  await prisma.task.delete({ where: { id: taskId } });
}
