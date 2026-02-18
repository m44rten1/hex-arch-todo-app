import type { User } from "@todo/core/domain/user/User.js";
import type { UserId } from "@todo/core/domain/shared/index.js";
import type { UserRepo } from "@todo/core/application/ports/outbound/UserRepo.js";

export class InMemoryUserRepo implements UserRepo {
  private readonly users = new Map<UserId, User>();

  async findById(id: UserId): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  clear(): void {
    this.users.clear();
  }
}
