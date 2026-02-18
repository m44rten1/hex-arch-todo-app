import type { FastifyInstance } from "fastify";
import { wireHandlers } from "../../src/infrastructure/di/container.js";
import { buildApp } from "../../src/infrastructure/server/app.js";
import { InMemoryTaskRepo } from "../../src/adapters/outbound/inmemory/InMemoryTaskRepo.js";
import { InMemoryProjectRepo } from "../../src/adapters/outbound/inmemory/InMemoryProjectRepo.js";
import { InMemoryUserRepo } from "../../src/adapters/outbound/inmemory/InMemoryUserRepo.js";
import { InMemoryWorkspaceRepo } from "../../src/adapters/outbound/inmemory/InMemoryWorkspaceRepo.js";
import { InMemoryEventBus } from "../../src/adapters/outbound/inmemory/InMemoryEventBus.js";
import { StubIdGenerator } from "../../src/adapters/outbound/inmemory/StubIdGenerator.js";
import { StubClock } from "../../src/adapters/outbound/inmemory/StubClock.js";
import { StubPasswordHasher } from "../../src/adapters/outbound/inmemory/StubPasswordHasher.js";
import { StubTokenService } from "../../src/adapters/outbound/inmemory/StubTokenService.js";

export interface TestContext {
  app: FastifyInstance;
  taskRepo: InMemoryTaskRepo;
  projectRepo: InMemoryProjectRepo;
  userRepo: InMemoryUserRepo;
  workspaceRepo: InMemoryWorkspaceRepo;
  eventBus: InMemoryEventBus;
  idGen: StubIdGenerator;
  clock: StubClock;
  tokenService: StubTokenService;
}

export function createTestApp(now = new Date("2025-06-15T10:00:00Z")): TestContext {
  const taskRepo = new InMemoryTaskRepo();
  const projectRepo = new InMemoryProjectRepo();
  const userRepo = new InMemoryUserRepo();
  const workspaceRepo = new InMemoryWorkspaceRepo();
  const eventBus = new InMemoryEventBus();
  const idGen = new StubIdGenerator();
  const clock = new StubClock(now);
  const tokenService = new StubTokenService();

  const handlers = wireHandlers({
    taskRepo,
    projectRepo,
    userRepo,
    workspaceRepo,
    idGenerator: idGen,
    clock,
    eventBus,
    passwordHasher: new StubPasswordHasher(),
    tokenService,
  });

  const app = buildApp(handlers, tokenService, { logger: false });

  return { app, taskRepo, projectRepo, userRepo, workspaceRepo, eventBus, idGen, clock, tokenService };
}

export async function registerAndGetToken(ctx: TestContext, email = "test@example.com", password = "password123"): Promise<string> {
  const res = await ctx.app.inject({
    method: "POST",
    url: "/auth/register",
    headers: { "content-type": "application/json" },
    payload: { email, password },
  });
  const body = res.json() as { token: string };
  return body.token;
}
