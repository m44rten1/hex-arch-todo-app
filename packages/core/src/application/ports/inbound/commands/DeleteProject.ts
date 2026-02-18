import type { ProjectId } from "../../../../domain/shared/index.js";

export interface DeleteProjectCommand {
  readonly projectId: ProjectId;
}
