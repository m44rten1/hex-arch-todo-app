import type { TaskId, ProjectId, UserId, WorkspaceId, TagId } from "../../../domain/shared/index.js";

export interface IdGenerator {
  taskId(): TaskId;
  projectId(): ProjectId;
  userId(): UserId;
  workspaceId(): WorkspaceId;
  tagId(): TagId;
}
