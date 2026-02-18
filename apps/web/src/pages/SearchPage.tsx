import { useCallback, useEffect, useState, useRef } from "react";
import {
  api,
  ApiRequestError,
  type TaskDTO,
  type ProjectDTO,
  type TagDTO,
} from "@/lib/api-client";
import { useAuth } from "@/context/useAuth";
import { TaskItem } from "@/components/TaskItem";
import { TaskDetailPanel } from "@/components/TaskDetailPanel";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function SearchPage() {
  const { logout } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TaskDTO[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskDTO | null>(null);

  // Filters
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [tags, setTags] = useState<TagDTO[]>([]);
  const [filterProjectId, setFilterProjectId] = useState("");
  const [filterTagId, setFilterTagId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void api.getProjects().then((p) => setProjects(p.filter((proj) => !proj.archived))).catch(() => {});
    void api.getTags().then(setTags).catch(() => {});
    inputRef.current?.focus();
  }, []);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const data = await api.searchTasks({
        q: trimmed,
        projectId: filterProjectId || undefined,
        tagIds: filterTagId ? [filterTagId] : undefined,
        status: filterStatus || undefined,
      });
      setResults(data);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        void logout();
        return;
      }
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  }, [query, filterProjectId, filterTagId, filterStatus, logout]);

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
      setResults((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      if (selectedTask?.id === taskId) setSelectedTask(updated);
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError, selectedTask?.id]);

  const handleUpdate = useCallback(async (taskId: string, title: string) => {
    try {
      const updated = await api.updateTask(taskId, { title });
      setResults((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      if (selectedTask?.id === taskId) setSelectedTask(updated);
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError, selectedTask?.id]);

  const handleDelete = useCallback(async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      setResults((prev) => prev.filter((t) => t.id !== taskId));
      if (selectedTask?.id === taskId) setSelectedTask(null);
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError, selectedTask?.id]);

  const handleTaskUpdated = useCallback((updated: TaskDTO) => {
    setResults((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTask(updated);
  }, []);

  const handleTaskDeleted = useCallback((taskId: string) => {
    setResults((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Search className="h-6 w-6" />
              Search
            </h1>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); void handleSearch(); }}
            className="mb-4"
          >
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Search tasks..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1"
              />
              <button
                type="submit"
                disabled={!query.trim() || loading}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
              >
                Search
              </button>
            </div>

            <div className="flex gap-2 mt-3 flex-wrap">
              <select
                value={filterProjectId}
                onChange={(e) => setFilterProjectId(e.target.value)}
                className="rounded-md border bg-transparent px-3 py-1.5 text-sm"
              >
                <option value="">All projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <select
                value={filterTagId}
                onChange={(e) => setFilterTagId(e.target.value)}
                className="rounded-md border bg-transparent px-3 py-1.5 text-sm"
              >
                <option value="">All tags</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-md border bg-transparent px-3 py-1.5 text-sm"
              >
                <option value="">Any status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
          </form>

          {loading && <p className="text-muted-foreground">Searching...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {searched && !loading && !error && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Search className="h-12 w-12 mb-3" />
              <p>No results found</p>
              <p className="text-sm mt-1">Try different search terms or filters</p>
            </div>
          )}

          {results.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </p>
              <div className="flex flex-col gap-2">
                {results.map((task) => (
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
