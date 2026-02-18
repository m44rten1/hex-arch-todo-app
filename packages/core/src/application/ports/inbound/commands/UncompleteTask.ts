import type { TaskId } from "../../../../domain/shared/index.js";

export interface UncompleteTaskCommand {
  readonly taskId: TaskId;
}
