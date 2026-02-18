import type { Result } from "../../../domain/shared/index.js";
import { ok, err } from "../../../domain/shared/index.js";
import type { ValidationError } from "../../../domain/shared/index.js";
import { projectId, tagId } from "../../../domain/shared/index.js";
import { isTaskStatus } from "../../../domain/task/TaskRules.js";
import type { SearchIndex, TaskSearchFilters } from "../../ports/outbound/SearchIndex.js";
import type { SearchTasksQuery } from "../../ports/inbound/queries/SearchTasks.js";
import type { TaskDTO } from "../../dto/TaskDTO.js";
import { toTaskDTO } from "../../dto/TaskDTO.js";
import type { RequestContext } from "../../RequestContext.js";

export class SearchTasksHandler {
  private readonly searchIndex: SearchIndex;

  constructor(searchIndex: SearchIndex) {
    this.searchIndex = searchIndex;
  }

  async execute(
    query: SearchTasksQuery,
    ctx: RequestContext,
  ): Promise<Result<readonly TaskDTO[], ValidationError>> {
    const q = query.q.trim();
    if (q.length === 0) {
      return err({ type: "ValidationError", field: "q", message: "Search query cannot be empty" });
    }

    const filters: TaskSearchFilters = {
      projectId: query.projectId ? projectId(query.projectId) : undefined,
      tagIds: query.tagIds?.map(id => tagId(id)),
      status: query.status && isTaskStatus(query.status) ? query.status : undefined,
      dueBefore: query.dueBefore ? new Date(query.dueBefore) : undefined,
      dueAfter: query.dueAfter ? new Date(query.dueAfter) : undefined,
    };

    const tasks = await this.searchIndex.searchTasks(ctx.workspaceId, q, filters);
    return ok(tasks.map(toTaskDTO));
  }
}
