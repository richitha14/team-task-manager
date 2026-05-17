import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const baseNavItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/projects", label: "Projects" },
] as const;

function linkClass({ isActive }: { isActive: boolean }) {
  return [
    "block rounded-lg px-3 py-2 text-sm font-medium transition",
    isActive
      ? "bg-brand-600 text-white"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  async function handleLogout() {
    await logout();
    showToast("Signed out successfully", "info");
  }
  const navItems = [
    ...baseNavItems,
    ...(user?.role === "ADMIN"
      ? [{ to: "/admin" as const, label: "Admin" }]
      : []),
  ];

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white md:w-64 md:border-b-0 md:border-r">
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Team Task Manager
        </p>
        <h1 className="mt-1 text-lg font-semibold text-slate-900">Workspace</h1>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 px-4 py-4">
        <p className="truncate text-sm font-medium text-slate-900">{user?.name}</p>
        <p className="truncate text-xs text-slate-500">{user?.email}</p>
        <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          {user?.role}
        </span>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
