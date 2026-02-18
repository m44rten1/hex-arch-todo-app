import { InMemoryTaskRepo } from "../adapters/outbound/inmemory/InMemoryTaskRepo.js";
import { InMemoryProjectRepo } from "../adapters/outbound/inmemory/InMemoryProjectRepo.js";
import { InMemoryTagRepo } from "../adapters/outbound/inmemory/InMemoryTagRepo.js";
import { InMemoryUserRepo } from "../adapters/outbound/inmemory/InMemoryUserRepo.js";
import { InMemoryWorkspaceRepo } from "../adapters/outbound/inmemory/InMemoryWorkspaceRepo.js";
import { InMemoryUserRegistrationStore } from "../adapters/outbound/inmemory/InMemoryUserRegistrationStore.js";
import { InMemorySearchIndex } from "../adapters/outbound/inmemory/InMemorySearchIndex.js";
import { InMemoryReminderRepo } from "../adapters/outbound/inmemory/InMemoryReminderRepo.js";
import { InMemoryRecurrenceRuleRepo } from "../adapters/outbound/inmemory/InMemoryRecurrenceRuleRepo.js";
import { InMemoryRecurrenceRuleStore } from "../adapters/outbound/inmemory/InMemoryRecurrenceRuleStore.js";
import { InMemoryEventBus } from "../adapters/outbound/inmemory/InMemoryEventBus.js";
import { ConsoleNotificationChannel } from "../adapters/outbound/ConsoleNotificationChannel.js";
import { ReminderScheduler } from "../adapters/inbound/scheduler/ReminderScheduler.js";
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

  const userRepo = new InMemoryUserRepo();
  const workspaceRepo = new InMemoryWorkspaceRepo();

  const taskRepo = new InMemoryTaskRepo();
  const recurrenceRuleRepo = new InMemoryRecurrenceRuleRepo();

  const handlers = wireHandlers({
    taskRepo,
    projectRepo: new InMemoryProjectRepo(),
    tagRepo: new InMemoryTagRepo(),
    userRepo,
    workspaceRepo,
    registrationStore: new InMemoryUserRegistrationStore(userRepo, workspaceRepo),
    searchIndex: new InMemorySearchIndex(taskRepo),
    reminderRepo: new InMemoryReminderRepo(),
    recurrenceRuleRepo,
    recurrenceRuleStore: new InMemoryRecurrenceRuleStore(recurrenceRuleRepo, taskRepo),
    notificationChannel: new ConsoleNotificationChannel(),
    idGenerator: new UuidIdGenerator(),
    clock: new SystemClock(),
    eventBus: new InMemoryEventBus(),
    passwordHasher: new StubPasswordHasher(),
    tokenService,
  });

  const app = buildApp(handlers, tokenService);

  const scheduler = new ReminderScheduler(handlers.processDueReminders);
  scheduler.start();

  await app.listen({ port, host: "0.0.0.0" });
  console.log(`Dev API running at http://localhost:${port}`);
}

main().catch((error: unknown) => {
  console.error("Failed to start dev server:", error);
  process.exit(1);
});
