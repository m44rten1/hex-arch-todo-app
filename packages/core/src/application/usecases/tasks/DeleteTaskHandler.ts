import type { Result, NotFoundError } from "../../../domain/shared/index.js";
import { ok, err } from "../../../domain/shared/index.js";
import type { DeleteTaskCommand } from "../../ports/inbound/commands/DeleteTask.js";
import type { RequestContext } from "../../RequestContext.js";
import type { TaskRepo } from "../../ports/outbound/TaskRepo.js";
import type { Clock } from "../../../domain/shared/Clock.js";
import type { EventBus } from "../../ports/outbound/EventBus.js";
import type { TaskDeleted } from "../../../domain/task/TaskEvents.js";

export class DeleteTaskHandler {
  constructor(
    private readonly taskRepo: TaskRepo,
    private readonly clock: Clock,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: DeleteTaskCommand, ctx: RequestContext): Promise<Result<void, NotFoundError>> {
    const existing = await this.taskRepo.findById(cmd.taskId);
    if (existing === null || existing.workspaceId !== ctx.workspaceId) {
      return err({ type: "NotFoundError", entity: "Task", id: cmd.taskId });
    }

    await this.taskRepo.delete(cmd.taskId);

    const event: TaskDeleted = {
      type: "TaskDeleted",
      taskId: cmd.taskId,
      occurredAt: this.clock.now(),
    };
    await this.eventBus.publish(event);

    return ok(undefined);
  }
}
