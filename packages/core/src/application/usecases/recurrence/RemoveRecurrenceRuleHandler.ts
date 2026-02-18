import type { Result, NotFoundError } from "../../../domain/shared/index.js";
import { err } from "../../../domain/shared/index.js";
import type { RemoveRecurrenceRuleCommand } from "../../ports/inbound/commands/RemoveRecurrenceRule.js";
import type { RequestContext } from "../../RequestContext.js";
import type { TaskRepo } from "../../ports/outbound/TaskRepo.js";
import type { RecurrenceRuleStore } from "../../ports/outbound/RecurrenceRuleStore.js";
import type { Clock } from "../../../domain/shared/Clock.js";
import type { EventBus } from "../../ports/outbound/EventBus.js";
import type { RecurrenceRuleRemoved } from "../../../domain/recurrence/RecurrenceEvents.js";

export type RemoveRecurrenceRuleError = NotFoundError;

export class RemoveRecurrenceRuleHandler {
  private readonly taskRepo: TaskRepo;
  private readonly recurrenceRuleStore: RecurrenceRuleStore;
  private readonly clock: Clock;
  private readonly eventBus: EventBus;

  constructor(
    taskRepo: TaskRepo,
    recurrenceRuleStore: RecurrenceRuleStore,
    clock: Clock,
    eventBus: EventBus,
  ) {
    this.taskRepo = taskRepo;
    this.recurrenceRuleStore = recurrenceRuleStore;
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
    const updatedTask = { ...task, recurrenceRuleId: null, updatedAt: now };

    await this.recurrenceRuleStore.removeRule(ruleId, updatedTask);

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
