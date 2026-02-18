import type { ProjectId } from "../../../../domain/shared/index.js";

export interface UnarchiveProjectCommand {
  readonly projectId: ProjectId;
}
