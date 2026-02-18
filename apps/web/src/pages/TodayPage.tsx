import { useCallback, useEffect, useState } from "react";
import { api, ApiRequestError, type TaskDTO, type TodayViewDTO } from "@/lib/api-client";
import { useAuth } from "@/context/useAuth";
import { TaskItem } from "@/components/TaskItem";
import { CalendarDays, AlertTriangle } from "lucide-react";

export function TodayPage() {
  const { logout } = useAuth();
  const [view, setView] = useState<TodayViewDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToday = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getToday();
      setView(data);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        void logout();
        return;
      }
      setError("Failed to load today view");
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    void fetchToday();
  }, [fetchToday]);

  const handleApiError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiRequestError && err.status === 401) {
        void logout();
      }
    },
    [logout],
  );

  const updateTaskInView = useCallback((taskId: string, updater: (task: TaskDTO) => TaskDTO | null) => {
    setView((prev) => {
      if (!prev) return prev;
      const mapOrRemove = (tasks: TaskDTO[]) =>
        tasks.flatMap((t) => {
          if (t.id !== taskId) return [t];
          const result = updater(t);
          return result ? [result] : [];
        });
      return {
        overdue: mapOrRemove(prev.overdue),
        dueToday: mapOrRemove(prev.dueToday),
      };
    });
  }, []);

  const handleToggleComplete = useCallback(async (taskId: string, currentlyCompleted: boolean) => {
    try {
      const updated = currentlyCompleted
        ? await api.uncompleteTask(taskId)
        : await api.completeTask(taskId);
      updateTaskInView(taskId, () => updated);
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError, updateTaskInView]);

  const handleUpdate = useCallback(async (taskId: string, title: string) => {
    try {
      const updated = await api.updateTask(taskId, { title });
      updateTaskInView(taskId, () => updated);
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError, updateTaskInView]);

  const handleDelete = useCallback(async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      updateTaskInView(taskId, () => null);
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError, updateTaskInView]);

  const totalTasks = (view?.overdue.length ?? 0) + (view?.dueToday.length ?? 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <CalendarDays className="h-6 w-6" />
          Today
        </h1>
      </div>

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && totalTasks === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <CalendarDays className="h-12 w-12 mb-3" />
          <p>Nothing due today</p>
          <p className="text-sm mt-1">Enjoy your free time!</p>
        </div>
      )}

      {view && view.overdue.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-destructive flex items-center gap-1.5 mb-3">
            <AlertTriangle className="h-4 w-4" />
            Overdue
          </h2>
          <div className="flex flex-col gap-2">
            {view.overdue.map((task) => (
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

      {view && view.dueToday.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            Due today
          </h2>
          <div className="flex flex-col gap-2">
            {view.dueToday.map((task) => (
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
