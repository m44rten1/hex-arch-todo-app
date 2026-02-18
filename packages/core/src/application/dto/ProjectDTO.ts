import type { Project } from "../../domain/project/Project.js";
import type { ProjectId, WorkspaceId } from "../../domain/shared/index.js";

export interface ProjectDTO {
  readonly id: ProjectId;
  readonly workspaceId: WorkspaceId;
  readonly name: string;
  readonly color: string | null;
  readonly archived: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function toProjectDTO(project: Project): ProjectDTO {
  return {
    id: project.id,
    workspaceId: project.workspaceId,
    name: project.name,
    color: project.color,
    archived: project.archived,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}
