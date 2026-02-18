import type { Project } from "@todo/core/domain/project/Project.js";
import type { ProjectId, WorkspaceId } from "@todo/core/domain/shared/index.js";
import type { ProjectRepo } from "@todo/core/application/ports/outbound/ProjectRepo.js";

export class InMemoryProjectRepo implements ProjectRepo {
  private readonly projects = new Map<ProjectId, Project>();

  async findById(id: ProjectId): Promise<Project | null> {
    return this.projects.get(id) ?? null;
  }

  async save(project: Project): Promise<void> {
    this.projects.set(project.id, project);
  }

  async delete(id: ProjectId): Promise<void> {
    this.projects.delete(id);
  }

  async findByWorkspace(workspaceId: WorkspaceId): Promise<Project[]> {
    return [...this.projects.values()].filter(
      p => p.workspaceId === workspaceId && !p.archived,
    );
  }

  clear(): void {
    this.projects.clear();
  }
}
