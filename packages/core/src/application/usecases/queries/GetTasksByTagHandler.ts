import type { TagId } from "../../../domain/shared/index.js";
import type { TaskRepo } from "../../ports/outbound/TaskRepo.js";
import type { TaskDTO } from "../../dto/TaskDTO.js";
import { toTaskDTO } from "../../dto/TaskDTO.js";
import type { RequestContext } from "../../RequestContext.js";

export class GetTasksByTagHandler {
  private readonly taskRepo: TaskRepo;

  constructor(taskRepo: TaskRepo) {
    this.taskRepo = taskRepo;
  }

  async execute(tId: TagId, ctx: RequestContext): Promise<readonly TaskDTO[]> {
    const tasks = await this.taskRepo.findByTag(tId, ctx.workspaceId);
    return tasks.map(toTaskDTO);
  }
}
