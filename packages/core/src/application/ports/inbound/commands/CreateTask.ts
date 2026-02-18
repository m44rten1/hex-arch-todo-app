import type { ProjectId } from "../../../../domain/shared/index.js";

export interface CreateTaskCommand {
  readonly title: string;
  readonly projectId?: ProjectId;
  readonly dueAt?: Date;
  readonly notes?: string;
}
