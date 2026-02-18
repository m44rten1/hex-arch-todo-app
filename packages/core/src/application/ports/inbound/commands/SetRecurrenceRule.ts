import type { TaskId } from "../../../../domain/shared/index.js";
import type { RecurrenceFrequency, RecurrenceMode } from "../../../../domain/recurrence/RecurrenceRule.js";

export interface SetRecurrenceRuleCommand {
  readonly taskId: TaskId;
  readonly frequency: RecurrenceFrequency;
  readonly interval?: number;
  readonly daysOfWeek?: readonly number[];
  readonly dayOfMonth?: number;
  readonly mode?: RecurrenceMode;
}
