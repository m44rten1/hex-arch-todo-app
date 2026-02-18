import type { Tag } from "../../domain/tag/Tag.js";
import type { TagId, WorkspaceId } from "../../domain/shared/index.js";

export interface TagDTO {
  readonly id: TagId;
  readonly workspaceId: WorkspaceId;
  readonly name: string;
  readonly color: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function toTagDTO(tag: Tag): TagDTO {
  return {
    id: tag.id,
    workspaceId: tag.workspaceId,
    name: tag.name,
    color: tag.color,
    createdAt: tag.createdAt.toISOString(),
    updatedAt: tag.updatedAt.toISOString(),
  };
}
