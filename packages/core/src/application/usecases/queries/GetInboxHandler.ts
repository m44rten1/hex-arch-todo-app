import type { TaskRepo } from "../../ports/outbound/TaskRepo.js";
import type { TaskDTO } from "../../dto/TaskDTO.js";
import { toTaskDTO } from "../../dto/TaskDTO.js";
import type { RequestContext } from "../../RequestContext.js";

export class GetInboxHandler {
  private readonly taskRepo: TaskRepo;

  constructor(taskRepo: TaskRepo) {
    this.taskRepo = taskRepo;
  }

  async execute(ctx: RequestContext): Promise<readonly TaskDTO[]> {
    const tasks = await this.taskRepo.findInbox(ctx.workspaceId);
    return tasks.map(toTaskDTO);
  }
}
