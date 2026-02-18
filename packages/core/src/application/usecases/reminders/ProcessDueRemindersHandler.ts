import type { Task } from "../../../domain/task/Task.js";
import type { Reminder } from "../../../domain/reminder/Reminder.js";
import { triageReminder } from "../../../domain/reminder/ReminderRules.js";
import type { ReminderAction } from "../../../domain/reminder/ReminderRules.js";
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

    // --- GATHER ---
    const dueReminders = await this.reminderRepo.findDue(now);
    const tasks = await this.loadTasks(dueReminders);

    // --- DECIDE ---
    const actions = dueReminders.map(reminder =>
      triageReminder(reminder, tasks.get(reminder.taskId) ?? null, now),
    );

    // --- ACT ---
    for (const action of actions) {
      await this.executeAction(action, now);
    }
  }

  private async loadTasks(reminders: readonly Reminder[]): Promise<Map<string, Task>> {
    const tasks = new Map<string, Task>();
    const seen = new Set<string>();
    for (const r of reminders) {
      if (seen.has(r.taskId)) continue;
      seen.add(r.taskId);
      const task = await this.taskRepo.findById(r.taskId);
      if (task !== null) tasks.set(r.taskId, task);
    }
    return tasks;
  }

  private async executeAction(action: ReminderAction, now: Date): Promise<void> {
    switch (action.type) {
      case "dismiss":
        await this.reminderRepo.save(action.reminder);
        break;
      case "send": {
        await this.notificationChannel.send(action.reminder, action.task);
        await this.reminderRepo.save(action.reminder);
        const event: ReminderTriggered = {
          type: "ReminderTriggered",
          reminderId: action.reminder.id,
          taskId: action.reminder.taskId,
          occurredAt: now,
        };
        await this.eventBus.publish(event);
        break;
      }
      case "skip":
        break;
    }
  }
}
