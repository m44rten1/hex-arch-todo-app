import type { Project } from "@todo/core/domain/project/Project.js";
import type { ProjectId, WorkspaceId } from "@todo/core/domain/shared/index.js";
import { projectId, workspaceId } from "@todo/core/domain/shared/index.js";
import type { ProjectRepo } from "@todo/core/application/ports/outbound/ProjectRepo.js";
import type { DbPool } from "./pool.js";

interface ProjectRow {
  id: string;
  workspace_id: string;
  name: string;
  color: string | null;
  archived: boolean;
  created_at: Date;
  updated_at: Date;
}

function rowToProject(row: ProjectRow): Project {
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
  constructor(private readonly pool: DbPool) {}

  async findById(id: ProjectId): Promise<Project | null> {
    const { rows } = await this.pool.query<ProjectRow>(
      "SELECT * FROM projects WHERE id = $1",
      [id],
    );
    const row = rows[0];
    return row ? rowToProject(row) : null;
  }

  async save(project: Project): Promise<void> {
    await this.pool.query(
      `INSERT INTO projects (id, workspace_id, name, color, archived, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         color = EXCLUDED.color,
         archived = EXCLUDED.archived,
         updated_at = EXCLUDED.updated_at`,
      [
        project.id,
        project.workspaceId,
        project.name,
        project.color,
        project.archived,
        project.createdAt,
        project.updatedAt,
      ],
    );
  }

  async delete(id: ProjectId): Promise<void> {
    await this.pool.query("DELETE FROM projects WHERE id = $1", [id]);
  }

  async findByWorkspace(wsId: WorkspaceId): Promise<Project[]> {
    const { rows } = await this.pool.query<ProjectRow>(
      "SELECT * FROM projects WHERE workspace_id = $1 AND archived = false ORDER BY created_at DESC",
      [wsId],
    );
    return rows.map(rowToProject);
  }
}
