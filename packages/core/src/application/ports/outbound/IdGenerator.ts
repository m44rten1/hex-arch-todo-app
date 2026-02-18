import type { TaskId, ProjectId, UserId, WorkspaceId } from "../../../domain/shared/index.js";

export interface IdGenerator {
  taskId(): TaskId;
  projectId(): ProjectId;
  userId(): UserId;
  workspaceId(): WorkspaceId;
}
