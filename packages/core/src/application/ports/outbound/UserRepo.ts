import type { User } from "../../../domain/user/User.js";
import type { UserId } from "../../../domain/shared/index.js";

export interface UserRepo {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
