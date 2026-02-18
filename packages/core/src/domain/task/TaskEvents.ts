import type { DomainEvent, TaskId, ProjectId, WorkspaceId, UserId } from "../shared/index.js";

export interface TaskCreated extends DomainEvent {
  readonly type: "TaskCreated";
  readonly taskId: TaskId;
  readonly title: string;
  readonly workspaceId: WorkspaceId;
  readonly ownerUserId: UserId;
  readonly projectId: ProjectId | null;
}

export interface TaskUpdated extends DomainEvent {
  readonly type: "TaskUpdated";
  readonly taskId: TaskId;
}

export interface TaskCompleted extends DomainEvent {
  readonly type: "TaskCompleted";
  readonly taskId: TaskId;
  readonly completedAt: Date;
}

export interface TaskUncompleted extends DomainEvent {
  readonly type: "TaskUncompleted";
  readonly taskId: TaskId;
}

export interface TaskCanceled extends DomainEvent {
  readonly type: "TaskCanceled";
  readonly taskId: TaskId;
}

export interface TaskDeleted extends DomainEvent {
  readonly type: "TaskDeleted";
  readonly taskId: TaskId;
}

export type TaskEvent =
  | TaskCreated
  | TaskUpdated
  | TaskCompleted
  | TaskUncompleted
  | TaskCanceled
  | TaskDeleted;
