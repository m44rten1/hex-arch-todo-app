import type { Tag } from "@todo/core/domain/tag/Tag.js";
import type { TagId, WorkspaceId } from "@todo/core/domain/shared/index.js";
import { tagId, workspaceId } from "@todo/core/domain/shared/index.js";
import type { TagRepo } from "@todo/core/application/ports/outbound/TagRepo.js";
import type { Db } from "./db.js";
import type { TagsTable } from "./schema.js";

function rowToTag(row: TagsTable): Tag {
  return {
    id: tagId(row.id),
    workspaceId: workspaceId(row.workspace_id),
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PgTagRepo implements TagRepo {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async findById(id: TagId): Promise<Tag | null> {
    const row = await this.db
      .selectFrom("tags")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    return row ? rowToTag(row) : null;
  }

  async findByName(wsId: WorkspaceId, name: string): Promise<Tag | null> {
    const row = await this.db
      .selectFrom("tags")
      .selectAll()
      .where("workspace_id", "=", wsId)
      .where("name", "=", name)
      .executeTakeFirst();
    return row ? rowToTag(row) : null;
  }

  async save(tag: Tag): Promise<void> {
    await this.db
      .insertInto("tags")
      .values({
        id: tag.id,
        workspace_id: tag.workspaceId,
        name: tag.name,
        color: tag.color,
        created_at: tag.createdAt,
        updated_at: tag.updatedAt,
      })
      .onConflict(oc =>
        oc.column("id").doUpdateSet({
          name: tag.name,
          color: tag.color,
          updated_at: tag.updatedAt,
        }),
      )
      .execute();
  }

  async delete(id: TagId): Promise<void> {
    await this.db.deleteFrom("tags").where("id", "=", id).execute();
  }

  async findByWorkspace(wsId: WorkspaceId): Promise<Tag[]> {
    const rows = await this.db
      .selectFrom("tags")
      .selectAll()
      .where("workspace_id", "=", wsId)
      .orderBy("name", "asc")
      .execute();
    return rows.map(rowToTag);
  }
}
