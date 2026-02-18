import { describe, it, expect, beforeEach } from "vitest";
import { CreateTaskHandler } from "@todo/core/application/usecases/tasks/CreateTaskHandler.js";
import { taskId, userId, workspaceId, projectId } from "@todo/core/domain/shared/index.js";
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

describe("CreateTaskHandler", () => {
  let taskRepo: InMemoryTaskRepo;
  let eventBus: InMemoryEventBus;
  let idGen: StubIdGenerator;
  let clock: StubClock;
  let handler: CreateTaskHandler;

  beforeEach(() => {
    taskRepo = new InMemoryTaskRepo();
    eventBus = new InMemoryEventBus();
    idGen = new StubIdGenerator();
    clock = new StubClock(NOW);
    handler = new CreateTaskHandler(taskRepo, idGen, clock, eventBus);
  });

  it("creates a task and persists it", async () => {
    const id = taskId("task-abc");
    idGen.setNextTaskId(id);

    const result = await handler.execute({ title: "Buy milk" }, CTX);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.id).toBe("task-abc");
    expect(result.value.title).toBe("Buy milk");
    expect(result.value.status).toBe("active");

    const persisted = await taskRepo.findById(id);
    expect(persisted).not.toBeNull();
    expect(persisted?.title).toBe("Buy milk");
  });

  it("publishes a TaskCreated event", async () => {
    await handler.execute({ title: "Buy milk" }, CTX);
    expect(eventBus.published).toHaveLength(1);
    expect(eventBus.published[0]?.type).toBe("TaskCreated");
  });

  it("returns validation error for empty title", async () => {
    const result = await handler.execute({ title: "" }, CTX);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.type).toBe("ValidationError");
  });

  it("assigns project when provided", async () => {
    const pid = projectId("proj-1");
    const result = await handler.execute({ title: "Task", projectId: pid }, CTX);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.projectId).toBe("proj-1");
  });
});
