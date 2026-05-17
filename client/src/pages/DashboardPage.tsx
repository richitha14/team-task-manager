import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { DashboardStats } from "@team-task-manager/shared";
import { fetchDashboardStats } from "../api/dashboard";
import { ApiError } from "../api/client";
import { StatusSummary } from "../components/dashboard/StatusSummary";
import { TaskListSection } from "../components/dashboard/TaskListSection";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { StatCard } from "../components/ui/StatCard";
import { useAuth } from "../context/AuthContext";

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDashboardStats()
      .then((data) => {
        if (!cancelled) setStats(data.stats);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Failed to load dashboard",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Spinner />
        Loading dashboard…
      </div>
    );
  }

  if (error || !stats) {
    return (
      <EmptyState
        variant="error"
        title="Dashboard unavailable"
        description={error ?? "Could not load statistics"}
        action={
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            Retry
          </button>
        }
      />
    );
  }

  const isAdmin = stats.scope === "admin";
  const { tasks, projects } = stats;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome, {user?.name}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isAdmin
            ? "Organization overview across all projects and tasks."
            : "Your personal workspace — projects and tasks assigned to you."}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total tasks"
          value={String(tasks.total)}
          hint={isAdmin ? "All projects" : "In your projects"}
        />
        <StatCard
          label="Completed"
          value={String(tasks.completed)}
          hint="Marked completed"
        />
        <StatCard
          label="Pending"
          value={String(tasks.pending)}
          hint="To do + in progress"
        />
        <StatCard
          label="Overdue"
          value={String(tasks.overdue)}
          hint="Past due, not completed"
        />
        <StatCard
          label="Assigned to you"
          value={String(tasks.assignedToMe)}
          hint="Tasks you own"
        />
        <StatCard
          label="Projects"
          value={String(projects.total)}
          hint={isAdmin ? "All projects" : "Your projects"}
        />
      </section>

      {!isAdmin ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="My completed"
            value={String(tasks.myCompleted)}
            hint="Your assignments"
          />
          <StatCard
            label="My pending"
            value={String(tasks.myPending)}
            hint="Your active work"
          />
          <StatCard
            label="My overdue"
            value={String(tasks.myOverdue)}
            hint="Needs attention"
          />
          <StatCard label="Your role" value={user?.role ?? "—"} hint="App access" />
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Your role" value="ADMIN" hint="Full overview" />
          <StatCard
            label="Open workload"
            value={String(tasks.pending)}
            hint="Team-wide pending"
          />
          <StatCard
            label="Team overdue"
            value={String(tasks.overdue)}
            hint="Across all projects"
          />
          <StatCard
            label="Completion rate"
            value={
              tasks.total > 0
                ? `${Math.round((tasks.completed / tasks.total) * 100)}%`
                : "—"
            }
            hint="Completed / total"
          />
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            Task status summary
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Distribution across {tasks.total} tasks
          </p>
          <div className="mt-4">
            <StatusSummary byStatus={tasks.byStatus} total={tasks.total} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            Project statistics
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {projects.total} project{projects.total === 1 ? "" : "s"}
          </p>
          {projects.items.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No projects yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {projects.items.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/projects/${p.id}`}
                      className="truncate text-sm font-medium text-slate-900 hover:text-brand-600"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {p.memberCount} members · {p.completedTasks}/{p.taskCount}{" "}
                      done
                      {p.overdueTasks > 0 ? ` · ${p.overdueTasks} overdue` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-slate-700">
                    {p.taskCount}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/projects"
            className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline"
          >
            View all projects →
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <TaskListSection
          title="Recent tasks"
          description={
            isAdmin
              ? "Latest updates across your workspace"
              : "Your recently updated assignments"
          }
          tasks={stats.recentTasks}
          emptyTitle="No recent tasks"
          emptyDescription={
            isAdmin
              ? "Tasks will appear here as your team works."
              : "No tasks assigned to you yet."
          }
        />
        <TaskListSection
          title="Overdue tasks"
          description={
            isAdmin
              ? "Past-due items needing attention"
              : "Your past-due assignments"
          }
          tasks={stats.overdueTasks}
          emptyTitle="No overdue tasks"
          emptyDescription="You're all caught up."
        />
      </section>
    </div>
  );
}
