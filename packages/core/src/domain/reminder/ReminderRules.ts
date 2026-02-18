import type { ReminderId, TaskId, WorkspaceId, Result, ValidationError, InvalidStateTransitionError } from "../shared/index.js";
import { ok, err } from "../shared/index.js";
import type { Reminder } from "./Reminder.js";
import type { Task } from "../task/Task.js";

export type ReminderValidationError = ValidationError;
export type ReminderStateError = InvalidStateTransitionError;

export interface CreateReminderParams {
  readonly id: ReminderId;
  readonly taskId: TaskId;
  readonly workspaceId: WorkspaceId;
  readonly remindAt: Date;
  readonly now: Date;
}

export function createReminder(params: CreateReminderParams): Result<Reminder, ReminderValidationError> {
  if (params.remindAt <= params.now) {
    return err({ type: "ValidationError", field: "remindAt", message: "Reminder time must be in the future" });
  }

  return ok({
    id: params.id,
    taskId: params.taskId,
    workspaceId: params.workspaceId,
    remindAt: params.remindAt,
    status: "pending" as const,
    createdAt: params.now,
    updatedAt: params.now,
  });
}

export function updateReminderTime(
  reminder: Reminder,
  remindAt: Date,
  now: Date,
): Result<Reminder, ReminderValidationError | ReminderStateError> {
  if (reminder.status !== "pending") {
    return err({
      type: "InvalidStateTransitionError",
      entity: "Reminder",
      from: reminder.status,
      to: "pending",
      message: `Cannot update a reminder that is ${reminder.status}`,
    });
  }

  if (remindAt <= now) {
    return err({ type: "ValidationError", field: "remindAt", message: "Reminder time must be in the future" });
  }

  return ok({ ...reminder, remindAt, updatedAt: now });
}

export function dismissReminder(
  reminder: Reminder,
  now: Date,
): Result<Reminder, ReminderStateError> {
  if (reminder.status === "dismissed") {
    return err({
      type: "InvalidStateTransitionError",
      entity: "Reminder",
      from: "dismissed",
      to: "dismissed",
      message: "Reminder is already dismissed",
    });
  }

  return ok({ ...reminder, status: "dismissed" as const, updatedAt: now });
}

export function markReminderSent(
  reminder: Reminder,
  now: Date,
): Result<Reminder, ReminderStateError> {
  if (reminder.status !== "pending") {
    return err({
      type: "InvalidStateTransitionError",
      entity: "Reminder",
      from: reminder.status,
      to: "sent",
      message: `Cannot mark a ${reminder.status} reminder as sent`,
    });
  }

  return ok({ ...reminder, status: "sent" as const, updatedAt: now });
}

export type ReminderAction =
  | { readonly type: "send"; readonly reminder: Reminder; readonly task: Task }
  | { readonly type: "dismiss"; readonly reminder: Reminder }
  | { readonly type: "skip"; readonly reminder: Reminder };

export function triageReminder(
  reminder: Reminder,
  task: Task | null,
  now: Date,
): ReminderAction {
  if (task === null || task.status !== "active" || task.deletedAt !== null) {
    const dismissed = dismissReminder(reminder, now);
    return dismissed.ok
      ? { type: "dismiss", reminder: dismissed.value }
      : { type: "skip", reminder };
  }

  const sent = markReminderSent(reminder, now);
  return sent.ok
    ? { type: "send", reminder: sent.value, task }
    : { type: "skip", reminder };
}
