import type { TaskId, ProjectId, UserId, WorkspaceId } from "@todo/core/domain/shared/index.js";
import { taskId, projectId, userId, workspaceId } from "@todo/core/domain/shared/index.js";
import type { IdGenerator } from "@todo/core/application/ports/outbound/IdGenerator.js";
import { randomUUID } from "node:crypto";

export class StubIdGenerator implements IdGenerator {
  private nextTaskId: TaskId | null = null;
  private nextProjectId: ProjectId | null = null;
  private nextUserId: UserId | null = null;
  private nextWorkspaceId: WorkspaceId | null = null;

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
}
