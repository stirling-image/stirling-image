/**
 * Tests for cleanup.ts helper functions:
 * getMaxAgeMs and shouldRunStartupCleanup.
 *
 * These test the DB-backed settings lookup with fallback to env vars.
 * Requires migrations to be run first (shared DB from vitest env).
 */

import { eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { db, schema } from "../../../apps/api/src/db/index.js";
import { runMigrations } from "../../../apps/api/src/db/migrate.js";
import { getMaxAgeMs, shouldRunStartupCleanup } from "../../../apps/api/src/lib/cleanup.js";

// Run migrations once to ensure the settings table exists
beforeAll(() => {
  runMigrations();
});

// Helper to insert a setting
function setSetting(key: string, value: string) {
  const existing = db.select().from(schema.settings).where(eq(schema.settings.key, key)).get();
  if (existing) {
    db.update(schema.settings)
      .set({ value, updatedAt: new Date() })
      .where(eq(schema.settings.key, key))
      .run();
  } else {
    db.insert(schema.settings).values({ key, value }).run();
  }
}

// Helper to remove a setting
function removeSetting(key: string) {
  db.delete(schema.settings).where(eq(schema.settings.key, key)).run();
}

afterEach(() => {
  removeSetting("tempFileMaxAgeHours");
  removeSetting("startupCleanup");
});

// ═══════════════════════════════════════════════════════════════════════════
// getMaxAgeMs
// ═══════════════════════════════════════════════════════════════════════════
describe("getMaxAgeMs", () => {
  it("returns DB value when tempFileMaxAgeHours is set", () => {
    setSetting("tempFileMaxAgeHours", "48");
    const result = getMaxAgeMs();
    expect(result).toBe(48 * 60 * 60 * 1000);
  });

  it("returns env fallback when no DB setting exists", () => {
    removeSetting("tempFileMaxAgeHours");
    const result = getMaxAgeMs();
    // vitest.config.ts sets FILE_MAX_AGE_HOURS=1
    expect(result).toBe(1 * 60 * 60 * 1000);
  });

  it("returns env fallback for invalid (non-numeric) DB value", () => {
    setSetting("tempFileMaxAgeHours", "notanumber");
    const result = getMaxAgeMs();
    expect(result).toBe(1 * 60 * 60 * 1000);
  });

  it("returns env fallback for zero or negative DB value", () => {
    setSetting("tempFileMaxAgeHours", "0");
    const result = getMaxAgeMs();
    expect(result).toBe(1 * 60 * 60 * 1000);

    setSetting("tempFileMaxAgeHours", "-5");
    const result2 = getMaxAgeMs();
    expect(result2).toBe(1 * 60 * 60 * 1000);
  });

  it("handles fractional hours", () => {
    setSetting("tempFileMaxAgeHours", "0.5");
    const result = getMaxAgeMs();
    expect(result).toBe(0.5 * 60 * 60 * 1000);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// shouldRunStartupCleanup
// ═══════════════════════════════════════════════════════════════════════════
describe("shouldRunStartupCleanup", () => {
  it("returns false when setting is 'false'", () => {
    setSetting("startupCleanup", "false");
    expect(shouldRunStartupCleanup()).toBe(false);
  });

  it("returns true when setting is 'true'", () => {
    setSetting("startupCleanup", "true");
    expect(shouldRunStartupCleanup()).toBe(true);
  });

  it("returns true when setting is not set", () => {
    removeSetting("startupCleanup");
    expect(shouldRunStartupCleanup()).toBe(true);
  });

  it("returns true for any value other than 'false'", () => {
    setSetting("startupCleanup", "yes");
    expect(shouldRunStartupCleanup()).toBe(true);

    setSetting("startupCleanup", "1");
    expect(shouldRunStartupCleanup()).toBe(true);
  });
});
