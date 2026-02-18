import type { Reminder, ReminderStatus } from "../../domain/reminder/Reminder.js";
import type { ReminderId, TaskId, WorkspaceId } from "../../domain/shared/index.js";

export interface ReminderDTO {
  readonly id: ReminderId;
  readonly taskId: TaskId;
  readonly workspaceId: WorkspaceId;
  readonly remindAt: string;
  readonly status: ReminderStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function toReminderDTO(reminder: Reminder): ReminderDTO {
  return {
    id: reminder.id,
    taskId: reminder.taskId,
    workspaceId: reminder.workspaceId,
    remindAt: reminder.remindAt.toISOString(),
    status: reminder.status,
    createdAt: reminder.createdAt.toISOString(),
    updatedAt: reminder.updatedAt.toISOString(),
  };
}
