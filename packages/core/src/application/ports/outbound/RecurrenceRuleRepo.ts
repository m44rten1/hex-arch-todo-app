import type { RecurrenceRule } from "../../../domain/recurrence/RecurrenceRule.js";
import type { RecurrenceRuleId } from "../../../domain/shared/index.js";

export interface RecurrenceRuleRepo {
  findById(id: RecurrenceRuleId): Promise<RecurrenceRule | null>;
  save(rule: RecurrenceRule): Promise<void>;
  delete(id: RecurrenceRuleId): Promise<void>;
}
