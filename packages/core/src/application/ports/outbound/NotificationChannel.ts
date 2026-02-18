import type { Reminder } from "../../../domain/reminder/Reminder.js";
import type { Task } from "../../../domain/task/Task.js";

export interface NotificationChannel {
  send(reminder: Reminder, task: Task): Promise<void>;
}
