import type { RecurrenceRule } from "../../../domain/recurrence/RecurrenceRule.js";
import type { Task } from "../../../domain/task/Task.js";
import type { RecurrenceRuleId } from "../../../domain/shared/index.js";

export interface RecurrenceRuleStore {
  replaceRule(oldRuleId: RecurrenceRuleId | null, newRule: RecurrenceRule, updatedTask: Task): Promise<void>;
  removeRule(ruleId: RecurrenceRuleId, updatedTask: Task): Promise<void>;
}
