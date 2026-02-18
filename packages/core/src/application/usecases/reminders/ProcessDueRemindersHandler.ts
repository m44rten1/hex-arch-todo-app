import { markReminderSent, dismissReminder } from "../../../domain/reminder/ReminderRules.js";
import type { ReminderRepo } from "../../ports/outbound/ReminderRepo.js";
import type { TaskRepo } from "../../ports/outbound/TaskRepo.js";
import type { NotificationChannel } from "../../ports/outbound/NotificationChannel.js";
import type { Clock } from "../../../domain/shared/Clock.js";
import type { EventBus } from "../../ports/outbound/EventBus.js";
import type { ReminderTriggered } from "../../../domain/reminder/ReminderEvents.js";

export class ProcessDueRemindersHandler {
  private readonly reminderRepo: ReminderRepo;
  private readonly taskRepo: TaskRepo;
  private readonly notificationChannel: NotificationChannel;
  private readonly clock: Clock;
  private readonly eventBus: EventBus;

  constructor(
    reminderRepo: ReminderRepo,
    taskRepo: TaskRepo,
    notificationChannel: NotificationChannel,
    clock: Clock,
    eventBus: EventBus,
  ) {
    this.reminderRepo = reminderRepo;
    this.taskRepo = taskRepo;
    this.notificationChannel = notificationChannel;
    this.clock = clock;
    this.eventBus = eventBus;
  }

  async execute(): Promise<void> {
    const now = this.clock.now();
    const dueReminders = await this.reminderRepo.findDue(now);

    for (const reminder of dueReminders) {
      const task = await this.taskRepo.findById(reminder.taskId);

      if (task === null || task.status !== "active" || task.deletedAt !== null) {
        const dismissed = dismissReminder(reminder, now);
        if (dismissed.ok) {
          await this.reminderRepo.save(dismissed.value);
        }
        continue;
      }

      const sent = markReminderSent(reminder, now);
      if (!sent.ok) continue;

      await this.notificationChannel.send(reminder, task);
      await this.reminderRepo.save(sent.value);

      const event: ReminderTriggered = {
        type: "ReminderTriggered",
        reminderId: reminder.id,
        taskId: reminder.taskId,
        occurredAt: now,
      };
      await this.eventBus.publish(event);
    }
  }
}
