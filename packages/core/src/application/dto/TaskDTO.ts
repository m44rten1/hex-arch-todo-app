import type { Task, TaskStatus } from "../../domain/task/Task.js";
import type { TaskId, ProjectId, WorkspaceId, UserId } from "../../domain/shared/index.js";

export interface TaskDTO {
  readonly id: TaskId;
  readonly title: string;
  readonly status: TaskStatus;
  readonly notes: string | null;
  readonly projectId: ProjectId | null;
  readonly dueAt: string | null;
  readonly completedAt: string | null;
  readonly deletedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly ownerUserId: UserId;
  readonly workspaceId: WorkspaceId;
}

export function toTaskDTO(task: Task): TaskDTO {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    notes: task.notes,
    projectId: task.projectId,
    dueAt: task.dueAt?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    deletedAt: task.deletedAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    ownerUserId: task.ownerUserId,
    workspaceId: task.workspaceId,
  };
}
