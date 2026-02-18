import type { User } from "@todo/core/domain/user/User.js";
import type { Workspace } from "@todo/core/domain/workspace/Workspace.js";
import type { UserRegistrationStore } from "@todo/core/application/ports/outbound/UserRegistrationStore.js";
import type { Db } from "./db.js";

export class PgUserRegistrationStore implements UserRegistrationStore {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const row = await this.db
      .selectFrom("users")
      .select("id")
      .where("email", "=", email)
      .limit(1)
      .executeTakeFirst();
    return row !== undefined;
  }

  async save(user: User, workspace: Workspace): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      await trx
        .insertInto("users")
        .values({
          id: user.id,
          email: user.email,
          password_hash: user.passwordHash,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
        })
        .execute();

      await trx
        .insertInto("workspaces")
        .values({
          id: workspace.id,
          name: workspace.name,
          owner_user_id: workspace.ownerUserId,
          created_at: workspace.createdAt,
          updated_at: workspace.updatedAt,
        })
        .execute();
    });
  }
}
