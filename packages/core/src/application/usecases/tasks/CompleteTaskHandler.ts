import type { Result, NotFoundError } from "../../../domain/shared/index.js";
import { err } from "../../../domain/shared/index.js";
import type { Task } from "../../../domain/task/Task.js";
import { completeTask, createTask } from "../../../domain/task/TaskRules.js";
import type { TaskStateError } from "../../../domain/task/TaskRules.js";
import { computeNextDueDate } from "../../../domain/recurrence/RecurrenceRules.js";
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
    const existing = await this.taskRepo.findById(cmd.taskId);
    if (existing === null || existing.workspaceId !== ctx.workspaceId) {
      return err({ type: "NotFoundError", entity: "Task", id: cmd.taskId });
    }

    const now = this.clock.now();
    const result = completeTask(existing, now);
    if (!result.ok) return result;

    await this.taskRepo.save(result.value);

    const completedEvent: TaskCompleted = {
      type: "TaskCompleted",
      taskId: result.value.id,
      completedAt: now,
      occurredAt: now,
    };
    await this.eventBus.publish(completedEvent);

    if (existing.recurrenceRuleId !== null) {
      await this.advanceRecurrence(existing, now, ctx);
    }

    return { ok: true, value: toTaskDTO(result.value) };
  }

  private async advanceRecurrence(
    completedTask: Task,
    completedAt: Date,
    ctx: RequestContext,
  ): Promise<void> {
    if (completedTask.recurrenceRuleId === null) return;

    const rule = await this.recurrenceRuleRepo.findById(completedTask.recurrenceRuleId);
    if (rule === null) return;

    const nextDue = computeNextDueDate(rule, completedTask.dueAt, completedAt);
    const nextId = this.idGenerator.taskId();

    const nextResult = createTask({
      id: nextId,
      title: completedTask.title,
      now: completedAt,
      userId: completedTask.ownerUserId,
      workspaceId: completedTask.workspaceId,
      projectId: completedTask.projectId ?? undefined,
      dueAt: nextDue,
      notes: completedTask.notes ?? undefined,
      tagIds: completedTask.tagIds,
      recurrenceRuleId: completedTask.recurrenceRuleId,
    });

    if (!nextResult.ok) return;

    await this.taskRepo.save(nextResult.value);

    const createdEvent: TaskCreated = {
      type: "TaskCreated",
      taskId: nextId,
      title: nextResult.value.title,
      workspaceId: ctx.workspaceId,
      ownerUserId: ctx.userId,
      projectId: nextResult.value.projectId,
      occurredAt: completedAt,
    };
    await this.eventBus.publish(createdEvent);
  }
}
