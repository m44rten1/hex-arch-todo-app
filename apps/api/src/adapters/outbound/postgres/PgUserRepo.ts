import type { User } from "@todo/core/domain/user/User.js";
import type { UserId } from "@todo/core/domain/shared/index.js";
import { userId } from "@todo/core/domain/shared/index.js";
import type { UserRepo } from "@todo/core/application/ports/outbound/UserRepo.js";
import type { Db } from "./db.js";
import type { UsersTable } from "./schema.js";

function rowToUser(row: UsersTable): User {
  return {
    id: userId(row.id),
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PgUserRepo implements UserRepo {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async findById(id: UserId): Promise<User | null> {
    const row = await this.db
      .selectFrom("users")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    return row ? rowToUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db
      .selectFrom("users")
      .selectAll()
      .where("email", "=", email)
      .executeTakeFirst();
    return row ? rowToUser(row) : null;
  }

  async save(user: User): Promise<void> {
    await this.db
      .insertInto("users")
      .values({
        id: user.id,
        email: user.email,
        password_hash: user.passwordHash,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      })
      .onConflict(oc =>
        oc.column("id").doUpdateSet({
          email: user.email,
          password_hash: user.passwordHash,
          updated_at: user.updatedAt,
        }),
      )
      .execute();
  }
}
