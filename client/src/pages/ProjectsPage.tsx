import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ProjectSummary } from "@team-task-manager/shared";
import { createProject, fetchProjects } from "../api/projects";
import { ApiError } from "../api/client";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export function ProjectsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function loadProjects() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProjects();
      setProjects(data.projects);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load projects",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  async function handleCreate(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const { project } = await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setProjects((current) => [project, ...current]);
      setName("");
      setDescription("");
      showToast("Project created", "success");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not create project",
        "error",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
        <p className="mt-1 text-sm text-slate-500">
          {user?.role === "ADMIN"
            ? "Manage all projects and team assignments."
            : "Projects you are assigned to. Contact a project admin to be added."}
        </p>
      </header>

      {
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="text-sm font-medium text-slate-700">New project</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Project name"
                disabled={creating}
                required
                minLength={2}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Description</span>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Optional"
                disabled={creating}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {creating ? <Spinner className="h-4 w-4 border-white" /> : null}
            Create project
          </button>
        </form>
      }

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Spinner />
          Loading projects…
        </div>
      ) : error ? (
        <EmptyState
          variant="error"
          title="Could not load projects"
          description={error}
          action={
            <button
              type="button"
              onClick={() => void loadProjects()}
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              Try again
            </button>
          }
        />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create a project or ask a project admin to add you to a team."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                to={`/projects/${project.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
              >
                <h2 className="font-semibold text-slate-900">{project.name}</h2>
                {project.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                    {project.description}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5">
                    {project.role}
                  </span>
                  <span>{project.memberCount} members</span>
                  <span>{project.taskCount} tasks</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
