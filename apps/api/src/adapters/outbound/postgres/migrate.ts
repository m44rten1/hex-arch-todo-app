import fs from "node:fs";
import path from "node:path";
import { sql } from "kysely";
import type { Db } from "./db.js";

export async function runMigrations(db: Db): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.execute(db);

  const migrationsDir = path.join(import.meta.dirname, "migrations");
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const { rows } = await db
      .selectFrom("_migrations")
      .select("name")
      .where("name", "=", file)
      .execute()
      .then(rows => ({ rows }));

    if (rows.length > 0) continue;

    const content = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    await sql.raw(content).execute(db);
    await db.insertInto("_migrations").values({ name: file }).execute();
  }
}
