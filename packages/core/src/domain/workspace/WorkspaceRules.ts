import type { WorkspaceId, UserId, Result, ValidationError } from "../shared/index.js";
import { ok, err } from "../shared/index.js";
import type { Workspace } from "./Workspace.js";

const NAME_MIN_LENGTH = 1;
const NAME_MAX_LENGTH = 100;

export interface CreateWorkspaceParams {
  readonly id: WorkspaceId;
  readonly name: string;
  readonly ownerUserId: UserId;
  readonly now: Date;
}

export function createWorkspace(params: CreateWorkspaceParams): Result<Workspace, ValidationError> {
  const trimmed = params.name.trim();
  if (trimmed.length < NAME_MIN_LENGTH) {
    return err({ type: "ValidationError", field: "name", message: "Workspace name must not be empty" });
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return err({ type: "ValidationError", field: "name", message: `Workspace name must not exceed ${NAME_MAX_LENGTH} characters` });
  }

  return ok({
    id: params.id,
    name: trimmed,
    ownerUserId: params.ownerUserId,
    createdAt: params.now,
    updatedAt: params.now,
  });
}
