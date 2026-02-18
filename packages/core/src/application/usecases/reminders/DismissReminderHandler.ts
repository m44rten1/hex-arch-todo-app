import type { Result, NotFoundError } from "../../../domain/shared/index.js";
import { err } from "../../../domain/shared/index.js";
import { dismissReminder } from "../../../domain/reminder/ReminderRules.js";
import type { ReminderStateError } from "../../../domain/reminder/ReminderRules.js";
import type { ReminderDTO } from "../../dto/ReminderDTO.js";
import { toReminderDTO } from "../../dto/ReminderDTO.js";
import type { DismissReminderCommand } from "../../ports/inbound/commands/DismissReminder.js";
import type { RequestContext } from "../../RequestContext.js";
import type { ReminderRepo } from "../../ports/outbound/ReminderRepo.js";
import type { Clock } from "../../../domain/shared/Clock.js";
import type { EventBus } from "../../ports/outbound/EventBus.js";
import type { ReminderDismissed } from "../../../domain/reminder/ReminderEvents.js";

export type DismissReminderError = ReminderStateError | NotFoundError;

export class DismissReminderHandler {
  private readonly reminderRepo: ReminderRepo;
  private readonly clock: Clock;
  private readonly eventBus: EventBus;

  constructor(reminderRepo: ReminderRepo, clock: Clock, eventBus: EventBus) {
    this.reminderRepo = reminderRepo;
    this.clock = clock;
    this.eventBus = eventBus;
  }

  async execute(
    cmd: DismissReminderCommand,
    ctx: RequestContext,
  ): Promise<Result<ReminderDTO, DismissReminderError>> {
    const existing = await this.reminderRepo.findById(cmd.reminderId);
    if (existing === null || existing.workspaceId !== ctx.workspaceId) {
      return err({ type: "NotFoundError", entity: "Reminder", id: cmd.reminderId });
    }

    const now = this.clock.now();
    const result = dismissReminder(existing, now);
    if (!result.ok) return result;

    await this.reminderRepo.save(result.value);

    const event: ReminderDismissed = {
      type: "ReminderDismissed",
      reminderId: result.value.id,
      taskId: result.value.taskId,
      occurredAt: now,
    };
    await this.eventBus.publish(event);

    return { ok: true, value: toReminderDTO(result.value) };
  }
}
