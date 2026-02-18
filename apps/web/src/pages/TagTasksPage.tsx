import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, ApiRequestError, type TaskDTO, type TagDTO } from "@/lib/api-client";
import { useAuth } from "@/context/useAuth";
import { TaskItem } from "@/components/TaskItem";
import { Hash } from "lucide-react";

export function TagTasksPage() {
  const { tagId } = useParams<{ tagId: string }>();
  const { logout } = useAuth();
  const [tag, setTag] = useState<TagDTO | null>(null);
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!tagId) return;
    try {
      setError(null);
      const [allTags, tagTasks] = await Promise.all([
        api.getTags(),
        api.getTagTasks(tagId),
      ]);
      const found = allTags.find((t) => t.id === tagId) ?? null;
      setTag(found);
      setTasks(tagTasks);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        void logout();
        return;
      }
      setError("Failed to load tag tasks");
    } finally {
      setLoading(false);
    }
  }, [tagId, logout]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleApiError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiRequestError && err.status === 401) void logout();
    },
    [logout],
  );

  const handleToggleComplete = useCallback(async (taskId: string, currentlyCompleted: boolean) => {
    try {
      const updated = currentlyCompleted
        ? await api.uncompleteTask(taskId)
        : await api.completeTask(taskId);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError]);

  const handleUpdate = useCallback(async (taskId: string, title: string) => {
    try {
      const updated = await api.updateTask(taskId, { title });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError]);

  const handleDelete = useCallback(async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError]);

  const activeTasks = tasks.filter((t) => t.status === "active");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Hash className="h-6 w-6" style={{ color: tag?.color ?? undefined }} />
          {tag?.name ?? "Tag"}
        </h1>
      </div>

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Hash className="h-12 w-12 mb-3" />
          <p>No tasks with this tag</p>
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
            />
          ))}
        </div>
      )}

      {completedTasks.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            Completed ({completedTasks.length})
          </h2>
          <div className="flex flex-col gap-2 opacity-60">
            {completedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
