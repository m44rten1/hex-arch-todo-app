import type { Result, NotFoundError } from "../../../domain/shared/index.js";
import { err } from "../../../domain/shared/index.js";
import { updateTask } from "../../../domain/task/TaskRules.js";
import type { TaskValidationError } from "../../../domain/task/TaskRules.js";
import type { TaskDTO } from "../../dto/TaskDTO.js";
import { toTaskDTO } from "../../dto/TaskDTO.js";
import type { UpdateTaskCommand } from "../../ports/inbound/commands/UpdateTask.js";
import type { RequestContext } from "../../RequestContext.js";
import type { TaskRepo } from "../../ports/outbound/TaskRepo.js";
import type { Clock } from "../../../domain/shared/Clock.js";
import type { EventBus } from "../../ports/outbound/EventBus.js";
import type { TaskUpdated } from "../../../domain/task/TaskEvents.js";

export type UpdateTaskError = TaskValidationError | NotFoundError;

export class UpdateTaskHandler {
  private readonly taskRepo: TaskRepo;
  private readonly clock: Clock;
  private readonly eventBus: EventBus;

  constructor(taskRepo: TaskRepo, clock: Clock, eventBus: EventBus) {
    this.taskRepo = taskRepo;
    this.clock = clock;
    this.eventBus = eventBus;
  }

  async execute(cmd: UpdateTaskCommand, ctx: RequestContext): Promise<Result<TaskDTO, UpdateTaskError>> {
    const existing = await this.taskRepo.findById(cmd.taskId);
    if (existing === null || existing.workspaceId !== ctx.workspaceId) {
      return err({ type: "NotFoundError", entity: "Task", id: cmd.taskId });
    }

    const now = this.clock.now();
    const result = updateTask(existing, {
      title: cmd.title,
      notes: cmd.notes,
      projectId: cmd.projectId,
      dueAt: cmd.dueAt,
      tagIds: cmd.tagIds,
      now,
    });

    if (!result.ok) return result;

    await this.taskRepo.save(result.value);

    const event: TaskUpdated = {
      type: "TaskUpdated",
      taskId: result.value.id,
      occurredAt: now,
    };
    await this.eventBus.publish(event);

    return { ok: true, value: toTaskDTO(result.value) };
  }
}
