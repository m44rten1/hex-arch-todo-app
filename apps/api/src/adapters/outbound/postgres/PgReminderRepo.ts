import type { Reminder, ReminderStatus } from "@todo/core/domain/reminder/Reminder.js";
import type { ReminderId, TaskId, WorkspaceId } from "@todo/core/domain/shared/index.js";
import { reminderId, workspaceId, taskId } from "@todo/core/domain/shared/index.js";
import type { ReminderRepo } from "@todo/core/application/ports/outbound/ReminderRepo.js";
import type { Db } from "./db.js";
import type { RemindersTable } from "./schema.js";

function rowToReminder(row: RemindersTable): Reminder {
  return {
    id: reminderId(row.id),
    taskId: taskId(row.task_id),
    workspaceId: workspaceId(row.workspace_id),
    remindAt: row.remind_at,
    status: row.status as ReminderStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PgReminderRepo implements ReminderRepo {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async findById(id: ReminderId): Promise<Reminder | null> {
    const row = await this.db
      .selectFrom("reminders")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    return row ? rowToReminder(row) : null;
  }

  async save(reminder: Reminder): Promise<void> {
    await this.db
      .insertInto("reminders")
      .values({
        id: reminder.id,
        task_id: reminder.taskId,
        workspace_id: reminder.workspaceId,
        remind_at: reminder.remindAt,
        status: reminder.status,
        created_at: reminder.createdAt,
        updated_at: reminder.updatedAt,
      })
      .onConflict(oc =>
        oc.column("id").doUpdateSet({
          remind_at: reminder.remindAt,
          status: reminder.status,
          updated_at: reminder.updatedAt,
        }),
      )
      .execute();
  }

  async delete(id: ReminderId): Promise<void> {
    await this.db.deleteFrom("reminders").where("id", "=", id).execute();
  }

  async findByTask(tid: TaskId, wsId: WorkspaceId): Promise<Reminder[]> {
    const rows = await this.db
      .selectFrom("reminders")
      .selectAll()
      .where("task_id", "=", tid)
      .where("workspace_id", "=", wsId)
      .orderBy("remind_at", "asc")
      .execute();
    return rows.map(rowToReminder);
  }

  async findDue(before: Date): Promise<Reminder[]> {
    const rows = await this.db
      .selectFrom("reminders")
      .selectAll()
      .where("status", "=", "pending")
      .where("remind_at", "<=", before)
      .orderBy("remind_at", "asc")
      .execute();
    return rows.map(rowToReminder);
  }
}
