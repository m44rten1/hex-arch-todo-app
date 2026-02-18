import type { Workspace } from "../../../domain/workspace/Workspace.js";
import type { WorkspaceId, UserId } from "../../../domain/shared/index.js";

export interface WorkspaceRepo {
  findById(id: WorkspaceId): Promise<Workspace | null>;
  findByOwner(userId: UserId): Promise<Workspace | null>;
  save(workspace: Workspace): Promise<void>;
}
