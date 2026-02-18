import type { Result, NotFoundError, ConflictError } from "../../../domain/shared/index.js";
import { err } from "../../../domain/shared/index.js";
import { updateTag } from "../../../domain/tag/TagRules.js";
import type { TagValidationError } from "../../../domain/tag/TagRules.js";
import type { TagDTO } from "../../dto/TagDTO.js";
import { toTagDTO } from "../../dto/TagDTO.js";
import type { UpdateTagCommand } from "../../ports/inbound/commands/UpdateTag.js";
import type { RequestContext } from "../../RequestContext.js";
import type { TagRepo } from "../../ports/outbound/TagRepo.js";
import type { Clock } from "../../../domain/shared/Clock.js";
import type { EventBus } from "../../ports/outbound/EventBus.js";
import type { TagUpdated } from "../../../domain/tag/TagEvents.js";

export type UpdateTagError = TagValidationError | NotFoundError | ConflictError;

export class UpdateTagHandler {
  private readonly tagRepo: TagRepo;
  private readonly clock: Clock;
  private readonly eventBus: EventBus;

  constructor(tagRepo: TagRepo, clock: Clock, eventBus: EventBus) {
    this.tagRepo = tagRepo;
    this.clock = clock;
    this.eventBus = eventBus;
  }

  async execute(cmd: UpdateTagCommand, ctx: RequestContext): Promise<Result<TagDTO, UpdateTagError>> {
    const existing = await this.tagRepo.findById(cmd.tagId);
    if (existing === null || existing.workspaceId !== ctx.workspaceId) {
      return err({ type: "NotFoundError", entity: "Tag", id: cmd.tagId });
    }

    const now = this.clock.now();
    const result = updateTag(existing, {
      name: cmd.name,
      color: cmd.color,
      now,
    });
    if (!result.ok) return result;

    if (cmd.name !== undefined) {
      const duplicate = await this.tagRepo.findByName(ctx.workspaceId, result.value.name);
      if (duplicate !== null && duplicate.id !== existing.id) {
        return err({
          type: "ConflictError",
          entity: "Tag",
          message: `A tag named "${result.value.name}" already exists`,
        });
      }
    }

    await this.tagRepo.save(result.value);

    const event: TagUpdated = {
      type: "TagUpdated",
      tagId: result.value.id,
      occurredAt: now,
    };
    await this.eventBus.publish(event);

    return { ok: true, value: toTagDTO(result.value) };
  }
}
