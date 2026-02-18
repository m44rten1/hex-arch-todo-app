import type { Result, NotFoundError } from "../../../domain/shared/index.js";
import { err } from "../../../domain/shared/index.js";
import { completeTask } from "../../../domain/task/TaskRules.js";
import type { TaskStateError } from "../../../domain/task/TaskRules.js";
import type { TaskDTO } from "../../dto/TaskDTO.js";
import { toTaskDTO } from "../../dto/TaskDTO.js";
import type { CompleteTaskCommand } from "../../ports/inbound/commands/CompleteTask.js";
import type { RequestContext } from "../../RequestContext.js";
import type { TaskRepo } from "../../ports/outbound/TaskRepo.js";
import type { Clock } from "../../../domain/shared/Clock.js";
import type { EventBus } from "../../ports/outbound/EventBus.js";
import type { TaskCompleted } from "../../../domain/task/TaskEvents.js";

export type CompleteTaskError = TaskStateError | NotFoundError;

export class CompleteTaskHandler {
  constructor(
    private readonly taskRepo: TaskRepo,
    private readonly clock: Clock,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: CompleteTaskCommand, ctx: RequestContext): Promise<Result<TaskDTO, CompleteTaskError>> {
    const existing = await this.taskRepo.findById(cmd.taskId);
    if (existing === null || existing.workspaceId !== ctx.workspaceId) {
      return err({ type: "NotFoundError", entity: "Task", id: cmd.taskId });
    }

    const now = this.clock.now();
    const result = completeTask(existing, now);
    if (!result.ok) return result;

    await this.taskRepo.save(result.value);

    const event: TaskCompleted = {
      type: "TaskCompleted",
      taskId: result.value.id,
      completedAt: now,
      occurredAt: now,
    };
    await this.eventBus.publish(event);

    return { ok: true, value: toTaskDTO(result.value) };
  }
}
