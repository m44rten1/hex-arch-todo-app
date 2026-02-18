import { describe, it, expect } from "vitest";
import {
  createTask,
  completeTask,
  uncompleteTask,
  cancelTask,
  updateTask,
  isOverdue,
  isDueOn,
  canTransition,
} from "../../src/domain/task/TaskRules.js";
import type { Task } from "../../src/domain/task/Task.js";
import { taskId, userId, workspaceId } from "../../src/domain/shared/Id.js";

const NOW = new Date("2025-06-15T10:00:00Z");

const BASE_PARAMS = {
  id: taskId("task-1"),
  title: "Buy groceries",
  now: NOW,
  userId: userId("user-1"),
  workspaceId: workspaceId("ws-1"),
} as const;

function activeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: taskId("task-1"),
    title: "Buy groceries",
    status: "active",
    notes: null,
    projectId: null,
    dueAt: null,
    completedAt: null,
    deletedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ownerUserId: userId("user-1"),
    workspaceId: workspaceId("ws-1"),
    ...overrides,
  };
}

describe("createTask", () => {
  it("creates a valid active task", () => {
    const result = createTask(BASE_PARAMS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.title).toBe("Buy groceries");
    expect(result.value.status).toBe("active");
    expect(result.value.completedAt).toBeNull();
  });

  it("trims whitespace from title", () => {
    const result = createTask({ ...BASE_PARAMS, title: "  trimmed  " });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.title).toBe("trimmed");
  });

  it("rejects empty title", () => {
    const result = createTask({ ...BASE_PARAMS, title: "" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.field).toBe("title");
  });

  it("rejects whitespace-only title", () => {
    const result = createTask({ ...BASE_PARAMS, title: "   " });
    expect(result.ok).toBe(false);
  });

  it("rejects title exceeding 200 characters", () => {
    const result = createTask({ ...BASE_PARAMS, title: "a".repeat(201) });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.field).toBe("title");
  });

  it("accepts title of exactly 200 characters", () => {
    const result = createTask({ ...BASE_PARAMS, title: "a".repeat(200) });
    expect(result.ok).toBe(true);
  });

  it("sets optional fields when provided", () => {
    const result = createTask({
      ...BASE_PARAMS,
      notes: "organic only",
      dueAt: new Date("2025-06-16T09:00:00Z"),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.notes).toBe("organic only");
    expect(result.value.dueAt).toEqual(new Date("2025-06-16T09:00:00Z"));
  });
});

describe("completeTask", () => {
  it("completes an active task", () => {
    const result = completeTask(activeTask(), NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe("completed");
    expect(result.value.completedAt).toEqual(NOW);
  });

  it("rejects completing an already completed task", () => {
    const task = activeTask({ status: "completed", completedAt: NOW });
    const result = completeTask(task, NOW);
    expect(result.ok).toBe(false);
  });

  it("rejects completing a canceled task", () => {
    const task = activeTask({ status: "canceled" });
    const result = completeTask(task, NOW);
    expect(result.ok).toBe(false);
  });
});

describe("uncompleteTask", () => {
  it("uncompletes a completed task", () => {
    const task = activeTask({ status: "completed", completedAt: NOW });
    const result = uncompleteTask(task, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe("active");
    expect(result.value.completedAt).toBeNull();
  });

  it("rejects uncompleting an active task", () => {
    const result = uncompleteTask(activeTask(), NOW);
    expect(result.ok).toBe(false);
  });
});

describe("cancelTask", () => {
  it("cancels an active task", () => {
    const result = cancelTask(activeTask(), NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe("canceled");
  });

  it("cancels a completed task", () => {
    const task = activeTask({ status: "completed", completedAt: NOW });
    const result = cancelTask(task, NOW);
    expect(result.ok).toBe(true);
  });

  it("rejects canceling an already canceled task", () => {
    const task = activeTask({ status: "canceled" });
    const result = cancelTask(task, NOW);
    expect(result.ok).toBe(false);
  });
});

describe("updateTask", () => {
  it("updates title", () => {
    const later = new Date("2025-06-15T11:00:00Z");
    const result = updateTask(activeTask(), { title: "New title", now: later });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.title).toBe("New title");
    expect(result.value.updatedAt).toEqual(later);
  });

  it("rejects invalid title on update", () => {
    const result = updateTask(activeTask(), { title: "", now: NOW });
    expect(result.ok).toBe(false);
  });

  it("clears optional fields with null", () => {
    const task = activeTask({ notes: "some notes", dueAt: new Date() });
    const result = updateTask(task, { notes: null, dueAt: null, now: NOW });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.notes).toBeNull();
    expect(result.value.dueAt).toBeNull();
  });
});

describe("isOverdue", () => {
  it("returns true when due date is in the past", () => {
    const task = activeTask({ dueAt: new Date("2025-06-14T10:00:00Z") });
    expect(isOverdue(task, NOW)).toBe(true);
  });

  it("returns false when no due date", () => {
    expect(isOverdue(activeTask(), NOW)).toBe(false);
  });

  it("returns false for completed tasks", () => {
    const task = activeTask({ status: "completed", dueAt: new Date("2025-06-14T10:00:00Z") });
    expect(isOverdue(task, NOW)).toBe(false);
  });
});

describe("isDueOn", () => {
  it("returns true when due on the given date", () => {
    const task = activeTask({ dueAt: new Date("2025-06-15T23:59:59Z") });
    expect(isDueOn(task, new Date("2025-06-15T00:00:00Z"))).toBe(true);
  });

  it("returns false when due on a different date", () => {
    const task = activeTask({ dueAt: new Date("2025-06-16T10:00:00Z") });
    expect(isDueOn(task, new Date("2025-06-15T00:00:00Z"))).toBe(false);
  });
});

describe("canTransition", () => {
  it("allows active -> completed", () => expect(canTransition("active", "completed")).toBe(true));
  it("allows active -> canceled", () => expect(canTransition("active", "canceled")).toBe(true));
  it("allows completed -> active", () => expect(canTransition("completed", "active")).toBe(true));
  it("disallows completed -> canceled", () => expect(canTransition("completed", "canceled")).toBe(false));
  it("allows canceled -> active", () => expect(canTransition("canceled", "active")).toBe(true));
});
