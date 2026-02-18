import type { TaskId } from "../../../../domain/shared/index.js";

export interface RemoveRecurrenceRuleCommand {
  readonly taskId: TaskId;
}
