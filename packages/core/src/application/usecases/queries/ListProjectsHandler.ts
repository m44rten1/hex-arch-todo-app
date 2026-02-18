import type { ProjectRepo } from "../../ports/outbound/ProjectRepo.js";
import type { ProjectDTO } from "../../dto/ProjectDTO.js";
import { toProjectDTO } from "../../dto/ProjectDTO.js";
import type { RequestContext } from "../../RequestContext.js";

export class ListProjectsHandler {
  constructor(private readonly projectRepo: ProjectRepo) {}

  async execute(ctx: RequestContext): Promise<readonly ProjectDTO[]> {
    const projects = await this.projectRepo.findByWorkspace(ctx.workspaceId);
    return projects.map(toProjectDTO);
  }
}
