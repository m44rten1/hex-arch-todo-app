import type { Result, NotFoundError } from "../../../domain/shared/index.js";
import { ok, err } from "../../../domain/shared/index.js";
import type { DeleteProjectCommand } from "../../ports/inbound/commands/DeleteProject.js";
import type { RequestContext } from "../../RequestContext.js";
import type { ProjectRepo } from "../../ports/outbound/ProjectRepo.js";
import type { Clock } from "../../../domain/shared/Clock.js";
import type { EventBus } from "../../ports/outbound/EventBus.js";
import type { ProjectDeleted } from "../../../domain/project/ProjectEvents.js";

export class DeleteProjectHandler {
  private readonly projectRepo: ProjectRepo;
  private readonly clock: Clock;
  private readonly eventBus: EventBus;

  constructor(projectRepo: ProjectRepo, clock: Clock, eventBus: EventBus) {
    this.projectRepo = projectRepo;
    this.clock = clock;
    this.eventBus = eventBus;
  }

  async execute(cmd: DeleteProjectCommand, ctx: RequestContext): Promise<Result<void, NotFoundError>> {
    const existing = await this.projectRepo.findById(cmd.projectId);
    if (existing === null || existing.workspaceId !== ctx.workspaceId) {
      return err({ type: "NotFoundError", entity: "Project", id: cmd.projectId });
    }

    await this.projectRepo.delete(cmd.projectId);

    const event: ProjectDeleted = {
      type: "ProjectDeleted",
      projectId: cmd.projectId,
      occurredAt: this.clock.now(),
    };
    await this.eventBus.publish(event);

    return ok(undefined);
  }
}
