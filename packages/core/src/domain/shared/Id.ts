import type { Brand } from "./Brand.js";

export type TaskId = Brand<string, "TaskId">;
export type ProjectId = Brand<string, "ProjectId">;
export type WorkspaceId = Brand<string, "WorkspaceId">;
export type UserId = Brand<string, "UserId">;

export function taskId(raw: string): TaskId {
  return raw as TaskId;
}

export function projectId(raw: string): ProjectId {
  return raw as ProjectId;
}

export function workspaceId(raw: string): WorkspaceId {
  return raw as WorkspaceId;
}

export function userId(raw: string): UserId {
  return raw as UserId;
}
