import type { FastifyInstance } from "fastify";
import { sql } from "kysely";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { createDb, type Db } from "../../src/adapters/outbound/postgres/db.js";
import { runMigrations } from "../../src/adapters/outbound/postgres/migrate.js";
import { PgTaskRepo } from "../../src/adapters/outbound/postgres/PgTaskRepo.js";
import { PgProjectRepo } from "../../src/adapters/outbound/postgres/PgProjectRepo.js";
import { PgTagRepo } from "../../src/adapters/outbound/postgres/PgTagRepo.js";
import { PgUserRepo } from "../../src/adapters/outbound/postgres/PgUserRepo.js";
import { PgWorkspaceRepo } from "../../src/adapters/outbound/postgres/PgWorkspaceRepo.js";
import { PgUserRegistrationStore } from "../../src/adapters/outbound/postgres/PgUserRegistrationStore.js";
import { PgSearchIndex } from "../../src/adapters/outbound/postgres/PgSearchIndex.js";
import { PgReminderRepo } from "../../src/adapters/outbound/postgres/PgReminderRepo.js";
import { PgRecurrenceRuleRepo } from "../../src/adapters/outbound/postgres/PgRecurrenceRuleRepo.js";
import { PgRecurrenceRuleStore } from "../../src/adapters/outbound/postgres/PgRecurrenceRuleStore.js";
import { BcryptPasswordHasher } from "../../src/adapters/outbound/BcryptPasswordHasher.js";
import { JoseTokenService } from "../../src/adapters/outbound/JoseTokenService.js";
import { UuidIdGenerator } from "../../src/adapters/outbound/UuidIdGenerator.js";
import { SystemClock } from "../../src/adapters/outbound/SystemClock.js";
import { ConsoleNotificationChannel } from "../../src/adapters/outbound/ConsoleNotificationChannel.js";
import { InMemoryEventBus } from "../../src/adapters/outbound/inmemory/InMemoryEventBus.js";
import { wireHandlers } from "../../src/infrastructure/di/container.js";
import { buildApp } from "../../src/infrastructure/server/app.js";

export interface PgTestContext {
  app: FastifyInstance;
  db: Db;
  reset: () => Promise<void>;
  stop: () => Promise<void>;
}

async function resetPgState(db: Db): Promise<void> {
  await sql.raw(
    "TRUNCATE TABLE task_tags, reminders, tasks, tags, projects, recurrence_rules, workspaces, users RESTART IDENTITY CASCADE",
  ).execute(db);
}

export async function createPgTestApp(): Promise<PgTestContext> {
  const container = await new PostgreSqlContainer("postgres:16-alpine").start();
  const db = createDb(container.getConnectionUri());
  await runMigrations(db);

  const tokenService = new JoseTokenService("test-jwt-secret");

  const handlers = wireHandlers({
    taskRepo: new PgTaskRepo(db),
    projectRepo: new PgProjectRepo(db),
    tagRepo: new PgTagRepo(db),
    userRepo: new PgUserRepo(db),
    workspaceRepo: new PgWorkspaceRepo(db),
    registrationStore: new PgUserRegistrationStore(db),
    searchIndex: new PgSearchIndex(db),
    reminderRepo: new PgReminderRepo(db),
    recurrenceRuleRepo: new PgRecurrenceRuleRepo(db),
    recurrenceRuleStore: new PgRecurrenceRuleStore(db),
    notificationChannel: new ConsoleNotificationChannel(),
    idGenerator: new UuidIdGenerator(),
    clock: new SystemClock(),
    eventBus: new InMemoryEventBus(),
    passwordHasher: new BcryptPasswordHasher(),
    tokenService,
  });

  const app = buildApp(handlers, tokenService, { logger: false });
  await app.ready();

  return {
    app,
    db,
    reset: () => resetPgState(db),
    stop: async () => {
      await app.close();
      await db.destroy();
      await container.stop();
    },
  };
}
