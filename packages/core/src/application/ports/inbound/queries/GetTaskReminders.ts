import type { TaskId } from "../../../../domain/shared/index.js";

export interface GetTaskRemindersQuery {
  readonly type: "GetTaskReminders";
  readonly taskId: TaskId;
}
