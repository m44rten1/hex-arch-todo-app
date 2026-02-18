import type { TaskId } from "../../../../domain/shared/index.js";

export interface GetTaskRecurrenceQuery {
  readonly taskId: TaskId;
}
