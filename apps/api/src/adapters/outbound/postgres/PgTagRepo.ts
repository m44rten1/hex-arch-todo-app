import type { Tag } from "@todo/core/domain/tag/Tag.js";
import type { TagId, WorkspaceId } from "@todo/core/domain/shared/index.js";
import { tagId, workspaceId } from "@todo/core/domain/shared/index.js";
import type { TagRepo } from "@todo/core/application/ports/outbound/TagRepo.js";
import type { DbPool } from "./pool.js";

interface TagRow {
  id: string;
  workspace_id: string;
  name: string;
  color: string | null;
  created_at: Date;
  updated_at: Date;
}

function rowToTag(row: TagRow): Tag {
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
  private readonly pool: DbPool;

  constructor(pool: DbPool) {
    this.pool = pool;
  }

  async findById(id: TagId): Promise<Tag | null> {
    const { rows } = await this.pool.query<TagRow>(
      "SELECT * FROM tags WHERE id = $1",
      [id],
    );
    return rows[0] ? rowToTag(rows[0]) : null;
  }

  async findByName(wsId: WorkspaceId, name: string): Promise<Tag | null> {
    const { rows } = await this.pool.query<TagRow>(
      "SELECT * FROM tags WHERE workspace_id = $1 AND name = $2",
      [wsId, name],
    );
    return rows[0] ? rowToTag(rows[0]) : null;
  }

  async save(tag: Tag): Promise<void> {
    await this.pool.query(
      `INSERT INTO tags (id, workspace_id, name, color, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         color = EXCLUDED.color,
         updated_at = EXCLUDED.updated_at`,
      [tag.id, tag.workspaceId, tag.name, tag.color, tag.createdAt, tag.updatedAt],
    );
  }

  async delete(id: TagId): Promise<void> {
    await this.pool.query("DELETE FROM tags WHERE id = $1", [id]);
  }

  async findByWorkspace(wsId: WorkspaceId): Promise<Tag[]> {
    const { rows } = await this.pool.query<TagRow>(
      "SELECT * FROM tags WHERE workspace_id = $1 ORDER BY name ASC",
      [wsId],
    );
    return rows.map(rowToTag);
  }
}
