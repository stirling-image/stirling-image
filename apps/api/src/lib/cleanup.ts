import { mkdirSync } from "node:fs";
import { readdir, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { eq, lt } from "drizzle-orm";
import { env } from "../config.js";
import { db, schema } from "../db/index.js";

/**
 * Read the temp file max age from DB settings, falling back to env var.
 * Called each cleanup cycle so changes take effect without restart.
 */
export function getMaxAgeMs(): number {
  try {
    const row = db
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.key, "tempFileMaxAgeHours"))
      .get();
    if (row) {
      const hours = parseFloat(row.value);
      if (!isNaN(hours) && hours > 0) return hours * 60 * 60 * 1000;
    }
  } catch {
    /* DB not ready yet, use env */
  }
  return env.FILE_MAX_AGE_HOURS * 60 * 60 * 1000;
}

/**
 * Check whether startup cleanup should run.
 * Returns true by default; only returns false when explicitly set to "false".
 */
export function shouldRunStartupCleanup(): boolean {
  try {
    const row = db
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.key, "startupCleanup"))
      .get();
    return row ? row.value !== "false" : true;
  } catch {
    return true;
  }
}

export function startCleanupCron() {
  // Ensure workspace directory exists
  mkdirSync(env.WORKSPACE_PATH, { recursive: true });

  const intervalMs = env.CLEANUP_INTERVAL_MINUTES * 60 * 1000;

  const cleanup = async () => {
    const maxAgeMs = getMaxAgeMs();
    try {
      const entries = await readdir(env.WORKSPACE_PATH, { withFileTypes: true }).catch(() => []);
      const now = Date.now();
      let cleaned = 0;

      for (const entry of entries) {
        const fullPath = join(env.WORKSPACE_PATH, entry.name);
        try {
          const stats = await stat(fullPath);
          if (now - stats.mtimeMs > maxAgeMs) {
            await rm(fullPath, { recursive: true });
            cleaned++;
          }
        } catch {
          // Skip files that can't be stat'd
        }
      }

      if (cleaned > 0) {
        console.log(`Cleanup: removed ${cleaned} expired workspace entries`);
      }
    } catch (err) {
      console.error("Cleanup error:", err);
    }
  };

  // Purge expired sessions from the database
  const purgeExpiredSessions = () => {
    try {
      const now = new Date();
      const result = db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, now)).run();
      if (result.changes > 0) {
        console.log(`Cleanup: purged ${result.changes} expired sessions`);
      }
    } catch (err) {
      console.error("Session cleanup error:", err);
    }
  };

  // Run on startup only if setting allows it
  if (shouldRunStartupCleanup()) {
    cleanup();
    purgeExpiredSessions();
  }

  // Schedule recurring cleanup
  setInterval(cleanup, intervalMs);
  setInterval(purgeExpiredSessions, 60 * 60 * 1000); // Hourly
  console.log(
    `Cleanup scheduled: every ${env.CLEANUP_INTERVAL_MINUTES}m, max age configurable (env default: ${env.FILE_MAX_AGE_HOURS}h)`,
  );
}
