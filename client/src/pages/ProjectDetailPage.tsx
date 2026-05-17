import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type {
  ProjectDetail,
  ProjectRole,
  UserSearchResult,
} from "@team-task-manager/shared";
import {
  addProjectMember,
  deleteProject,
  fetchProject,
  removeProjectMember,
  updateProject,
  updateProjectMemberRole,
} from "../api/projects";
import { ApiError } from "../api/client";
import { UserSearchSelect } from "../components/projects/UserSearchSelect";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { useToast } from "../context/ToastContext";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<ProjectRole>("MEMBER");
  const [addingMember, setAddingMember] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { project: data } = await fetchProject(id);
      setProject(data);
      setEditName(data.name);
      setEditDescription(data.description ?? "");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load project",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!id || !project?.permissions.canEdit) return;
    setSaving(true);
    try {
      const { project: updated } = await updateProject(id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setProject(updated);
      showToast("Project updated", "success");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not update project",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id || !project?.permissions.canDelete) return;
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteProject(id);
      showToast("Project deleted", "success");
      navigate("/projects", { replace: true });
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not delete project",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddMember(user: UserSearchResult) {
    if (!id || !project?.permissions.canManageMembers) return;
    setAddingMember(true);
    try {
      const { member } = await addProjectMember(id, {
        userId: user.id,
        role: newMemberRole,
      });
      const { project: refreshed } = await fetchProject(id);
      setProject(refreshed);
      showToast(`${member.name} added to project`, "success");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not add member",
        "error",
      );
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRoleChange(userId: string, role: ProjectRole) {
    if (!id) return;
    try {
      await updateProjectMemberRole(id, userId, role);
      const { project: refreshed } = await fetchProject(id);
      setProject(refreshed);
      showToast("Member role updated", "success");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not update role",
        "error",
      );
    }
  }

  async function handleRemoveMember(userId: string, name: string) {
    if (!id) return;
    if (!window.confirm(`Remove ${name} from this project?`)) return;
    try {
      await removeProjectMember(id, userId);
      const { project: refreshed } = await fetchProject(id);
      setProject(refreshed);
      showToast(`${name} removed`, "info");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Could not remove member",
        "error",
      );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Spinner />
        Loading project…
      </div>
    );
  }

  if (error || !project) {
    return (
      <EmptyState
        variant="error"
        title="Project unavailable"
        description={error ?? "This project does not exist or you lack access."}
        action={
          <Link to="/projects" className="text-sm font-medium text-brand-600 hover:underline">
            Back to projects
          </Link>
        }
      />
    );
  }

  const { permissions } = project;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/projects"
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            ← All projects
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            {project.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Your role: <span className="font-medium">{project.role}</span>
            {permissions.canManageMembers
              ? " · You can manage this project"
              : " · View only"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/projects/${id}/tasks`}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            View tasks
          </Link>
          {permissions.canDelete ? (
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete project"}
            </button>
          ) : null}
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Details</h2>
        {permissions.canEdit ? (
          <form onSubmit={handleSave} className="mt-4 space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Name</span>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
                minLength={2}
                disabled={saving}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Description
              </span>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                disabled={saving}
              />
            </label>
            <button
              type="submit"
              disabled={saving || !editName.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? <Spinner className="h-4 w-4 border-white" /> : null}
              Save changes
            </button>
          </form>
        ) : (
          <div className="mt-4 text-sm text-slate-600">
            {project.description ? (
              <p>{project.description}</p>
            ) : (
              <p className="italic text-slate-400">No description</p>
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          Team members ({project.members.length})
        </h2>

        {permissions.canManageMembers ? (
          <div className="mt-4 space-y-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Add member</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <UserSearchSelect
                  projectId={project.id}
                  onSelect={(user) => void handleAddMember(user)}
                  disabled={addingMember}
                />
              </div>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Role</span>
                <select
                  value={newMemberRole}
                  onChange={(e) =>
                    setNewMemberRole(e.target.value as ProjectRole)
                  }
                  disabled={addingMember}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </label>
            </div>
          </div>
        ) : null}

        {project.members.length === 0 ? (
          <EmptyState
            title="No members"
            description="Add registered users to collaborate on this project."
          />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  {permissions.canManageMembers ? (
                    <th className="px-3 py-2 font-medium">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {project.members.map((member) => (
                  <tr key={member.membershipId} className="border-b border-slate-100">
                    <td className="px-3 py-3 font-medium text-slate-900">
                      {member.name}
                      {member.isOwner ? (
                        <span className="ml-2 text-xs text-slate-500">(owner)</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-slate-600">{member.email}</td>
                    <td className="px-3 py-3">
                      {permissions.canManageMembers && !member.isOwner ? (
                        <select
                          value={member.role}
                          onChange={(e) =>
                            void handleRoleChange(
                              member.userId,
                              e.target.value as ProjectRole,
                            )
                          }
                          className="rounded border border-slate-300 px-2 py-1 text-xs"
                        >
                          <option value="ADMIN">Admin</option>
                          <option value="MEMBER">Member</option>
                        </select>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                          {member.role}
                        </span>
                      )}
                    </td>
                    {permissions.canManageMembers ? (
                      <td className="px-3 py-3">
                        {!member.isOwner ? (
                          <button
                            type="button"
                            onClick={() =>
                              void handleRemoveMember(member.userId, member.name)
                            }
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
