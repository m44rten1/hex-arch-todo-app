import { describe, it, expect, beforeEach } from "vitest";
import { CompleteTaskHandler } from "@todo/core/application/usecases/tasks/CompleteTaskHandler.js";
import { CreateTaskHandler } from "@todo/core/application/usecases/tasks/CreateTaskHandler.js";
import { taskId, userId, workspaceId } from "@todo/core/domain/shared/index.js";
import { InMemoryTaskRepo } from "../../src/adapters/outbound/inmemory/InMemoryTaskRepo.js";
import { InMemoryEventBus } from "../../src/adapters/outbound/inmemory/InMemoryEventBus.js";
import { StubIdGenerator } from "../../src/adapters/outbound/inmemory/StubIdGenerator.js";
import { StubClock } from "../../src/adapters/outbound/inmemory/StubClock.js";
import type { RequestContext } from "@todo/core/application/RequestContext.js";

const NOW = new Date("2025-06-15T10:00:00Z");
const CTX: RequestContext = {
  userId: userId("user-1"),
  workspaceId: workspaceId("ws-1"),
};

describe("CompleteTaskHandler", () => {
  let taskRepo: InMemoryTaskRepo;
  let eventBus: InMemoryEventBus;
  let idGen: StubIdGenerator;
  let clock: StubClock;
  let createHandler: CreateTaskHandler;
  let completeHandler: CompleteTaskHandler;

  beforeEach(() => {
    taskRepo = new InMemoryTaskRepo();
    eventBus = new InMemoryEventBus();
    idGen = new StubIdGenerator();
    clock = new StubClock(NOW);
    createHandler = new CreateTaskHandler(taskRepo, idGen, clock, eventBus);
    completeHandler = new CompleteTaskHandler(taskRepo, clock, eventBus);
  });

  it("completes an active task", async () => {
    const id = taskId("task-1");
    idGen.setNextTaskId(id);
    await createHandler.execute({ title: "Do laundry" }, CTX);

    const completionTime = new Date("2025-06-15T12:00:00Z");
    clock.set(completionTime);

    const result = await completeHandler.execute({ taskId: id });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe("completed");
    expect(result.value.completedAt).toBe(completionTime.toISOString());
  });

  it("returns not found for unknown task", async () => {
    const result = await completeHandler.execute({ taskId: taskId("nonexistent") });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.type).toBe("NotFoundError");
  });

  it("returns error when completing an already completed task", async () => {
    const id = taskId("task-1");
    idGen.setNextTaskId(id);
    await createHandler.execute({ title: "Task" }, CTX);
    await completeHandler.execute({ taskId: id });

    const result = await completeHandler.execute({ taskId: id });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.type).toBe("InvalidStateTransitionError");
  });
});
