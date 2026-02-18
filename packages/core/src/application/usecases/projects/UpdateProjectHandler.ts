import type { Result, NotFoundError } from "../../../domain/shared/index.js";
import { err } from "../../../domain/shared/index.js";
import { updateProject } from "../../../domain/project/ProjectRules.js";
import type { ProjectValidationError } from "../../../domain/project/ProjectRules.js";
import type { ProjectDTO } from "../../dto/ProjectDTO.js";
import { toProjectDTO } from "../../dto/ProjectDTO.js";
import type { UpdateProjectCommand } from "../../ports/inbound/commands/UpdateProject.js";
import type { RequestContext } from "../../RequestContext.js";
import type { ProjectRepo } from "../../ports/outbound/ProjectRepo.js";
import type { Clock } from "../../../domain/shared/Clock.js";
import type { EventBus } from "../../ports/outbound/EventBus.js";
import type { ProjectUpdated } from "../../../domain/project/ProjectEvents.js";

export type UpdateProjectError = ProjectValidationError | NotFoundError;

export class UpdateProjectHandler {
  private readonly projectRepo: ProjectRepo;
  private readonly clock: Clock;
  private readonly eventBus: EventBus;

  constructor(projectRepo: ProjectRepo, clock: Clock, eventBus: EventBus) {
    this.projectRepo = projectRepo;
    this.clock = clock;
    this.eventBus = eventBus;
  }

  async execute(cmd: UpdateProjectCommand, ctx: RequestContext): Promise<Result<ProjectDTO, UpdateProjectError>> {
    const existing = await this.projectRepo.findById(cmd.projectId);
    if (existing === null || existing.workspaceId !== ctx.workspaceId) {
      return err({ type: "NotFoundError", entity: "Project", id: cmd.projectId });
    }

    const now = this.clock.now();
    const result = updateProject(existing, {
      name: cmd.name,
      color: cmd.color,
      now,
    });
    if (!result.ok) return result;

    await this.projectRepo.save(result.value);

    const event: ProjectUpdated = {
      type: "ProjectUpdated",
      projectId: result.value.id,
      occurredAt: now,
    };
    await this.eventBus.publish(event);

    return { ok: true, value: toProjectDTO(result.value) };
  }
}
