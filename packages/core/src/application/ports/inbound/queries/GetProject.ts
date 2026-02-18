import type { ProjectId } from "../../../../domain/shared/index.js";

export interface GetProjectQuery {
  readonly type: "GetProject";
  readonly projectId: ProjectId;
}
