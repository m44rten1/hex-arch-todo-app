import type { ReminderId, TaskId, WorkspaceId } from "../shared/index.js";

export type ReminderStatus = "pending" | "sent" | "dismissed";

export interface Reminder {
  readonly id: ReminderId;
  readonly taskId: TaskId;
  readonly workspaceId: WorkspaceId;
  readonly remindAt: Date;
  readonly status: ReminderStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
