import type { Result, NotFoundError } from "../../../domain/shared/index.js";
import { err } from "../../../domain/shared/index.js";
import { createRecurrenceRule } from "../../../domain/recurrence/RecurrenceRules.js";
import type { RecurrenceValidationError } from "../../../domain/recurrence/RecurrenceRules.js";
import { linkRecurrenceRule } from "../../../domain/task/TaskRules.js";
import type { RecurrenceRuleDTO } from "../../dto/RecurrenceRuleDTO.js";
import { toRecurrenceRuleDTO } from "../../dto/RecurrenceRuleDTO.js";
import type { SetRecurrenceRuleCommand } from "../../ports/inbound/commands/SetRecurrenceRule.js";
import type { RequestContext } from "../../RequestContext.js";
import type { TaskRepo } from "../../ports/outbound/TaskRepo.js";
import type { RecurrenceRuleStore } from "../../ports/outbound/RecurrenceRuleStore.js";
import type { IdGenerator } from "../../ports/outbound/IdGenerator.js";
import type { Clock } from "../../../domain/shared/Clock.js";
import type { EventBus } from "../../ports/outbound/EventBus.js";
import type { RecurrenceRuleSet } from "../../../domain/recurrence/RecurrenceEvents.js";

export type SetRecurrenceRuleError = RecurrenceValidationError | NotFoundError;

export class SetRecurrenceRuleHandler {
  private readonly taskRepo: TaskRepo;
  private readonly recurrenceRuleStore: RecurrenceRuleStore;
  private readonly idGenerator: IdGenerator;
  private readonly clock: Clock;
  private readonly eventBus: EventBus;

  constructor(
    taskRepo: TaskRepo,
    recurrenceRuleStore: RecurrenceRuleStore,
    idGenerator: IdGenerator,
    clock: Clock,
    eventBus: EventBus,
  ) {
    this.taskRepo = taskRepo;
    this.recurrenceRuleStore = recurrenceRuleStore;
    this.idGenerator = idGenerator;
    this.clock = clock;
    this.eventBus = eventBus;
  }

  async execute(
    cmd: SetRecurrenceRuleCommand,
    ctx: RequestContext,
  ): Promise<Result<RecurrenceRuleDTO, SetRecurrenceRuleError>> {
    const task = await this.taskRepo.findById(cmd.taskId);
    if (task === null || task.workspaceId !== ctx.workspaceId) {
      return err({ type: "NotFoundError", entity: "Task", id: cmd.taskId });
    }

    const now = this.clock.now();
    const ruleId = this.idGenerator.recurrenceRuleId();
    const result = createRecurrenceRule({
      id: ruleId,
      frequency: cmd.frequency,
      interval: cmd.interval,
      daysOfWeek: cmd.daysOfWeek,
      dayOfMonth: cmd.dayOfMonth,
      mode: cmd.mode,
      now,
    });

    if (!result.ok) return result;

    const updatedTask = linkRecurrenceRule(task, ruleId, now);
    await this.recurrenceRuleStore.replaceRule(task.recurrenceRuleId, result.value, updatedTask);

    const event: RecurrenceRuleSet = {
      type: "RecurrenceRuleSet",
      recurrenceRuleId: ruleId,
      taskId: task.id,
      occurredAt: now,
    };
    await this.eventBus.publish(event);

    return { ok: true, value: toRecurrenceRuleDTO(result.value) };
  }
}
