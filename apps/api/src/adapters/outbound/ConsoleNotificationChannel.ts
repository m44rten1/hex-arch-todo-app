import type { Reminder } from "@todo/core/domain/reminder/Reminder.js";
import type { Task } from "@todo/core/domain/task/Task.js";
import type { NotificationChannel } from "@todo/core/application/ports/outbound/NotificationChannel.js";

export class ConsoleNotificationChannel implements NotificationChannel {
  async send(reminder: Reminder, task: Task): Promise<void> {
    console.log(
      `[Reminder] Task "${task.title}" (${task.id}) — reminder ${reminder.id} triggered at ${reminder.remindAt.toISOString()}`,
    );
  }
}
