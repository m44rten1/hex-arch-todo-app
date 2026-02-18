import pg from "pg";
import { Kysely, PostgresDialect } from "kysely";
import type { Database } from "./schema.js";

export type Db = Kysely<Database>;

export function createDb(connectionString: string): Db {
  const pool = new pg.Pool({ connectionString });
  return new Kysely<Database>({ dialect: new PostgresDialect({ pool }) });
}
