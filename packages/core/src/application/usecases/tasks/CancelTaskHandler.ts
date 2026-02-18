import type { Result, NotFoundError } from "../../../domain/shared/index.js";
import { err } from "../../../domain/shared/index.js";
import { cancelTask } from "../../../domain/task/TaskRules.js";
import type { TaskStateError } from "../../../domain/task/TaskRules.js";
import type { TaskDTO } from "../../dto/TaskDTO.js";
import { toTaskDTO } from "../../dto/TaskDTO.js";
import type { CancelTaskCommand } from "../../ports/inbound/commands/CancelTask.js";
import type { RequestContext } from "../../RequestContext.js";
import type { TaskRepo } from "../../ports/outbound/TaskRepo.js";
import type { Clock } from "../../../domain/shared/Clock.js";
import type { EventBus } from "../../ports/outbound/EventBus.js";
import type { TaskCanceled } from "../../../domain/task/TaskEvents.js";

export type CancelTaskError = TaskStateError | NotFoundError;

export class CancelTaskHandler {
  private readonly taskRepo: TaskRepo;
  private readonly clock: Clock;
  private readonly eventBus: EventBus;

  constructor(taskRepo: TaskRepo, clock: Clock, eventBus: EventBus) {
    this.taskRepo = taskRepo;
    this.clock = clock;
    this.eventBus = eventBus;
  }

  async execute(cmd: CancelTaskCommand, ctx: RequestContext): Promise<Result<TaskDTO, CancelTaskError>> {
    const existing = await this.taskRepo.findById(cmd.taskId);
    if (existing === null || existing.workspaceId !== ctx.workspaceId) {
      return err({ type: "NotFoundError", entity: "Task", id: cmd.taskId });
    }

    const now = this.clock.now();
    const result = cancelTask(existing, now);
    if (!result.ok) return result;

    await this.taskRepo.save(result.value);

    const event: TaskCanceled = {
      type: "TaskCanceled",
      taskId: result.value.id,
      occurredAt: now,
    };
    await this.eventBus.publish(event);

    return { ok: true, value: toTaskDTO(result.value) };
  }
}
