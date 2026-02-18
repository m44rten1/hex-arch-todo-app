import type { ProcessDueRemindersHandler } from "@todo/core/application/usecases/reminders/ProcessDueRemindersHandler.js";

const DEFAULT_INTERVAL_MS = 60_000;

export class ReminderScheduler {
  private readonly handler: ProcessDueRemindersHandler;
  private readonly intervalMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(handler: ProcessDueRemindersHandler, intervalMs = DEFAULT_INTERVAL_MS) {
    this.handler = handler;
    this.intervalMs = intervalMs;
  }

  start(): void {
    if (this.timer !== null) return;

    this.timer = setInterval(() => {
      this.handler.execute().catch((error: unknown) => {
        console.error("[ReminderScheduler] Failed to process due reminders:", error);
      });
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
