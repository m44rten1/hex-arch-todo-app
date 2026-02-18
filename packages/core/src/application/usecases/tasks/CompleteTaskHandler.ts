import type { Result, NotFoundError } from "../../../domain/shared/index.js";
import { err } from "../../../domain/shared/index.js";
import type { Task } from "../../../domain/task/Task.js";
import { completeTask, createTask } from "../../../domain/task/TaskRules.js";
import type { TaskStateError } from "../../../domain/task/TaskRules.js";
import { buildNextRecurringTask } from "../../../domain/recurrence/RecurrenceRules.js";
import type { TaskDTO } from "../../dto/TaskDTO.js";
import { toTaskDTO } from "../../dto/TaskDTO.js";
import type { CompleteTaskCommand } from "../../ports/inbound/commands/CompleteTask.js";
import type { RequestContext } from "../../RequestContext.js";
import type { TaskRepo } from "../../ports/outbound/TaskRepo.js";
import type { RecurrenceRuleRepo } from "../../ports/outbound/RecurrenceRuleRepo.js";
import type { IdGenerator } from "../../ports/outbound/IdGenerator.js";
import type { Clock } from "../../../domain/shared/Clock.js";
import type { EventBus } from "../../ports/outbound/EventBus.js";
import type { TaskCompleted, TaskCreated } from "../../../domain/task/TaskEvents.js";
import type { DomainEvent } from "../../../domain/shared/DomainEvent.js";

export type CompleteTaskError = TaskStateError | NotFoundError;

export class CompleteTaskHandler {
  private readonly taskRepo: TaskRepo;
  private readonly recurrenceRuleRepo: RecurrenceRuleRepo;
  private readonly idGenerator: IdGenerator;
  private readonly clock: Clock;
  private readonly eventBus: EventBus;

  constructor(
    taskRepo: TaskRepo,
    recurrenceRuleRepo: RecurrenceRuleRepo,
    idGenerator: IdGenerator,
    clock: Clock,
    eventBus: EventBus,
  ) {
    this.taskRepo = taskRepo;
    this.recurrenceRuleRepo = recurrenceRuleRepo;
    this.idGenerator = idGenerator;
    this.clock = clock;
    this.eventBus = eventBus;
  }

  async execute(cmd: CompleteTaskCommand, ctx: RequestContext): Promise<Result<TaskDTO, CompleteTaskError>> {
    // --- GATHER ---
    const existing = await this.taskRepo.findById(cmd.taskId);
    if (existing === null || existing.workspaceId !== ctx.workspaceId) {
      return err({ type: "NotFoundError", entity: "Task", id: cmd.taskId });
    }

    const rule = existing.recurrenceRuleId !== null
      ? await this.recurrenceRuleRepo.findById(existing.recurrenceRuleId)
      : null;

    // --- DECIDE ---
    const now = this.clock.now();
    const result = completeTask(existing, now);
    if (!result.ok) return result;

    const tasksToSave: Task[] = [result.value];
    const events: DomainEvent[] = [];

    const completedEvent: TaskCompleted = {
      type: "TaskCompleted",
      taskId: result.value.id,
      completedAt: now,
      occurredAt: now,
    };
    events.push(completedEvent);

    if (rule !== null) {
      const nextParams = buildNextRecurringTask({
        completedTask: existing,
        rule,
        nextTaskId: this.idGenerator.taskId(),
        completedAt: now,
      });

      if (nextParams !== null) {
        const nextResult = createTask(nextParams);
        if (nextResult.ok) {
          tasksToSave.push(nextResult.value);
          const nextEvent: TaskCreated = {
            type: "TaskCreated",
            taskId: nextResult.value.id,
            title: nextResult.value.title,
            workspaceId: nextResult.value.workspaceId,
            ownerUserId: nextResult.value.ownerUserId,
            projectId: nextResult.value.projectId,
            occurredAt: now,
          };
          events.push(nextEvent);
        }
      }
    }

    // --- ACT ---
    await this.taskRepo.saveAll(tasksToSave);

    for (const event of events) {
      await this.eventBus.publish(event);
    }

    return { ok: true, value: toTaskDTO(result.value) };
  }
}
