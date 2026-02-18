import type { UserId, WorkspaceId } from "../domain/shared/index.js";

export interface RequestContext {
  readonly userId: UserId;
  readonly workspaceId: WorkspaceId;
}
