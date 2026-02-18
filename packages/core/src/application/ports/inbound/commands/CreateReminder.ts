import type { TaskId } from "../../../../domain/shared/index.js";

export interface CreateReminderCommand {
  readonly taskId: TaskId;
  readonly remindAt: Date;
}
