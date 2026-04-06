import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database, { type Database as DatabaseType } from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { env } from "../config.js";
import * as schema from "./schema.js";

// Ensure data directory exists
mkdirSync(dirname(env.DB_PATH), { recursive: true });

const sqlite: DatabaseType = new Database(env.DB_PATH);

// Critical SQLite pragmas for reliability.
// busy_timeout must be set first so journal_mode = WAL can retry
// if another connection holds the lock (e.g. parallel test files).
sqlite.pragma("busy_timeout = 5000");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("synchronous = NORMAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { schema, sqlite };
