import type { RecurrenceRuleDTO } from "../../dto/RecurrenceRuleDTO.js";
import { toRecurrenceRuleDTO } from "../../dto/RecurrenceRuleDTO.js";
import type { TaskId } from "../../../domain/shared/index.js";
import type { RequestContext } from "../../RequestContext.js";
import type { TaskRepo } from "../../ports/outbound/TaskRepo.js";
import type { RecurrenceRuleRepo } from "../../ports/outbound/RecurrenceRuleRepo.js";

export class GetTaskRecurrenceHandler {
  private readonly taskRepo: TaskRepo;
  private readonly recurrenceRuleRepo: RecurrenceRuleRepo;

  constructor(taskRepo: TaskRepo, recurrenceRuleRepo: RecurrenceRuleRepo) {
    this.taskRepo = taskRepo;
    this.recurrenceRuleRepo = recurrenceRuleRepo;
  }

  async execute(taskId: TaskId, ctx: RequestContext): Promise<RecurrenceRuleDTO | null> {
    const task = await this.taskRepo.findById(taskId);
    if (task === null || task.workspaceId !== ctx.workspaceId) {
      return null;
    }

    if (task.recurrenceRuleId === null) {
      return null;
    }

    const rule = await this.recurrenceRuleRepo.findById(task.recurrenceRuleId);
    return rule ? toRecurrenceRuleDTO(rule) : null;
  }
}
