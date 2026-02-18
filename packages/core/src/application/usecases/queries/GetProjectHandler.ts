import type { Result, NotFoundError } from "../../../domain/shared/index.js";
import { ok, err } from "../../../domain/shared/index.js";
import type { ProjectRepo } from "../../ports/outbound/ProjectRepo.js";
import type { TaskRepo } from "../../ports/outbound/TaskRepo.js";
import type { ProjectDTO } from "../../dto/ProjectDTO.js";
import { toProjectDTO } from "../../dto/ProjectDTO.js";
import type { TaskDTO } from "../../dto/TaskDTO.js";
import { toTaskDTO } from "../../dto/TaskDTO.js";
import type { GetProjectQuery } from "../../ports/inbound/queries/GetProject.js";
import type { RequestContext } from "../../RequestContext.js";

export interface ProjectDetailDTO {
  readonly project: ProjectDTO;
  readonly tasks: readonly TaskDTO[];
}

export class GetProjectHandler {
  private readonly projectRepo: ProjectRepo;
  private readonly taskRepo: TaskRepo;

  constructor(projectRepo: ProjectRepo, taskRepo: TaskRepo) {
    this.projectRepo = projectRepo;
    this.taskRepo = taskRepo;
  }

  async execute(query: GetProjectQuery, ctx: RequestContext): Promise<Result<ProjectDetailDTO, NotFoundError>> {
    const project = await this.projectRepo.findById(query.projectId);
    if (project === null || project.workspaceId !== ctx.workspaceId) {
      return err({ type: "NotFoundError", entity: "Project", id: query.projectId });
    }

    const tasks = await this.taskRepo.findByProject(query.projectId);

    return ok({
      project: toProjectDTO(project),
      tasks: tasks.map(toTaskDTO),
    });
  }
}
