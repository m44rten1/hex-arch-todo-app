import type { Project } from "../../../domain/project/Project.js";
import type { ProjectId, WorkspaceId } from "../../../domain/shared/index.js";

export interface ProjectRepo {
  findById(id: ProjectId): Promise<Project | null>;
  save(project: Project): Promise<void>;
  delete(id: ProjectId): Promise<void>;
  findByWorkspace(workspaceId: WorkspaceId): Promise<Project[]>;
}
