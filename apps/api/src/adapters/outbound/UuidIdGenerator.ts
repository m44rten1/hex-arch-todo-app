import { randomUUID } from "node:crypto";
import { taskId, projectId, userId, workspaceId, tagId } from "@todo/core/domain/shared/index.js";
import type { TaskId, ProjectId, UserId, WorkspaceId, TagId } from "@todo/core/domain/shared/index.js";
import type { IdGenerator } from "@todo/core/application/ports/outbound/IdGenerator.js";

export class UuidIdGenerator implements IdGenerator {
  taskId(): TaskId {
    return taskId(randomUUID());
  }

  projectId(): ProjectId {
    return projectId(randomUUID());
  }

  userId(): UserId {
    return userId(randomUUID());
  }

  workspaceId(): WorkspaceId {
    return workspaceId(randomUUID());
  }

  tagId(): TagId {
    return tagId(randomUUID());
  }
}
