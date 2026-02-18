import type { DomainEvent } from "../../../domain/shared/index.js";

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
}
