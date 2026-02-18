import type { Brand } from "./Brand.js";

export type TaskId = Brand<string, "TaskId">;
export type ProjectId = Brand<string, "ProjectId">;
export type WorkspaceId = Brand<string, "WorkspaceId">;
export type UserId = Brand<string, "UserId">;
export type TagId = Brand<string, "TagId">;
export type ReminderId = Brand<string, "ReminderId">;
export type RecurrenceRuleId = Brand<string, "RecurrenceRuleId">;

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

export function tagId(raw: string): TagId {
  return raw as TagId;
}

export function reminderId(raw: string): ReminderId {
  return raw as ReminderId;
}

export function recurrenceRuleId(raw: string): RecurrenceRuleId {
  return raw as RecurrenceRuleId;
}
