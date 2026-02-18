import type { TaskId, ProjectId } from "../../../domain/shared/index.js";

export interface IdGenerator {
  taskId(): TaskId;
  projectId(): ProjectId;
}
