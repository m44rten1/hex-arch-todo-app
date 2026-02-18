import type { TaskId, ProjectId } from "@todo/core/domain/shared/index.js";
import { taskId, projectId } from "@todo/core/domain/shared/index.js";
import type { IdGenerator } from "@todo/core/application/ports/outbound/IdGenerator.js";
import { randomUUID } from "node:crypto";

export class StubIdGenerator implements IdGenerator {
  private nextTaskId: TaskId | null = null;
  private nextProjectId: ProjectId | null = null;

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

  setNextTaskId(id: TaskId): void {
    this.nextTaskId = id;
  }

  setNextProjectId(id: ProjectId): void {
    this.nextProjectId = id;
  }
}
