import { describe, it, expect, beforeEach } from "vitest";
import { RegisterUserHandler } from "@todo/core/application/usecases/auth/RegisterUserHandler.js";
import { LoginUserHandler } from "@todo/core/application/usecases/auth/LoginUserHandler.js";
import { InMemoryUserRepo } from "../../src/adapters/outbound/inmemory/InMemoryUserRepo.js";
import { InMemoryWorkspaceRepo } from "../../src/adapters/outbound/inmemory/InMemoryWorkspaceRepo.js";
import { InMemoryEventBus } from "../../src/adapters/outbound/inmemory/InMemoryEventBus.js";
import { StubIdGenerator } from "../../src/adapters/outbound/inmemory/StubIdGenerator.js";
import { StubClock } from "../../src/adapters/outbound/inmemory/StubClock.js";
import { StubPasswordHasher } from "../../src/adapters/outbound/inmemory/StubPasswordHasher.js";
import { StubTokenService } from "../../src/adapters/outbound/inmemory/StubTokenService.js";

const NOW = new Date("2025-06-15T10:00:00Z");

describe("LoginUserHandler", () => {
  let userRepo: InMemoryUserRepo;
  let workspaceRepo: InMemoryWorkspaceRepo;
  let hasher: StubPasswordHasher;
  let tokenService: StubTokenService;
  let loginHandler: LoginUserHandler;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepo();
    workspaceRepo = new InMemoryWorkspaceRepo();
    hasher = new StubPasswordHasher();
    tokenService = new StubTokenService();

    const registerHandler = new RegisterUserHandler(
      userRepo,
      workspaceRepo,
      hasher,
      tokenService,
      new StubIdGenerator(),
      new StubClock(NOW),
      new InMemoryEventBus(),
    );

    await registerHandler.execute({ email: "user@example.com", password: "password123" });

    loginHandler = new LoginUserHandler(userRepo, workspaceRepo, hasher, tokenService);
  });

  it("logs in with valid credentials", async () => {
    const result = await loginHandler.execute({ email: "user@example.com", password: "password123" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.token).toBeTruthy();
    expect(result.value.user.email).toBe("user@example.com");
  });

  it("rejects wrong password", async () => {
    const result = await loginHandler.execute({ email: "user@example.com", password: "wrongpass123" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.type).toBe("AuthenticationError");
  });

  it("rejects unknown email", async () => {
    const result = await loginHandler.execute({ email: "nobody@example.com", password: "password123" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.type).toBe("AuthenticationError");
  });

  it("does not leak whether email exists", async () => {
    const wrongPass = await loginHandler.execute({ email: "user@example.com", password: "wrong" });
    const wrongEmail = await loginHandler.execute({ email: "nobody@example.com", password: "password123" });

    expect(wrongPass.ok).toBe(false);
    expect(wrongEmail.ok).toBe(false);
    if (wrongPass.ok || wrongEmail.ok) return;
    expect(wrongPass.error.message).toBe(wrongEmail.error.message);
  });
});
