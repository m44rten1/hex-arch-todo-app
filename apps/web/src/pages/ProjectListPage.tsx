import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiRequestError, type ProjectDTO } from "@/lib/api-client";
import { useAuth } from "@/context/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FolderOpen,
  Plus,
  Archive,
  ArchiveRestore,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export function ProjectListPage() {
  const { logout } = useAuth();
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        void logout();
        return;
      }
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  const handleApiError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiRequestError && err.status === 401) void logout();
    },
    [logout],
  );

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    try {
      const created = await api.createProject({ name: trimmed, color: newColor });
      setProjects((prev) => [...prev, created]);
      setNewName("");
    } catch (err) {
      handleApiError(err);
    } finally {
      setCreating(false);
    }
  }, [newName, newColor, creating, handleApiError]);

  const startEdit = useCallback((project: ProjectDTO) => {
    setEditingId(project.id);
    setEditName(project.name);
    setEditColor(project.color ?? "#3b82f6");
  }, []);

  const commitEdit = useCallback(async () => {
    if (!editingId) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    try {
      const updated = await api.updateProject(editingId, { name: trimmed, color: editColor });
      setProjects((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
    } catch (err) {
      handleApiError(err);
    }
    setEditingId(null);
  }, [editingId, editName, editColor, handleApiError]);

  const handleArchive = useCallback(async (projectId: string, archived: boolean) => {
    try {
      const updated = archived
        ? await api.unarchiveProject(projectId)
        : await api.archiveProject(projectId);
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError]);

  const handleDelete = useCallback(async (projectId: string) => {
    try {
      await api.deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError]);

  const activeProjects = projects.filter((p) => !p.archived);
  const archivedProjects = projects.filter((p) => p.archived);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <FolderOpen className="h-6 w-6" />
          Projects
        </h1>
      </div>

      <form onSubmit={handleCreate} className="flex items-center gap-2 mb-6">
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className="h-9 w-9 rounded border cursor-pointer shrink-0"
        />
        <Input
          placeholder="New project name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          disabled={creating}
          className="flex-1"
        />
        <Button type="submit" size="icon" variant="ghost" disabled={!newName.trim() || creating}>
          <Plus className="h-5 w-5" />
        </Button>
      </form>

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && activeProjects.length === 0 && (
        <p className="text-muted-foreground text-center py-8">No projects yet. Create one above!</p>
      )}

      <div className="flex flex-col gap-2">
        {activeProjects.map((project) => (
          <div
            key={project.id}
            className="group flex items-center gap-3 rounded-md border px-4 py-3 hover:bg-accent/50 transition-colors"
          >
            {editingId === project.id ? (
              <>
                <input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="h-6 w-6 rounded cursor-pointer shrink-0"
                />
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void commitEdit();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="h-auto py-0 px-0 border-0 shadow-none focus-visible:ring-0 text-sm flex-1"
                  autoFocus
                />
                <button onClick={() => void commitEdit()} className="text-muted-foreground hover:text-foreground cursor-pointer">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <span
                  className="h-4 w-4 rounded-full shrink-0"
                  style={{ backgroundColor: project.color ?? "#737373" }}
                />
                <Link
                  to={`/projects/${project.id}`}
                  className="flex-1 min-w-0 truncate text-sm font-medium hover:underline"
                >
                  {project.name}
                </Link>
                <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(project)} className="text-muted-foreground hover:text-foreground cursor-pointer" aria-label="Edit project">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => void handleArchive(project.id, false)} className="text-muted-foreground hover:text-foreground cursor-pointer" aria-label="Archive project">
                    <Archive className="h-4 w-4" />
                  </button>
                  <button onClick={() => void handleDelete(project.id)} className="text-muted-foreground hover:text-destructive cursor-pointer" aria-label="Delete project">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {archivedProjects.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowArchived((s) => !s)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 cursor-pointer"
          >
            {showArchived ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Archived ({archivedProjects.length})
          </button>
          {showArchived && (
            <div className="flex flex-col gap-2">
              {archivedProjects.map((project) => (
                <div
                  key={project.id}
                  className="group flex items-center gap-3 rounded-md border px-4 py-3 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <span
                    className="h-4 w-4 rounded-full shrink-0"
                    style={{ backgroundColor: project.color ?? "#737373" }}
                  />
                  <span className="flex-1 min-w-0 truncate text-sm">{project.name}</span>
                  <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => void handleArchive(project.id, true)} className="text-muted-foreground hover:text-foreground cursor-pointer" aria-label="Unarchive project">
                      <ArchiveRestore className="h-4 w-4" />
                    </button>
                    <button onClick={() => void handleDelete(project.id)} className="text-muted-foreground hover:text-destructive cursor-pointer" aria-label="Delete project">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
