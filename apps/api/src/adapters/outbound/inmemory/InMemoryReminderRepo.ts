import type { Reminder } from "@todo/core/domain/reminder/Reminder.js";
import type { ReminderId, TaskId, WorkspaceId } from "@todo/core/domain/shared/index.js";
import type { ReminderRepo } from "@todo/core/application/ports/outbound/ReminderRepo.js";

export class InMemoryReminderRepo implements ReminderRepo {
  private readonly reminders = new Map<ReminderId, Reminder>();

  async findById(id: ReminderId): Promise<Reminder | null> {
    return this.reminders.get(id) ?? null;
  }

  async save(reminder: Reminder): Promise<void> {
    this.reminders.set(reminder.id, reminder);
  }

  async delete(id: ReminderId): Promise<void> {
    this.reminders.delete(id);
  }

  async findByTask(taskId: TaskId, workspaceId: WorkspaceId): Promise<Reminder[]> {
    return [...this.reminders.values()]
      .filter(r => r.taskId === taskId && r.workspaceId === workspaceId)
      .sort((a, b) => a.remindAt.getTime() - b.remindAt.getTime());
  }

  async findDue(before: Date): Promise<Reminder[]> {
    return [...this.reminders.values()]
      .filter(r => r.status === "pending" && r.remindAt <= before)
      .sort((a, b) => a.remindAt.getTime() - b.remindAt.getTime());
  }

  clear(): void {
    this.reminders.clear();
  }
}
