import type { User } from "@todo/core/domain/user/User.js";
import type { Workspace } from "@todo/core/domain/workspace/Workspace.js";
import type { UserRegistrationStore } from "@todo/core/application/ports/outbound/UserRegistrationStore.js";
import type { DbPool } from "./pool.js";

export class PgUserRegistrationStore implements UserRegistrationStore {
  private readonly pool: DbPool;

  constructor(pool: DbPool) {
    this.pool = pool;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const { rows } = await this.pool.query<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) AS exists",
      [email],
    );
    return rows[0]?.exists ?? false;
  }

  async save(user: User, workspace: Workspace): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, user.email, user.passwordHash, user.createdAt, user.updatedAt],
      );
      await client.query(
        `INSERT INTO workspaces (id, name, owner_user_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [workspace.id, workspace.name, workspace.ownerUserId, workspace.createdAt, workspace.updatedAt],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
