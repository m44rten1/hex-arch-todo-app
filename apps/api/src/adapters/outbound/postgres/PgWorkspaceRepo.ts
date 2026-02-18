import type { Workspace } from "@todo/core/domain/workspace/Workspace.js";
import type { WorkspaceId, UserId } from "@todo/core/domain/shared/index.js";
import { workspaceId, userId } from "@todo/core/domain/shared/index.js";
import type { WorkspaceRepo } from "@todo/core/application/ports/outbound/WorkspaceRepo.js";
import type { Db } from "./db.js";
import type { WorkspacesTable } from "./schema.js";

function rowToWorkspace(row: WorkspacesTable): Workspace {
  return {
    id: workspaceId(row.id),
    name: row.name,
    ownerUserId: userId(row.owner_user_id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PgWorkspaceRepo implements WorkspaceRepo {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async findById(id: WorkspaceId): Promise<Workspace | null> {
    const row = await this.db
      .selectFrom("workspaces")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    return row ? rowToWorkspace(row) : null;
  }

  async findByOwner(ownerId: UserId): Promise<Workspace | null> {
    const row = await this.db
      .selectFrom("workspaces")
      .selectAll()
      .where("owner_user_id", "=", ownerId)
      .orderBy("created_at", "asc")
      .limit(1)
      .executeTakeFirst();
    return row ? rowToWorkspace(row) : null;
  }

  async save(workspace: Workspace): Promise<void> {
    await this.db
      .insertInto("workspaces")
      .values({
        id: workspace.id,
        name: workspace.name,
        owner_user_id: workspace.ownerUserId,
        created_at: workspace.createdAt,
        updated_at: workspace.updatedAt,
      })
      .onConflict(oc =>
        oc.column("id").doUpdateSet({
          name: workspace.name,
          updated_at: workspace.updatedAt,
        }),
      )
      .execute();
  }
}
