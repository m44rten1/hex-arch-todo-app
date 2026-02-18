import { loadConfig } from "./config/env.js";
import { createDb } from "../adapters/outbound/postgres/db.js";
import { runMigrations } from "../adapters/outbound/postgres/migrate.js";
import { PgTaskRepo } from "../adapters/outbound/postgres/PgTaskRepo.js";
import { PgProjectRepo } from "../adapters/outbound/postgres/PgProjectRepo.js";
import { PgTagRepo } from "../adapters/outbound/postgres/PgTagRepo.js";
import { PgUserRepo } from "../adapters/outbound/postgres/PgUserRepo.js";
import { PgWorkspaceRepo } from "../adapters/outbound/postgres/PgWorkspaceRepo.js";
import { PgUserRegistrationStore } from "../adapters/outbound/postgres/PgUserRegistrationStore.js";
import { PgSearchIndex } from "../adapters/outbound/postgres/PgSearchIndex.js";
import { PgReminderRepo } from "../adapters/outbound/postgres/PgReminderRepo.js";
import { ConsoleNotificationChannel } from "../adapters/outbound/ConsoleNotificationChannel.js";
import { UuidIdGenerator } from "../adapters/outbound/UuidIdGenerator.js";
import { ReminderScheduler } from "../adapters/inbound/scheduler/ReminderScheduler.js";
import { SystemClock } from "../adapters/outbound/SystemClock.js";
import { InMemoryEventBus } from "../adapters/outbound/inmemory/InMemoryEventBus.js";
import { BcryptPasswordHasher } from "../adapters/outbound/BcryptPasswordHasher.js";
import { JoseTokenService } from "../adapters/outbound/JoseTokenService.js";
import { wireHandlers } from "./di/container.js";
import { buildApp } from "./server/app.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const db = createDb(config.databaseUrl);

  await runMigrations(db);

  const tokenService = new JoseTokenService(config.jwtSecret);

  const handlers = wireHandlers({
    taskRepo: new PgTaskRepo(db),
    projectRepo: new PgProjectRepo(db),
    tagRepo: new PgTagRepo(db),
    userRepo: new PgUserRepo(db),
    workspaceRepo: new PgWorkspaceRepo(db),
    registrationStore: new PgUserRegistrationStore(db),
    searchIndex: new PgSearchIndex(db),
    reminderRepo: new PgReminderRepo(db),
    notificationChannel: new ConsoleNotificationChannel(),
    idGenerator: new UuidIdGenerator(),
    clock: new SystemClock(),
    eventBus: new InMemoryEventBus(),
    passwordHasher: new BcryptPasswordHasher(),
    tokenService,
  });

  const app = buildApp(handlers, tokenService);

  const scheduler = new ReminderScheduler(handlers.processDueReminders);
  scheduler.start();

  await app.listen({ port: config.port, host: config.host });
}

main().catch((error: unknown) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
