import type { Task, TaskStatus } from "@todo/core/domain/task/Task.js";
import type { TaskId, ProjectId, WorkspaceId, TagId } from "@todo/core/domain/shared/index.js";
import { taskId, projectId, workspaceId, userId, tagId } from "@todo/core/domain/shared/index.js";
import type { TaskRepo } from "@todo/core/application/ports/outbound/TaskRepo.js";
import type { Db } from "./db.js";
import type { TasksTable } from "./schema.js";

function rowToTask(row: TasksTable, tagIds: readonly TagId[]): Task {
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
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async findById(id: TaskId): Promise<Task | null> {
    const row = await this.db
      .selectFrom("tasks")
      .selectAll()
      .where("id", "=", id)
      .where("deleted_at", "is", null)
      .executeTakeFirst();
    if (!row) return null;
    const tagIds = await this.loadTagIds([row.id]);
    return rowToTask(row, tagIds.get(row.id) ?? []);
  }

  async save(task: Task): Promise<void> {
    await this.db
      .insertInto("tasks")
      .values({
        id: task.id,
        title: task.title,
        status: task.status,
        notes: task.notes,
        project_id: task.projectId,
        due_at: task.dueAt,
        completed_at: task.completedAt,
        deleted_at: task.deletedAt,
        created_at: task.createdAt,
        updated_at: task.updatedAt,
        owner_user_id: task.ownerUserId,
        workspace_id: task.workspaceId,
      })
      .onConflict(oc =>
        oc.column("id").doUpdateSet({
          title: task.title,
          status: task.status,
          notes: task.notes,
          project_id: task.projectId,
          due_at: task.dueAt,
          completed_at: task.completedAt,
          deleted_at: task.deletedAt,
          updated_at: task.updatedAt,
        }),
      )
      .execute();
    await this.syncTagIds(task.id, task.tagIds);
  }

  async findInbox(wsId: WorkspaceId): Promise<Task[]> {
    const rows = await this.db
      .selectFrom("tasks")
      .selectAll()
      .where("workspace_id", "=", wsId)
      .where("project_id", "is", null)
      .where("status", "=", "active")
      .where("deleted_at", "is", null)
      .orderBy("created_at", "desc")
      .execute();
    return this.hydrateTags(rows);
  }

  async findCompletedInbox(wsId: WorkspaceId): Promise<Task[]> {
    const rows = await this.db
      .selectFrom("tasks")
      .selectAll()
      .where("workspace_id", "=", wsId)
      .where("project_id", "is", null)
      .where("status", "=", "completed")
      .where("deleted_at", "is", null)
      .orderBy("completed_at", "desc")
      .execute();
    return this.hydrateTags(rows);
  }

  async findDueOnOrBefore(wsId: WorkspaceId, date: Date): Promise<Task[]> {
    const rows = await this.db
      .selectFrom("tasks")
      .selectAll()
      .where("workspace_id", "=", wsId)
      .where("status", "=", "active")
      .where("due_at", "<=", date)
      .where("deleted_at", "is", null)
      .orderBy("due_at", "asc")
      .execute();
    return this.hydrateTags(rows);
  }

  async findDueBetween(wsId: WorkspaceId, from: Date, to: Date): Promise<Task[]> {
    const rows = await this.db
      .selectFrom("tasks")
      .selectAll()
      .where("workspace_id", "=", wsId)
      .where("status", "=", "active")
      .where("due_at", ">=", from)
      .where("due_at", "<=", to)
      .where("deleted_at", "is", null)
      .orderBy("due_at", "asc")
      .execute();
    return this.hydrateTags(rows);
  }

  async findByProject(projId: ProjectId): Promise<Task[]> {
    const rows = await this.db
      .selectFrom("tasks")
      .selectAll()
      .where("project_id", "=", projId)
      .where("deleted_at", "is", null)
      .orderBy("created_at", "desc")
      .execute();
    return this.hydrateTags(rows);
  }

  async findByTag(tId: TagId, wsId: WorkspaceId): Promise<Task[]> {
    const rows = await this.db
      .selectFrom("tasks as t")
      .innerJoin("task_tags as tt", "tt.task_id", "t.id")
      .where("tt.tag_id", "=", tId)
      .where("t.workspace_id", "=", wsId)
      .where("t.deleted_at", "is", null)
      .orderBy("t.created_at", "desc")
      .selectAll("t")
      .execute();
    return this.hydrateTags(rows);
  }

  private async hydrateTags(rows: TasksTable[]): Promise<Task[]> {
    if (rows.length === 0) return [];
    const ids = rows.map(r => r.id);
    const tagMap = await this.loadTagIds(ids);
    return rows.map(r => rowToTask(r, tagMap.get(r.id) ?? []));
  }

  private async loadTagIds(taskIds: string[]): Promise<Map<string, TagId[]>> {
    if (taskIds.length === 0) return new Map();
    const rows = await this.db
      .selectFrom("task_tags")
      .select(["task_id", "tag_id"])
      .where("task_id", "in", taskIds)
      .execute();
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
    await this.db.deleteFrom("task_tags").where("task_id", "=", tId).execute();
    if (tagIds.length > 0) {
      await this.db
        .insertInto("task_tags")
        .values(tagIds.map(tgId => ({ task_id: tId, tag_id: tgId })))
        .execute();
    }
  }
}
