import type { TaskId, ProjectId, WorkspaceId, UserId, TagId, RecurrenceRuleId } from "../shared/index.js";

export type TaskStatus = "active" | "completed" | "canceled";

export interface Task {
  readonly id: TaskId;
  readonly title: string;
  readonly status: TaskStatus;
  readonly notes: string | null;
  readonly projectId: ProjectId | null;
  readonly dueAt: Date | null;
  readonly completedAt: Date | null;
  readonly tagIds: readonly TagId[];
  readonly deletedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly recurrenceRuleId: RecurrenceRuleId | null;
  readonly ownerUserId: UserId;
  readonly workspaceId: WorkspaceId;
}
