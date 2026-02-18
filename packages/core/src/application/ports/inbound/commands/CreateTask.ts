import type { ProjectId, TagId } from "../../../../domain/shared/index.js";

export interface CreateTaskCommand {
  readonly title: string;
  readonly projectId?: ProjectId;
  readonly dueAt?: Date;
  readonly notes?: string;
  readonly tagIds?: readonly TagId[];
}
