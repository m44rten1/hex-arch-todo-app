import { useCallback, useEffect, useState } from "react";
import { api, ApiRequestError, type TaskDTO } from "@/lib/api-client";
import { useAuth } from "@/context/useAuth";
import { TaskItem } from "@/components/TaskItem";
import { AddTaskInput } from "@/components/AddTaskInput";
import { TaskDetailPanel } from "@/components/TaskDetailPanel";
import { ChevronDown, ChevronRight, Inbox } from "lucide-react";

export function InboxPage() {
  const { logout } = useAuth();
  const [activeTasks, setActiveTasks] = useState<TaskDTO[]>([]);
  const [completedTasks, setCompletedTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskDTO | null>(null);

  const fetchInbox = useCallback(async () => {
    try {
      setError(null);
      const [active, completed] = await Promise.all([
        api.getInbox(),
        api.getCompletedInbox(),
      ]);
      setActiveTasks(active);
      setCompletedTasks(completed);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        void logout();
        return;
      }
      setError("Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    void fetchInbox();
  }, [fetchInbox]);

  const handleApiError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiRequestError && err.status === 401) {
        void logout();
      }
    },
    [logout],
  );

  const handleAdd = useCallback(async (title: string) => {
    try {
      const created = await api.createTask({ title });
      setActiveTasks((prev) => [created, ...prev]);
    } catch (err) {
      handleApiError(err);
      throw err;
    }
  }, [handleApiError]);

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

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Inbox className="h-6 w-6" />
              Inbox
            </h1>
          </div>

          <div className="mb-4">
            <AddTaskInput onAdd={handleAdd} />
          </div>

          {loading && <p className="text-muted-foreground">Loading...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {!loading && !error && activeTasks.length === 0 && completedTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Inbox className="h-12 w-12 mb-3" />
              <p>Your inbox is empty</p>
              <p className="text-sm mt-1">Add a task above to get started</p>
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
                {showCompleted ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
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
