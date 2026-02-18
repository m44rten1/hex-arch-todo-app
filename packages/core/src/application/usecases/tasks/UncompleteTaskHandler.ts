import type { Result, NotFoundError } from "../../../domain/shared/index.js";
import { err } from "../../../domain/shared/index.js";
import { uncompleteTask } from "../../../domain/task/TaskRules.js";
import type { TaskStateError } from "../../../domain/task/TaskRules.js";
import type { TaskDTO } from "../../dto/TaskDTO.js";
import { toTaskDTO } from "../../dto/TaskDTO.js";
import type { UncompleteTaskCommand } from "../../ports/inbound/commands/UncompleteTask.js";
import type { RequestContext } from "../../RequestContext.js";
import type { TaskRepo } from "../../ports/outbound/TaskRepo.js";
import type { Clock } from "../../../domain/shared/Clock.js";
import type { EventBus } from "../../ports/outbound/EventBus.js";
import type { TaskUncompleted } from "../../../domain/task/TaskEvents.js";

export type UncompleteTaskError = TaskStateError | NotFoundError;

export class UncompleteTaskHandler {
  constructor(
    private readonly taskRepo: TaskRepo,
    private readonly clock: Clock,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: UncompleteTaskCommand, ctx: RequestContext): Promise<Result<TaskDTO, UncompleteTaskError>> {
    const existing = await this.taskRepo.findById(cmd.taskId);
    if (existing === null || existing.workspaceId !== ctx.workspaceId) {
      return err({ type: "NotFoundError", entity: "Task", id: cmd.taskId });
    }

    const now = this.clock.now();
    const result = uncompleteTask(existing, now);
    if (!result.ok) return result;

    await this.taskRepo.save(result.value);

    const event: TaskUncompleted = {
      type: "TaskUncompleted",
      taskId: result.value.id,
      occurredAt: now,
    };
    await this.eventBus.publish(event);

    return { ok: true, value: toTaskDTO(result.value) };
  }
}
