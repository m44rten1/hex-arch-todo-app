import type { TaskId } from "../../../../domain/shared/index.js";

export interface DeleteTaskCommand {
  readonly taskId: TaskId;
}
