import type { Task } from "@todo/core/domain/task/Task.js";
import type { WorkspaceId } from "@todo/core/domain/shared/index.js";
import type { SearchIndex, TaskSearchFilters } from "@todo/core/application/ports/outbound/SearchIndex.js";
import type { InMemoryTaskRepo } from "./InMemoryTaskRepo.js";

/**
 * Simple substring search over title + notes for use in dev and integration tests.
 * Delegates to InMemoryTaskRepo so results stay in sync without additional wiring.
 */
export class InMemorySearchIndex implements SearchIndex {
  private readonly taskRepo: InMemoryTaskRepo;

  constructor(taskRepo: InMemoryTaskRepo) {
    this.taskRepo = taskRepo;
  }

  async searchTasks(wsId: WorkspaceId, q: string, filters: TaskSearchFilters): Promise<Task[]> {
    const lower = q.toLowerCase();
    const all = await this.taskRepo.findAll(wsId);

    return all.filter(t => {
      const text = `${t.title} ${t.notes ?? ""}`.toLowerCase();
      if (!text.includes(lower)) return false;
      if (filters.status && t.status !== filters.status) return false;
      if (filters.projectId && t.projectId !== filters.projectId) return false;
      if (filters.dueBefore && (t.dueAt === null || t.dueAt > filters.dueBefore)) return false;
      if (filters.dueAfter && (t.dueAt === null || t.dueAt < filters.dueAfter)) return false;
      if (filters.tagIds?.length) {
        const hasAll = filters.tagIds.every(tid => t.tagIds.includes(tid));
        if (!hasAll) return false;
      }
      return true;
    });
  }
}
