import type { ReminderId } from "../../../../domain/shared/index.js";

export interface UpdateReminderCommand {
  readonly reminderId: ReminderId;
  readonly remindAt: Date;
}
