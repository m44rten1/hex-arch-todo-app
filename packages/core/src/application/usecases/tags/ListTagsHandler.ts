import type { TagRepo } from "../../ports/outbound/TagRepo.js";
import type { TagDTO } from "../../dto/TagDTO.js";
import { toTagDTO } from "../../dto/TagDTO.js";
import type { RequestContext } from "../../RequestContext.js";

export class ListTagsHandler {
  private readonly tagRepo: TagRepo;

  constructor(tagRepo: TagRepo) {
    this.tagRepo = tagRepo;
  }

  async execute(ctx: RequestContext): Promise<readonly TagDTO[]> {
    const tags = await this.tagRepo.findByWorkspace(ctx.workspaceId);
    return tags.map(toTagDTO);
  }
}
