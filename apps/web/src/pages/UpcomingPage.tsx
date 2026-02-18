import { useCallback, useEffect, useState } from "react";
import { api, ApiRequestError, type TaskDTO, type UpcomingViewDTO } from "@/lib/api-client";
import { useAuth } from "@/context/useAuth";
import { TaskItem } from "@/components/TaskItem";
import { TaskDetailPanel } from "@/components/TaskDetailPanel";
import { CalendarRange } from "lucide-react";

const DAY_OPTIONS = [7, 14, 30] as const;

function formatDayHeader(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === tomorrow.getTime()) return "Tomorrow";

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function UpcomingPage() {
  const { logout } = useAuth();
  const [view, setView] = useState<UpcomingViewDTO | null>(null);
  const [days, setDays] = useState<number>(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskDTO | null>(null);

  const fetchUpcoming = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await api.getUpcoming(days);
      setView(data);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        void logout();
        return;
      }
      setError("Failed to load upcoming view");
    } finally {
      setLoading(false);
    }
  }, [days, logout]);

  useEffect(() => {
    void fetchUpcoming();
  }, [fetchUpcoming]);

  const handleApiError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiRequestError && err.status === 401) void logout();
    },
    [logout],
  );

  const updateTaskInView = useCallback((taskId: string, updater: (task: TaskDTO) => TaskDTO | null) => {
    setView((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        groups: prev.groups.map((group) => ({
          ...group,
          tasks: group.tasks.flatMap((t) => {
            if (t.id !== taskId) return [t];
            const result = updater(t);
            return result ? [result] : [];
          }),
        })),
      };
    });
  }, []);

  const handleToggleComplete = useCallback(async (taskId: string, currentlyCompleted: boolean) => {
    try {
      const updated = currentlyCompleted
        ? await api.uncompleteTask(taskId)
        : await api.completeTask(taskId);
      updateTaskInView(taskId, () => updated);
      if (selectedTask?.id === taskId) setSelectedTask(updated);
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError, updateTaskInView, selectedTask?.id]);

  const handleUpdate = useCallback(async (taskId: string, title: string) => {
    try {
      const updated = await api.updateTask(taskId, { title });
      updateTaskInView(taskId, () => updated);
      if (selectedTask?.id === taskId) setSelectedTask(updated);
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError, updateTaskInView, selectedTask?.id]);

  const handleDelete = useCallback(async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      updateTaskInView(taskId, () => null);
      if (selectedTask?.id === taskId) setSelectedTask(null);
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError, updateTaskInView, selectedTask?.id]);

  const handleTaskUpdated = useCallback((updated: TaskDTO) => {
    updateTaskInView(updated.id, () => updated);
    setSelectedTask(updated);
  }, [updateTaskInView]);

  const handleTaskDeleted = useCallback((taskId: string) => {
    updateTaskInView(taskId, () => null);
  }, [updateTaskInView]);

  const totalTasks = view?.groups.reduce((sum, g) => sum + g.tasks.length, 0) ?? 0;

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <CalendarRange className="h-6 w-6" />
              Upcoming
            </h1>
            <div className="flex gap-1">
              {DAY_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`rounded-md px-3 py-1 text-sm font-medium transition-colors cursor-pointer ${
                    days === d
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {loading && <p className="text-muted-foreground">Loading...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {!loading && !error && totalTasks === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CalendarRange className="h-12 w-12 mb-3" />
              <p>No upcoming tasks in the next {days} days</p>
            </div>
          )}

          {view && view.groups.filter((g) => g.tasks.length > 0).map((group) => (
            <div key={group.date} className="mb-6">
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                {formatDayHeader(group.date)}
              </h2>
              <div className="flex flex-col gap-2">
                {group.tasks.map((task) => (
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
            </div>
          ))}
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
