import { describe, it, expect, beforeEach } from "vitest";
import { GetTodayViewHandler } from "@todo/core/application/usecases/queries/GetTodayViewHandler.js";
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

describe("GetTodayViewHandler", () => {
  let taskRepo: InMemoryTaskRepo;
  let eventBus: InMemoryEventBus;
  let idGen: StubIdGenerator;
  let clock: StubClock;
  let createHandler: CreateTaskHandler;
  let todayHandler: GetTodayViewHandler;

  beforeEach(() => {
    taskRepo = new InMemoryTaskRepo();
    eventBus = new InMemoryEventBus();
    idGen = new StubIdGenerator();
    clock = new StubClock(NOW);
    createHandler = new CreateTaskHandler(taskRepo, idGen, clock, eventBus);
    todayHandler = new GetTodayViewHandler(taskRepo, clock);
  });

  it("returns tasks due today", async () => {
    idGen.setNextTaskId(taskId("t1"));
    await createHandler.execute(
      { title: "Due today", dueAt: new Date("2025-06-15T17:00:00Z") },
      CTX,
    );

    const view = await todayHandler.execute(CTX);
    expect(view.dueToday).toHaveLength(1);
    expect(view.overdue).toHaveLength(0);
  });

  it("returns overdue tasks separately", async () => {
    idGen.setNextTaskId(taskId("t1"));
    await createHandler.execute(
      { title: "Overdue", dueAt: new Date("2025-06-14T09:00:00Z") },
      CTX,
    );

    const view = await todayHandler.execute(CTX);
    expect(view.overdue).toHaveLength(1);
    expect(view.dueToday).toHaveLength(0);
  });

  it("does not include tasks with no due date", async () => {
    idGen.setNextTaskId(taskId("t1"));
    await createHandler.execute({ title: "No due date" }, CTX);

    const view = await todayHandler.execute(CTX);
    expect(view.overdue).toHaveLength(0);
    expect(view.dueToday).toHaveLength(0);
  });

  it("does not include future tasks", async () => {
    idGen.setNextTaskId(taskId("t1"));
    await createHandler.execute(
      { title: "Future", dueAt: new Date("2025-06-20T10:00:00Z") },
      CTX,
    );

    const view = await todayHandler.execute(CTX);
    expect(view.overdue).toHaveLength(0);
    expect(view.dueToday).toHaveLength(0);
  });
});
