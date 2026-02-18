import type { Result, NotFoundError } from "../../../domain/shared/index.js";
import { err } from "../../../domain/shared/index.js";
import { updateReminderTime } from "../../../domain/reminder/ReminderRules.js";
import type { ReminderValidationError, ReminderStateError } from "../../../domain/reminder/ReminderRules.js";
import type { ReminderDTO } from "../../dto/ReminderDTO.js";
import { toReminderDTO } from "../../dto/ReminderDTO.js";
import type { UpdateReminderCommand } from "../../ports/inbound/commands/UpdateReminder.js";
import type { RequestContext } from "../../RequestContext.js";
import type { ReminderRepo } from "../../ports/outbound/ReminderRepo.js";
import type { Clock } from "../../../domain/shared/Clock.js";

export type UpdateReminderError = ReminderValidationError | ReminderStateError | NotFoundError;

export class UpdateReminderHandler {
  private readonly reminderRepo: ReminderRepo;
  private readonly clock: Clock;

  constructor(reminderRepo: ReminderRepo, clock: Clock) {
    this.reminderRepo = reminderRepo;
    this.clock = clock;
  }

  async execute(
    cmd: UpdateReminderCommand,
    ctx: RequestContext,
  ): Promise<Result<ReminderDTO, UpdateReminderError>> {
    const existing = await this.reminderRepo.findById(cmd.reminderId);
    if (existing === null || existing.workspaceId !== ctx.workspaceId) {
      return err({ type: "NotFoundError", entity: "Reminder", id: cmd.reminderId });
    }

    const now = this.clock.now();
    const result = updateReminderTime(existing, cmd.remindAt, now);
    if (!result.ok) return result;

    await this.reminderRepo.save(result.value);

    return { ok: true, value: toReminderDTO(result.value) };
  }
}
