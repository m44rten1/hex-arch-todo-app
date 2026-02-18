import type { Clock } from "../../../domain/shared/Clock.js";
import type { TaskRepo } from "../../ports/outbound/TaskRepo.js";
import type { UpcomingViewDTO, UpcomingDayGroup } from "../../dto/UpcomingViewDTO.js";
import { toTaskDTO } from "../../dto/TaskDTO.js";
import type { RequestContext } from "../../RequestContext.js";

const ALLOWED_DAYS = [7, 14, 30] as const;
export type UpcomingDays = (typeof ALLOWED_DAYS)[number];

export function isAllowedDays(n: number): n is UpcomingDays {
  return (ALLOWED_DAYS as readonly number[]).includes(n);
}

function toUtcDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export class GetUpcomingViewHandler {
  private readonly taskRepo: TaskRepo;
  private readonly clock: Clock;

  constructor(taskRepo: TaskRepo, clock: Clock) {
    this.taskRepo = taskRepo;
    this.clock = clock;
  }

  async execute(ctx: RequestContext, days: UpcomingDays = 7): Promise<UpcomingViewDTO> {
    const now = this.clock.now();

    const startOfToday = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    ));

    const endOfWindow = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + days,
      23, 59, 59, 999,
    ));

    const tasks = await this.taskRepo.findDueBetween(ctx.workspaceId, startOfToday, endOfWindow);

    const byDate = new Map<string, ReturnType<typeof toTaskDTO>[]>();
    for (const task of tasks) {
      const key = toUtcDateString(task.dueAt!);
      let group = byDate.get(key);
      if (!group) {
        group = [];
        byDate.set(key, group);
      }
      group.push(toTaskDTO(task));
    }

    const groups: UpcomingDayGroup[] = [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, groupTasks]) => ({ date, tasks: groupTasks }));

    return { days, groups };
  }
}
