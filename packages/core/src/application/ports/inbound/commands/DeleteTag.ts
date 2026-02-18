import type { TagId } from "../../../../domain/shared/index.js";

export interface DeleteTagCommand {
  readonly tagId: TagId;
}
