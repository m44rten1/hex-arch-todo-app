import type { Project } from "@todo/core/domain/project/Project.js";
import type { ProjectId, WorkspaceId } from "@todo/core/domain/shared/index.js";
import { projectId, workspaceId } from "@todo/core/domain/shared/index.js";
import type { ProjectRepo } from "@todo/core/application/ports/outbound/ProjectRepo.js";
import type { Db } from "./db.js";
import type { ProjectsTable } from "./schema.js";

function rowToProject(row: ProjectsTable): Project {
  return {
    id: projectId(row.id),
    workspaceId: workspaceId(row.workspace_id),
    name: row.name,
    color: row.color,
    archived: row.archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PgProjectRepo implements ProjectRepo {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async findById(id: ProjectId): Promise<Project | null> {
    const row = await this.db
      .selectFrom("projects")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    return row ? rowToProject(row) : null;
  }

  async save(project: Project): Promise<void> {
    await this.db
      .insertInto("projects")
      .values({
        id: project.id,
        workspace_id: project.workspaceId,
        name: project.name,
        color: project.color,
        archived: project.archived,
        created_at: project.createdAt,
        updated_at: project.updatedAt,
      })
      .onConflict(oc =>
        oc.column("id").doUpdateSet({
          name: project.name,
          color: project.color,
          archived: project.archived,
          updated_at: project.updatedAt,
        }),
      )
      .execute();
  }

  async delete(id: ProjectId): Promise<void> {
    await this.db.deleteFrom("projects").where("id", "=", id).execute();
  }

  async findByWorkspace(wsId: WorkspaceId): Promise<Project[]> {
    const rows = await this.db
      .selectFrom("projects")
      .selectAll()
      .where("workspace_id", "=", wsId)
      .where("archived", "=", false)
      .orderBy("created_at", "desc")
      .execute();
    return rows.map(rowToProject);
  }
}
