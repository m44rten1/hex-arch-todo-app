import type { WorkspaceId, UserId } from "../shared/index.js";

export interface Workspace {
  readonly id: WorkspaceId;
  readonly name: string;
  readonly ownerUserId: UserId;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
