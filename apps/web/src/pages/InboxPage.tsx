import { useCallback, useEffect, useState } from "react";
import { api, ApiRequestError, type TaskDTO } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { TaskItem } from "@/components/TaskItem";
import { Inbox } from "lucide-react";

export function InboxPage() {
  const { logout } = useAuth();
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInbox = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getInbox();
      setTasks(data);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        logout();
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

  const handleComplete = useCallback(async (taskId: string) => {
    try {
      const updated = await api.completeTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== updated.id));
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        logout();
      }
    }
  }, [logout]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Inbox className="h-6 w-6" />
          Inbox
        </h1>
        <button
          onClick={logout}
          className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
        >
          Sign out
        </button>
      </div>

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Inbox className="h-12 w-12 mb-3" />
          <p>Your inbox is empty</p>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} onComplete={handleComplete} />
          ))}
        </div>
      )}
    </div>
  );
}
