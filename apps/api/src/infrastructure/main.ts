import { loadConfig } from "./config/env.js";
import { createPool } from "../adapters/outbound/postgres/pool.js";
import { runMigrations } from "../adapters/outbound/postgres/migrate.js";
import { PgTaskRepo } from "../adapters/outbound/postgres/PgTaskRepo.js";
import { PgProjectRepo } from "../adapters/outbound/postgres/PgProjectRepo.js";
import { PgUserRepo } from "../adapters/outbound/postgres/PgUserRepo.js";
import { PgWorkspaceRepo } from "../adapters/outbound/postgres/PgWorkspaceRepo.js";
import { UuidIdGenerator } from "../adapters/outbound/UuidIdGenerator.js";
import { SystemClock } from "../adapters/outbound/SystemClock.js";
import { InMemoryEventBus } from "../adapters/outbound/inmemory/InMemoryEventBus.js";
import { BcryptPasswordHasher } from "../adapters/outbound/BcryptPasswordHasher.js";
import { JoseTokenService } from "../adapters/outbound/JoseTokenService.js";
import { wireHandlers } from "./di/container.js";
import { buildApp } from "./server/app.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const pool = createPool(config.databaseUrl);

  await runMigrations(pool);

  const tokenService = new JoseTokenService(config.jwtSecret);

  const handlers = wireHandlers({
    taskRepo: new PgTaskRepo(pool),
    projectRepo: new PgProjectRepo(pool),
    userRepo: new PgUserRepo(pool),
    workspaceRepo: new PgWorkspaceRepo(pool),
    idGenerator: new UuidIdGenerator(),
    clock: new SystemClock(),
    eventBus: new InMemoryEventBus(),
    passwordHasher: new BcryptPasswordHasher(),
    tokenService,
  });

  const app = buildApp(handlers, tokenService);

  await app.listen({ port: config.port, host: config.host });
}

main().catch((error: unknown) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
