import type { DomainEvent, ReminderId, TaskId } from "../shared/index.js";

export interface ReminderCreated extends DomainEvent {
  readonly type: "ReminderCreated";
  readonly reminderId: ReminderId;
  readonly taskId: TaskId;
  readonly remindAt: Date;
}

export interface ReminderDismissed extends DomainEvent {
  readonly type: "ReminderDismissed";
  readonly reminderId: ReminderId;
  readonly taskId: TaskId;
}

export interface ReminderTriggered extends DomainEvent {
  readonly type: "ReminderTriggered";
  readonly reminderId: ReminderId;
  readonly taskId: TaskId;
}

export type ReminderEvent = ReminderCreated | ReminderDismissed | ReminderTriggered;
