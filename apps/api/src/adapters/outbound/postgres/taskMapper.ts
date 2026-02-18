import type { Task, TaskStatus } from "@todo/core/domain/task/Task.js";
import type { TagId } from "@todo/core/domain/shared/index.js";
import { taskId, projectId, workspaceId, userId } from "@todo/core/domain/shared/index.js";
import type { TasksTable } from "./schema.js";

export function rowToTask(row: TasksTable, tagIds: readonly TagId[]): Task {
  return {
    id: taskId(row.id),
    title: row.title,
    status: row.status as TaskStatus,
    notes: row.notes,
    projectId: row.project_id ? projectId(row.project_id) : null,
    dueAt: row.due_at,
    tagIds,
    completedAt: row.completed_at,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ownerUserId: userId(row.owner_user_id),
    workspaceId: workspaceId(row.workspace_id),
  };
}
