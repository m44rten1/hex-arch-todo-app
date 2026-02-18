import { describe, it, expect, beforeEach } from "vitest";
import { GetUpcomingViewHandler } from "@todo/core/application/usecases/queries/GetUpcomingViewHandler.js";
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

describe("GetUpcomingViewHandler", () => {
  let taskRepo: InMemoryTaskRepo;
  let eventBus: InMemoryEventBus;
  let idGen: StubIdGenerator;
  let clock: StubClock;
  let createHandler: CreateTaskHandler;
  let upcomingHandler: GetUpcomingViewHandler;

  beforeEach(() => {
    taskRepo = new InMemoryTaskRepo();
    eventBus = new InMemoryEventBus();
    idGen = new StubIdGenerator();
    clock = new StubClock(NOW);
    createHandler = new CreateTaskHandler(taskRepo, idGen, clock, eventBus);
    upcomingHandler = new GetUpcomingViewHandler(taskRepo, clock);
  });

  it("groups tasks by due date within the window", async () => {
    idGen.setNextTaskId(taskId("t1"));
    await createHandler.execute({ title: "Today task", dueAt: new Date("2025-06-15T14:00:00Z") }, CTX);
    idGen.setNextTaskId(taskId("t2"));
    await createHandler.execute({ title: "Tomorrow task", dueAt: new Date("2025-06-16T09:00:00Z") }, CTX);
    idGen.setNextTaskId(taskId("t3"));
    await createHandler.execute({ title: "Day 5 task", dueAt: new Date("2025-06-20T12:00:00Z") }, CTX);

    const view = await upcomingHandler.execute(CTX, 7);
    expect(view.days).toBe(7);
    expect(view.groups).toHaveLength(3);
    expect(view.groups[0].date).toBe("2025-06-15");
    expect(view.groups[0].tasks).toHaveLength(1);
    expect(view.groups[1].date).toBe("2025-06-16");
    expect(view.groups[2].date).toBe("2025-06-20");
  });

  it("excludes tasks outside the window", async () => {
    idGen.setNextTaskId(taskId("t1"));
    await createHandler.execute({ title: "Within", dueAt: new Date("2025-06-20T10:00:00Z") }, CTX);
    idGen.setNextTaskId(taskId("t2"));
    await createHandler.execute({ title: "Outside", dueAt: new Date("2025-06-25T10:00:00Z") }, CTX);

    const view = await upcomingHandler.execute(CTX, 7);
    expect(view.groups).toHaveLength(1);
    expect(view.groups[0].tasks[0].title).toBe("Within");
  });

  it("excludes overdue tasks (before today)", async () => {
    idGen.setNextTaskId(taskId("t1"));
    await createHandler.execute({ title: "Overdue", dueAt: new Date("2025-06-14T10:00:00Z") }, CTX);
    idGen.setNextTaskId(taskId("t2"));
    await createHandler.execute({ title: "Today", dueAt: new Date("2025-06-15T10:00:00Z") }, CTX);

    const view = await upcomingHandler.execute(CTX, 7);
    expect(view.groups).toHaveLength(1);
    expect(view.groups[0].tasks[0].title).toBe("Today");
  });

  it("returns empty groups when no tasks are due", async () => {
    idGen.setNextTaskId(taskId("t1"));
    await createHandler.execute({ title: "No due date" }, CTX);

    const view = await upcomingHandler.execute(CTX, 7);
    expect(view.groups).toHaveLength(0);
  });
});
