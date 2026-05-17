import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  variant?: "empty" | "error";
};

export function EmptyState({
  title,
  description,
  action,
  variant = "empty",
}: EmptyStateProps) {
  const border =
    variant === "error"
      ? "border-red-200 bg-red-50"
      : "border-slate-200 bg-white";

  return (
    <div
      className={`rounded-xl border p-8 text-center shadow-sm ${border}`}
    >
      <h3
        className={`text-base font-semibold ${variant === "error" ? "text-red-900" : "text-slate-900"}`}
      >
        {title}
      </h3>
      <p
        className={`mt-2 text-sm ${variant === "error" ? "text-red-700" : "text-slate-600"}`}
      >
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
