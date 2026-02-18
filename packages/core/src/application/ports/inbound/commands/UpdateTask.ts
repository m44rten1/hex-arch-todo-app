import type { TaskId, ProjectId } from "../../../../domain/shared/index.js";

export interface UpdateTaskCommand {
  readonly taskId: TaskId;
  readonly title?: string;
  readonly notes?: string | null;
  readonly projectId?: ProjectId | null;
  readonly dueAt?: Date | null;
}
