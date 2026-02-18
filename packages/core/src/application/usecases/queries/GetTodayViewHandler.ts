import type { Clock } from "../../../domain/shared/Clock.js";
import { isOverdue, isDueOn } from "../../../domain/task/TaskRules.js";
import type { TaskRepo } from "../../ports/outbound/TaskRepo.js";
import type { TodayViewDTO } from "../../dto/TodayViewDTO.js";
import { toTaskDTO } from "../../dto/TaskDTO.js";
import type { RequestContext } from "../../RequestContext.js";

export class GetTodayViewHandler {
  private readonly taskRepo: TaskRepo;
  private readonly clock: Clock;

  constructor(taskRepo: TaskRepo, clock: Clock) {
    this.taskRepo = taskRepo;
    this.clock = clock;
  }

  async execute(ctx: RequestContext): Promise<TodayViewDTO> {
    const now = this.clock.now();
    const endOfToday = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23, 59, 59, 999,
    ));

    const tasks = await this.taskRepo.findDueOnOrBefore(ctx.workspaceId, endOfToday);

    const overdue = tasks.filter(t => isOverdue(t, now) && !isDueOn(t, now));
    const dueToday = tasks.filter(t => isDueOn(t, now));

    return {
      overdue: overdue.map(toTaskDTO),
      dueToday: dueToday.map(toTaskDTO),
    };
  }
}
