import type { InputHTMLAttributes, ReactNode } from "react";

type FormFieldProps = {
  label: string;
  name: string;
  error?: string;
  children?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>;

export function FormField({
  label,
  name,
  error,
  children,
  className = "",
  ...inputProps
}: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children ?? (
        <input
          id={name}
          name={name}
          className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${error ? "border-red-400" : ""} ${className}`}
          {...inputProps}
        />
      )}
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : null}
    </label>
  );
}
