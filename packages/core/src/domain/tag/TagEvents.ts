import type { DomainEvent, TagId, WorkspaceId } from "../shared/index.js";

export interface TagCreated extends DomainEvent {
  readonly type: "TagCreated";
  readonly tagId: TagId;
  readonly name: string;
  readonly workspaceId: WorkspaceId;
}

export interface TagUpdated extends DomainEvent {
  readonly type: "TagUpdated";
  readonly tagId: TagId;
}

export interface TagDeleted extends DomainEvent {
  readonly type: "TagDeleted";
  readonly tagId: TagId;
}

export type TagEvent = TagCreated | TagUpdated | TagDeleted;
