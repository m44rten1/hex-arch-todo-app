import type { Result, NotFoundError } from "../../../domain/shared/index.js";
import { err } from "../../../domain/shared/index.js";
import { createReminder } from "../../../domain/reminder/ReminderRules.js";
import type { ReminderValidationError } from "../../../domain/reminder/ReminderRules.js";
import type { ReminderDTO } from "../../dto/ReminderDTO.js";
import { toReminderDTO } from "../../dto/ReminderDTO.js";
import type { CreateReminderCommand } from "../../ports/inbound/commands/CreateReminder.js";
import type { RequestContext } from "../../RequestContext.js";
import type { TaskRepo } from "../../ports/outbound/TaskRepo.js";
import type { ReminderRepo } from "../../ports/outbound/ReminderRepo.js";
import type { IdGenerator } from "../../ports/outbound/IdGenerator.js";
import type { Clock } from "../../../domain/shared/Clock.js";
import type { EventBus } from "../../ports/outbound/EventBus.js";
import type { ReminderCreated } from "../../../domain/reminder/ReminderEvents.js";

export type CreateReminderError = ReminderValidationError | NotFoundError;

export class CreateReminderHandler {
  private readonly taskRepo: TaskRepo;
  private readonly reminderRepo: ReminderRepo;
  private readonly idGenerator: IdGenerator;
  private readonly clock: Clock;
  private readonly eventBus: EventBus;

  constructor(
    taskRepo: TaskRepo,
    reminderRepo: ReminderRepo,
    idGenerator: IdGenerator,
    clock: Clock,
    eventBus: EventBus,
  ) {
    this.taskRepo = taskRepo;
    this.reminderRepo = reminderRepo;
    this.idGenerator = idGenerator;
    this.clock = clock;
    this.eventBus = eventBus;
  }

  async execute(
    cmd: CreateReminderCommand,
    ctx: RequestContext,
  ): Promise<Result<ReminderDTO, CreateReminderError>> {
    const task = await this.taskRepo.findById(cmd.taskId);
    if (task === null || task.workspaceId !== ctx.workspaceId) {
      return err({ type: "NotFoundError", entity: "Task", id: cmd.taskId });
    }

    const now = this.clock.now();
    const result = createReminder({
      id: this.idGenerator.reminderId(),
      taskId: cmd.taskId,
      workspaceId: ctx.workspaceId,
      remindAt: cmd.remindAt,
      now,
    });

    if (!result.ok) return result;

    await this.reminderRepo.save(result.value);

    const event: ReminderCreated = {
      type: "ReminderCreated",
      reminderId: result.value.id,
      taskId: result.value.taskId,
      remindAt: result.value.remindAt,
      occurredAt: now,
    };
    await this.eventBus.publish(event);

    return { ok: true, value: toReminderDTO(result.value) };
  }
}
