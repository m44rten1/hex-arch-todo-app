import type { UserId, WorkspaceId, Result, ValidationError } from "../shared/index.js";
import { ok } from "../shared/index.js";
import type { User } from "./User.js";
import type { UserRegistered } from "./UserEvents.js";
import { createUser } from "./UserRules.js";
import type { Workspace } from "../workspace/Workspace.js";
import { createWorkspace } from "../workspace/WorkspaceRules.js";

export interface RegistrationParams {
  readonly userId: UserId;
  readonly workspaceId: WorkspaceId;
  readonly email: string;
  readonly passwordHash: string;
  readonly now: Date;
}

export interface Registration {
  readonly user: User;
  readonly workspace: Workspace;
  readonly event: UserRegistered;
}

/**
 * Self-registration always produces a user together with their personal workspace.
 * This is a domain invariant: a self-registered user without a workspace is invalid.
 */
export function createRegistration(
  params: RegistrationParams,
): Result<Registration, ValidationError> {
  const userResult = createUser({
    id: params.userId,
    email: params.email,
    passwordHash: params.passwordHash,
    now: params.now,
  });
  if (!userResult.ok) return userResult;

  const wsResult = createWorkspace({
    id: params.workspaceId,
    name: "Personal",
    ownerUserId: params.userId,
    now: params.now,
  });
  if (!wsResult.ok) return wsResult;

  const event: UserRegistered = {
    type: "UserRegistered",
    userId: params.userId,
    email: userResult.value.email,
    workspaceId: params.workspaceId,
    occurredAt: params.now,
  };

  return ok({ user: userResult.value, workspace: wsResult.value, event });
}
