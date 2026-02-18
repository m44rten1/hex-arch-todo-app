import type { Task } from "@todo/core/domain/task/Task.js";
import type { TaskId, ProjectId, WorkspaceId } from "@todo/core/domain/shared/index.js";
import type { TaskRepo } from "@todo/core/application/ports/outbound/TaskRepo.js";

export class InMemoryTaskRepo implements TaskRepo {
  private readonly tasks = new Map<TaskId, Task>();

  async findById(id: TaskId): Promise<Task | null> {
    return this.tasks.get(id) ?? null;
  }

  async save(task: Task): Promise<void> {
    this.tasks.set(task.id, task);
  }

  async delete(id: TaskId): Promise<void> {
    this.tasks.delete(id);
  }

  async findInbox(workspaceId: WorkspaceId): Promise<Task[]> {
    return [...this.tasks.values()].filter(
      t => t.workspaceId === workspaceId && t.projectId === null && t.status === "active",
    );
  }

  async findDueOnOrBefore(workspaceId: WorkspaceId, date: Date): Promise<Task[]> {
    return [...this.tasks.values()].filter(
      t =>
        t.workspaceId === workspaceId &&
        t.status === "active" &&
        t.dueAt !== null &&
        t.dueAt <= date,
    );
  }

  async findByProject(projectId: ProjectId): Promise<Task[]> {
    return [...this.tasks.values()].filter(t => t.projectId === projectId);
  }

  clear(): void {
    this.tasks.clear();
  }
}
