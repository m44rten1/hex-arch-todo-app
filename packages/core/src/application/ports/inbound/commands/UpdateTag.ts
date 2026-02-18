import type { TagId } from "../../../../domain/shared/index.js";

export interface UpdateTagCommand {
  readonly tagId: TagId;
  readonly name?: string;
  readonly color?: string | null;
}
