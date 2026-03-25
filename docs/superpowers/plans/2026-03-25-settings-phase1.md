# Settings Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 admin features to the settings dialog: teams management, tool disabling, feature flags, temp file management, and custom branding/logo upload.

**Architecture:** Extend the existing settings key-value store and settings dialog. New `teams` table for team CRUD. New API routes for teams and logo. Frontend filters tools based on settings. All changes build on existing patterns (Fastify routes, Drizzle ORM, React dialog with sidebar nav).

**Tech Stack:** Fastify, Drizzle ORM (SQLite), React, Vite, Sharp, Vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-03-25-settings-phase1-design.md`

---

## File Map

### New Files
| File | Purpose |
|---|---|
| `apps/api/drizzle/0005_add_teams_table.sql` | Migration: create teams table, seed Default, convert users.team |
| `apps/api/drizzle/meta/0005_snapshot.json` | Drizzle migration snapshot |
| `apps/api/src/routes/teams.ts` | Teams CRUD API routes |
| `apps/api/src/routes/branding.ts` | Logo upload/serve/delete API routes |
| `tests/api/teams.test.ts` | Teams API tests |
| `tests/api/branding.test.ts` | Logo API tests |
| `tests/api/settings-phase1.test.ts` | Tests for new settings keys (disabledTools, experimentalTools, tempFile, startupCleanup) |
| `tests/api/cleanup.test.ts` | Cleanup system tests with DB-backed settings |
| `tests/e2e/settings-teams.spec.ts` | E2E: Teams management UI |
| `tests/e2e/settings-tools.spec.ts` | E2E: Tool disabling UI |
| `tests/e2e/settings-system.spec.ts` | E2E: Feature flags, temp file, logo upload UI |

### Modified Files
| File | What Changes |
|---|---|
| `packages/shared/src/types.ts` | Rename `alpha` to `experimental` on Tool interface |
| `packages/shared/src/constants.ts` | Update any tools using `alpha` to use `experimental` |
| `packages/shared/src/i18n/en.ts` | Add translation keys for teams, tools sections |
| `apps/api/src/db/schema.ts` | Add `teams` table definition |
| `apps/api/src/index.ts` | Register teams routes, branding routes, pass settings to tool registration |
| `apps/api/src/routes/tools/index.ts` | Filter out disabled/experimental tools on startup |
| `apps/api/src/lib/cleanup.ts` | Read tempFileMaxAgeHours from DB settings, respect startupCleanup |
| `apps/api/src/plugins/auth.ts` | Add `/api/v1/settings/logo` to PUBLIC_PATHS, update register/update endpoints to use team IDs |
| `apps/web/src/components/settings/settings-dialog.tsx` | Add Teams, Tools sections; add feature flags/temp/logo to System Settings; update People section team dropdown |
| `apps/web/src/components/layout/tool-panel.tsx` | Filter disabled/experimental tools |
| `apps/web/src/components/layout/app-layout.tsx` | Load custom logo |
| `apps/web/src/components/tools/pipeline-builder.tsx` | Filter disabled/experimental tools from picker |
| `apps/web/src/components/common/tool-card.tsx` | Rename `alpha` badge to `experimental` |
| `apps/web/src/pages/fullscreen-grid-page.tsx` | Rename `alpha` badge, filter disabled/experimental tools |

---

## Task 1: Teams — Database & Migration

**Files:**
- Modify: `apps/api/src/db/schema.ts`
- Create: `apps/api/drizzle/0005_add_teams_table.sql`
- Modify: `apps/api/drizzle/meta/_journal.json`

- [ ] **Step 1: Add teams table to Drizzle schema**

In `apps/api/src/db/schema.ts`, add after the `users` table:

```typescript
export const teams = sqliteTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
```

- [ ] **Step 2: Create migration SQL file**

Create `apps/api/drizzle/0005_add_teams_table.sql`:

```sql
-- Create teams table
CREATE TABLE IF NOT EXISTS `teams` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `created_at` integer NOT NULL DEFAULT (unixepoch())
);
CREATE UNIQUE INDEX IF NOT EXISTS `teams_name_unique` ON `teams` (`name`);

-- Seed Default team with a known UUID
INSERT OR IGNORE INTO `teams` (`id`, `name`, `created_at`) VALUES ('default-team-00000000', 'Default', unixepoch());

-- Migrate existing users: for each distinct team value, create a team if it doesn't exist
-- Then update users.team from the string name to the team ID
-- Note: For fresh installs, all users have team='Default' which maps to 'default-team-00000000'
-- For existing installs with custom team strings, we handle them here:
INSERT OR IGNORE INTO `teams` (`id`, `name`, `created_at`)
  SELECT lower(hex(randomblob(16))), `team`, unixepoch()
  FROM `users`
  WHERE `team` != 'Default'
  GROUP BY `team`;

-- Update users to reference team IDs instead of team names
UPDATE `users` SET `team` = (
  SELECT `id` FROM `teams` WHERE `teams`.`name` = `users`.`team`
) WHERE EXISTS (
  SELECT 1 FROM `teams` WHERE `teams`.`name` = `users`.`team`
);
```

- [ ] **Step 3: Update the Drizzle journal**

Add entry for migration 0005 to `apps/api/drizzle/meta/_journal.json`. Follow the pattern of existing entries (idx: 5, tag: "0005_add_teams_table"). Existing entries go up to idx 4.

- [ ] **Step 4: Generate Drizzle snapshot**

Create `apps/api/drizzle/meta/0005_snapshot.json` matching the updated schema. Can use `npx drizzle-kit generate` or manually create based on `0003_snapshot.json` pattern with the teams table added.

- [ ] **Step 5: Verify migration runs**

Run: `npm run dev` (or the dev command) briefly to verify the migration applies without errors. Check the database has the `teams` table with a "Default" row.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/db/schema.ts apps/api/drizzle/
git commit -m "feat(db): add teams table and migration"
```

---

## Task 2: Teams — API Routes

**Files:**
- Create: `apps/api/src/routes/teams.ts`
- Modify: `apps/api/src/index.ts`
- Create: `tests/api/teams.test.ts`

- [ ] **Step 1: Write failing tests for teams CRUD**

Create `tests/api/teams.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from "vitest";

// Test helper: create a Fastify app instance with auth + teams routes
// Use the same test setup pattern from existing tests

describe("Teams API", () => {
  describe("GET /api/v1/teams", () => {
    it("returns list of teams with member counts", async () => {
      // Should return at least the Default team
      // Response shape: { teams: [{ id, name, memberCount, createdAt }] }
    });

    it("requires authentication", async () => {
      // 401 without token
    });
  });

  describe("POST /api/v1/teams", () => {
    it("creates a new team", async () => {
      // Body: { name: "Engineering" }
      // Response: { team: { id, name, createdAt } }
    });

    it("requires admin role", async () => {
      // 403 for non-admin
    });

    it("rejects duplicate team names (case-insensitive)", async () => {
      // 409 for duplicate
    });

    it("rejects empty or whitespace-only names", async () => {
      // 400 for validation error
    });

    it("rejects names longer than 50 characters", async () => {
      // 400 for validation error
    });

    it("trims whitespace from names", async () => {
      // " Marketing " -> "Marketing"
    });
  });

  describe("PUT /api/v1/teams/:id", () => {
    it("renames a team", async () => {
      // Body: { name: "New Name" }
    });

    it("requires admin role", async () => {});

    it("rejects rename to existing name", async () => {});

    it("returns 404 for non-existent team", async () => {});
  });

  describe("DELETE /api/v1/teams/:id", () => {
    it("deletes an empty team", async () => {});

    it("rejects deletion of team with members", async () => {
      // 409: "Cannot delete team with assigned members"
    });

    it("rejects deletion of Default team", async () => {
      // 409: "Cannot delete the Default team"
    });

    it("requires admin role", async () => {});

    it("returns 404 for non-existent team", async () => {});
  });
});
```

Fill in each test with actual HTTP calls using the app's test harness. Follow existing test patterns from the codebase.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/api/teams.test.ts`
Expected: All tests FAIL (routes don't exist yet)

- [ ] **Step 3: Implement teams routes**

Create `apps/api/src/routes/teams.ts`:

```typescript
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db, schema } from "../db/index.js";
import { requireAuth, requireAdmin } from "../plugins/auth.js";

export async function teamsRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/v1/teams — List all teams with member counts
  app.get("/api/v1/teams", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request, reply);
    if (!user) return;

    const teams = db
      .select({
        id: schema.teams.id,
        name: schema.teams.name,
        createdAt: schema.teams.createdAt,
        memberCount: sql<number>`(SELECT COUNT(*) FROM users WHERE users.team = ${schema.teams.id})`,
      })
      .from(schema.teams)
      .all();

    return reply.send({ teams });
  });

  // POST /api/v1/teams — Create team
  app.post("/api/v1/teams", async (request: FastifyRequest, reply: FastifyReply) => {
    const admin = requireAdmin(request, reply);
    if (!admin) return;

    const body = request.body as { name?: string } | null;
    const name = body?.name?.trim();

    if (!name || name.length === 0) {
      return reply.status(400).send({ error: "Team name is required", code: "VALIDATION_ERROR" });
    }
    if (name.length > 50) {
      return reply.status(400).send({ error: "Team name must be 50 characters or less", code: "VALIDATION_ERROR" });
    }

    // Case-insensitive uniqueness check
    const existing = db.select().from(schema.teams).all()
      .find(t => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      return reply.status(409).send({ error: "A team with this name already exists", code: "DUPLICATE" });
    }

    const team = {
      id: randomUUID(),
      name,
      createdAt: new Date(),
    };
    db.insert(schema.teams).values(team).run();

    return reply.status(201).send({ team });
  });

  // PUT /api/v1/teams/:id — Rename team
  app.put("/api/v1/teams/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const admin = requireAdmin(request, reply);
    if (!admin) return;

    const { id } = request.params;
    const body = request.body as { name?: string } | null;
    const name = body?.name?.trim();

    if (!name || name.length === 0) {
      return reply.status(400).send({ error: "Team name is required", code: "VALIDATION_ERROR" });
    }
    if (name.length > 50) {
      return reply.status(400).send({ error: "Team name must be 50 characters or less", code: "VALIDATION_ERROR" });
    }

    const team = db.select().from(schema.teams).where(eq(schema.teams.id, id)).get();
    if (!team) {
      return reply.status(404).send({ error: "Team not found", code: "NOT_FOUND" });
    }

    const existing = db.select().from(schema.teams).all()
      .find(t => t.name.toLowerCase() === name.toLowerCase() && t.id !== id);
    if (existing) {
      return reply.status(409).send({ error: "A team with this name already exists", code: "DUPLICATE" });
    }

    db.update(schema.teams).set({ name }).where(eq(schema.teams.id, id)).run();
    return reply.send({ team: { ...team, name } });
  });

  // DELETE /api/v1/teams/:id — Delete team
  app.delete("/api/v1/teams/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const admin = requireAdmin(request, reply);
    if (!admin) return;

    const { id } = request.params;
    const team = db.select().from(schema.teams).where(eq(schema.teams.id, id)).get();
    if (!team) {
      return reply.status(404).send({ error: "Team not found", code: "NOT_FOUND" });
    }

    if (team.name === "Default") {
      return reply.status(409).send({ error: "Cannot delete the Default team", code: "PROTECTED" });
    }

    const memberCount = db.select({ count: sql<number>`COUNT(*)` })
      .from(schema.users)
      .where(eq(schema.users.team, id))
      .get();

    if (memberCount && memberCount.count > 0) {
      return reply.status(409).send({ error: "Cannot delete team with assigned members", code: "HAS_MEMBERS" });
    }

    db.delete(schema.teams).where(eq(schema.teams.id, id)).run();
    return reply.send({ ok: true });
  });

  app.log.info("Teams routes registered");
}
```

- [ ] **Step 4: Register teams routes in index.ts**

In `apps/api/src/index.ts`, add import and registration:

```typescript
import { teamsRoutes } from "./routes/teams.js";
// Register after settingsRoutes
teamsRoutes(app);
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/api/teams.test.ts`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/routes/teams.ts apps/api/src/index.ts tests/api/teams.test.ts
git commit -m "feat(api): add teams CRUD routes with tests"
```

---

## Task 2b: Update auth.ts — Team ID References

**Files:**
- Modify: `apps/api/src/plugins/auth.ts`

After migration, `users.team` stores team UUIDs, not string names. The auth routes that create/update users must be updated.

- [ ] **Step 1: Update register endpoint to use Default team ID**

In `apps/api/src/plugins/auth.ts`, find the register endpoint (`POST /api/auth/register`). Where it sets `team`, look up the Default team ID instead of using the string `"Default"`:

```typescript
// Before: team: body.team || "Default"
// After:
const defaultTeam = db.select().from(schema.teams).where(eq(schema.teams.name, "Default")).get();
const teamId = body.team || defaultTeam?.id || "default-team-00000000";
// Validate team exists if a specific team was provided
if (body.team) {
  const teamExists = db.select().from(schema.teams).where(eq(schema.teams.id, body.team)).get();
  if (!teamExists) {
    return reply.status(400).send({ error: "Team not found", code: "VALIDATION_ERROR" });
  }
}
```

- [ ] **Step 2: Update user update endpoint to validate team ID**

In the `PUT /api/auth/users/:id` endpoint, validate that the team ID exists:

```typescript
if (body.team) {
  const teamExists = db.select().from(schema.teams).where(eq(schema.teams.id, body.team)).get();
  if (!teamExists) {
    return reply.status(400).send({ error: "Team not found", code: "VALIDATION_ERROR" });
  }
}
```

- [ ] **Step 3: Update People section team dropdown in settings-dialog.tsx**

The People section currently shows team as free text. Update it to fetch from `GET /api/v1/teams` and render a `<select>` dropdown of team IDs/names.

- [ ] **Step 4: Verify team assignment works**

Create a user via People section, assign to a team, verify it saves correctly.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/plugins/auth.ts apps/web/src/components/settings/settings-dialog.tsx
git commit -m "feat(api): update auth routes to use team IDs instead of strings"
```

---

## Task 3: Rename `alpha` to `experimental` in Tool Type

**Files:**
- Modify: `packages/shared/src/types.ts`
- Modify: `packages/shared/src/constants.ts`
- Modify: `apps/web/src/components/common/tool-card.tsx`
- Modify: `apps/web/src/pages/fullscreen-grid-page.tsx`

- [ ] **Step 1: Rename in types.ts**

In `packages/shared/src/types.ts`, change `alpha?: boolean` to `experimental?: boolean`.

- [ ] **Step 2: Update constants.ts**

Search for any tools with `alpha: true` in `packages/shared/src/constants.ts` and rename the field to `experimental: true`.

- [ ] **Step 3: Update tool-card.tsx**

In `apps/web/src/components/common/tool-card.tsx`, change the alpha badge rendering:

```typescript
// Before:
{tool.alpha && (
  <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 font-medium">
    Alpha
  </span>
)}

// After:
{tool.experimental && (
  <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 font-medium">
    Experimental
  </span>
)}
```

- [ ] **Step 4: Update fullscreen-grid-page.tsx**

In `apps/web/src/pages/fullscreen-grid-page.tsx`, find and rename `tool.alpha` to `tool.experimental` (badge rendering around line 185).

- [ ] **Step 5: Search for any other references to `alpha` on Tool**

Run: `grep -r "\.alpha" packages/ apps/ --include="*.ts" --include="*.tsx"` to find any other references that need updating.

- [ ] **Step 6: Verify build succeeds**

Run: `npm run build` (or `npx tsc --noEmit`)
Expected: No type errors

- [ ] **Step 7: Commit**

```bash
git add packages/shared/src/types.ts packages/shared/src/constants.ts apps/web/src/components/common/tool-card.tsx apps/web/src/pages/fullscreen-grid-page.tsx
git commit -m "refactor: rename Tool.alpha to Tool.experimental"
```

---

## Task 4: Tool Disabling & Feature Flags — Backend

**Files:**
- Modify: `apps/api/src/routes/tools/index.ts`
- Modify: `apps/api/src/index.ts`
- Create: `tests/api/settings-phase1.test.ts`

- [ ] **Step 1: Write failing tests for tool filtering**

Create `tests/api/settings-phase1.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("Tool Disabling", () => {
  it("disabled tools return 404 after restart simulation", async () => {
    // Set disabledTools setting to include "resize"
    // Restart the app (or re-register routes)
    // POST /api/v1/tools/resize should 404
  });

  it("non-disabled tools still work", async () => {
    // POST /api/v1/tools/crop should still work
  });
});

describe("Feature Flags", () => {
  it("experimental tools are excluded when flag is off", async () => {
    // Mark a tool as experimental in registry
    // With enableExperimentalTools = false, tool route should not exist
  });

  it("experimental tools are available when flag is on", async () => {
    // With enableExperimentalTools = true, tool route should exist
  });
});

describe("Settings keys", () => {
  it("can save and retrieve disabledTools as JSON array", async () => {
    // PUT /api/v1/settings { disabledTools: '["resize","crop"]' }
    // GET /api/v1/settings -> includes disabledTools
  });

  it("can save and retrieve enableExperimentalTools", async () => {});
  it("can save and retrieve tempFileMaxAgeHours", async () => {});
  it("can save and retrieve startupCleanup", async () => {});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/api/settings-phase1.test.ts`
Expected: FAIL

- [ ] **Step 3: Modify tool registration to respect disabled/experimental settings**

In `apps/api/src/routes/tools/index.ts`, modify `registerToolRoutes` to accept settings and filter:

```typescript
import { TOOLS } from "@stirling-image/shared";
import { db, schema } from "../../db/index.js";

export function registerToolRoutes(app: FastifyInstance) {
  // Read disabled tools from settings
  const disabledRow = db.select().from(schema.settings)
    .where(eq(schema.settings.key, "disabledTools")).get();
  const disabledTools: string[] = disabledRow
    ? JSON.parse(disabledRow.value)
    : [];

  // Read experimental flag
  const expRow = db.select().from(schema.settings)
    .where(eq(schema.settings.key, "enableExperimentalTools")).get();
  const enableExperimental = expRow?.value === "true";

  // Get experimental tool IDs from shared constants
  const experimentalToolIds = TOOLS
    .filter(t => t.experimental)
    .map(t => t.id);

  // Build skip set
  const skipTools = new Set([
    ...disabledTools,
    ...(enableExperimental ? [] : experimentalToolIds),
  ]);

  // The current code has individual registerXxx(app) calls.
  // Wrap each call in a conditional. Create a mapping object:
  const toolRegistrations: Array<{ id: string; register: (app: FastifyInstance) => void }> = [
    { id: "resize", register: registerResize },
    { id: "crop", register: registerCrop },
    // ... one entry per tool, mapping tool ID to its registration function
  ];

  let skipped = 0;
  for (const { id, register } of toolRegistrations) {
    if (skipTools.has(id)) {
      app.log.info(`Skipping disabled/experimental tool: ${id}`);
      skipped++;
      continue;
    }
    register(app);
  }

  app.log.info(`Tool routes registered (skipped ${skipped} disabled/experimental tools)`);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/api/settings-phase1.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/routes/tools/index.ts tests/api/settings-phase1.test.ts
git commit -m "feat(api): filter disabled and experimental tools on startup"
```

---

## Task 5: Temp File Management — Backend

**Files:**
- Modify: `apps/api/src/lib/cleanup.ts`
- Create: `tests/api/cleanup.test.ts`

- [ ] **Step 1: Write failing tests for DB-backed cleanup settings**

Create `tests/api/cleanup.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";

describe("Cleanup with DB settings", () => {
  it("uses tempFileMaxAgeHours from DB when set", async () => {
    // Insert setting tempFileMaxAgeHours = "2"
    // Run cleanup
    // Files older than 2 hours should be cleaned, files newer should remain
  });

  it("falls back to env FILE_MAX_AGE_HOURS when DB setting not set", async () => {
    // No DB setting
    // Should use env default (24 or test value)
  });

  it("respects startupCleanup=false by not running on init", async () => {
    // Set startupCleanup = "false"
    // Call startCleanupCron
    // Old files should NOT be cleaned immediately
  });

  it("respects startupCleanup=true by running on init", async () => {
    // Set startupCleanup = "true" (or not set, default is true)
    // Call startCleanupCron
    // Old files should be cleaned
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/api/cleanup.test.ts`
Expected: FAIL

- [ ] **Step 3: Modify cleanup.ts to read from DB**

Update `apps/api/src/lib/cleanup.ts`:

```typescript
import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";

function getMaxAgeMs(): number {
  // Try DB setting first
  const row = db.select().from(schema.settings)
    .where(eq(schema.settings.key, "tempFileMaxAgeHours")).get();
  if (row) {
    const hours = parseFloat(row.value);
    if (!isNaN(hours) && hours > 0) return hours * 60 * 60 * 1000;
  }
  // Fall back to env
  return env.FILE_MAX_AGE_HOURS * 60 * 60 * 1000;
}

function shouldRunStartupCleanup(): boolean {
  const row = db.select().from(schema.settings)
    .where(eq(schema.settings.key, "startupCleanup")).get();
  // Default to true if not set
  return row ? row.value !== "false" : true;
}

export function startCleanupCron() {
  // ... existing setup
  const cleanup = async () => {
    const maxAgeMs = getMaxAgeMs(); // Re-read each cycle
    // ... rest of cleanup logic using maxAgeMs
  };

  // Only run on startup if setting allows
  if (shouldRunStartupCleanup()) {
    cleanup();
  }

  setInterval(cleanup, intervalMs);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/api/cleanup.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/lib/cleanup.ts tests/api/cleanup.test.ts
git commit -m "feat(api): read temp file settings from DB with env fallback"
```

---

## Task 6: Custom Branding — Logo API Routes

**Files:**
- Create: `apps/api/src/routes/branding.ts`
- Modify: `apps/api/src/index.ts`
- Modify: `apps/api/src/plugins/auth.ts`
- Create: `tests/api/branding.test.ts`

- [ ] **Step 1: Write failing tests for logo API**

Create `tests/api/branding.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("Logo Branding API", () => {
  describe("POST /api/v1/settings/logo", () => {
    it("uploads a PNG logo and stores it", async () => {
      // Upload a small PNG
      // Response: { ok: true }
      // GET /api/v1/settings/logo should return the image
    });

    it("uploads a JPEG and converts to PNG", async () => {
      // Upload JPEG, verify GET returns PNG content-type
    });

    it("rejects files over 500KB", async () => {
      // 400 error
    });

    it("uploads an SVG and converts to PNG", async () => {
      // Upload a small SVG, verify GET returns image/png content-type
    });

    it("rejects non-image files", async () => {
      // 400 error for text/pdf etc
    });

    it("requires admin role", async () => {
      // 403 for non-admin
    });

    it("resizes large images to max 128x128", async () => {
      // Upload 1000x1000 PNG
      // GET logo, check dimensions are <= 128x128
    });
  });

  describe("GET /api/v1/settings/logo", () => {
    it("returns 404 when no custom logo is set", async () => {});

    it("returns the logo with correct content-type after upload", async () => {
      // Content-Type: image/png
    });

    it("works without authentication (public path)", async () => {
      // No auth header, should still return logo
    });
  });

  describe("DELETE /api/v1/settings/logo", () => {
    it("removes the custom logo", async () => {
      // Upload, then delete
      // GET should return 404
    });

    it("requires admin role", async () => {});

    it("returns ok even if no logo exists", async () => {
      // Idempotent delete
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/api/branding.test.ts`
Expected: FAIL

- [ ] **Step 3: Add logo path to PUBLIC_PATHS**

In `apps/api/src/plugins/auth.ts`, add to the `PUBLIC_PATHS` array:

```typescript
const PUBLIC_PATHS = ["/api/v1/health", "/api/v1/config/", "/api/auth/", "/api/v1/download/", "/api/v1/jobs/", "/api/v1/settings/logo"];
```

- [ ] **Step 4: Implement branding routes**

Create `apps/api/src/routes/branding.ts`:

```typescript
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq } from "drizzle-orm";
import { existsSync, mkdirSync, unlinkSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import { db, schema } from "../db/index.js";
import { requireAdmin } from "../plugins/auth.js";

const BRANDING_DIR = join(process.cwd(), "data", "branding");
const LOGO_PATH = join(BRANDING_DIR, "logo.png");
const MAX_LOGO_SIZE = 500 * 1024; // 500KB

export async function brandingRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/v1/settings/logo — Upload logo
  app.post("/api/v1/settings/logo", async (request: FastifyRequest, reply: FastifyReply) => {
    const admin = requireAdmin(request, reply);
    if (!admin) return;

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: "No file uploaded", code: "VALIDATION_ERROR" });
    }

    // Validate mime type
    if (!data.mimetype.startsWith("image/")) {
      return reply.status(400).send({ error: "File must be an image", code: "VALIDATION_ERROR" });
    }

    const buffer = await data.toBuffer();
    if (buffer.length > MAX_LOGO_SIZE) {
      return reply.status(400).send({ error: "File must be under 500KB", code: "VALIDATION_ERROR" });
    }

    // Convert to PNG and resize
    const processed = await sharp(buffer)
      .resize(128, 128, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();

    // Ensure directory exists and write
    mkdirSync(BRANDING_DIR, { recursive: true });
    writeFileSync(LOGO_PATH, processed);

    // Update setting
    const now = new Date();
    const existing = db.select().from(schema.settings)
      .where(eq(schema.settings.key, "customLogo")).get();
    if (existing) {
      db.update(schema.settings).set({ value: "true", updatedAt: now })
        .where(eq(schema.settings.key, "customLogo")).run();
    } else {
      db.insert(schema.settings).values({ key: "customLogo", value: "true", updatedAt: now }).run();
    }

    return reply.send({ ok: true });
  });

  // GET /api/v1/settings/logo — Serve logo (public)
  app.get("/api/v1/settings/logo", async (_request: FastifyRequest, reply: FastifyReply) => {
    if (!existsSync(LOGO_PATH)) {
      return reply.status(404).send({ error: "No custom logo set", code: "NOT_FOUND" });
    }

    const buffer = readFileSync(LOGO_PATH);
    return reply.type("image/png").send(buffer);
  });

  // DELETE /api/v1/settings/logo — Remove logo
  app.delete("/api/v1/settings/logo", async (request: FastifyRequest, reply: FastifyReply) => {
    const admin = requireAdmin(request, reply);
    if (!admin) return;

    if (existsSync(LOGO_PATH)) {
      unlinkSync(LOGO_PATH);
    }

    // Update setting
    const now = new Date();
    const existing = db.select().from(schema.settings)
      .where(eq(schema.settings.key, "customLogo")).get();
    if (existing) {
      db.update(schema.settings).set({ value: "false", updatedAt: now })
        .where(eq(schema.settings.key, "customLogo")).run();
    }

    return reply.send({ ok: true });
  });

  app.log.info("Branding routes registered");
}
```

- [ ] **Step 5: Register branding routes in index.ts**

In `apps/api/src/index.ts`:

```typescript
import { brandingRoutes } from "./routes/branding.js";
// Register after settingsRoutes
brandingRoutes(app);
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run tests/api/branding.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/routes/branding.ts apps/api/src/plugins/auth.ts apps/api/src/index.ts tests/api/branding.test.ts
git commit -m "feat(api): add logo upload/serve/delete routes with tests"
```

---

## Task 7: i18n — Add Translation Keys

**Files:**
- Modify: `packages/shared/src/i18n/en.ts`

- [ ] **Step 1: Add translation keys for new sections**

In `packages/shared/src/i18n/en.ts`, add under the `settings` section:

```typescript
teams: {
  title: "Teams",
  description: "Manage teams and organize workspace members",
  createTeam: "Create New Team",
  teamName: "Team Name",
  totalMembers: "Total Members",
  rename: "Rename",
  delete: "Delete",
  deleteConfirm: "Are you sure you want to delete this team?",
  cannotDeleteDefault: "Cannot delete the Default team",
  cannotDeleteWithMembers: "Cannot delete a team with assigned members",
  namePlaceholder: "Enter team name",
  nameRequired: "Team name is required",
  nameTooLong: "Team name must be 50 characters or less",
  duplicateName: "A team with this name already exists",
},
tools: {
  title: "Tools",
  description: "Enable or disable tools for all users",
  searchPlaceholder: "Search tools...",
  enabled: "Enabled",
  disabled: "Disabled",
  restartRequired: "Restart required for changes to take effect",
  toolUnavailable: "Tool unavailable",
},
experimental: {
  label: "Enable Experimental Tools",
  description: "Show tools that are still in development. These may be unstable.",
},
fileManagement: {
  title: "File Management",
  maxAge: "Max File Age (hours)",
  maxAgeDescription: "How long processed files are kept before automatic cleanup",
  startupCleanup: "Startup Cleanup",
  startupCleanupDescription: "Clean up old temporary files when the server starts",
},
branding: {
  logo: "Custom Logo",
  logoDescription: "Upload a custom logo for the sidebar and navbar",
  uploadLogo: "Upload Logo",
  removeLogo: "Remove Logo",
  logoRequirements: "PNG, SVG, or JPEG. Max 500KB.",
  dragDrop: "Drag and drop or click to upload",
},
```

- [ ] **Step 2: Commit**

```bash
git add packages/shared/src/i18n/en.ts
git commit -m "feat(i18n): add translation keys for teams, tools, and system settings"
```

---

## Task 8: Frontend — Settings Dialog: Teams Section

**Files:**
- Modify: `apps/web/src/components/settings/settings-dialog.tsx`

- [ ] **Step 1: Add Teams to Section type and NAV_ITEMS**

Update the `Section` type:
```typescript
type Section = "general" | "system" | "security" | "people" | "teams" | "api-keys" | "tools" | "about";
```

Add to `NAV_ITEMS` (after "people"):
```typescript
{ id: "teams", label: "Teams", icon: UsersRound },  // import UsersRound from lucide-react
```

Add to `NAV_ITEMS` (after "api-keys"):
```typescript
{ id: "tools", label: "Tools", icon: Wrench },  // import Wrench from lucide-react
```

Add section rendering:
```typescript
{section === "teams" && <TeamsSection />}
{section === "tools" && <ToolsSection />}
```

- [ ] **Step 2: Implement TeamsSection component**

Add inside `settings-dialog.tsx` (or extract to a separate file if the dialog is getting large):

```typescript
function TeamsSection() {
  const [teams, setTeams] = useState<Array<{ id: string; name: string; memberCount: number; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    try {
      const data = await apiGet<{ teams: typeof teams }>("/v1/teams");
      setTeams(data.teams);
    } catch { /* handle error */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      await apiPost("/v1/teams", { name: newName });
      setNewName("");
      fetchTeams();
    } catch (e: any) {
      setError(e?.message || "Failed to create team");
    } finally { setCreating(false); }
  };

  const handleRename = async (id: string) => {
    setError(null);
    try {
      await apiPut(`/v1/teams/${id}`, { name: editName });
      setEditingId(null);
      fetchTeams();
    } catch (e: any) {
      setError(e?.message || "Failed to rename team");
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await apiDelete(`/v1/teams/${id}`);
      fetchTeams();
    } catch (e: any) {
      setError(e?.message || "Failed to delete team");
    }
  };

  // Render: header, create form, teams table with actions
  // Follow existing UI patterns (SettingRow, cards, etc.)
}
```

- [ ] **Step 3: Verify it renders correctly**

Run dev server, open settings, navigate to Teams tab. Verify:
- Default team shows with member count
- Can create a new team
- Can rename a team
- Can delete an empty team
- Cannot delete Default team or team with members

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/settings/settings-dialog.tsx
git commit -m "feat(ui): add Teams section to settings dialog"
```

---

## Task 9: Frontend — Settings Dialog: Tools Section

**Files:**
- Modify: `apps/web/src/components/settings/settings-dialog.tsx`

- [ ] **Step 1: Implement ToolsSection component**

```typescript
function ToolsSection() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiGet<{ settings: Record<string, string> }>("/v1/settings")
      .then((data) => setSettings(data.settings))
      .finally(() => setLoading(false));
  }, []);

  const disabledTools: string[] = settings.disabledTools
    ? JSON.parse(settings.disabledTools)
    : [];

  const toggleTool = (toolId: string) => {
    const updated = disabledTools.includes(toolId)
      ? disabledTools.filter(id => id !== toolId)
      : [...disabledTools, toolId];
    setSettings(prev => ({ ...prev, disabledTools: JSON.stringify(updated) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPut("/v1/settings", { disabledTools: settings.disabledTools });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  // Render:
  // - Header with description
  // - Search bar
  // - Tools grouped by category, each with toggle
  // - "Restart required" banner when saved === true
  // - Save button
}
```

Uses `TOOLS` and `CATEGORIES` from `@stirling-image/shared` to render the full tool list with toggles.

- [ ] **Step 2: Verify rendering**

Open settings > Tools. Verify:
- All 32 tools shown grouped by category
- Search filters tools
- Toggling a tool updates state
- Save shows "restart required" banner

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/settings/settings-dialog.tsx
git commit -m "feat(ui): add Tools section for tool enable/disable management"
```

---

## Task 10: Frontend — System Settings: Feature Flags, Temp Files, Logo

**Files:**
- Modify: `apps/web/src/components/settings/settings-dialog.tsx`

- [ ] **Step 1: Add feature flags toggle to SystemSection**

After the existing "Login Attempt Limit" setting, add:

```typescript
{/* Experimental Tools */}
<SettingRow label="Enable Experimental Tools" description="Show tools that are still in development. These may be unstable.">
  <ToggleSwitch
    checked={settings.enableExperimentalTools === "true"}
    onChange={(v) => updateSetting("enableExperimentalTools", v ? "true" : "false")}
  />
</SettingRow>
```

Create a simple `ToggleSwitch` component if one doesn't exist (or use a styled checkbox).

- [ ] **Step 2: Add temp file management controls**

```typescript
{/* File Management */}
<div className="pt-4">
  <h4 className="text-sm font-semibold text-foreground mb-3">File Management</h4>
</div>

<SettingRow label="Max File Age (hours)" description="How long processed files are kept before automatic cleanup">
  <input
    type="number"
    value={settings.tempFileMaxAgeHours || "24"}
    onChange={(e) => updateSetting("tempFileMaxAgeHours", e.target.value)}
    className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground w-24"
    min={1}
  />
</SettingRow>

<SettingRow label="Startup Cleanup" description="Clean up old temporary files when the server starts">
  <ToggleSwitch
    checked={settings.startupCleanup !== "false"}
    onChange={(v) => updateSetting("startupCleanup", v ? "true" : "false")}
  />
</SettingRow>
```

- [ ] **Step 3: Add logo upload area**

After the "App Name" setting:

```typescript
{/* Custom Logo */}
<SettingRow label="Custom Logo" description="Upload a custom logo for the sidebar. PNG, SVG, or JPEG. Max 500KB.">
  <div className="flex items-center gap-3">
    {/* Show current logo preview if exists */}
    {settings.customLogo === "true" && (
      <img src="/api/v1/settings/logo" className="w-10 h-10 rounded" alt="Logo" />
    )}
    <label className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm cursor-pointer hover:bg-muted transition-colors">
      Upload
      <input
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        className="hidden"
        onChange={handleLogoUpload}
      />
    </label>
    {settings.customLogo === "true" && (
      <button onClick={handleLogoDelete} className="text-sm text-destructive hover:underline">
        Remove
      </button>
    )}
  </div>
</SettingRow>
```

Implement `handleLogoUpload` (FormData POST) and `handleLogoDelete` (DELETE request).

- [ ] **Step 4: Show "restart required" banner for experimental toggle**

When `enableExperimentalTools` changes and is saved, show the same restart banner as the Tools section.

- [ ] **Step 5: Verify all controls work**

Open settings > System Settings. Verify:
- Feature flags toggle works
- Temp file age input works
- Startup cleanup toggle works
- Logo upload shows preview
- Logo remove works
- Save persists all settings

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/settings/settings-dialog.tsx
git commit -m "feat(ui): add feature flags, temp file management, and logo upload to System Settings"
```

---

## Task 11: Frontend — Filter Tools in Tool Panel, Pipeline Builder & Fullscreen Grid

**Files:**
- Modify: `apps/web/src/components/layout/tool-panel.tsx`
- Modify: `apps/web/src/components/tools/pipeline-builder.tsx`
- Modify: `apps/web/src/pages/fullscreen-grid-page.tsx`

- [ ] **Step 1: Filter tools in tool-panel.tsx**

Modify `tool-panel.tsx` to fetch settings and filter:

```typescript
// Fetch settings on mount
const [disabledTools, setDisabledTools] = useState<string[]>([]);
const [experimentalEnabled, setExperimentalEnabled] = useState(false);

useEffect(() => {
  apiGet<{ settings: Record<string, string> }>("/v1/settings")
    .then((data) => {
      setDisabledTools(data.settings.disabledTools ? JSON.parse(data.settings.disabledTools) : []);
      setExperimentalEnabled(data.settings.enableExperimentalTools === "true");
    })
    .catch(() => {});
}, []);

// Filter tools
const visibleTools = TOOLS.filter(t => {
  if (disabledTools.includes(t.id)) return false;
  if (t.experimental && !experimentalEnabled) return false;
  return true;
});
```

Use `visibleTools` instead of `TOOLS` for grouping and rendering.

- [ ] **Step 2: Filter tools in pipeline-builder.tsx**

Apply the same filter logic to the `PIPELINE_TOOLS` constant, making it dynamic:

```typescript
const visiblePipelineTools = PIPELINE_TOOLS.filter(t => {
  if (disabledTools.includes(t.id)) return false;
  if (t.experimental && !experimentalEnabled) return false;
  return true;
});
```

- [ ] **Step 3: Filter tools in fullscreen-grid-page.tsx**

Apply the same filtering logic to the fullscreen grid page. Fetch settings and filter `TOOLS` the same way as tool-panel and pipeline-builder.

- [ ] **Step 4: Verify filtering works**

Disable a tool via settings, refresh. Verify:
- Tool is gone from tool panel
- Tool is gone from fullscreen grid
- Tool is gone from pipeline step picker
- Direct URL to the tool still works (server hasn't restarted)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/layout/tool-panel.tsx apps/web/src/components/tools/pipeline-builder.tsx apps/web/src/pages/fullscreen-grid-page.tsx
git commit -m "feat(ui): filter disabled and experimental tools from tool panel, fullscreen grid, and pipeline builder"
```

---

## Task 12: Frontend — Custom Logo in Sidebar/Layout

**Files:**
- Modify: `apps/web/src/components/layout/app-layout.tsx`

- [ ] **Step 1: Load and display custom logo**

In `app-layout.tsx`, fetch the custom logo setting and conditionally render:

```typescript
const [customLogo, setCustomLogo] = useState(false);

useEffect(() => {
  apiGet<{ settings: Record<string, string> }>("/v1/settings")
    .then((data) => {
      setCustomLogo(data.settings.customLogo === "true");
    })
    .catch(() => {});
}, []);

// In the logo rendering spots (mobile header, mobile top bar):
{customLogo ? (
  <img src="/api/v1/settings/logo" className="h-6 w-6 rounded" alt="Logo" />
) : (
  <span className="text-sm font-bold text-foreground">Stirling <span className="text-primary">Image</span></span>
)}
```

- [ ] **Step 2: Verify logo displays**

Upload a logo via settings, refresh. Verify:
- Custom logo appears in mobile header
- Removing logo reverts to text branding

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/app-layout.tsx
git commit -m "feat(ui): display custom logo in sidebar and mobile header"
```

---

## Task 13: E2E Tests — Teams Management

**Files:**
- Create: `tests/e2e/settings-teams.spec.ts`

- [ ] **Step 1: Write Playwright E2E tests for Teams**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Teams Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    // Navigate to settings > Teams
  });

  test("shows Default team on load", async ({ page }) => {
    await expect(page.getByText("Default")).toBeVisible();
  });

  test("can create a new team", async ({ page }) => {
    await page.getByRole("button", { name: /create new team/i }).click();
    await page.getByPlaceholder(/team name/i).fill("Engineering");
    await page.getByRole("button", { name: /create/i }).click();
    await expect(page.getByText("Engineering")).toBeVisible();
  });

  test("can rename a team", async ({ page }) => {
    // Create team, then rename it
  });

  test("can delete an empty team", async ({ page }) => {
    // Create team, then delete it
  });

  test("cannot delete Default team", async ({ page }) => {
    // Try to delete Default, verify error message
  });

  test("cannot delete team with members", async ({ page }) => {
    // Default team has admin, try to delete, verify error
  });
});
```

- [ ] **Step 2: Run E2E tests**

Run: `npx playwright test tests/e2e/settings-teams.spec.ts`
Expected: All PASS

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/settings-teams.spec.ts
git commit -m "test(e2e): add teams management E2E tests"
```

---

## Task 14: E2E Tests — Tool Disabling

**Files:**
- Create: `tests/e2e/settings-tools.spec.ts`

- [ ] **Step 1: Write Playwright E2E tests for Tool Disabling**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Tool Disabling", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
  });

  test("shows all tools with toggles in Tools settings", async ({ page }) => {
    // Navigate to settings > Tools
    // Verify tool list is populated
    // Verify each tool has a toggle
  });

  test("can search tools", async ({ page }) => {
    // Type in search, verify filtered results
  });

  test("disabling a tool hides it from tool panel after save", async ({ page }) => {
    // Navigate to settings > Tools
    // Disable "resize" tool
    // Save
    // Go to home page
    // Verify "Resize" is not in the tool panel
  });

  test("re-enabling a tool shows it in tool panel after save", async ({ page }) => {
    // Re-enable the tool
    // Verify it reappears
  });

  test("shows restart required banner after saving", async ({ page }) => {
    // Toggle a tool, save
    // Verify "restart required" message appears
  });
});
```

- [ ] **Step 2: Run E2E tests**

Run: `npx playwright test tests/e2e/settings-tools.spec.ts`
Expected: All PASS

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/settings-tools.spec.ts
git commit -m "test(e2e): add tool disabling E2E tests"
```

---

## Task 15: E2E Tests — System Settings (Feature Flags, Temp Files, Logo)

**Files:**
- Create: `tests/e2e/settings-system.spec.ts`

- [ ] **Step 1: Write Playwright E2E tests**

```typescript
import { test, expect } from "@playwright/test";

test.describe("System Settings - Feature Flags", () => {
  test("experimental tools toggle exists and is off by default", async ({ page }) => {
    // Navigate to settings > System Settings
    // Verify "Enable Experimental Tools" toggle exists and is unchecked
  });

  test("enabling experimental tools shows experimental tools in panel", async ({ page }) => {
    // Toggle on, save
    // Go to home, verify experimental tools appear (if any are marked)
  });
});

test.describe("System Settings - File Management", () => {
  test("max file age input shows default value of 24", async ({ page }) => {
    // Verify input value is 24
  });

  test("can change max file age and save", async ({ page }) => {
    // Change to 48, save
    // Reload, verify value persists
  });

  test("startup cleanup toggle is on by default", async ({ page }) => {
    // Verify toggle is checked
  });
});

test.describe("System Settings - Logo Upload", () => {
  test("shows upload area when no logo is set", async ({ page }) => {
    // Verify upload button exists
    // Verify no preview image
  });

  test("can upload a logo and see preview", async ({ page }) => {
    // Upload a test PNG
    // Verify preview image appears
    // Verify "Remove" button appears
  });

  test("can remove uploaded logo", async ({ page }) => {
    // Upload, then click Remove
    // Verify preview disappears
  });

  test("uploaded logo appears in sidebar/header", async ({ page }) => {
    // Upload logo
    // Close settings
    // Check sidebar/header for logo image
  });
});
```

- [ ] **Step 2: Run E2E tests**

Run: `npx playwright test tests/e2e/settings-system.spec.ts`
Expected: All PASS

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/settings-system.spec.ts
git commit -m "test(e2e): add system settings E2E tests for feature flags, temp files, and logo"
```

---

## Task 16: Final Integration Verification

- [ ] **Step 1: Run all unit/API tests**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 2: Run all E2E tests**

Run: `npx playwright test`
Expected: All PASS

- [ ] **Step 3: Manual smoke test**

Start dev server, verify:
1. Settings dialog has all new sections (Teams, Tools)
2. System Settings has feature flags, temp file, logo controls
3. Creating/renaming/deleting teams works
4. Disabling a tool hides it from the panel
5. Toggling experimental tools works
6. Uploading/removing logo works
7. All existing functionality still works (no regressions)

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: settings phase 1 — teams, tool disabling, feature flags, temp files, custom logo"
```
