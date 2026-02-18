import type { Clock } from "@todo/core/domain/shared/index.js";

export class StubClock implements Clock {
  private current: Date;

  constructor(fixed: Date) {
    this.current = fixed;
  }

  now(): Date {
    return this.current;
  }

  set(date: Date): void {
    this.current = date;
  }

  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}
