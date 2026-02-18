import type { RecurrenceRule } from "@todo/core/domain/recurrence/RecurrenceRule.js";
import type { Task } from "@todo/core/domain/task/Task.js";
import type { RecurrenceRuleId } from "@todo/core/domain/shared/index.js";
import type { RecurrenceRuleStore } from "@todo/core/application/ports/outbound/RecurrenceRuleStore.js";
import type { Db } from "./db.js";
import type { Kysely } from "kysely";
import type { Database } from "./schema.js";

export class PgRecurrenceRuleStore implements RecurrenceRuleStore {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async replaceRule(
    oldRuleId: RecurrenceRuleId | null,
    newRule: RecurrenceRule,
    updatedTask: Task,
  ): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      if (oldRuleId !== null) {
        await this.deleteRule(trx, oldRuleId);
      }
      await this.saveRule(trx, newRule);
      await this.saveTask(trx, updatedTask);
    });
  }

  async removeRule(ruleId: RecurrenceRuleId, updatedTask: Task): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      await this.deleteRule(trx, ruleId);
      await this.saveTask(trx, updatedTask);
    });
  }

  private async deleteRule(trx: Kysely<Database>, id: RecurrenceRuleId): Promise<void> {
    await trx.deleteFrom("recurrence_rules").where("id", "=", id).execute();
  }

  private async saveRule(trx: Kysely<Database>, rule: RecurrenceRule): Promise<void> {
    await trx
      .insertInto("recurrence_rules")
      .values({
        id: rule.id,
        frequency: rule.frequency,
        interval: rule.interval,
        days_of_week: rule.daysOfWeek ? JSON.stringify(rule.daysOfWeek) : null,
        day_of_month: rule.dayOfMonth,
        mode: rule.mode,
        created_at: rule.createdAt,
        updated_at: rule.updatedAt,
      })
      .execute();
  }

  private async saveTask(trx: Kysely<Database>, task: Task): Promise<void> {
    await trx
      .updateTable("tasks")
      .set({
        recurrence_rule_id: task.recurrenceRuleId,
        updated_at: task.updatedAt,
      })
      .where("id", "=", task.id)
      .execute();
  }
}
