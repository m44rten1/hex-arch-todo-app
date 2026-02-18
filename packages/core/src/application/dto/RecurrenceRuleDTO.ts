import type { RecurrenceRule, RecurrenceFrequency, RecurrenceMode } from "../../domain/recurrence/RecurrenceRule.js";
import type { RecurrenceRuleId } from "../../domain/shared/index.js";

export interface RecurrenceRuleDTO {
  readonly id: RecurrenceRuleId;
  readonly frequency: RecurrenceFrequency;
  readonly interval: number;
  readonly daysOfWeek: readonly number[] | null;
  readonly dayOfMonth: number | null;
  readonly mode: RecurrenceMode;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function toRecurrenceRuleDTO(rule: RecurrenceRule): RecurrenceRuleDTO {
  return {
    id: rule.id,
    frequency: rule.frequency,
    interval: rule.interval,
    daysOfWeek: rule.daysOfWeek,
    dayOfMonth: rule.dayOfMonth,
    mode: rule.mode,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  };
}
