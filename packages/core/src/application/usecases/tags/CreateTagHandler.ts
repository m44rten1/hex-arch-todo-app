import type { Result, ConflictError } from "../../../domain/shared/index.js";
import { err } from "../../../domain/shared/index.js";
import { createTag } from "../../../domain/tag/TagRules.js";
import type { TagValidationError } from "../../../domain/tag/TagRules.js";
import type { TagDTO } from "../../dto/TagDTO.js";
import { toTagDTO } from "../../dto/TagDTO.js";
import type { CreateTagCommand } from "../../ports/inbound/commands/CreateTag.js";
import type { TagRepo } from "../../ports/outbound/TagRepo.js";
import type { IdGenerator } from "../../ports/outbound/IdGenerator.js";
import type { Clock } from "../../../domain/shared/Clock.js";
import type { EventBus } from "../../ports/outbound/EventBus.js";
import type { RequestContext } from "../../RequestContext.js";
import type { TagCreated } from "../../../domain/tag/TagEvents.js";

export type CreateTagError = TagValidationError | ConflictError;

export class CreateTagHandler {
  private readonly tagRepo: TagRepo;
  private readonly idGenerator: IdGenerator;
  private readonly clock: Clock;
  private readonly eventBus: EventBus;

  constructor(tagRepo: TagRepo, idGenerator: IdGenerator, clock: Clock, eventBus: EventBus) {
    this.tagRepo = tagRepo;
    this.idGenerator = idGenerator;
    this.clock = clock;
    this.eventBus = eventBus;
  }

  async execute(
    cmd: CreateTagCommand,
    ctx: RequestContext,
  ): Promise<Result<TagDTO, CreateTagError>> {
    const id = this.idGenerator.tagId();
    const now = this.clock.now();

    const result = createTag({
      id,
      workspaceId: ctx.workspaceId,
      name: cmd.name,
      color: cmd.color,
      now,
    });

    if (!result.ok) return result;

    const existing = await this.tagRepo.findByName(ctx.workspaceId, result.value.name);
    if (existing !== null) {
      return err({
        type: "ConflictError",
        entity: "Tag",
        message: `A tag named "${result.value.name}" already exists`,
      });
    }

    await this.tagRepo.save(result.value);

    const event: TagCreated = {
      type: "TagCreated",
      tagId: result.value.id,
      name: result.value.name,
      workspaceId: result.value.workspaceId,
      occurredAt: now,
    };
    await this.eventBus.publish(event);

    return { ok: true, value: toTagDTO(result.value) };
  }
}
