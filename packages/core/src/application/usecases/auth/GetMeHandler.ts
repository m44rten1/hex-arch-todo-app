import type { UserRepo } from "../../ports/outbound/UserRepo.js";
import type { UserDTO } from "../../dto/AuthDTO.js";
import { toUserDTO } from "../../dto/AuthDTO.js";
import type { RequestContext } from "../../RequestContext.js";
import type { DomainError } from "../../../domain/shared/Errors.js";
import type { Result } from "../../../domain/shared/Result.js";
import { ok, err } from "../../../domain/shared/Result.js";

export class GetMeHandler {
  private readonly userRepo: UserRepo;

  constructor(userRepo: UserRepo) {
    this.userRepo = userRepo;
  }

  async execute(ctx: RequestContext): Promise<Result<UserDTO, DomainError>> {
    const user = await this.userRepo.findById(ctx.userId);
    if (!user) {
      return err({ type: "NotFoundError", entity: "User", id: ctx.userId });
    }
    return ok(toUserDTO(user));
  }
}
