import type { RecurrenceRuleId, TaskId, Result, ValidationError } from "../shared/index.js";
import { ok, err } from "../shared/index.js";
import type { RecurrenceRule, RecurrenceFrequency, RecurrenceMode } from "./RecurrenceRule.js";
import type { Task } from "../task/Task.js";
import type { CreateTaskParams } from "../task/TaskRules.js";

export type RecurrenceValidationError = ValidationError;

export interface CreateRecurrenceRuleParams {
  readonly id: RecurrenceRuleId;
  readonly frequency: RecurrenceFrequency;
  readonly interval?: number;
  readonly daysOfWeek?: readonly number[];
  readonly dayOfMonth?: number;
  readonly mode?: RecurrenceMode;
  readonly now: Date;
}

export function createRecurrenceRule(
  params: CreateRecurrenceRuleParams,
): Result<RecurrenceRule, RecurrenceValidationError> {
  const interval = params.interval ?? 1;

  if (interval < 1 || !Number.isInteger(interval)) {
    return err({ type: "ValidationError", field: "interval", message: "Interval must be a positive integer" });
  }

  if (params.daysOfWeek !== undefined) {
    if (params.daysOfWeek.length === 0) {
      return err({ type: "ValidationError", field: "daysOfWeek", message: "daysOfWeek must not be empty when provided" });
    }
    for (const d of params.daysOfWeek) {
      if (d < 0 || d > 6 || !Number.isInteger(d)) {
        return err({ type: "ValidationError", field: "daysOfWeek", message: "daysOfWeek values must be integers 0-6" });
      }
    }
  }

  if (params.dayOfMonth !== undefined) {
    if (params.dayOfMonth < 1 || params.dayOfMonth > 31 || !Number.isInteger(params.dayOfMonth)) {
      return err({ type: "ValidationError", field: "dayOfMonth", message: "dayOfMonth must be an integer 1-31" });
    }
  }

  return ok({
    id: params.id,
    frequency: params.frequency,
    interval,
    daysOfWeek: params.daysOfWeek ? [...params.daysOfWeek].sort() : null,
    dayOfMonth: params.dayOfMonth ?? null,
    mode: params.mode ?? "fixedSchedule",
    createdAt: params.now,
    updatedAt: params.now,
  });
}

export function computeNextDueDate(
  rule: RecurrenceRule,
  currentDueDate: Date | null,
  completedAt: Date,
): Date {
  const base =
    rule.mode === "fixedSchedule" && currentDueDate !== null
      ? currentDueDate
      : completedAt;

  switch (rule.frequency) {
    case "daily":
      return addDays(base, rule.interval);
    case "weekly":
      return nextWeeklyOccurrence(rule, base);
    case "monthly":
      return nextMonthlyOccurrence(rule, base);
  }
}

export interface BuildNextRecurringTaskParams {
  readonly completedTask: Task;
  readonly rule: RecurrenceRule;
  readonly nextTaskId: TaskId;
  readonly completedAt: Date;
}

export function buildNextRecurringTask(
  params: BuildNextRecurringTaskParams,
): CreateTaskParams | null {
  const { completedTask, rule, nextTaskId, completedAt } = params;
  const nextDue = computeNextDueDate(rule, completedTask.dueAt, completedAt);

  return {
    id: nextTaskId,
    title: completedTask.title,
    now: completedAt,
    userId: completedTask.ownerUserId,
    workspaceId: completedTask.workspaceId,
    projectId: completedTask.projectId ?? undefined,
    dueAt: nextDue,
    notes: completedTask.notes ?? undefined,
    tagIds: completedTask.tagIds,
    recurrenceRuleId: completedTask.recurrenceRuleId ?? undefined,
  };
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function nextWeeklyOccurrence(rule: RecurrenceRule, base: Date): Date {
  if (rule.daysOfWeek === null || rule.daysOfWeek.length === 0) {
    return addDays(base, 7 * rule.interval);
  }

  const baseDay = base.getUTCDay();
  const sorted = [...rule.daysOfWeek].sort((a, b) => a - b);

  const nextInWeek = sorted.find(d => d > baseDay);
  if (nextInWeek !== undefined) {
    return addDays(base, nextInWeek - baseDay);
  }

  const daysUntilFirstDay = 7 - baseDay + sorted[0]!;
  const extraWeeks = (rule.interval - 1) * 7;
  return addDays(base, daysUntilFirstDay + extraWeeks);
}

function nextMonthlyOccurrence(rule: RecurrenceRule, base: Date): Date {
  const targetDay = rule.dayOfMonth ?? base.getUTCDate();
  const targetMonth = base.getUTCMonth() + rule.interval;
  const result = new Date(base);
  result.setUTCDate(1);
  result.setUTCMonth(targetMonth);

  const maxDay = daysInMonth(result.getUTCFullYear(), result.getUTCMonth());
  result.setUTCDate(Math.min(targetDay, maxDay));

  return result;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}
