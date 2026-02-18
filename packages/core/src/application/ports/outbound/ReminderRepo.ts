import type { Reminder } from "../../../domain/reminder/Reminder.js";
import type { ReminderId, TaskId, WorkspaceId } from "../../../domain/shared/index.js";

export interface ReminderRepo {
  findById(id: ReminderId): Promise<Reminder | null>;
  save(reminder: Reminder): Promise<void>;
  delete(id: ReminderId): Promise<void>;
  findByTask(taskId: TaskId, workspaceId: WorkspaceId): Promise<Reminder[]>;
  findDue(before: Date): Promise<Reminder[]>;
}
