import type { TaskId, ProjectId, WorkspaceId, UserId, TagId, RecurrenceRuleId, Result, ValidationError, InvalidStateTransitionError } from "../shared/index.js";
import { ok, err } from "../shared/index.js";
import type { Task, TaskStatus } from "./Task.js";

const TITLE_MIN_LENGTH = 1;
const TITLE_MAX_LENGTH = 200;

export type TaskValidationError = ValidationError;
export type TaskStateError = InvalidStateTransitionError;

export interface CreateTaskParams {
  readonly id: TaskId;
  readonly title: string;
  readonly now: Date;
  readonly userId: UserId;
  readonly workspaceId: WorkspaceId;
  readonly projectId?: ProjectId;
  readonly dueAt?: Date;
  readonly notes?: string;
  readonly tagIds?: readonly TagId[];
  readonly recurrenceRuleId?: RecurrenceRuleId;
}

export interface UpdateTaskParams {
  readonly title?: string;
  readonly notes?: string | null;
  readonly projectId?: ProjectId | null;
  readonly dueAt?: Date | null;
  readonly tagIds?: readonly TagId[];
  readonly now: Date;
}

function validateTitle(title: string): Result<string, TaskValidationError> {
  const trimmed = title.trim();
  if (trimmed.length < TITLE_MIN_LENGTH) {
    return err({ type: "ValidationError", field: "title", message: "Title must not be empty" });
  }
  if (trimmed.length > TITLE_MAX_LENGTH) {
    return err({ type: "ValidationError", field: "title", message: `Title must not exceed ${TITLE_MAX_LENGTH} characters` });
  }
  return ok(trimmed);
}

export function createTask(params: CreateTaskParams): Result<Task, TaskValidationError> {
  const titleResult = validateTitle(params.title);
  if (!titleResult.ok) return titleResult;

  const task: Task = {
    id: params.id,
    title: titleResult.value,
    status: "active",
    notes: params.notes?.trim() ?? null,
    projectId: params.projectId ?? null,
    dueAt: params.dueAt ?? null,
    tagIds: params.tagIds ?? [],
    completedAt: null,
    recurrenceRuleId: params.recurrenceRuleId ?? null,
    deletedAt: null,
    createdAt: params.now,
    updatedAt: params.now,
    ownerUserId: params.userId,
    workspaceId: params.workspaceId,
  };

  return ok(task);
}

export function completeTask(task: Task, now: Date): Result<Task, TaskStateError> {
  if (task.status !== "active") {
    return err({
      type: "InvalidStateTransitionError",
      entity: "Task",
      from: task.status,
      to: "completed",
      message: `Cannot complete a task that is ${task.status}`,
    });
  }

  return ok({ ...task, status: "completed" as const, completedAt: now, updatedAt: now });
}

export function uncompleteTask(task: Task, now: Date): Result<Task, TaskStateError> {
  if (task.status !== "completed") {
    return err({
      type: "InvalidStateTransitionError",
      entity: "Task",
      from: task.status,
      to: "active",
      message: `Cannot uncomplete a task that is ${task.status}`,
    });
  }

  return ok({ ...task, status: "active" as const, completedAt: null, updatedAt: now });
}

export function cancelTask(task: Task, now: Date): Result<Task, TaskStateError> {
  if (task.status === "canceled") {
    return err({
      type: "InvalidStateTransitionError",
      entity: "Task",
      from: task.status,
      to: "canceled",
      message: "Task is already canceled",
    });
  }

  return ok({ ...task, status: "canceled" as const, updatedAt: now });
}

export function deleteTask(task: Task, now: Date): Result<Task, TaskStateError> {
  if (task.deletedAt !== null) {
    return err({
      type: "InvalidStateTransitionError",
      entity: "Task",
      from: "deleted",
      to: "deleted",
      message: "Task is already deleted",
    });
  }

  return ok({ ...task, deletedAt: now, updatedAt: now });
}

export function updateTask(task: Task, params: UpdateTaskParams): Result<Task, TaskValidationError> {
  if (params.title !== undefined) {
    const titleResult = validateTitle(params.title);
    if (!titleResult.ok) return titleResult;

    return ok(applyUpdate(task, { ...params, title: titleResult.value }));
  }

  return ok(applyUpdate(task, params));
}

function applyUpdate(task: Task, params: UpdateTaskParams & { title?: string }): Task {
  return {
    ...task,
    title: params.title ?? task.title,
    notes: params.notes !== undefined ? (params.notes?.trim() ?? null) : task.notes,
    projectId: params.projectId !== undefined ? params.projectId : task.projectId,
    dueAt: params.dueAt !== undefined ? params.dueAt : task.dueAt,
    tagIds: params.tagIds !== undefined ? params.tagIds : task.tagIds,
    updatedAt: params.now,
  };
}

export function isOverdue(task: Task, now: Date): boolean {
  return (
    task.status === "active" &&
    task.dueAt !== null &&
    task.dueAt < now
  );
}

export function isDueOn(task: Task, date: Date): boolean {
  if (task.dueAt === null) return false;
  return (
    task.dueAt.getUTCFullYear() === date.getUTCFullYear() &&
    task.dueAt.getUTCMonth() === date.getUTCMonth() &&
    task.dueAt.getUTCDate() === date.getUTCDate()
  );
}

export const TASK_STATUSES = ["active", "completed", "canceled"] as const satisfies readonly TaskStatus[];

export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

const ALLOWED_TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
  active: ["completed", "canceled"],
  completed: ["active"],
  canceled: ["active"],
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}
