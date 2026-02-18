import type { ReminderId } from "../../../../domain/shared/index.js";

export interface DismissReminderCommand {
  readonly reminderId: ReminderId;
}
