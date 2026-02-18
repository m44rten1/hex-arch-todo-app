import { describe, it, expect, beforeEach } from "vitest";
import { RegisterUserHandler } from "@todo/core/application/usecases/auth/RegisterUserHandler.js";
import { userId, workspaceId } from "@todo/core/domain/shared/index.js";
import { InMemoryUserRepo } from "../../src/adapters/outbound/inmemory/InMemoryUserRepo.js";
import { InMemoryWorkspaceRepo } from "../../src/adapters/outbound/inmemory/InMemoryWorkspaceRepo.js";
import { InMemoryUserRegistrationStore } from "../../src/adapters/outbound/inmemory/InMemoryUserRegistrationStore.js";
import { InMemoryEventBus } from "../../src/adapters/outbound/inmemory/InMemoryEventBus.js";
import { StubIdGenerator } from "../../src/adapters/outbound/inmemory/StubIdGenerator.js";
import { StubClock } from "../../src/adapters/outbound/inmemory/StubClock.js";
import { StubPasswordHasher } from "../../src/adapters/outbound/inmemory/StubPasswordHasher.js";
import { StubTokenService } from "../../src/adapters/outbound/inmemory/StubTokenService.js";

const NOW = new Date("2025-06-15T10:00:00Z");

describe("RegisterUserHandler", () => {
  let userRepo: InMemoryUserRepo;
  let workspaceRepo: InMemoryWorkspaceRepo;
  let registrationStore: InMemoryUserRegistrationStore;
  let eventBus: InMemoryEventBus;
  let idGen: StubIdGenerator;
  let clock: StubClock;
  let handler: RegisterUserHandler;

  beforeEach(() => {
    userRepo = new InMemoryUserRepo();
    workspaceRepo = new InMemoryWorkspaceRepo();
    registrationStore = new InMemoryUserRegistrationStore(userRepo, workspaceRepo);
    eventBus = new InMemoryEventBus();
    idGen = new StubIdGenerator();
    clock = new StubClock(NOW);
    handler = new RegisterUserHandler(
      registrationStore,
      new StubPasswordHasher(),
      new StubTokenService(),
      idGen,
      clock,
      eventBus,
    );
  });

  it("registers a new user and creates a personal workspace", async () => {
    idGen.setNextUserId(userId("u-1"));
    idGen.setNextWorkspaceId(workspaceId("ws-1"));

    const result = await handler.execute({ email: "test@example.com", password: "password123" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.user.email).toBe("test@example.com");
    expect(result.value.token).toBeTruthy();

    const savedUser = await userRepo.findById(userId("u-1"));
    expect(savedUser).not.toBeNull();

    const savedWs = await workspaceRepo.findByOwner(userId("u-1"));
    expect(savedWs).not.toBeNull();
    expect(savedWs?.name).toBe("Personal");
  });

  it("publishes a UserRegistered event", async () => {
    await handler.execute({ email: "test@example.com", password: "password123" });
    expect(eventBus.published).toHaveLength(1);
    expect(eventBus.published[0]?.type).toBe("UserRegistered");
  });

  it("rejects duplicate email", async () => {
    await handler.execute({ email: "test@example.com", password: "password123" });

    const result = await handler.execute({ email: "test@example.com", password: "otherpass123" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.type).toBe("ConflictError");
  });

  it("rejects invalid email", async () => {
    const result = await handler.execute({ email: "bad", password: "password123" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.type).toBe("ValidationError");
  });

  it("rejects short password", async () => {
    const result = await handler.execute({ email: "test@example.com", password: "short" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.type).toBe("ValidationError");
  });
});
