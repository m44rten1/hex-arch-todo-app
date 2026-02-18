import type { TaskId } from "../../../../domain/shared/index.js";

export interface CompleteTaskCommand {
  readonly taskId: TaskId;
}
