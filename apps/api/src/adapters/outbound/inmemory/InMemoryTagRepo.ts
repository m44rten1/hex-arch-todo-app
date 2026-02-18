import type { Tag } from "@todo/core/domain/tag/Tag.js";
import type { TagId, WorkspaceId } from "@todo/core/domain/shared/index.js";
import type { TagRepo } from "@todo/core/application/ports/outbound/TagRepo.js";

export class InMemoryTagRepo implements TagRepo {
  private readonly tags = new Map<TagId, Tag>();

  async findById(id: TagId): Promise<Tag | null> {
    return this.tags.get(id) ?? null;
  }

  async findByName(workspaceId: WorkspaceId, name: string): Promise<Tag | null> {
    for (const tag of this.tags.values()) {
      if (tag.workspaceId === workspaceId && tag.name === name) {
        return tag;
      }
    }
    return null;
  }

  async save(tag: Tag): Promise<void> {
    this.tags.set(tag.id, tag);
  }

  async delete(id: TagId): Promise<void> {
    this.tags.delete(id);
  }

  async findByWorkspace(workspaceId: WorkspaceId): Promise<Tag[]> {
    return [...this.tags.values()].filter(t => t.workspaceId === workspaceId);
  }

  clear(): void {
    this.tags.clear();
  }
}
