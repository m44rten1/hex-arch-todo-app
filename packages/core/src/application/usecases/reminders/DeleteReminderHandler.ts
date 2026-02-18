import type { Result, NotFoundError } from "../../../domain/shared/index.js";
import { ok, err } from "../../../domain/shared/index.js";
import type { DeleteReminderCommand } from "../../ports/inbound/commands/DeleteReminder.js";
import type { RequestContext } from "../../RequestContext.js";
import type { ReminderRepo } from "../../ports/outbound/ReminderRepo.js";

export class DeleteReminderHandler {
  private readonly reminderRepo: ReminderRepo;

  constructor(reminderRepo: ReminderRepo) {
    this.reminderRepo = reminderRepo;
  }

  async execute(
    cmd: DeleteReminderCommand,
    ctx: RequestContext,
  ): Promise<Result<void, NotFoundError>> {
    const existing = await this.reminderRepo.findById(cmd.reminderId);
    if (existing === null || existing.workspaceId !== ctx.workspaceId) {
      return err({ type: "NotFoundError", entity: "Reminder", id: cmd.reminderId });
    }

    await this.reminderRepo.delete(cmd.reminderId);

    return ok(undefined);
  }
}
