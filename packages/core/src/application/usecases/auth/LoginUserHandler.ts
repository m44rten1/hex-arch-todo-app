import type { Result, AuthenticationError } from "../../../domain/shared/index.js";
import { err } from "../../../domain/shared/index.js";
import { validateEmail } from "../../../domain/user/UserRules.js";
import type { AuthDTO } from "../../dto/AuthDTO.js";
import { toUserDTO } from "../../dto/AuthDTO.js";
import type { LoginUserCommand } from "../../ports/inbound/commands/LoginUser.js";
import type { UserRepo } from "../../ports/outbound/UserRepo.js";
import type { WorkspaceRepo } from "../../ports/outbound/WorkspaceRepo.js";
import type { PasswordHasher } from "../../ports/outbound/PasswordHasher.js";
import type { TokenService } from "../../ports/outbound/TokenService.js";

const INVALID_CREDENTIALS: AuthenticationError = {
  type: "AuthenticationError",
  message: "Invalid email or password",
};

export class LoginUserHandler {
  private readonly userRepo: UserRepo;
  private readonly workspaceRepo: WorkspaceRepo;
  private readonly passwordHasher: PasswordHasher;
  private readonly tokenService: TokenService;

  constructor(userRepo: UserRepo, workspaceRepo: WorkspaceRepo, passwordHasher: PasswordHasher, tokenService: TokenService) {
    this.userRepo = userRepo;
    this.workspaceRepo = workspaceRepo;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
  }

  async execute(cmd: LoginUserCommand): Promise<Result<AuthDTO, AuthenticationError>> {
    const emailResult = validateEmail(cmd.email);
    if (!emailResult.ok) return err(INVALID_CREDENTIALS);

    const user = await this.userRepo.findByEmail(emailResult.value);
    if (user === null) return err(INVALID_CREDENTIALS);

    const passwordValid = await this.passwordHasher.verify(cmd.password, user.passwordHash);
    if (!passwordValid) return err(INVALID_CREDENTIALS);

    const workspace = await this.workspaceRepo.findByOwner(user.id);
    if (workspace === null) return err(INVALID_CREDENTIALS);

    const token = await this.tokenService.generate({
      userId: user.id,
      workspaceId: workspace.id,
    });

    return { ok: true, value: { token, user: toUserDTO(user) } };
  }
}
