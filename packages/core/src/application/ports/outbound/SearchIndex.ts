import type { Task, TaskStatus } from "../../../domain/task/Task.js";
import type { ProjectId, TagId, WorkspaceId } from "../../../domain/shared/index.js";

export interface TaskSearchFilters {
  readonly projectId?: ProjectId;
  readonly tagIds?: readonly TagId[];
  readonly status?: TaskStatus;
  readonly dueBefore?: Date;
  readonly dueAfter?: Date;
}

export interface SearchIndex {
  searchTasks(
    workspaceId: WorkspaceId,
    q: string,
    filters: TaskSearchFilters,
  ): Promise<Task[]>;
}
