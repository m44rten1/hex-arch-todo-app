import type { DomainEvent, RecurrenceRuleId, TaskId } from "../shared/index.js";

export interface RecurrenceRuleSet extends DomainEvent {
  readonly type: "RecurrenceRuleSet";
  readonly recurrenceRuleId: RecurrenceRuleId;
  readonly taskId: TaskId;
}

export interface RecurrenceRuleRemoved extends DomainEvent {
  readonly type: "RecurrenceRuleRemoved";
  readonly recurrenceRuleId: RecurrenceRuleId;
  readonly taskId: TaskId;
}

export type RecurrenceEvent = RecurrenceRuleSet | RecurrenceRuleRemoved;
