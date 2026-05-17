import type {
  AppRole,
  DashboardStats,
  DashboardTaskItem,
  TaskStatus,
} from "@team-task-manager/shared";
import { isTaskOverdue } from "../lib/taskPermissions.js";
import {
  overdueTaskFilter,
  projectAccessFilter,
  startOfTodayUtc,
  taskInAccessibleProjectsFilter,
} from "../lib/accessFilters.js";
import { prisma } from "../lib/prisma.js";

type AppRoleLocal = AppRole;

function formatDueDate(value: Date | null): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

function toDashboardTask(task: {
  id: string;
  title: string;
  status: TaskStatus;
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: Date | null;
  updatedAt: Date;
  project: { id: string; name: string };
  assignee: { name: string } | null;
}): DashboardTaskItem {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate: formatDueDate(task.dueDate),
    isOverdue: isTaskOverdue(task.dueDate, task.status),
    projectId: task.project.id,
    projectName: task.project.name,
    assigneeName: task.assignee?.name ?? null,
    updatedAt: task.updatedAt.toISOString(),
  };
}

const taskListInclude = {
  project: { select: { id: true, name: true } },
  assignee: { select: { name: true } },
} as const;

export async function getDashboardStats(
  userId: string,
  appRole: AppRoleLocal,
): Promise<DashboardStats> {
  const projectFilter = projectAccessFilter(userId, appRole);
  const taskFilter = taskInAccessibleProjectsFilter(userId, appRole);
  const myTaskFilter = { ...taskFilter, assigneeId: userId };
  const overdueFilter = { ...taskFilter, ...overdueTaskFilter() };
  const myOverdueFilter = { ...myTaskFilter, ...overdueTaskFilter() };

  const isAdmin = appRole === "ADMIN";
  const listFilter = isAdmin ? taskFilter : myTaskFilter;
  const overdueListFilter = isAdmin ? overdueFilter : myOverdueFilter;

  const [
    projectTotal,
    projects,
    total,
    completed,
    todo,
    inProgress,
    overdue,
    assignedToMe,
    myCompleted,
    myTodo,
    myInProgress,
    myOverdue,
    recentRaw,
    overdueRaw,
  ] = await Promise.all([
    prisma.project.count({ where: projectFilter }),
    prisma.project.findMany({
      where: projectFilter,
      select: {
        id: true,
        name: true,
        _count: { select: { members: true, tasks: true } },
        tasks: {
          select: { status: true, dueDate: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.task.count({ where: taskFilter }),
    prisma.task.count({
      where: { ...taskFilter, status: "COMPLETED" },
    }),
    prisma.task.count({ where: { ...taskFilter, status: "TODO" } }),
    prisma.task.count({
      where: { ...taskFilter, status: "IN_PROGRESS" },
    }),
    prisma.task.count({ where: overdueFilter }),
    prisma.task.count({ where: myTaskFilter }),
    prisma.task.count({
      where: { ...myTaskFilter, status: "COMPLETED" },
    }),
    prisma.task.count({ where: { ...myTaskFilter, status: "TODO" } }),
    prisma.task.count({
      where: { ...myTaskFilter, status: "IN_PROGRESS" },
    }),
    prisma.task.count({ where: myOverdueFilter }),
    prisma.task.findMany({
      where: listFilter,
      include: taskListInclude,
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.task.findMany({
      where: overdueListFilter,
      include: taskListInclude,
      orderBy: { dueDate: "asc" },
      take: 8,
    }),
  ]);

  const pending = todo + inProgress;
  const myPending = myTodo + myInProgress;

  const projectItems = projects.map((p) => {
    let completedTasks = 0;
    let overdueTasks = 0;
    for (const t of p.tasks) {
      if (t.status === "COMPLETED") completedTasks += 1;
      if (isTaskOverdue(t.dueDate, t.status)) overdueTasks += 1;
    }
    return {
      id: p.id,
      name: p.name,
      taskCount: p._count.tasks,
      memberCount: p._count.members,
      completedTasks,
      overdueTasks,
    };
  });

  return {
    scope: isAdmin ? "admin" : "member",
    projects: {
      total: projectTotal,
      items: projectItems,
    },
    tasks: {
      total,
      completed,
      pending,
      overdue,
      assignedToMe,
      myCompleted,
      myPending,
      myOverdue,
      byStatus: {
        TODO: todo,
        IN_PROGRESS: inProgress,
        COMPLETED: completed,
      },
    },
    recentTasks: recentRaw.map(toDashboardTask),
    overdueTasks: overdueRaw.map(toDashboardTask),
  };
}

// exported for tests
export { startOfTodayUtc };
