import type { RecurrenceRuleId } from "../shared/index.js";

export type RecurrenceFrequency = "daily" | "weekly" | "monthly";
export type RecurrenceMode = "fixedSchedule" | "fromCompletion";

export interface RecurrenceRule {
  readonly id: RecurrenceRuleId;
  readonly frequency: RecurrenceFrequency;
  readonly interval: number;
  readonly daysOfWeek: readonly number[] | null;
  readonly dayOfMonth: number | null;
  readonly mode: RecurrenceMode;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
