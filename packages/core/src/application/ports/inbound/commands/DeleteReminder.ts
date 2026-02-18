import type { ReminderId } from "../../../../domain/shared/index.js";

export interface DeleteReminderCommand {
  readonly reminderId: ReminderId;
}
