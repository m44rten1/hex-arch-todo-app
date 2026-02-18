import type { TagId, WorkspaceId } from "../shared/index.js";

export interface Tag {
  readonly id: TagId;
  readonly workspaceId: WorkspaceId;
  readonly name: string;
  readonly color: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
