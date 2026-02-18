import type { User } from "@todo/core/domain/user/User.js";
import type { UserId } from "@todo/core/domain/shared/index.js";
import { userId } from "@todo/core/domain/shared/index.js";
import type { UserRepo } from "@todo/core/application/ports/outbound/UserRepo.js";
import type { DbPool } from "./pool.js";

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

function rowToUser(row: UserRow): User {
  return {
    id: userId(row.id),
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PgUserRepo implements UserRepo {
  constructor(private readonly pool: DbPool) {}

  async findById(id: UserId): Promise<User | null> {
    const { rows } = await this.pool.query<UserRow>(
      "SELECT * FROM users WHERE id = $1",
      [id],
    );
    const row = rows[0];
    return row ? rowToUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await this.pool.query<UserRow>(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    const row = rows[0];
    return row ? rowToUser(row) : null;
  }

  async save(user: User): Promise<void> {
    await this.pool.query(
      `INSERT INTO users (id, email, password_hash, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash,
         updated_at = EXCLUDED.updated_at`,
      [user.id, user.email, user.passwordHash, user.createdAt, user.updatedAt],
    );
  }
}
