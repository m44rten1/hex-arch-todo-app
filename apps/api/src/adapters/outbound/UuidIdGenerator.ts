import { randomUUID } from "node:crypto";
import { taskId, projectId } from "@todo/core/domain/shared/index.js";
import type { TaskId, ProjectId } from "@todo/core/domain/shared/index.js";
import type { IdGenerator } from "@todo/core/application/ports/outbound/IdGenerator.js";

export class UuidIdGenerator implements IdGenerator {
  taskId(): TaskId {
    return taskId(randomUUID());
  }

  projectId(): ProjectId {
    return projectId(randomUUID());
  }
}
