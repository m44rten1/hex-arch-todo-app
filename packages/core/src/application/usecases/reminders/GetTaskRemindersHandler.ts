import type { ReminderDTO } from "../../dto/ReminderDTO.js";
import { toReminderDTO } from "../../dto/ReminderDTO.js";
import type { RequestContext } from "../../RequestContext.js";
import type { ReminderRepo } from "../../ports/outbound/ReminderRepo.js";
import type { TaskId } from "../../../domain/shared/index.js";

export class GetTaskRemindersHandler {
  private readonly reminderRepo: ReminderRepo;

  constructor(reminderRepo: ReminderRepo) {
    this.reminderRepo = reminderRepo;
  }

  async execute(taskId: TaskId, ctx: RequestContext): Promise<readonly ReminderDTO[]> {
    const reminders = await this.reminderRepo.findByTask(taskId, ctx.workspaceId);
    return reminders.map(toReminderDTO);
  }
}
