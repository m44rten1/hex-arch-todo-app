import type { TaskId } from "../../../../domain/shared/index.js";

export interface CancelTaskCommand {
  readonly taskId: TaskId;
}
