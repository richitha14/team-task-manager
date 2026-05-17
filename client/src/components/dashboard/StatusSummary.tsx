import type { DashboardStats, TaskStatus } from "@team-task-manager/shared";

const labels: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

const colors: Record<TaskStatus, string> = {
  TODO: "bg-slate-400",
  IN_PROGRESS: "bg-blue-500",
  COMPLETED: "bg-emerald-500",
};

type StatusSummaryProps = {
  byStatus: DashboardStats["tasks"]["byStatus"];
  total: number;
};

export function StatusSummary({ byStatus, total }: StatusSummaryProps) {
  const entries = (Object.keys(byStatus) as TaskStatus[]).map((status) => ({
    status,
    count: byStatus[status],
    pct: total > 0 ? Math.round((byStatus[status] / total) * 100) : 0,
  }));

  return (
    <div className="space-y-3">
      {entries.map(({ status, count, pct }) => (
        <div key={status}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-slate-700">{labels[status]}</span>
            <span className="font-medium text-slate-900">
              {count} <span className="text-slate-500">({pct}%)</span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${colors[status]}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
