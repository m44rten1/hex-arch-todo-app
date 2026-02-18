import { InMemoryTaskRepo } from "../adapters/outbound/inmemory/InMemoryTaskRepo.js";
import { InMemoryProjectRepo } from "../adapters/outbound/inmemory/InMemoryProjectRepo.js";
import { InMemoryTagRepo } from "../adapters/outbound/inmemory/InMemoryTagRepo.js";
import { InMemoryUserRepo } from "../adapters/outbound/inmemory/InMemoryUserRepo.js";
import { InMemoryWorkspaceRepo } from "../adapters/outbound/inmemory/InMemoryWorkspaceRepo.js";
import { InMemoryEventBus } from "../adapters/outbound/inmemory/InMemoryEventBus.js";
import { UuidIdGenerator } from "../adapters/outbound/UuidIdGenerator.js";
import { SystemClock } from "../adapters/outbound/SystemClock.js";
import { StubPasswordHasher } from "../adapters/outbound/inmemory/StubPasswordHasher.js";
import { JoseTokenService } from "../adapters/outbound/JoseTokenService.js";
import { wireHandlers } from "./di/container.js";
import { buildApp } from "./server/app.js";

async function main(): Promise<void> {
  const jwtSecret = process.env["JWT_SECRET"] ?? "dev-secret-do-not-use-in-production";
  const port = parseInt(process.env["PORT"] ?? "3000", 10);

  const tokenService = new JoseTokenService(jwtSecret);

  const handlers = wireHandlers({
    taskRepo: new InMemoryTaskRepo(),
    projectRepo: new InMemoryProjectRepo(),
    tagRepo: new InMemoryTagRepo(),
    userRepo: new InMemoryUserRepo(),
    workspaceRepo: new InMemoryWorkspaceRepo(),
    idGenerator: new UuidIdGenerator(),
    clock: new SystemClock(),
    eventBus: new InMemoryEventBus(),
    passwordHasher: new StubPasswordHasher(),
    tokenService,
  });

  const app = buildApp(handlers, tokenService);

  await app.listen({ port, host: "0.0.0.0" });
  console.log(`Dev API running at http://localhost:${port}`);
}

main().catch((error: unknown) => {
  console.error("Failed to start dev server:", error);
  process.exit(1);
});
