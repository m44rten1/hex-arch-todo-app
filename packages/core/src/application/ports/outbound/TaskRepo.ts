import type { Task } from "../../../domain/task/Task.js";
import type { TaskId, ProjectId, WorkspaceId, TagId } from "../../../domain/shared/index.js";

export interface TaskRepo {
  findById(id: TaskId): Promise<Task | null>;
  save(task: Task): Promise<void>;
  saveAll(tasks: readonly Task[]): Promise<void>;
  findInbox(workspaceId: WorkspaceId): Promise<Task[]>;
  findCompletedInbox(workspaceId: WorkspaceId): Promise<Task[]>;
  findDueOnOrBefore(workspaceId: WorkspaceId, date: Date): Promise<Task[]>;
  findDueBetween(workspaceId: WorkspaceId, from: Date, to: Date): Promise<Task[]>;
  findByProject(projectId: ProjectId): Promise<Task[]>;
  findByTag(tagId: TagId, workspaceId: WorkspaceId): Promise<Task[]>;
}
