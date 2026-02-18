import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  api,
  ApiRequestError,
  type ProjectDTO,
  type TaskDTO,
} from "@/lib/api-client";
import { useAuth } from "@/context/useAuth";
import { TaskItem } from "@/components/TaskItem";
import { AddTaskInput } from "@/components/AddTaskInput";
import { TaskDetailPanel } from "@/components/TaskDetailPanel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FolderOpen,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [project, setProject] = useState<ProjectDTO | null>(null);
  const [activeTasks, setActiveTasks] = useState<TaskDTO[]>([]);
  const [completedTasks, setCompletedTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskDTO | null>(null);

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    try {
      setError(null);
      const detail = await api.getProject(projectId);
      setProject(detail.project);
      setActiveTasks(detail.tasks.filter((t) => t.status === "active"));
      setCompletedTasks(detail.tasks.filter((t) => t.status === "completed"));
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        void logout();
        return;
      }
      if (err instanceof ApiRequestError && err.status === 404) {
        setError("Project not found");
        return;
      }
      setError("Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [projectId, logout]);

  useEffect(() => {
    void fetchProject();
  }, [fetchProject]);

  const handleApiError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiRequestError && err.status === 401) void logout();
    },
    [logout],
  );

  const handleAdd = useCallback(async (title: string) => {
    if (!projectId) return;
    try {
      const created = await api.createTask({ title, projectId });
      setActiveTasks((prev) => [created, ...prev]);
    } catch (err) {
      handleApiError(err);
      throw err;
    }
  }, [projectId, handleApiError]);

  const handleToggleComplete = useCallback(async (taskId: string, currentlyCompleted: boolean) => {
    try {
      const updated = currentlyCompleted
        ? await api.uncompleteTask(taskId)
        : await api.completeTask(taskId);

      if (currentlyCompleted) {
        setCompletedTasks((prev) => prev.filter((t) => t.id !== taskId));
        setActiveTasks((prev) => [updated, ...prev]);
      } else {
        setActiveTasks((prev) => prev.filter((t) => t.id !== taskId));
        setCompletedTasks((prev) => [updated, ...prev]);
      }
      if (selectedTask?.id === taskId) setSelectedTask(updated);
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError, selectedTask?.id]);

  const handleUpdate = useCallback(async (taskId: string, title: string) => {
    try {
      const updated = await api.updateTask(taskId, { title });
      setActiveTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      setCompletedTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      if (selectedTask?.id === taskId) setSelectedTask(updated);
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError, selectedTask?.id]);

  const handleDelete = useCallback(async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      setActiveTasks((prev) => prev.filter((t) => t.id !== taskId));
      setCompletedTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (selectedTask?.id === taskId) setSelectedTask(null);
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError, selectedTask?.id]);

  const handleTaskUpdated = useCallback((updated: TaskDTO) => {
    setActiveTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setCompletedTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTask(updated);
  }, []);

  const handleTaskDeleted = useCallback((taskId: string) => {
    setActiveTasks((prev) => prev.filter((t) => t.id !== taskId));
    setCompletedTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const startEdit = useCallback(() => {
    if (!project) return;
    setEditName(project.name);
    setEditColor(project.color ?? "#3b82f6");
    setEditing(true);
  }, [project]);

  const commitEdit = useCallback(async () => {
    if (!project) return;
    setEditing(false);
    const trimmed = editName.trim();
    if (!trimmed) return;
    try {
      const updated = await api.updateProject(project.id, { name: trimmed, color: editColor });
      setProject(updated);
    } catch (err) {
      handleApiError(err);
    }
  }, [project, editName, editColor, handleApiError]);

  const handleArchive = useCallback(async () => {
    if (!project) return;
    try {
      const updated = project.archived
        ? await api.unarchiveProject(project.id)
        : await api.archiveProject(project.id);
      setProject(updated);
    } catch (err) {
      handleApiError(err);
    }
  }, [project, handleApiError]);

  const handleDeleteProject = useCallback(async () => {
    if (!project) return;
    try {
      await api.deleteProject(project.id);
      navigate("/projects");
    } catch (err) {
      handleApiError(err);
    }
  }, [project, navigate, handleApiError]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-destructive">{error ?? "Project not found"}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="mb-6">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="h-8 w-8 rounded cursor-pointer shrink-0"
                />
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void commitEdit();
                    if (e.key === "Escape") setEditing(false);
                  }}
                  className="text-xl font-semibold"
                  autoFocus
                />
                <Button size="icon" variant="ghost" onClick={() => void commitEdit()}>
                  <Check className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditing(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold flex items-center gap-2">
                  <span
                    className="h-5 w-5 rounded-full shrink-0"
                    style={{ backgroundColor: project.color ?? "#737373" }}
                  />
                  {project.name}
                  {project.archived && (
                    <span className="text-sm font-normal text-muted-foreground">(archived)</span>
                  )}
                </h1>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={startEdit} aria-label="Edit project">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => void handleArchive()} aria-label={project.archived ? "Unarchive" : "Archive"}>
                    {project.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => void handleDeleteProject()} aria-label="Delete project" className="hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {!project.archived && (
            <div className="mb-4">
              <AddTaskInput onAdd={handleAdd} />
            </div>
          )}

          {activeTasks.length === 0 && completedTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mb-3" />
              <p>No tasks in this project</p>
            </div>
          )}

          {activeTasks.length > 0 && (
            <div className="flex flex-col gap-2">
              {activeTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onSelect={setSelectedTask}
                />
              ))}
            </div>
          )}

          {completedTasks.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowCompleted((s) => !s)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 cursor-pointer"
              >
                {showCompleted ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Completed ({completedTasks.length})
              </button>
              {showCompleted && (
                <div className="flex flex-col gap-2">
                  {completedTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      onSelect={setSelectedTask}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
        />
      )}
    </div>
  );
}
