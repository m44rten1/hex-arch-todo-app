import type { TaskId, ProjectId, TagId } from "../../../../domain/shared/index.js";

export interface UpdateTaskCommand {
  readonly taskId: TaskId;
  readonly title?: string;
  readonly notes?: string | null;
  readonly projectId?: ProjectId | null;
  readonly dueAt?: Date | null;
  readonly tagIds?: readonly TagId[];
}
