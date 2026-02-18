import type { Result } from "../../../domain/shared/index.js";
import { createProject } from "../../../domain/project/ProjectRules.js";
import type { ProjectValidationError } from "../../../domain/project/ProjectRules.js";
import type { ProjectDTO } from "../../dto/ProjectDTO.js";
import { toProjectDTO } from "../../dto/ProjectDTO.js";
import type { CreateProjectCommand } from "../../ports/inbound/commands/CreateProject.js";
import type { ProjectRepo } from "../../ports/outbound/ProjectRepo.js";
import type { IdGenerator } from "../../ports/outbound/IdGenerator.js";
import type { Clock } from "../../../domain/shared/Clock.js";
import type { EventBus } from "../../ports/outbound/EventBus.js";
import type { RequestContext } from "../../RequestContext.js";
import type { ProjectCreated } from "../../../domain/project/ProjectEvents.js";

export class CreateProjectHandler {
  private readonly projectRepo: ProjectRepo;
  private readonly idGenerator: IdGenerator;
  private readonly clock: Clock;
  private readonly eventBus: EventBus;

  constructor(projectRepo: ProjectRepo, idGenerator: IdGenerator, clock: Clock, eventBus: EventBus) {
    this.projectRepo = projectRepo;
    this.idGenerator = idGenerator;
    this.clock = clock;
    this.eventBus = eventBus;
  }

  async execute(
    cmd: CreateProjectCommand,
    ctx: RequestContext,
  ): Promise<Result<ProjectDTO, ProjectValidationError>> {
    const id = this.idGenerator.projectId();
    const now = this.clock.now();

    const result = createProject({
      id,
      workspaceId: ctx.workspaceId,
      name: cmd.name,
      color: cmd.color,
      now,
    });

    if (!result.ok) return result;

    await this.projectRepo.save(result.value);

    const event: ProjectCreated = {
      type: "ProjectCreated",
      projectId: result.value.id,
      name: result.value.name,
      workspaceId: result.value.workspaceId,
      occurredAt: now,
    };
    await this.eventBus.publish(event);

    return { ok: true, value: toProjectDTO(result.value) };
  }
}
