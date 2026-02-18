import type { ProjectId } from "../../../../domain/shared/index.js";

export interface UpdateProjectCommand {
  readonly projectId: ProjectId;
  readonly name?: string;
  readonly color?: string | null;
}
