import { sql } from "kysely";
import type { Task } from "@todo/core/domain/task/Task.js";
import type { WorkspaceId, TagId } from "@todo/core/domain/shared/index.js";
import { tagId } from "@todo/core/domain/shared/index.js";
import type {
  SearchIndex,
  TaskSearchFilters,
} from "@todo/core/application/ports/outbound/SearchIndex.js";
import type { Db } from "./db.js";
import type { TasksTable } from "./schema.js";
import { rowToTask } from "./taskMapper.js";

export class PgSearchIndex implements SearchIndex {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async searchTasks(
    wsId: WorkspaceId,
    q: string,
    filters: TaskSearchFilters,
  ): Promise<Task[]> {
    const tsQuery = sql`websearch_to_tsquery('english', ${q})`;

    let qb = this.db
      .selectFrom("tasks")
      .selectAll()
      .where("workspace_id", "=", wsId)
      .where("deleted_at", "is", null)
      .where(sql<boolean>`search_vec @@ ${tsQuery}`)
      .$if(filters.status !== undefined, (qb) =>
        qb.where("status", "=", filters.status!),
      )
      .$if(filters.projectId !== undefined, (qb) =>
        qb.where("project_id", "=", filters.projectId!),
      )
      .$if(filters.dueBefore !== undefined, (qb) =>
        qb.where("due_at", "<=", filters.dueBefore!),
      )
      .$if(filters.dueAfter !== undefined, (qb) =>
        qb.where("due_at", ">=", filters.dueAfter!),
      );

    // AND semantics: one EXISTS per tag, so all must be present
    for (const tid of filters.tagIds ?? []) {
      qb = qb.where((eb) =>
        eb.exists(
          eb
            .selectFrom("task_tags")
            .select("task_id")
            .whereRef("task_id", "=", "tasks.id")
            .where("tag_id", "=", tid),
        ),
      );
    }

    const rows = await qb
      .orderBy(sql`ts_rank(search_vec, ${tsQuery})`, "desc")
      .orderBy("due_at", "asc")
      .execute();

    return this.hydrateTags(rows);
  }

  private async hydrateTags(rows: TasksTable[]): Promise<Task[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const tagMap = await this.loadTagIds(ids);
    return rows.map((r) => rowToTask(r, tagMap.get(r.id) ?? []));
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
}
