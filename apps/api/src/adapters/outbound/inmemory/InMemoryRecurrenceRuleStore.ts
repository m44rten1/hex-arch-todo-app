import type { RecurrenceRule } from "@todo/core/domain/recurrence/RecurrenceRule.js";
import type { Task } from "@todo/core/domain/task/Task.js";
import type { RecurrenceRuleId } from "@todo/core/domain/shared/index.js";
import type { RecurrenceRuleStore } from "@todo/core/application/ports/outbound/RecurrenceRuleStore.js";
import type { InMemoryRecurrenceRuleRepo } from "./InMemoryRecurrenceRuleRepo.js";
import type { InMemoryTaskRepo } from "./InMemoryTaskRepo.js";

export class InMemoryRecurrenceRuleStore implements RecurrenceRuleStore {
  private readonly ruleRepo: InMemoryRecurrenceRuleRepo;
  private readonly taskRepo: InMemoryTaskRepo;

  constructor(ruleRepo: InMemoryRecurrenceRuleRepo, taskRepo: InMemoryTaskRepo) {
    this.ruleRepo = ruleRepo;
    this.taskRepo = taskRepo;
  }

  async replaceRule(
    oldRuleId: RecurrenceRuleId | null,
    newRule: RecurrenceRule,
    updatedTask: Task,
  ): Promise<void> {
    if (oldRuleId !== null) {
      await this.ruleRepo.delete(oldRuleId);
    }
    await this.ruleRepo.save(newRule);
    await this.taskRepo.save(updatedTask);
  }

  async removeRule(ruleId: RecurrenceRuleId, updatedTask: Task): Promise<void> {
    await this.ruleRepo.delete(ruleId);
    await this.taskRepo.save(updatedTask);
  }
}
