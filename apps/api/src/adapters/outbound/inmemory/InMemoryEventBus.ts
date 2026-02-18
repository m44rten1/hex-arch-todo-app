import type { DomainEvent } from "@todo/core/domain/shared/index.js";
import type { EventBus } from "@todo/core/application/ports/outbound/EventBus.js";

export class InMemoryEventBus implements EventBus {
  readonly published: DomainEvent[] = [];

  async publish(event: DomainEvent): Promise<void> {
    this.published.push(event);
  }

  clear(): void {
    this.published.length = 0;
  }
}
