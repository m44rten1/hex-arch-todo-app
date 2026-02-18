import type { RecurrenceRule } from "@todo/core/domain/recurrence/RecurrenceRule.js";
import type { RecurrenceRuleId } from "@todo/core/domain/shared/index.js";
import type { RecurrenceRuleRepo } from "@todo/core/application/ports/outbound/RecurrenceRuleRepo.js";

export class InMemoryRecurrenceRuleRepo implements RecurrenceRuleRepo {
  private readonly rules = new Map<RecurrenceRuleId, RecurrenceRule>();

  async findById(id: RecurrenceRuleId): Promise<RecurrenceRule | null> {
    return this.rules.get(id) ?? null;
  }

  async save(rule: RecurrenceRule): Promise<void> {
    this.rules.set(rule.id, rule);
  }

  async delete(id: RecurrenceRuleId): Promise<void> {
    this.rules.delete(id);
  }

  clear(): void {
    this.rules.clear();
  }
}
