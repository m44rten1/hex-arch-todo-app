import type { Task } from "@todo/core/domain/task/Task.js";
import type { TaskId, ProjectId, WorkspaceId } from "@todo/core/domain/shared/index.js";
import type { TaskRepo } from "@todo/core/application/ports/outbound/TaskRepo.js";

export class InMemoryTaskRepo implements TaskRepo {
  private readonly tasks = new Map<TaskId, Task>();

  async findById(id: TaskId): Promise<Task | null> {
    const task = this.tasks.get(id) ?? null;
    if (task !== null && task.deletedAt !== null) return null;
    return task;
  }

  async save(task: Task): Promise<void> {
    this.tasks.set(task.id, task);
  }

  async findInbox(workspaceId: WorkspaceId): Promise<Task[]> {
    return [...this.tasks.values()].filter(
      t => t.workspaceId === workspaceId && t.projectId === null && t.status === "active" && t.deletedAt === null,
    );
  }

  async findCompletedInbox(workspaceId: WorkspaceId): Promise<Task[]> {
    return [...this.tasks.values()]
      .filter(t => t.workspaceId === workspaceId && t.projectId === null && t.status === "completed" && t.deletedAt === null)
      .sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0));
  }

  async findDueOnOrBefore(workspaceId: WorkspaceId, date: Date): Promise<Task[]> {
    return [...this.tasks.values()].filter(
      t =>
        t.workspaceId === workspaceId &&
        t.status === "active" &&
        t.dueAt !== null &&
        t.dueAt <= date &&
        t.deletedAt === null,
    );
  }

  async findByProject(projectId: ProjectId): Promise<Task[]> {
    return [...this.tasks.values()].filter(t => t.projectId === projectId && t.deletedAt === null);
  }

  clear(): void {
    this.tasks.clear();
  }
}
