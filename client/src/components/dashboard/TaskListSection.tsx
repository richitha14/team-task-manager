import { Link } from "react-router-dom";
import type { DashboardTaskItem } from "@team-task-manager/shared";
import { TaskPriorityBadge, TaskStatusBadge } from "../tasks/TaskBadges";
import { EmptyState } from "../ui/EmptyState";

type TaskListSectionProps = {
  title: string;
  description?: string;
  tasks: DashboardTaskItem[];
  emptyTitle: string;
  emptyDescription: string;
};

export function TaskListSection({
  title,
  description,
  tasks,
  emptyTitle,
  emptyDescription,
}: TaskListSectionProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      ) : null}

      {tasks.length === 0 ? (
        <div className="mt-4">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {tasks.map((task) => (
            <li key={task.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div className="min-w-0 flex-1">
                <Link
                  to={`/projects/${task.projectId}/tasks`}
                  className="font-medium text-slate-900 hover:text-brand-600"
                >
                  {task.title}
                </Link>
                <p className="mt-0.5 text-xs text-slate-500">{task.projectName}</p>
                {task.assigneeName ? (
                  <p className="mt-0.5 text-xs text-slate-500">
                    Assigned to {task.assigneeName}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <TaskStatusBadge status={task.status} />
                <TaskPriorityBadge priority={task.priority} />
                {task.dueDate ? (
                  <span
                    className={`text-xs ${task.isOverdue ? "font-medium text-red-700" : "text-slate-500"}`}
                  >
                    Due {task.dueDate}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
