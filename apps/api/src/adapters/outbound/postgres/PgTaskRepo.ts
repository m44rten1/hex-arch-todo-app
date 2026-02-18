import type { Task } from "@todo/core/domain/task/Task.js";
import type { TaskStatus } from "@todo/core/domain/task/Task.js";
import type { TaskId, ProjectId, WorkspaceId, TagId } from "@todo/core/domain/shared/index.js";
import { taskId, projectId, workspaceId, userId, tagId } from "@todo/core/domain/shared/index.js";
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
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
  owner_user_id: string;
  workspace_id: string;
}

function rowToTask(row: TaskRow, tagIds: readonly TagId[]): Task {
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

export class PgTaskRepo implements TaskRepo {
  private readonly pool: DbPool;

  constructor(pool: DbPool) {
    this.pool = pool;
  }

  async findById(id: TaskId): Promise<Task | null> {
    const { rows } = await this.pool.query<TaskRow>(
      "SELECT * FROM tasks WHERE id = $1 AND deleted_at IS NULL",
      [id],
    );
    const row = rows[0];
    if (!row) return null;
    const tagIds = await this.loadTagIds([row.id]);
    return rowToTask(row, tagIds.get(row.id) ?? []);
  }

  async save(task: Task): Promise<void> {
    await this.pool.query(
      `INSERT INTO tasks (id, title, status, notes, project_id, due_at, completed_at, deleted_at, created_at, updated_at, owner_user_id, workspace_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         status = EXCLUDED.status,
         notes = EXCLUDED.notes,
         project_id = EXCLUDED.project_id,
         due_at = EXCLUDED.due_at,
         completed_at = EXCLUDED.completed_at,
         deleted_at = EXCLUDED.deleted_at,
         updated_at = EXCLUDED.updated_at`,
      [
        task.id, task.title, task.status, task.notes, task.projectId,
        task.dueAt, task.completedAt, task.deletedAt, task.createdAt,
        task.updatedAt, task.ownerUserId, task.workspaceId,
      ],
    );
    await this.syncTagIds(task.id, task.tagIds);
  }

  async findInbox(wsId: WorkspaceId): Promise<Task[]> {
    const { rows } = await this.pool.query<TaskRow>(
      "SELECT * FROM tasks WHERE workspace_id = $1 AND project_id IS NULL AND status = 'active' AND deleted_at IS NULL ORDER BY created_at DESC",
      [wsId],
    );
    return this.hydrateTags(rows);
  }

  async findCompletedInbox(wsId: WorkspaceId): Promise<Task[]> {
    const { rows } = await this.pool.query<TaskRow>(
      "SELECT * FROM tasks WHERE workspace_id = $1 AND project_id IS NULL AND status = 'completed' AND deleted_at IS NULL ORDER BY completed_at DESC",
      [wsId],
    );
    return this.hydrateTags(rows);
  }

  async findDueOnOrBefore(wsId: WorkspaceId, date: Date): Promise<Task[]> {
    const { rows } = await this.pool.query<TaskRow>(
      "SELECT * FROM tasks WHERE workspace_id = $1 AND status = 'active' AND due_at <= $2 AND deleted_at IS NULL ORDER BY due_at ASC",
      [wsId, date],
    );
    return this.hydrateTags(rows);
  }

  async findDueBetween(wsId: WorkspaceId, from: Date, to: Date): Promise<Task[]> {
    const { rows } = await this.pool.query<TaskRow>(
      "SELECT * FROM tasks WHERE workspace_id = $1 AND status = 'active' AND due_at >= $2 AND due_at <= $3 AND deleted_at IS NULL ORDER BY due_at ASC",
      [wsId, from, to],
    );
    return this.hydrateTags(rows);
  }

  async findByProject(projId: ProjectId): Promise<Task[]> {
    const { rows } = await this.pool.query<TaskRow>(
      "SELECT * FROM tasks WHERE project_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC",
      [projId],
    );
    return this.hydrateTags(rows);
  }

  async findByTag(tId: TagId, wsId: WorkspaceId): Promise<Task[]> {
    const { rows } = await this.pool.query<TaskRow>(
      `SELECT t.* FROM tasks t
       JOIN task_tags tt ON tt.task_id = t.id
       WHERE tt.tag_id = $1 AND t.workspace_id = $2 AND t.deleted_at IS NULL
       ORDER BY t.created_at DESC`,
      [tId, wsId],
    );
    return this.hydrateTags(rows);
  }

  private async hydrateTags(rows: TaskRow[]): Promise<Task[]> {
    if (rows.length === 0) return [];
    const ids = rows.map(r => r.id);
    const tagMap = await this.loadTagIds(ids);
    return rows.map(r => rowToTask(r, tagMap.get(r.id) ?? []));
  }

  private async loadTagIds(taskIds: string[]): Promise<Map<string, TagId[]>> {
    if (taskIds.length === 0) return new Map();
    const placeholders = taskIds.map((_, i) => `$${i + 1}`).join(", ");
    const { rows } = await this.pool.query<{ task_id: string; tag_id: string }>(
      `SELECT task_id, tag_id FROM task_tags WHERE task_id IN (${placeholders})`,
      taskIds,
    );
    const map = new Map<string, TagId[]>();
    for (const row of rows) {
      let arr = map.get(row.task_id);
      if (!arr) {
        arr = [];
        map.set(row.task_id, arr);
      }
      arr.push(tagId(row.tag_id));
    }
    return map;
  }

  private async syncTagIds(tId: TaskId, tagIds: readonly TagId[]): Promise<void> {
    await this.pool.query("DELETE FROM task_tags WHERE task_id = $1", [tId]);
    for (const tgId of tagIds) {
      await this.pool.query(
        "INSERT INTO task_tags (task_id, tag_id) VALUES ($1, $2)",
        [tId, tgId],
      );
    }
  }
}
