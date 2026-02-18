import type { TaskId, ProjectId, UserId, WorkspaceId, TagId, ReminderId, RecurrenceRuleId } from "@todo/core/domain/shared/index.js";
import { taskId, projectId, userId, workspaceId, tagId, reminderId, recurrenceRuleId } from "@todo/core/domain/shared/index.js";
import type { IdGenerator } from "@todo/core/application/ports/outbound/IdGenerator.js";
import { randomUUID } from "node:crypto";

export class StubIdGenerator implements IdGenerator {
  private nextTaskId: TaskId | null = null;
  private nextProjectId: ProjectId | null = null;
  private nextUserId: UserId | null = null;
  private nextWorkspaceId: WorkspaceId | null = null;
  private nextTagId: TagId | null = null;
  private nextReminderId: ReminderId | null = null;
  private nextRecurrenceRuleId: RecurrenceRuleId | null = null;

  taskId(): TaskId {
    if (this.nextTaskId !== null) {
      const id = this.nextTaskId;
      this.nextTaskId = null;
      return id;
    }
    return taskId(randomUUID());
  }

  projectId(): ProjectId {
    if (this.nextProjectId !== null) {
      const id = this.nextProjectId;
      this.nextProjectId = null;
      return id;
    }
    return projectId(randomUUID());
  }

  userId(): UserId {
    if (this.nextUserId !== null) {
      const id = this.nextUserId;
      this.nextUserId = null;
      return id;
    }
    return userId(randomUUID());
  }

  workspaceId(): WorkspaceId {
    if (this.nextWorkspaceId !== null) {
      const id = this.nextWorkspaceId;
      this.nextWorkspaceId = null;
      return id;
    }
    return workspaceId(randomUUID());
  }

  tagId(): TagId {
    if (this.nextTagId !== null) {
      const id = this.nextTagId;
      this.nextTagId = null;
      return id;
    }
    return tagId(randomUUID());
  }

  setNextTaskId(id: TaskId): void {
    this.nextTaskId = id;
  }

  setNextProjectId(id: ProjectId): void {
    this.nextProjectId = id;
  }

  setNextUserId(id: UserId): void {
    this.nextUserId = id;
  }

  setNextWorkspaceId(id: WorkspaceId): void {
    this.nextWorkspaceId = id;
  }

  setNextTagId(id: TagId): void {
    this.nextTagId = id;
  }

  reminderId(): ReminderId {
    if (this.nextReminderId !== null) {
      const id = this.nextReminderId;
      this.nextReminderId = null;
      return id;
    }
    return reminderId(randomUUID());
  }

  setNextReminderId(id: ReminderId): void {
    this.nextReminderId = id;
  }

  recurrenceRuleId(): RecurrenceRuleId {
    if (this.nextRecurrenceRuleId !== null) {
      const id = this.nextRecurrenceRuleId;
      this.nextRecurrenceRuleId = null;
      return id;
    }
    return recurrenceRuleId(randomUUID());
  }

  setNextRecurrenceRuleId(id: RecurrenceRuleId): void {
    this.nextRecurrenceRuleId = id;
  }
}
