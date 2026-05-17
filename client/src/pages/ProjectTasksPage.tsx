import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type {
  ProjectDetail,
  TaskPriority,
  TaskStatus,
  TaskSummary,
} from "@team-task-manager/shared";
import { fetchProject } from "../api/projects";
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
} from "../api/tasks";
import { ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { CreateTaskModal } from "../components/tasks/CreateTaskModal";
import { EditTaskModal } from "../components/tasks/EditTaskModal";
import { TaskPriorityBadge, TaskStatusBadge } from "../components/tasks/TaskBadges";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { useToast } from "../context/ToastContext";

export function ProjectTasksPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskSummary | null>(null);

  const [filterStatus, setFilterStatus] = useState<TaskStatus | "">("");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "">("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [search, setSearch] = useState("");

  const canManageTasks =
    project?.permissions.canManageMembers ?? false;

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const [{ project: proj }, { tasks: list }] = await Promise.all([
        fetchProject(projectId),
        fetchTasks(projectId, {
          status: filterStatus || undefined,
          priority: filterPriority || undefined,
          assigneeId: filterAssignee || undefined,
          q: search || undefined,
        }),
      ]);
      setProject(proj);
      setTasks(list);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load tasks",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, filterStatus, filterPriority, filterAssignee, search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(payload: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string | null;
    assigneeId?: string | null;
  }) {
    if (!projectId) return;
    await createTask(projectId, payload);
    showToast("Task created", "success");
    await load();
  }

  async function handleEdit(
    taskId: string,
    payload: {
      title: string;
      description?: string | null;
      status: TaskStatus;
      priority: TaskPriority;
      dueDate?: string | null;
      assigneeId?: string | null;
    },
  ) {
    if (!projectId) return;
    await updateTask(projectId, taskId, payload);
    showToast("Task updated", "success");
    await load();
  }

  async function handleStatusChange(task: TaskSummary, status: TaskStatus) {
    if (!projectId || !task.permissions.canUpdateStatus) return;
    try {
      await updateTask(projectId, task.id, { status });
      showToast("Status updated", "success");
      await load();
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not update status",
        "error",
      );
    }
  }

  async function handleDelete(task: TaskSummary) {
    if (!projectId || !task.permissions.canDelete) return;
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    try {
      await deleteTask(projectId, task.id);
      showToast("Task deleted", "info");
      await load();
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not delete task",
        "error",
      );
    }
  }

  if (loading && !project) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Spinner />
        Loading tasks…
      </div>
    );
  }

  if (error || !project || !projectId) {
    return (
      <EmptyState
        variant="error"
        title="Tasks unavailable"
        description={error ?? "Project not found"}
        action={
          <Link to="/projects" className="text-sm font-medium text-brand-600 hover:underline">
            Back to projects
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to={`/projects/${projectId}`}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            ← {project.name}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Tasks</h1>
          <p className="mt-1 text-sm text-slate-500">
            {tasks.length} task{tasks.length === 1 ? "" : "s"}
            {user ? ` · signed in as ${user.name}` : ""}
          </p>
        </div>
        {canManageTasks ? (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            New task
          </button>
        ) : null}
      </header>

      <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Title or description"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Status</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TaskStatus | "")}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">All</option>
            <option value="TODO">To do</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Priority</span>
          <select
            value={filterPriority}
            onChange={(e) =>
              setFilterPriority(e.target.value as TaskPriority | "")
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">All</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Assigned to</span>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">Anyone</option>
            {project.members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description={
            canManageTasks
              ? "Create a task or adjust your filters."
              : "No tasks match your filters."
          }
          action={
            canManageTasks ? (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="text-sm font-medium text-brand-600 hover:underline"
              >
                Create task
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Task</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Assignee</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className={`border-b border-slate-100 ${task.isOverdue ? "bg-red-50/60" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{task.title}</p>
                      {task.description ? (
                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                          {task.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {task.permissions.canUpdateStatus ? (
                        <select
                          value={task.status}
                          onChange={(e) =>
                            void handleStatusChange(
                              task,
                              e.target.value as TaskStatus,
                            )
                          }
                          className="rounded border border-slate-300 px-2 py-1 text-xs"
                        >
                          <option value="TODO">To do</option>
                          <option value="IN_PROGRESS">In progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      ) : (
                        <TaskStatusBadge status={task.status} />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <TaskPriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {task.assignee?.name ?? "Unassigned"}
                    </td>
                    <td className="px-4 py-3">
                      {task.dueDate ? (
                        <span
                          className={
                            task.isOverdue
                              ? "font-medium text-red-700"
                              : "text-slate-600"
                          }
                        >
                          {task.dueDate}
                          {task.isOverdue ? " · Overdue" : ""}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {task.permissions.canEdit ? (
                          <button
                            type="button"
                            onClick={() => setEditingTask(task)}
                            className="text-xs font-medium text-brand-600 hover:underline"
                          >
                            Edit
                          </button>
                        ) : null}
                        {task.permissions.canDelete ? (
                          <button
                            type="button"
                            onClick={() => void handleDelete(task)}
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        ) : null}
                        {!task.permissions.canEdit && !task.permissions.canDelete ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateTaskModal
        open={modalOpen}
        members={project.members}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
      <EditTaskModal
        task={editingTask}
        members={project.members}
        onClose={() => setEditingTask(null)}
        onSubmit={handleEdit}
      />
    </div>
  );
}
