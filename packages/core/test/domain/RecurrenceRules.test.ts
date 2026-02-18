import { describe, it, expect } from "vitest";
import { createRecurrenceRule, computeNextDueDate } from "../../src/domain/recurrence/RecurrenceRules.js";
import type { RecurrenceRule } from "../../src/domain/recurrence/RecurrenceRule.js";
import { recurrenceRuleId } from "../../src/domain/shared/index.js";

const NOW = new Date("2025-06-15T10:00:00Z");
const ID = recurrenceRuleId("rule-1");

function makeRule(overrides: Partial<RecurrenceRule> & Pick<RecurrenceRule, "frequency">): RecurrenceRule {
  return {
    id: ID,
    interval: 1,
    daysOfWeek: null,
    dayOfMonth: null,
    mode: "fixedSchedule",
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe("createRecurrenceRule", () => {
  it("creates a valid daily rule with defaults", () => {
    const result = createRecurrenceRule({ id: ID, frequency: "daily", now: NOW });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.frequency).toBe("daily");
    expect(result.value.interval).toBe(1);
    expect(result.value.mode).toBe("fixedSchedule");
    expect(result.value.daysOfWeek).toBeNull();
    expect(result.value.dayOfMonth).toBeNull();
  });

  it("rejects interval < 1", () => {
    const result = createRecurrenceRule({ id: ID, frequency: "daily", interval: 0, now: NOW });
    expect(result.ok).toBe(false);
  });

  it("rejects non-integer interval", () => {
    const result = createRecurrenceRule({ id: ID, frequency: "daily", interval: 1.5, now: NOW });
    expect(result.ok).toBe(false);
  });

  it("rejects empty daysOfWeek array", () => {
    const result = createRecurrenceRule({ id: ID, frequency: "weekly", daysOfWeek: [], now: NOW });
    expect(result.ok).toBe(false);
  });

  it("rejects invalid day of week value", () => {
    const result = createRecurrenceRule({ id: ID, frequency: "weekly", daysOfWeek: [7], now: NOW });
    expect(result.ok).toBe(false);
  });

  it("rejects dayOfMonth out of range", () => {
    const r1 = createRecurrenceRule({ id: ID, frequency: "monthly", dayOfMonth: 0, now: NOW });
    expect(r1.ok).toBe(false);
    const r2 = createRecurrenceRule({ id: ID, frequency: "monthly", dayOfMonth: 32, now: NOW });
    expect(r2.ok).toBe(false);
  });

  it("sorts daysOfWeek", () => {
    const result = createRecurrenceRule({ id: ID, frequency: "weekly", daysOfWeek: [5, 1, 3], now: NOW });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.daysOfWeek).toEqual([1, 3, 5]);
  });
});

describe("computeNextDueDate", () => {
  describe("daily", () => {
    it("advances by interval days (fixedSchedule)", () => {
      const rule = makeRule({ frequency: "daily", interval: 1 });
      const dueAt = new Date("2025-06-15T09:00:00Z");
      const result = computeNextDueDate(rule, dueAt, NOW);
      expect(result).toEqual(new Date("2025-06-16T09:00:00Z"));
    });

    it("advances by multiple days", () => {
      const rule = makeRule({ frequency: "daily", interval: 3 });
      const dueAt = new Date("2025-06-15T09:00:00Z");
      const result = computeNextDueDate(rule, dueAt, NOW);
      expect(result).toEqual(new Date("2025-06-18T09:00:00Z"));
    });

    it("uses completedAt in fromCompletion mode", () => {
      const rule = makeRule({ frequency: "daily", interval: 1, mode: "fromCompletion" });
      const completedAt = new Date("2025-06-16T14:00:00Z");
      const result = computeNextDueDate(rule, new Date("2025-06-15T09:00:00Z"), completedAt);
      expect(result).toEqual(new Date("2025-06-17T14:00:00Z"));
    });

    it("falls back to completedAt when dueAt is null (fixedSchedule)", () => {
      const rule = makeRule({ frequency: "daily", interval: 2 });
      const result = computeNextDueDate(rule, null, NOW);
      expect(result).toEqual(new Date("2025-06-17T10:00:00Z"));
    });
  });

  describe("weekly", () => {
    it("advances by interval weeks when no daysOfWeek", () => {
      const rule = makeRule({ frequency: "weekly", interval: 2 });
      const dueAt = new Date("2025-06-15T09:00:00Z"); // Sunday
      const result = computeNextDueDate(rule, dueAt, NOW);
      expect(result).toEqual(new Date("2025-06-29T09:00:00Z"));
    });

    it("picks next matching day in same week", () => {
      // 2025-06-16 is Monday
      const rule = makeRule({ frequency: "weekly", daysOfWeek: [1, 3, 5] }); // Mon, Wed, Fri
      const dueAt = new Date("2025-06-16T09:00:00Z"); // Monday
      const result = computeNextDueDate(rule, dueAt, NOW);
      // Next matching day after Monday(1) is Wednesday(3) = +2 days
      expect(result).toEqual(new Date("2025-06-18T09:00:00Z"));
    });

    it("wraps to next week when past all days", () => {
      // 2025-06-20 is Friday (day 5)
      const rule = makeRule({ frequency: "weekly", daysOfWeek: [1, 3, 5] }); // Mon, Wed, Fri
      const dueAt = new Date("2025-06-20T09:00:00Z"); // Friday
      const result = computeNextDueDate(rule, dueAt, NOW);
      // Past all days in week (5 is the last). Next is Monday(1) = 2 days + 0 extra weeks
      expect(result).toEqual(new Date("2025-06-23T09:00:00Z"));
    });

    it("skips weeks with interval > 1", () => {
      // 2025-06-21 is Saturday (day 6)
      const rule = makeRule({ frequency: "weekly", interval: 2, daysOfWeek: [1] }); // Mon
      const dueAt = new Date("2025-06-21T09:00:00Z"); // Saturday
      const result = computeNextDueDate(rule, dueAt, NOW);
      // Next Monday(1) from Saturday(6): 2 days + (2-1)*7=7 extra = 9 days
      expect(result).toEqual(new Date("2025-06-30T09:00:00Z"));
    });
  });

  describe("monthly", () => {
    it("advances by interval months", () => {
      const rule = makeRule({ frequency: "monthly", interval: 1, dayOfMonth: 15 });
      const dueAt = new Date("2025-06-15T09:00:00Z");
      const result = computeNextDueDate(rule, dueAt, NOW);
      expect(result).toEqual(new Date("2025-07-15T09:00:00Z"));
    });

    it("clamps dayOfMonth to month length (Jan 31 → Feb 28)", () => {
      const rule = makeRule({ frequency: "monthly", interval: 1, dayOfMonth: 31 });
      const dueAt = new Date("2025-01-31T09:00:00Z");
      const result = computeNextDueDate(rule, dueAt, NOW);
      expect(result).toEqual(new Date("2025-02-28T09:00:00Z"));
    });

    it("uses base date's day when dayOfMonth is null", () => {
      const rule = makeRule({ frequency: "monthly", interval: 1 });
      const dueAt = new Date("2025-06-20T09:00:00Z");
      const result = computeNextDueDate(rule, dueAt, NOW);
      expect(result).toEqual(new Date("2025-07-20T09:00:00Z"));
    });

    it("handles multi-month intervals", () => {
      const rule = makeRule({ frequency: "monthly", interval: 3, dayOfMonth: 10 });
      const dueAt = new Date("2025-06-10T09:00:00Z");
      const result = computeNextDueDate(rule, dueAt, NOW);
      expect(result).toEqual(new Date("2025-09-10T09:00:00Z"));
    });

    it("handles year boundary", () => {
      const rule = makeRule({ frequency: "monthly", interval: 1, dayOfMonth: 15 });
      const dueAt = new Date("2025-12-15T09:00:00Z");
      const result = computeNextDueDate(rule, dueAt, NOW);
      expect(result).toEqual(new Date("2026-01-15T09:00:00Z"));
    });
  });
});
