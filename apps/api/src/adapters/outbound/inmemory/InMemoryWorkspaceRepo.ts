import type { Workspace } from "@todo/core/domain/workspace/Workspace.js";
import type { WorkspaceId, UserId } from "@todo/core/domain/shared/index.js";
import type { WorkspaceRepo } from "@todo/core/application/ports/outbound/WorkspaceRepo.js";

export class InMemoryWorkspaceRepo implements WorkspaceRepo {
  private readonly workspaces = new Map<WorkspaceId, Workspace>();

  async findById(id: WorkspaceId): Promise<Workspace | null> {
    return this.workspaces.get(id) ?? null;
  }

  async findByOwner(ownerId: UserId): Promise<Workspace | null> {
    for (const ws of this.workspaces.values()) {
      if (ws.ownerUserId === ownerId) return ws;
    }
    return null;
  }

  async save(workspace: Workspace): Promise<void> {
    this.workspaces.set(workspace.id, workspace);
  }

  clear(): void {
    this.workspaces.clear();
  }
}
