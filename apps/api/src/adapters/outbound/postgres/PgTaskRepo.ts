import type { Task } from "@todo/core/domain/task/Task.js";
import type { TaskStatus } from "@todo/core/domain/task/Task.js";
import type { TaskId, ProjectId, WorkspaceId } from "@todo/core/domain/shared/index.js";
import { taskId, projectId, workspaceId, userId } from "@todo/core/domain/shared/index.js";
import type { TaskRepo } from "@todo/core/application/ports/outbound/TaskRepo.js";
import type { DbPool } from "./pool.js";

interface TaskRow {
  id: string;
  title: string;
  status: string;
  notes: string | null;
  project_id: string | null;
  due_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
  owner_user_id: string;
  workspace_id: string;
}

function rowToTask(row: TaskRow): Task {
  return {
    id: taskId(row.id),
    title: row.title,
    status: row.status as TaskStatus,
    notes: row.notes,
    projectId: row.project_id ? projectId(row.project_id) : null,
    dueAt: row.due_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ownerUserId: userId(row.owner_user_id),
    workspaceId: workspaceId(row.workspace_id),
  };
}

export class PgTaskRepo implements TaskRepo {
  constructor(private readonly pool: DbPool) {}

  async findById(id: TaskId): Promise<Task | null> {
    const { rows } = await this.pool.query<TaskRow>(
      "SELECT * FROM tasks WHERE id = $1",
      [id],
    );
    const row = rows[0];
    return row ? rowToTask(row) : null;
  }

  async save(task: Task): Promise<void> {
    await this.pool.query(
      `INSERT INTO tasks (id, title, status, notes, project_id, due_at, completed_at, created_at, updated_at, owner_user_id, workspace_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         status = EXCLUDED.status,
         notes = EXCLUDED.notes,
         project_id = EXCLUDED.project_id,
         due_at = EXCLUDED.due_at,
         completed_at = EXCLUDED.completed_at,
         updated_at = EXCLUDED.updated_at`,
      [
        task.id,
        task.title,
        task.status,
        task.notes,
        task.projectId,
        task.dueAt,
        task.completedAt,
        task.createdAt,
        task.updatedAt,
        task.ownerUserId,
        task.workspaceId,
      ],
    );
  }

  async delete(id: TaskId): Promise<void> {
    await this.pool.query("DELETE FROM tasks WHERE id = $1", [id]);
  }

  async findInbox(wsId: WorkspaceId): Promise<Task[]> {
    const { rows } = await this.pool.query<TaskRow>(
      "SELECT * FROM tasks WHERE workspace_id = $1 AND project_id IS NULL AND status = 'active' ORDER BY created_at DESC",
      [wsId],
    );
    return rows.map(rowToTask);
  }

  async findCompletedInbox(wsId: WorkspaceId): Promise<Task[]> {
    const { rows } = await this.pool.query<TaskRow>(
      "SELECT * FROM tasks WHERE workspace_id = $1 AND project_id IS NULL AND status = 'completed' ORDER BY completed_at DESC",
      [wsId],
    );
    return rows.map(rowToTask);
  }

  async findDueOnOrBefore(wsId: WorkspaceId, date: Date): Promise<Task[]> {
    const { rows } = await this.pool.query<TaskRow>(
      "SELECT * FROM tasks WHERE workspace_id = $1 AND status = 'active' AND due_at <= $2 ORDER BY due_at ASC",
      [wsId, date],
    );
    return rows.map(rowToTask);
  }

  async findByProject(projId: ProjectId): Promise<Task[]> {
    const { rows } = await this.pool.query<TaskRow>(
      "SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC",
      [projId],
    );
    return rows.map(rowToTask);
  }
}
