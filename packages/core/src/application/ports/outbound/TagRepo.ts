import type { Tag } from "../../../domain/tag/Tag.js";
import type { TagId, WorkspaceId } from "../../../domain/shared/index.js";

export interface TagRepo {
  findById(id: TagId): Promise<Tag | null>;
  findByName(workspaceId: WorkspaceId, name: string): Promise<Tag | null>;
  save(tag: Tag): Promise<void>;
  delete(id: TagId): Promise<void>;
  findByWorkspace(workspaceId: WorkspaceId): Promise<Tag[]>;
}
