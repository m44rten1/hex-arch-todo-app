import type { Clock } from "@todo/core/domain/shared/index.js";

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
