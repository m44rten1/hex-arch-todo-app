import type { FastifyInstance } from "fastify";
import { wireHandlers } from "../../src/infrastructure/di/container.js";
import { buildApp } from "../../src/infrastructure/server/app.js";
import { InMemoryTaskRepo } from "../../src/adapters/outbound/inmemory/InMemoryTaskRepo.js";
import { InMemoryProjectRepo } from "../../src/adapters/outbound/inmemory/InMemoryProjectRepo.js";
import { InMemoryEventBus } from "../../src/adapters/outbound/inmemory/InMemoryEventBus.js";
import { StubIdGenerator } from "../../src/adapters/outbound/inmemory/StubIdGenerator.js";
import { StubClock } from "../../src/adapters/outbound/inmemory/StubClock.js";

export interface TestContext {
  app: FastifyInstance;
  taskRepo: InMemoryTaskRepo;
  projectRepo: InMemoryProjectRepo;
  eventBus: InMemoryEventBus;
  idGen: StubIdGenerator;
  clock: StubClock;
}

export function createTestApp(now = new Date("2025-06-15T10:00:00Z")): TestContext {
  const taskRepo = new InMemoryTaskRepo();
  const projectRepo = new InMemoryProjectRepo();
  const eventBus = new InMemoryEventBus();
  const idGen = new StubIdGenerator();
  const clock = new StubClock(now);

  const handlers = wireHandlers({
    taskRepo,
    projectRepo,
    idGenerator: idGen,
    clock,
    eventBus,
  });

  const app = buildApp(handlers, { logger: false });

  return { app, taskRepo, projectRepo, eventBus, idGen, clock };
}

export const AUTH_HEADERS = {
  "x-user-id": "user-1",
  "x-workspace-id": "ws-1",
} as const;
