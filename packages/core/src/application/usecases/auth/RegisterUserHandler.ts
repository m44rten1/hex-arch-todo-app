import type { Result, ConflictError, ValidationError } from "../../../domain/shared/index.js";
import { err } from "../../../domain/shared/index.js";
import { validatePassword, createUser } from "../../../domain/user/UserRules.js";
import { createWorkspace } from "../../../domain/workspace/WorkspaceRules.js";
import type { AuthDTO } from "../../dto/AuthDTO.js";
import { toUserDTO } from "../../dto/AuthDTO.js";
import type { RegisterUserCommand } from "../../ports/inbound/commands/RegisterUser.js";
import type { UserRepo } from "../../ports/outbound/UserRepo.js";
import type { WorkspaceRepo } from "../../ports/outbound/WorkspaceRepo.js";
import type { PasswordHasher } from "../../ports/outbound/PasswordHasher.js";
import type { TokenService } from "../../ports/outbound/TokenService.js";
import type { IdGenerator } from "../../ports/outbound/IdGenerator.js";
import type { Clock } from "../../../domain/shared/Clock.js";
import type { EventBus } from "../../ports/outbound/EventBus.js";
import type { UserRegistered } from "../../../domain/user/UserEvents.js";

export type RegisterUserError = ValidationError | ConflictError;

export class RegisterUserHandler {
  private readonly userRepo: UserRepo;
  private readonly workspaceRepo: WorkspaceRepo;
  private readonly passwordHasher: PasswordHasher;
  private readonly tokenService: TokenService;
  private readonly idGenerator: IdGenerator;
  private readonly clock: Clock;
  private readonly eventBus: EventBus;

  constructor(
    userRepo: UserRepo,
    workspaceRepo: WorkspaceRepo,
    passwordHasher: PasswordHasher,
    tokenService: TokenService,
    idGenerator: IdGenerator,
    clock: Clock,
    eventBus: EventBus,
  ) {
    this.userRepo = userRepo;
    this.workspaceRepo = workspaceRepo;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
    this.idGenerator = idGenerator;
    this.clock = clock;
    this.eventBus = eventBus;
  }

  async execute(cmd: RegisterUserCommand): Promise<Result<AuthDTO, RegisterUserError>> {
    const passwordResult = validatePassword(cmd.password);
    if (!passwordResult.ok) return passwordResult;

    const now = this.clock.now();
    const passwordHash = await this.passwordHasher.hash(cmd.password);

    const userId = this.idGenerator.userId();
    const userResult = createUser({ id: userId, email: cmd.email, passwordHash, now });
    if (!userResult.ok) return userResult;

    const existing = await this.userRepo.findByEmail(userResult.value.email);
    if (existing !== null) {
      return err({ type: "ConflictError", entity: "User", message: "Email is already registered" });
    }

    const wsId = this.idGenerator.workspaceId();
    const wsResult = createWorkspace({
      id: wsId,
      name: "Personal",
      ownerUserId: userId,
      now,
    });
    if (!wsResult.ok) return wsResult;

    await this.userRepo.save(userResult.value);
    await this.workspaceRepo.save(wsResult.value);

    const event: UserRegistered = {
      type: "UserRegistered",
      userId,
      email: userResult.value.email,
      workspaceId: wsId,
      occurredAt: now,
    };
    await this.eventBus.publish(event);

    const token = await this.tokenService.generate({ userId, workspaceId: wsId });

    return { ok: true, value: { token, user: toUserDTO(userResult.value) } };
  }
}
