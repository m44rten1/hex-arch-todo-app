import type { Result, NotFoundError } from "../../../domain/shared/index.js";
import { ok, err } from "../../../domain/shared/index.js";
import type { DeleteTagCommand } from "../../ports/inbound/commands/DeleteTag.js";
import type { RequestContext } from "../../RequestContext.js";
import type { TagRepo } from "../../ports/outbound/TagRepo.js";
import type { Clock } from "../../../domain/shared/Clock.js";
import type { EventBus } from "../../ports/outbound/EventBus.js";
import type { TagDeleted } from "../../../domain/tag/TagEvents.js";

export class DeleteTagHandler {
  private readonly tagRepo: TagRepo;
  private readonly clock: Clock;
  private readonly eventBus: EventBus;

  constructor(tagRepo: TagRepo, clock: Clock, eventBus: EventBus) {
    this.tagRepo = tagRepo;
    this.clock = clock;
    this.eventBus = eventBus;
  }

  async execute(cmd: DeleteTagCommand, ctx: RequestContext): Promise<Result<void, NotFoundError>> {
    const existing = await this.tagRepo.findById(cmd.tagId);
    if (existing === null || existing.workspaceId !== ctx.workspaceId) {
      return err({ type: "NotFoundError", entity: "Tag", id: cmd.tagId });
    }

    await this.tagRepo.delete(cmd.tagId);

    const event: TagDeleted = {
      type: "TagDeleted",
      tagId: cmd.tagId,
      occurredAt: this.clock.now(),
    };
    await this.eventBus.publish(event);

    return ok(undefined);
  }
}
