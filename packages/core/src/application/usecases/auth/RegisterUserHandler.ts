import type { Result, ConflictError, ValidationError } from "../../../domain/shared/index.js";
import { err } from "../../../domain/shared/index.js";
import { validatePassword } from "../../../domain/user/UserRules.js";
import { createRegistration } from "../../../domain/user/UserRegistration.js";
import type { AuthDTO } from "../../dto/AuthDTO.js";
import { toUserDTO } from "../../dto/AuthDTO.js";
import type { RegisterUserCommand } from "../../ports/inbound/commands/RegisterUser.js";
import type { UserRegistrationStore } from "../../ports/outbound/UserRegistrationStore.js";
import type { PasswordHasher } from "../../ports/outbound/PasswordHasher.js";
import type { TokenService } from "../../ports/outbound/TokenService.js";
import type { IdGenerator } from "../../ports/outbound/IdGenerator.js";
import type { Clock } from "../../../domain/shared/Clock.js";
import type { EventBus } from "../../ports/outbound/EventBus.js";

export type RegisterUserError = ValidationError | ConflictError;

export class RegisterUserHandler {
  private readonly registrationStore: UserRegistrationStore;
  private readonly passwordHasher: PasswordHasher;
  private readonly tokenService: TokenService;
  private readonly idGenerator: IdGenerator;
  private readonly clock: Clock;
  private readonly eventBus: EventBus;

  constructor(
    registrationStore: UserRegistrationStore,
    passwordHasher: PasswordHasher,
    tokenService: TokenService,
    idGenerator: IdGenerator,
    clock: Clock,
    eventBus: EventBus,
  ) {
    this.registrationStore = registrationStore;
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
    const workspaceId = this.idGenerator.workspaceId();

    const registrationResult = createRegistration({ userId, workspaceId, email: cmd.email, passwordHash, now });
    if (!registrationResult.ok) return registrationResult;

    const { user, workspace, event } = registrationResult.value;

    const exists = await this.registrationStore.existsByEmail(user.email);
    if (exists) {
      return err({ type: "ConflictError", entity: "User", message: "Email is already registered" });
    }

    await this.registrationStore.save(user, workspace);
    await this.eventBus.publish(event);

    const token = await this.tokenService.generate({ userId, workspaceId });
    return { ok: true, value: { token, user: toUserDTO(user) } };
  }
}
