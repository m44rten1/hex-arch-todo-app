import type { RecurrenceRuleDTO } from "../../dto/RecurrenceRuleDTO.js";
import { toRecurrenceRuleDTO } from "../../dto/RecurrenceRuleDTO.js";
import type { TaskId, NotFoundError, Result } from "../../../domain/shared/index.js";
import { ok, err } from "../../../domain/shared/index.js";
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

  async execute(taskId: TaskId, ctx: RequestContext): Promise<Result<RecurrenceRuleDTO, NotFoundError>> {
    const notFound: NotFoundError = { type: "NotFoundError", entity: "RecurrenceRule", id: taskId };

    const task = await this.taskRepo.findById(taskId);
    if (task === null || task.workspaceId !== ctx.workspaceId) {
      return err(notFound);
    }

    if (task.recurrenceRuleId === null) {
      return err(notFound);
    }

    const rule = await this.recurrenceRuleRepo.findById(task.recurrenceRuleId);
    if (!rule) {
      return err(notFound);
    }

    return ok(toRecurrenceRuleDTO(rule));
  }
}
