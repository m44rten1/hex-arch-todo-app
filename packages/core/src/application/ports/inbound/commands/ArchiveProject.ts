import type { ProjectId } from "../../../../domain/shared/index.js";

export interface ArchiveProjectCommand {
  readonly projectId: ProjectId;
}
