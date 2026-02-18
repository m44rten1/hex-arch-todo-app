import type { Workspace } from "@todo/core/domain/workspace/Workspace.js";
import type { WorkspaceId, UserId } from "@todo/core/domain/shared/index.js";
import { workspaceId, userId } from "@todo/core/domain/shared/index.js";
import type { WorkspaceRepo } from "@todo/core/application/ports/outbound/WorkspaceRepo.js";
import type { DbPool } from "./pool.js";

interface WorkspaceRow {
  id: string;
  name: string;
  owner_user_id: string;
  created_at: Date;
  updated_at: Date;
}

function rowToWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: workspaceId(row.id),
    name: row.name,
    ownerUserId: userId(row.owner_user_id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PgWorkspaceRepo implements WorkspaceRepo {
  private readonly pool: DbPool;

  constructor(pool: DbPool) {
    this.pool = pool;
  }

  async findById(id: WorkspaceId): Promise<Workspace | null> {
    const { rows } = await this.pool.query<WorkspaceRow>(
      "SELECT * FROM workspaces WHERE id = $1",
      [id],
    );
    const row = rows[0];
    return row ? rowToWorkspace(row) : null;
  }

  async findByOwner(ownerId: UserId): Promise<Workspace | null> {
    const { rows } = await this.pool.query<WorkspaceRow>(
      "SELECT * FROM workspaces WHERE owner_user_id = $1 ORDER BY created_at ASC LIMIT 1",
      [ownerId],
    );
    const row = rows[0];
    return row ? rowToWorkspace(row) : null;
  }

  async save(workspace: Workspace): Promise<void> {
    await this.pool.query(
      `INSERT INTO workspaces (id, name, owner_user_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         updated_at = EXCLUDED.updated_at`,
      [workspace.id, workspace.name, workspace.ownerUserId, workspace.createdAt, workspace.updatedAt],
    );
  }
}
