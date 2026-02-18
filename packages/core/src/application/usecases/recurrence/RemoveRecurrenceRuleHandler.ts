import type { Result, NotFoundError } from "../../../domain/shared/index.js";
import { err } from "../../../domain/shared/index.js";
import type { RemoveRecurrenceRuleCommand } from "../../ports/inbound/commands/RemoveRecurrenceRule.js";
import type { RequestContext } from "../../RequestContext.js";
import type { TaskRepo } from "../../ports/outbound/TaskRepo.js";
import type { RecurrenceRuleRepo } from "../../ports/outbound/RecurrenceRuleRepo.js";
import type { Clock } from "../../../domain/shared/Clock.js";
import type { EventBus } from "../../ports/outbound/EventBus.js";
import type { RecurrenceRuleRemoved } from "../../../domain/recurrence/RecurrenceEvents.js";

export type RemoveRecurrenceRuleError = NotFoundError;

export class RemoveRecurrenceRuleHandler {
  private readonly taskRepo: TaskRepo;
  private readonly recurrenceRuleRepo: RecurrenceRuleRepo;
  private readonly clock: Clock;
  private readonly eventBus: EventBus;

  constructor(
    taskRepo: TaskRepo,
    recurrenceRuleRepo: RecurrenceRuleRepo,
    clock: Clock,
    eventBus: EventBus,
  ) {
    this.taskRepo = taskRepo;
    this.recurrenceRuleRepo = recurrenceRuleRepo;
    this.clock = clock;
    this.eventBus = eventBus;
  }

  async execute(
    cmd: RemoveRecurrenceRuleCommand,
    ctx: RequestContext,
  ): Promise<Result<void, RemoveRecurrenceRuleError>> {
    const task = await this.taskRepo.findById(cmd.taskId);
    if (task === null || task.workspaceId !== ctx.workspaceId) {
      return err({ type: "NotFoundError", entity: "Task", id: cmd.taskId });
    }

    if (task.recurrenceRuleId === null) {
      return { ok: true, value: undefined };
    }

    const now = this.clock.now();
    const ruleId = task.recurrenceRuleId;

    await this.recurrenceRuleRepo.delete(ruleId);
    await this.taskRepo.save({ ...task, recurrenceRuleId: null, updatedAt: now });

    const event: RecurrenceRuleRemoved = {
      type: "RecurrenceRuleRemoved",
      recurrenceRuleId: ruleId,
      taskId: task.id,
      occurredAt: now,
    };
    await this.eventBus.publish(event);

    return { ok: true, value: undefined };
  }
}
