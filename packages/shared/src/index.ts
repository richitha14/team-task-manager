/** Shared types, enums, and API constants */

export const APP_ROLES = ["ADMIN", "MEMBER"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const PROJECT_ROLES = ["ADMIN", "MEMBER"] as const;
export type ProjectRole = (typeof PROJECT_ROLES)[number];

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "COMPLETED"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  createdAt: string;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};

export type ApiHealthResponse = {
  status: string;
  service: string;
  database: string;
  timestamp: string;
};

export type ApiErrorResponse = {
  error: string;
  details?: Record<string, string[]>;
};

export const PASSWORD_REQUIREMENTS =
  "Password: 8+ characters with uppercase, lowercase, and a number";

export const API_ROUTES = {
  health: "/api/health",
  auth: {
    signup: "/api/auth/signup",
    login: "/api/auth/login",
    me: "/api/auth/me",
    logout: "/api/auth/logout",
  },
  admin: {
    users: "/api/admin/users",
  },
  users: {
    search: "/api/users/search",
  },
  dashboard: "/api/dashboard",
  projects: {
    list: "/api/projects",
    create: "/api/projects",
    detail: (id: string) => `/api/projects/${id}`,
    members: (id: string) => `/api/projects/${id}/members`,
    member: (projectId: string, userId: string) =>
      `/api/projects/${projectId}/members/${userId}`,
    tasks: (projectId: string) => `/api/projects/${projectId}/tasks`,
    task: (projectId: string, taskId: string) =>
      `/api/projects/${projectId}/tasks/${taskId}`,
  },
} as const;

export const AUTH_TOKEN_KEY = "ttm_auth_token";

export type ProjectPermissions = {
  canEdit: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
};

export type TaskPermissions = {
  canEdit: boolean;
  canDelete: boolean;
  canAssign: boolean;
  canUpdateStatus: boolean;
};

export type TaskUserRef = {
  id: string;
  name: string;
  email: string;
};

export type TaskSummary = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  isOverdue: boolean;
  assigneeId: string | null;
  assignee: TaskUserRef | null;
  createdById: string;
  createdBy: TaskUserRef;
  createdAt: string;
  updatedAt: string;
  permissions: TaskPermissions;
};

export type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  role: ProjectRole;
  memberCount: number;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectMemberSummary = {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  role: ProjectRole;
  isOwner: boolean;
  joinedAt: string;
};

export type ProjectDetail = ProjectSummary & {
  permissions: ProjectPermissions;
  members: ProjectMemberSummary[];
};

export type UserSearchResult = {
  id: string;
  name: string;
  email: string;
};

export type AdminUserSummary = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  createdAt: string;
};

export type DashboardProjectStat = {
  id: string;
  name: string;
  taskCount: number;
  memberCount: number;
  completedTasks: number;
  overdueTasks: number;
};

export type DashboardTaskItem = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  isOverdue: boolean;
  projectId: string;
  projectName: string;
  assigneeName: string | null;
  updatedAt: string;
};

export type DashboardStats = {
  scope: "admin" | "member";
  projects: {
    total: number;
    items: DashboardProjectStat[];
  };
  tasks: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    assignedToMe: number;
    myCompleted: number;
    myPending: number;
    myOverdue: number;
    byStatus: Record<TaskStatus, number>;
  };
  recentTasks: DashboardTaskItem[];
  overdueTasks: DashboardTaskItem[];
};
