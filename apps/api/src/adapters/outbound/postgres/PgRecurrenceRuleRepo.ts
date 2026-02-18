import type { RecurrenceRule, RecurrenceFrequency, RecurrenceMode } from "@todo/core/domain/recurrence/RecurrenceRule.js";
import type { RecurrenceRuleId } from "@todo/core/domain/shared/index.js";
import { recurrenceRuleId } from "@todo/core/domain/shared/index.js";
import type { RecurrenceRuleRepo } from "@todo/core/application/ports/outbound/RecurrenceRuleRepo.js";
import type { Db } from "./db.js";
import type { RecurrenceRulesTable } from "./schema.js";

function rowToRule(row: RecurrenceRulesTable): RecurrenceRule {
  return {
    id: recurrenceRuleId(row.id),
    frequency: row.frequency as RecurrenceFrequency,
    interval: row.interval,
    daysOfWeek: row.days_of_week ? (JSON.parse(row.days_of_week) as number[]) : null,
    dayOfMonth: row.day_of_month,
    mode: row.mode as RecurrenceMode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PgRecurrenceRuleRepo implements RecurrenceRuleRepo {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async findById(id: RecurrenceRuleId): Promise<RecurrenceRule | null> {
    const row = await this.db
      .selectFrom("recurrence_rules")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    return row ? rowToRule(row) : null;
  }

  async save(rule: RecurrenceRule): Promise<void> {
    await this.db
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
      .onConflict(oc =>
        oc.column("id").doUpdateSet({
          frequency: rule.frequency,
          interval: rule.interval,
          days_of_week: rule.daysOfWeek ? JSON.stringify(rule.daysOfWeek) : null,
          day_of_month: rule.dayOfMonth,
          mode: rule.mode,
          updated_at: rule.updatedAt,
        }),
      )
      .execute();
  }

  async delete(id: RecurrenceRuleId): Promise<void> {
    await this.db.deleteFrom("recurrence_rules").where("id", "=", id).execute();
  }
}
