import type { User } from "../../domain/user/User.js";
import type { UserId } from "../../domain/shared/index.js";

export interface UserDTO {
  readonly id: UserId;
  readonly email: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AuthDTO {
  readonly token: string;
  readonly user: UserDTO;
}

export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
