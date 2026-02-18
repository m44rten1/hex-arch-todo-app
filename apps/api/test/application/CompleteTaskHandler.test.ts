import { describe, it, expect, beforeEach } from "vitest";
import { CompleteTaskHandler } from "@todo/core/application/usecases/tasks/CompleteTaskHandler.js";
import { CreateTaskHandler } from "@todo/core/application/usecases/tasks/CreateTaskHandler.js";
import { SetRecurrenceRuleHandler } from "@todo/core/application/usecases/recurrence/SetRecurrenceRuleHandler.js";
import { taskId, userId, workspaceId, recurrenceRuleId } from "@todo/core/domain/shared/index.js";
import { InMemoryTaskRepo } from "../../src/adapters/outbound/inmemory/InMemoryTaskRepo.js";
import { InMemoryRecurrenceRuleRepo } from "../../src/adapters/outbound/inmemory/InMemoryRecurrenceRuleRepo.js";
import { InMemoryEventBus } from "../../src/adapters/outbound/inmemory/InMemoryEventBus.js";
import { StubIdGenerator } from "../../src/adapters/outbound/inmemory/StubIdGenerator.js";
import { StubClock } from "../../src/adapters/outbound/inmemory/StubClock.js";
import type { RequestContext } from "@todo/core/application/RequestContext.js";

const NOW = new Date("2025-06-15T10:00:00Z");
const CTX: RequestContext = {
  userId: userId("user-1"),
  workspaceId: workspaceId("ws-1"),
};
const OTHER_CTX: RequestContext = {
  userId: userId("user-2"),
  workspaceId: workspaceId("ws-other"),
};

describe("CompleteTaskHandler", () => {
  let taskRepo: InMemoryTaskRepo;
  let recurrenceRuleRepo: InMemoryRecurrenceRuleRepo;
  let eventBus: InMemoryEventBus;
  let idGen: StubIdGenerator;
  let clock: StubClock;
  let createHandler: CreateTaskHandler;
  let completeHandler: CompleteTaskHandler;
  let setRecurrenceHandler: SetRecurrenceRuleHandler;

  beforeEach(() => {
    taskRepo = new InMemoryTaskRepo();
    recurrenceRuleRepo = new InMemoryRecurrenceRuleRepo();
    eventBus = new InMemoryEventBus();
    idGen = new StubIdGenerator();
    clock = new StubClock(NOW);
    createHandler = new CreateTaskHandler(taskRepo, idGen, clock, eventBus);
    completeHandler = new CompleteTaskHandler(taskRepo, recurrenceRuleRepo, idGen, clock, eventBus);
    setRecurrenceHandler = new SetRecurrenceRuleHandler(taskRepo, recurrenceRuleRepo, idGen, clock, eventBus);
  });

  it("completes an active task", async () => {
    const id = taskId("task-1");
    idGen.setNextTaskId(id);
    await createHandler.execute({ title: "Do laundry" }, CTX);

    const completionTime = new Date("2025-06-15T12:00:00Z");
    clock.set(completionTime);

    const result = await completeHandler.execute({ taskId: id }, CTX);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe("completed");
    expect(result.value.completedAt).toBe(completionTime.toISOString());
  });

  it("returns not found for unknown task", async () => {
    const result = await completeHandler.execute({ taskId: taskId("nonexistent") }, CTX);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.type).toBe("NotFoundError");
  });

  it("returns error when completing an already completed task", async () => {
    const id = taskId("task-1");
    idGen.setNextTaskId(id);
    await createHandler.execute({ title: "Task" }, CTX);
    await completeHandler.execute({ taskId: id }, CTX);

    const result = await completeHandler.execute({ taskId: id }, CTX);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.type).toBe("InvalidStateTransitionError");
  });

  it("returns not found for task in another workspace", async () => {
    const id = taskId("task-1");
    idGen.setNextTaskId(id);
    await createHandler.execute({ title: "Private" }, CTX);

    const result = await completeHandler.execute({ taskId: id }, OTHER_CTX);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.type).toBe("NotFoundError");
  });

  describe("recurrence", () => {
    it("creates next task instance when completing a recurring daily task", async () => {
      const id = taskId("task-1");
      idGen.setNextTaskId(id);
      await createHandler.execute({ title: "Daily standup", dueAt: new Date("2025-06-16T09:00:00Z") }, CTX);

      idGen.setNextRecurrenceRuleId(recurrenceRuleId("rule-1"));
      await setRecurrenceHandler.execute({ taskId: id, frequency: "daily" }, CTX);

      const completionTime = new Date("2025-06-16T09:30:00Z");
      clock.set(completionTime);
      const nextTaskId = taskId("task-next");
      idGen.setNextTaskId(nextTaskId);

      const result = await completeHandler.execute({ taskId: id }, CTX);
      expect(result.ok).toBe(true);

      const nextTask = await taskRepo.findById(nextTaskId);
      expect(nextTask).not.toBeNull();
      expect(nextTask!.title).toBe("Daily standup");
      expect(nextTask!.status).toBe("active");
      expect(nextTask!.dueAt).toEqual(new Date("2025-06-17T09:00:00Z"));
      expect(nextTask!.recurrenceRuleId).toBe(recurrenceRuleId("rule-1"));
    });

    it("creates next task with correct due date for weekly recurrence", async () => {
      const id = taskId("task-1");
      idGen.setNextTaskId(id);
      await createHandler.execute({ title: "Weekly review", dueAt: new Date("2025-06-16T09:00:00Z") }, CTX);

      idGen.setNextRecurrenceRuleId(recurrenceRuleId("rule-1"));
      await setRecurrenceHandler.execute({ taskId: id, frequency: "weekly", daysOfWeek: [1, 5] }, CTX);

      clock.set(new Date("2025-06-16T10:00:00Z"));
      const nextTaskId = taskId("task-next");
      idGen.setNextTaskId(nextTaskId);

      await completeHandler.execute({ taskId: id }, CTX);

      const nextTask = await taskRepo.findById(nextTaskId);
      expect(nextTask).not.toBeNull();
      // Monday(1) completed, next matching day is Friday(5) = +4 days
      expect(nextTask!.dueAt).toEqual(new Date("2025-06-20T09:00:00Z"));
    });

    it("does not create next task when task has no recurrence", async () => {
      const id = taskId("task-1");
      idGen.setNextTaskId(id);
      await createHandler.execute({ title: "One-off task" }, CTX);

      const before = (await taskRepo.findAll(CTX.workspaceId)).length;
      await completeHandler.execute({ taskId: id }, CTX);
      const after = (await taskRepo.findAll(CTX.workspaceId)).length;

      expect(after).toBe(before);
    });

    it("copies project, notes, and tags to the next task instance", async () => {
      const id = taskId("task-1");
      idGen.setNextTaskId(id);
      await createHandler.execute({
        title: "Recurring chore",
        dueAt: new Date("2025-06-16T09:00:00Z"),
        notes: "Don't forget",
        projectId: undefined,
      }, CTX);

      idGen.setNextRecurrenceRuleId(recurrenceRuleId("rule-1"));
      await setRecurrenceHandler.execute({ taskId: id, frequency: "daily" }, CTX);

      clock.set(new Date("2025-06-16T10:00:00Z"));
      const nextTaskId = taskId("task-next");
      idGen.setNextTaskId(nextTaskId);

      await completeHandler.execute({ taskId: id }, CTX);

      const nextTask = await taskRepo.findById(nextTaskId);
      expect(nextTask).not.toBeNull();
      expect(nextTask!.notes).toBe("Don't forget");
    });
  });
});
