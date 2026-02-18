import type { DomainEvent, ProjectId, WorkspaceId } from "../shared/index.js";

export interface ProjectCreated extends DomainEvent {
  readonly type: "ProjectCreated";
  readonly projectId: ProjectId;
  readonly name: string;
  readonly workspaceId: WorkspaceId;
}

export interface ProjectUpdated extends DomainEvent {
  readonly type: "ProjectUpdated";
  readonly projectId: ProjectId;
}

export interface ProjectArchived extends DomainEvent {
  readonly type: "ProjectArchived";
  readonly projectId: ProjectId;
}

export interface ProjectUnarchived extends DomainEvent {
  readonly type: "ProjectUnarchived";
  readonly projectId: ProjectId;
}

export type ProjectEvent =
  | ProjectCreated
  | ProjectUpdated
  | ProjectArchived
  | ProjectUnarchived;
