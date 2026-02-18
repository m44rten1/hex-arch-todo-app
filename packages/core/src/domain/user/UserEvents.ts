import type { DomainEvent, UserId, WorkspaceId } from "../shared/index.js";

export interface UserRegistered extends DomainEvent {
  readonly type: "UserRegistered";
  readonly userId: UserId;
  readonly email: string;
  readonly workspaceId: WorkspaceId;
}

export type UserEvent = UserRegistered;
