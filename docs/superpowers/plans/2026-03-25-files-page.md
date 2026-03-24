# Files Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a persistent file manager page with Recent files, Upload, file details panel, and auto-versioning when tools process files.

**Architecture:** New `user_files` SQLite table tracks uploaded/processed files with version chains. New `/api/v1/files/*` routes handle CRUD. Frontend is a three-panel page (nav, file list, details). The existing tool-factory gains an optional `fileId` parameter to auto-save processed results as new versions.

**Tech Stack:** Drizzle ORM, Fastify, Sharp (thumbnails), Zustand, React, Tailwind CSS

---

## File Structure

### New files

```
apps/api/src/routes/user-files.ts       # All /api/v1/files/* routes (list, upload, details, download, thumbnail, delete)
apps/api/src/lib/file-storage.ts         # Disk I/O helpers: saveFile, deleteFile, getFilePath, ensureStorageDir
apps/web/src/pages/files-page.tsx        # Three-panel Files page
apps/web/src/stores/files-page-store.ts  # Zustand store for Files page state
apps/web/src/components/files/files-nav.tsx       # Left nav panel
apps/web/src/components/files/file-list.tsx        # Center: search + toolbar + file rows
apps/web/src/components/files/file-list-item.tsx   # Single file row
apps/web/src/components/files/file-details.tsx     # Right panel: thumbnail + metadata + Open File
apps/web/src/components/files/file-upload-area.tsx # Dropzone for Upload tab
```

### Modified files

```
apps/api/src/db/schema.ts           # Add userFiles table
apps/api/src/lib/env.ts             # Add FILES_STORAGE_PATH env var
apps/api/src/index.ts               # Register userFiles routes
apps/api/src/routes/tool-factory.ts # Accept fileId, auto-save result as new version
apps/web/src/App.tsx                # Add /files route
apps/web/src/components/layout/sidebar.tsx      # Re-add Files nav item
apps/web/src/components/layout/app-layout.tsx   # Re-add Files to mobile nav
apps/web/src/stores/file-store.ts   # Add optional serverFileId field to FileEntry
apps/web/src/lib/api.ts             # Add files API helpers
```

---

### Task 1: Database Schema — Add userFiles Table

**Files:**
- Modify: `apps/api/src/db/schema.ts`

- [ ] **Step 1: Add userFiles table to schema**

Add to `apps/api/src/db/schema.ts` after the `pipelines` table:

```typescript
export const userFiles = sqliteTable("user_files", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  originalName: text("original_name").notNull(),
  storedName: text("stored_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  width: integer("width"),
  height: integer("height"),
  version: integer("version").notNull().default(1),
  parentId: text("parent_id"),
  toolChain: text("tool_chain"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
```

- [ ] **Step 2: Generate Drizzle migration**

Run: `cd apps/api && npx drizzle-kit generate`

Expected: A new migration file appears in `apps/api/drizzle/` with `CREATE TABLE user_files`.

- [ ] **Step 3: Verify migration applies**

Run: `cd /Users/sidd/Desktop/Personal/Projects/Stirling-Image && pnpm --filter api dev` (start and stop quickly)

Expected: Server starts without DB errors, table is created.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/db/schema.ts apps/api/drizzle/
git commit -m "feat(db): add user_files table for persistent file storage"
```

---

### Task 2: Environment Config — Add FILES_STORAGE_PATH

**Files:**
- Modify: `apps/api/src/lib/env.ts`

- [ ] **Step 1: Add FILES_STORAGE_PATH to env schema**

Add to the `envSchema` object in `apps/api/src/lib/env.ts`:

```typescript
FILES_STORAGE_PATH: z.string().default("./data/files"),
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/lib/env.ts
git commit -m "feat(config): add FILES_STORAGE_PATH env variable"
```

---

### Task 3: File Storage Helpers

**Files:**
- Create: `apps/api/src/lib/file-storage.ts`

- [ ] **Step 1: Create file-storage.ts**

```typescript
import { mkdir, writeFile, unlink, stat } from "node:fs/promises";
import { join, extname } from "node:path";
import { randomUUID } from "node:crypto";
import { env } from "../config.js";

let storageReady = false;

/** Ensure the storage directory exists. Called once on first use. */
export async function ensureStorageDir(): Promise<void> {
  if (storageReady) return;
  await mkdir(env.FILES_STORAGE_PATH, { recursive: true });
  storageReady = true;
}

/** Save a buffer to disk with a UUID-based name. Returns the stored filename. */
export async function saveFile(buffer: Buffer, originalName: string): Promise<string> {
  await ensureStorageDir();
  const ext = extname(originalName).toLowerCase() || ".bin";
  const storedName = `${randomUUID()}${ext}`;
  await writeFile(join(env.FILES_STORAGE_PATH, storedName), buffer);
  return storedName;
}

/** Delete a file from storage by its stored name. */
export async function deleteStoredFile(storedName: string): Promise<void> {
  try {
    await unlink(join(env.FILES_STORAGE_PATH, storedName));
  } catch {
    // File already gone — that's fine
  }
}

/** Get the full disk path for a stored file. */
export function getStoredFilePath(storedName: string): string {
  return join(env.FILES_STORAGE_PATH, storedName);
}

/** Check if a stored file exists and return its size, or null. */
export async function getStoredFileStat(storedName: string): Promise<{ size: number } | null> {
  try {
    const s = await stat(join(env.FILES_STORAGE_PATH, storedName));
    return { size: s.size };
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/lib/file-storage.ts
git commit -m "feat: add file-storage helpers for persistent file management"
```

---

### Task 4: API Routes — User Files CRUD

**Files:**
- Create: `apps/api/src/routes/user-files.ts`
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: Create user-files.ts with all routes**

```typescript
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import sharp from "sharp";
import { eq, desc, like, and, isNull, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { validateImageBuffer } from "../lib/file-validation.js";
import { sanitizeFilename } from "../lib/filename.js";
import { saveFile, deleteStoredFile, getStoredFilePath } from "../lib/file-storage.js";
import { getAuthUser } from "../plugins/auth.js";

function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
    webp: "image/webp", gif: "image/gif", bmp: "image/bmp",
    tiff: "image/tiff", tif: "image/tiff", avif: "image/avif",
  };
  return map[ext] ?? "application/octet-stream";
}

/**
 * Find the root ancestor of a file (the V1 original).
 * Walks parentId chain up to the root.
 */
function getRootId(fileId: string): string {
  let currentId = fileId;
  for (let i = 0; i < 100; i++) {  // safety limit
    const row = db.select({ parentId: schema.userFiles.parentId })
      .from(schema.userFiles)
      .where(eq(schema.userFiles.id, currentId))
      .get();
    if (!row || !row.parentId) return currentId;
    currentId = row.parentId;
  }
  return currentId;
}

export async function userFileRoutes(app: FastifyInstance): Promise<void> {
  // ── GET /api/v1/files — List recent files (latest version per group) ──
  app.get(
    "/api/v1/files",
    async (
      request: FastifyRequest<{ Querystring: { search?: string; limit?: string; offset?: string } }>,
      reply: FastifyReply,
    ) => {
      const user = getAuthUser(request);
      const userId = user?.id ?? null;
      const search = (request.query as { search?: string }).search || "";
      const limit = Math.min(parseInt((request.query as { limit?: string }).limit || "50", 10), 200);
      const offset = parseInt((request.query as { offset?: string }).offset || "0", 10);

      // Get the latest version of each file chain.
      // A file is "latest" if no other file has it as parentId.
      let query = db.select()
        .from(schema.userFiles)
        .where(
          and(
            userId ? eq(schema.userFiles.userId, userId) : isNull(schema.userFiles.userId),
            // Only get files that are NOT a parent of another file (i.e., they are the latest version)
            sql`${schema.userFiles.id} NOT IN (
              SELECT ${schema.userFiles.parentId} FROM ${schema.userFiles}
              WHERE ${schema.userFiles.parentId} IS NOT NULL
            )`,
            search ? like(schema.userFiles.originalName, `%${search}%`) : undefined,
          ),
        )
        .orderBy(desc(schema.userFiles.createdAt))
        .limit(limit)
        .offset(offset);

      const files = query.all();

      // Get total count for pagination
      const countResult = db.select({ count: sql<number>`count(*)` })
        .from(schema.userFiles)
        .where(
          and(
            userId ? eq(schema.userFiles.userId, userId) : isNull(schema.userFiles.userId),
            sql`${schema.userFiles.id} NOT IN (
              SELECT ${schema.userFiles.parentId} FROM ${schema.userFiles}
              WHERE ${schema.userFiles.parentId} IS NOT NULL
            )`,
            search ? like(schema.userFiles.originalName, `%${search}%`) : undefined,
          ),
        )
        .get();

      return reply.send({
        files: files.map((f) => ({
          id: f.id,
          originalName: f.originalName,
          mimeType: f.mimeType,
          size: f.size,
          width: f.width,
          height: f.height,
          version: f.version,
          toolChain: f.toolChain ? JSON.parse(f.toolChain) : [],
          createdAt: f.createdAt?.toISOString(),
        })),
        total: countResult?.count ?? 0,
      });
    },
  );

  // ── POST /api/v1/files/upload — Upload new files ──────────────────
  app.post(
    "/api/v1/files/upload",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = getAuthUser(request);
      const userId = user?.id ?? null;
      const uploaded: Array<{ id: string; originalName: string; size: number; version: number }> = [];

      const parts = request.parts();
      for await (const part of parts) {
        if (part.type !== "file") continue;

        const chunks: Buffer[] = [];
        for await (const chunk of part.file) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        if (buffer.length === 0) continue;

        const validation = await validateImageBuffer(buffer);
        if (!validation.valid) {
          return reply.status(400).send({ error: `Invalid file "${part.filename}": ${validation.reason}` });
        }

        const safeName = sanitizeFilename(part.filename ?? "upload");
        const storedName = await saveFile(buffer, safeName);
        const ext = extname(safeName).toLowerCase().replace(/^\./, "");
        const id = randomUUID();

        db.insert(schema.userFiles).values({
          id,
          userId,
          originalName: safeName,
          storedName,
          mimeType: getMimeType(ext),
          size: buffer.length,
          width: validation.width,
          height: validation.height,
          version: 1,
          parentId: null,
          toolChain: null,
        }).run();

        uploaded.push({ id, originalName: safeName, size: buffer.length, version: 1 });
      }

      if (uploaded.length === 0) {
        return reply.status(400).send({ error: "No valid files uploaded" });
      }

      return reply.send({ files: uploaded });
    },
  );

  // ── GET /api/v1/files/:id — File details with version history ─────
  app.get(
    "/api/v1/files/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params;
      const file = db.select().from(schema.userFiles).where(eq(schema.userFiles.id, id)).get();
      if (!file) return reply.status(404).send({ error: "File not found" });

      // Build version chain by walking from root to latest
      const rootId = getRootId(id);
      const allVersions = db.select()
        .from(schema.userFiles)
        .where(
          sql`${schema.userFiles.id} = ${rootId}
          OR ${schema.userFiles.parentId} = ${rootId}
          OR ${schema.userFiles.id} IN (
            WITH RECURSIVE chain(id) AS (
              SELECT ${rootId}
              UNION ALL
              SELECT uf.id FROM ${schema.userFiles} uf
              JOIN chain c ON uf.parent_id = c.id
            )
            SELECT id FROM chain
          )`,
        )
        .orderBy(schema.userFiles.version)
        .all();

      return reply.send({
        id: file.id,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        width: file.width,
        height: file.height,
        version: file.version,
        toolChain: file.toolChain ? JSON.parse(file.toolChain) : [],
        createdAt: file.createdAt?.toISOString(),
        versions: allVersions.map((v) => ({
          id: v.id,
          version: v.version,
          size: v.size,
          toolChain: v.toolChain ? JSON.parse(v.toolChain) : [],
          createdAt: v.createdAt?.toISOString(),
        })),
      });
    },
  );

  // ── GET /api/v1/files/:id/download — Download file ────────────────
  app.get(
    "/api/v1/files/:id/download",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params;
      const file = db.select().from(schema.userFiles).where(eq(schema.userFiles.id, id)).get();
      if (!file) return reply.status(404).send({ error: "File not found" });

      const buffer = await readFile(getStoredFilePath(file.storedName));
      return reply
        .header("Content-Type", file.mimeType)
        .header("Content-Disposition", `attachment; filename="${encodeURIComponent(file.originalName)}"`)
        .send(buffer);
    },
  );

  // ── GET /api/v1/files/:id/thumbnail — 300px JPEG thumbnail ────────
  app.get(
    "/api/v1/files/:id/thumbnail",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params;
      const file = db.select().from(schema.userFiles).where(eq(schema.userFiles.id, id)).get();
      if (!file) return reply.status(404).send({ error: "File not found" });

      const buffer = await readFile(getStoredFilePath(file.storedName));
      const thumbnail = await sharp(buffer)
        .resize(300, 300, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      return reply
        .header("Content-Type", "image/jpeg")
        .header("Cache-Control", "public, max-age=3600")
        .send(thumbnail);
    },
  );

  // ── DELETE /api/v1/files — Bulk delete ────────────────────────────
  app.delete(
    "/api/v1/files",
    async (
      request: FastifyRequest<{ Body: { ids: string[] } }>,
      reply: FastifyReply,
    ) => {
      const { ids } = request.body as { ids: string[] };
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return reply.status(400).send({ error: "ids array required" });
      }

      for (const id of ids) {
        // Find all versions in this chain
        const rootId = getRootId(id);
        const chain = db.select()
          .from(schema.userFiles)
          .where(
            sql`${schema.userFiles.id} = ${rootId}
            OR ${schema.userFiles.id} IN (
              WITH RECURSIVE ver(id) AS (
                SELECT ${rootId}
                UNION ALL
                SELECT uf.id FROM ${schema.userFiles} uf
                JOIN ver v ON uf.parent_id = v.id
              )
              SELECT id FROM ver
            )`,
          )
          .all();

        for (const file of chain) {
          await deleteStoredFile(file.storedName);
          db.delete(schema.userFiles).where(eq(schema.userFiles.id, file.id)).run();
        }
      }

      return reply.send({ deleted: ids.length });
    },
  );

  // ── POST /api/v1/files/save-result — Save tool processing result ──
  // Called internally by tool-factory after processing. Also available as API.
  app.post(
    "/api/v1/files/save-result",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = getAuthUser(request);
      const userId = user?.id ?? null;

      let buffer: Buffer | null = null;
      let parentId: string | null = null;
      let toolId: string | null = null;
      let filename = "processed";

      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === "file") {
          const chunks: Buffer[] = [];
          for await (const chunk of part.file) chunks.push(chunk);
          buffer = Buffer.concat(chunks);
          filename = part.filename ?? "processed";
        } else {
          if (part.fieldname === "parentId") parentId = part.value as string;
          if (part.fieldname === "toolId") toolId = part.value as string;
        }
      }

      if (!buffer || buffer.length === 0) {
        return reply.status(400).send({ error: "No file provided" });
      }

      // Get dimensions
      let width: number | undefined;
      let height: number | undefined;
      try {
        const meta = await sharp(buffer).metadata();
        width = meta.width;
        height = meta.height;
      } catch { /* non-image or unsupported */ }

      const safeName = sanitizeFilename(filename);
      const storedName = await saveFile(buffer, safeName);
      const ext = extname(safeName).toLowerCase().replace(/^\./, "");

      // Build version info from parent
      let version = 1;
      let toolChain: string[] = [];
      if (parentId) {
        const parent = db.select().from(schema.userFiles).where(eq(schema.userFiles.id, parentId)).get();
        if (parent) {
          version = parent.version + 1;
          toolChain = parent.toolChain ? JSON.parse(parent.toolChain) : [];
          // Use parent's original name for consistency
          filename = parent.originalName;
        }
      }
      if (toolId) toolChain.push(toolId);

      const id = randomUUID();
      db.insert(schema.userFiles).values({
        id,
        userId,
        originalName: sanitizeFilename(filename),
        storedName,
        mimeType: getMimeType(ext),
        size: buffer.length,
        width: width ?? null,
        height: height ?? null,
        version,
        parentId,
        toolChain: JSON.stringify(toolChain),
      }).run();

      return reply.send({
        id,
        originalName: filename,
        version,
        size: buffer.length,
        toolChain,
      });
    },
  );
}
```

- [ ] **Step 2: Register routes in index.ts**

Add import at top of `apps/api/src/index.ts`:

```typescript
import { userFileRoutes } from "./routes/user-files.js";
```

Add after `await fileRoutes(app);`:

```typescript
// Persistent file management routes
await userFileRoutes(app);
```

- [ ] **Step 3: Verify server starts**

Run: `cd /Users/sidd/Desktop/Personal/Projects/Stirling-Image && pnpm --filter api dev`

Expected: Server starts without errors, routes are registered.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/routes/user-files.ts apps/api/src/index.ts
git commit -m "feat(api): add /api/v1/files/* routes for persistent file management"
```

---

### Task 5: Tool Factory Integration — Auto-save Results

**Files:**
- Modify: `apps/api/src/routes/tool-factory.ts`

- [ ] **Step 1: Add fileId support to tool-factory**

Modify `apps/api/src/routes/tool-factory.ts`. In the multipart parsing loop, add a new field:

```typescript
// After the existing settingsRaw field handling, add:
let fileId: string | null = null;
```

In the field parsing section (the `else` branch for non-file parts), add:

```typescript
if (part.fieldname === "fileId") {
  fileId = part.value as string;
}
```

After the successful processing block (after `await writeFile(outputPath, result.buffer);` and before the `return reply.send`), add the save-result logic:

```typescript
// Auto-save to persistent file store if this file came from the Files page
let savedFileId: string | undefined;
if (fileId) {
  try {
    const { saveFile: saveToStorage } = await import("../lib/file-storage.js");
    const { sanitizeFilename: sanitize } = await import("../lib/filename.js");
    const { getAuthUser } = await import("../plugins/auth.js");
    const sharpMod = await import("sharp");

    const user = getAuthUser(request);
    const userId = user?.id ?? null;

    const storedName = await saveToStorage(result.buffer, result.filename);
    const ext = result.filename.split(".").pop()?.toLowerCase() || "";
    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
      webp: "image/webp", gif: "image/gif", bmp: "image/bmp",
      tiff: "image/tiff", avif: "image/avif",
    };

    let width: number | undefined;
    let height: number | undefined;
    try {
      const meta = await sharpMod.default(result.buffer).metadata();
      width = meta.width;
      height = meta.height;
    } catch { /* skip */ }

    // Look up parent to build version chain
    const parent = db.select().from(schema.userFiles).where(eq(schema.userFiles.id, fileId)).get();
    const version = parent ? parent.version + 1 : 1;
    const parentToolChain: string[] = parent?.toolChain ? JSON.parse(parent.toolChain) : [];
    parentToolChain.push(config.toolId);
    const originalName = parent ? parent.originalName : sanitize(result.filename);

    const newId = randomUUID();
    db.insert(schema.userFiles).values({
      id: newId,
      userId,
      originalName,
      storedName,
      mimeType: mimeMap[ext] ?? "application/octet-stream",
      size: result.buffer.length,
      width: width ?? null,
      height: height ?? null,
      version,
      parentId: fileId,
      toolChain: JSON.stringify(parentToolChain),
    }).run();

    savedFileId = newId;
  } catch (err) {
    request.log.warn({ err }, "Failed to auto-save to file store");
    // Non-fatal: tool still succeeded
  }
}
```

Add the required imports at the top of tool-factory.ts:

```typescript
import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
```

Update the reply to include `savedFileId`:

```typescript
return reply.send({
  jobId,
  downloadUrl: `/api/v1/download/${jobId}/${encodeURIComponent(result.filename)}`,
  originalSize: fileBuffer.length,
  processedSize: result.buffer.length,
  savedFileId,
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/routes/tool-factory.ts
git commit -m "feat(tools): auto-save processed results to file store when fileId provided"
```

---

### Task 6: Frontend API Helpers

**Files:**
- Modify: `apps/web/src/lib/api.ts`

- [ ] **Step 1: Add files API functions**

Append to `apps/web/src/lib/api.ts`:

```typescript
// ── Persistent File Management ──────────────────────────────────

export interface UserFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  version: number;
  toolChain: string[];
  createdAt: string;
}

export interface UserFileDetail extends UserFile {
  versions: Array<{
    id: string;
    version: number;
    size: number;
    toolChain: string[];
    createdAt: string;
  }>;
}

export async function apiListFiles(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ files: UserFile[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));
  const qs = searchParams.toString();
  return apiGet(`/v1/files${qs ? `?${qs}` : ""}`);
}

export async function apiGetFileDetails(id: string): Promise<UserFileDetail> {
  return apiGet(`/v1/files/${id}`);
}

export async function apiUploadFiles(
  files: File[],
): Promise<{ files: Array<{ id: string; originalName: string; size: number; version: number }> }> {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  const res = await fetch("/api/v1/files/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

export async function apiDeleteFiles(ids: string[]): Promise<{ deleted: number }> {
  return apiDelete("/v1/files") as Promise<{ deleted: number }>;
  // NOTE: apiDelete doesn't support body — use fetch directly:
}

// Override apiDeleteFiles to send body:
export async function apiDeleteUserFiles(ids: string[]): Promise<{ deleted: number }> {
  const res = await fetch("/api/v1/files", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  return res.json();
}

export function getFileThumbnailUrl(id: string): string {
  return `/api/v1/files/${id}/thumbnail`;
}

export function getFileDownloadUrl(id: string): string {
  return `/api/v1/files/${id}/download`;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/api.ts
git commit -m "feat(web): add persistent files API helpers"
```

---

### Task 7: Files Page Store

**Files:**
- Create: `apps/web/src/stores/files-page-store.ts`

- [ ] **Step 1: Create the Zustand store**

```typescript
import { create } from "zustand";
import {
  apiListFiles,
  apiUploadFiles,
  apiDeleteUserFiles,
  type UserFile,
} from "@/lib/api";

interface FilesPageState {
  files: UserFile[];
  total: number;
  selectedFileId: string | null;
  checkedIds: Set<string>;
  activeTab: "recent" | "upload";
  searchQuery: string;
  loading: boolean;
  error: string | null;

  fetchFiles: () => Promise<void>;
  uploadFiles: (files: File[]) => Promise<void>;
  deleteChecked: () => Promise<void>;
  selectFile: (id: string | null) => void;
  toggleChecked: (id: string) => void;
  toggleCheckAll: () => void;
  setSearchQuery: (q: string) => void;
  setActiveTab: (tab: "recent" | "upload") => void;
}

export const useFilesPageStore = create<FilesPageState>((set, get) => ({
  files: [],
  total: 0,
  selectedFileId: null,
  checkedIds: new Set(),
  activeTab: "recent",
  searchQuery: "",
  loading: false,
  error: null,

  fetchFiles: async () => {
    set({ loading: true, error: null });
    try {
      const { searchQuery } = get();
      const result = await apiListFiles({
        search: searchQuery || undefined,
        limit: 100,
      });
      set({ files: result.files, total: result.total, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load files",
        loading: false,
      });
    }
  },

  uploadFiles: async (files) => {
    set({ loading: true, error: null });
    try {
      await apiUploadFiles(files);
      await get().fetchFiles();
      set({ activeTab: "recent" });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Upload failed",
        loading: false,
      });
    }
  },

  deleteChecked: async () => {
    const { checkedIds } = get();
    if (checkedIds.size === 0) return;
    set({ loading: true, error: null });
    try {
      await apiDeleteUserFiles(Array.from(checkedIds));
      set({ checkedIds: new Set(), selectedFileId: null });
      await get().fetchFiles();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Delete failed",
        loading: false,
      });
    }
  },

  selectFile: (id) => set({ selectedFileId: id }),

  toggleChecked: (id) => {
    const { checkedIds } = get();
    const next = new Set(checkedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    set({ checkedIds: next });
  },

  toggleCheckAll: () => {
    const { files, checkedIds } = get();
    if (checkedIds.size === files.length) {
      set({ checkedIds: new Set() });
    } else {
      set({ checkedIds: new Set(files.map((f) => f.id)) });
    }
  },

  setSearchQuery: (q) => set({ searchQuery: q }),

  setActiveTab: (tab) => set({ activeTab: tab }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/stores/files-page-store.ts
git commit -m "feat(web): add Zustand store for Files page"
```

---

### Task 8: Frontend Components — Files Nav, List, Details

**Files:**
- Create: `apps/web/src/components/files/files-nav.tsx`
- Create: `apps/web/src/components/files/file-list-item.tsx`
- Create: `apps/web/src/components/files/file-list.tsx`
- Create: `apps/web/src/components/files/file-details.tsx`
- Create: `apps/web/src/components/files/file-upload-area.tsx`

- [ ] **Step 1: Create files-nav.tsx**

```typescript
import { Clock, Upload, Cloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFilesPageStore } from "@/stores/files-page-store";

export function FilesNav() {
  const { activeTab, setActiveTab } = useFilesPageStore();

  const items = [
    { id: "recent" as const, label: "Recent", icon: Clock },
    { id: "upload" as const, label: "Upload Files", icon: Upload },
  ];

  return (
    <div className="w-48 border-r border-border p-4 shrink-0 hidden md:block">
      <h3 className="text-sm font-semibold text-foreground mb-3">My Files</h3>
      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
              activeTab === item.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
        {/* Google Drive placeholder */}
        <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground/40 cursor-not-allowed">
          <Cloud className="h-4 w-4" />
          Google Drive
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded ml-auto">Soon</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create file-list-item.tsx**

```typescript
import { cn } from "@/lib/utils";
import { useFilesPageStore } from "@/stores/files-page-store";
import { TOOLS } from "@stirling-image/shared";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" }) +
    ", " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function toolName(toolId: string): string {
  const tool = TOOLS.find((t) => t.id === toolId);
  return tool?.name ?? toolId;
}

interface FileListItemProps {
  file: {
    id: string;
    originalName: string;
    size: number;
    version: number;
    toolChain: string[];
    createdAt: string;
  };
}

export function FileListItem({ file }: FileListItemProps) {
  const { selectedFileId, selectFile, checkedIds, toggleChecked } = useFilesPageStore();
  const isSelected = selectedFileId === file.id;
  const isChecked = checkedIds.has(file.id);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 border-b border-border cursor-pointer transition-colors",
        isSelected ? "bg-muted" : "hover:bg-muted/50",
      )}
      onClick={() => selectFile(file.id)}
    >
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(e) => { e.stopPropagation(); toggleChecked(file.id); }}
        onClick={(e) => e.stopPropagation()}
        className="h-4 w-4 rounded border-border accent-primary shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{file.originalName}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {formatSize(file.size)} · {formatDate(file.createdAt)}
          {file.toolChain.length > 0 && (
            <span className="text-primary ml-1">
              {file.toolChain.map(toolName).join(" → ")}
            </span>
          )}
        </div>
      </div>
      <span
        className={cn(
          "text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0",
          file.version > 1
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        V{file.version}
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Create file-list.tsx**

```typescript
import { useEffect } from "react";
import { Search, Trash2, Download } from "lucide-react";
import { useFilesPageStore } from "@/stores/files-page-store";
import { FileListItem } from "./file-list-item";
import { getFileDownloadUrl } from "@/lib/api";

export function FileList() {
  const {
    files, loading, error, searchQuery, setSearchQuery,
    fetchFiles, checkedIds, toggleCheckAll, deleteChecked,
  } = useFilesPageStore();

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => fetchFiles(), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchFiles]);

  const handleBulkDownload = () => {
    for (const id of checkedIds) {
      const a = document.createElement("a");
      a.href = getFileDownloadUrl(id);
      a.download = "";
      a.click();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-3 py-2 border-b border-border flex items-center gap-3">
        <input
          type="checkbox"
          checked={checkedIds.size > 0 && checkedIds.size === files.length}
          onChange={toggleCheckAll}
          className="h-4 w-4 rounded border-border accent-primary"
        />
        <span className="flex-1" />
        {checkedIds.size > 0 && (
          <>
            <button
              onClick={deleteChecked}
              className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Delete selected"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleBulkDownload}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Download selected"
            >
              <Download className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* File rows */}
      <div className="flex-1 overflow-y-auto">
        {loading && files.length === 0 && (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            Loading...
          </div>
        )}
        {error && (
          <div className="p-4 text-sm text-destructive">{error}</div>
        )}
        {!loading && files.length === 0 && !error && (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No files yet. Upload some images to get started.
          </div>
        )}
        {files.map((file) => (
          <FileListItem key={file.id} file={file} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create file-details.tsx**

```typescript
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileImage } from "lucide-react";
import { useFilesPageStore } from "@/stores/files-page-store";
import { useFileStore } from "@/stores/file-store";
import {
  apiGetFileDetails,
  getFileThumbnailUrl,
  getFileDownloadUrl,
  type UserFileDetail,
} from "@/lib/api";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "JPEG", "image/png": "PNG", "image/webp": "WebP",
    "image/gif": "GIF", "image/bmp": "BMP", "image/tiff": "TIFF",
    "image/avif": "AVIF",
  };
  return map[mimeType] ?? mimeType.split("/")[1]?.toUpperCase() ?? "Unknown";
}

export function FileDetails() {
  const { selectedFileId } = useFilesPageStore();
  const { setFiles } = useFileStore();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<UserFileDetail | null>(null);

  useEffect(() => {
    if (!selectedFileId) { setDetail(null); return; }
    apiGetFileDetails(selectedFileId).then(setDetail).catch(() => setDetail(null));
  }, [selectedFileId]);

  if (!detail) {
    return (
      <div className="w-60 border-l border-border p-4 shrink-0 hidden lg:flex flex-col items-center justify-center text-muted-foreground">
        <FileImage className="h-10 w-10 mb-2 opacity-50" />
        <p className="text-xs">Select a file to view details</p>
      </div>
    );
  }

  const handleOpenFile = async () => {
    const res = await fetch(getFileDownloadUrl(detail.id), {
      headers: { Authorization: `Bearer ${localStorage.getItem("stirling-token") || ""}` },
    });
    const blob = await res.blob();
    const file = new File([blob], detail.originalName, { type: detail.mimeType });
    setFiles([file]);
    navigate("/");
  };

  const toolChainStr = detail.toolChain.length > 0 ? detail.toolChain.join(" → ") : "—";

  return (
    <div className="w-60 border-l border-border p-4 shrink-0 hidden lg:flex flex-col gap-4">
      {/* Thumbnail */}
      <div className="bg-muted rounded-lg h-36 flex items-center justify-center overflow-hidden">
        <img
          src={getFileThumbnailUrl(detail.id)}
          alt={detail.originalName}
          className="max-h-full max-w-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      {/* Details card */}
      <div className="bg-muted rounded-lg overflow-hidden">
        <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-medium">
          File Details
        </div>
        <div className="p-3 space-y-2 text-xs">
          {[
            ["Name", detail.originalName],
            ["Format", formatExtension(detail.mimeType)],
            ["Size", formatSize(detail.size)],
            ["Dimensions", detail.width && detail.height ? `${detail.width} × ${detail.height}` : "—"],
            ["Version", `V${detail.version}`],
            ["Tools Used", toolChainStr],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-border pb-2 last:border-0 last:pb-0">
              <span className="text-muted-foreground">{label}</span>
              <span className={`text-foreground text-right max-w-[120px] truncate ${label === "Tools Used" && detail.toolChain.length > 0 ? "text-primary" : ""}`}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleOpenFile}
        className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Open File
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Create file-upload-area.tsx**

```typescript
import { useCallback, useState, type DragEvent } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFilesPageStore } from "@/stores/files-page-store";

export function FileUploadArea() {
  const { uploadFiles, loading } = useFilesPageStore();
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) uploadFiles(files);
    },
    [uploadFiles],
  );

  const handleClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*";
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) uploadFiles(files);
    };
    input.click();
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div
        className={cn(
          "w-full max-w-lg border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50",
        )}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground mb-1">
          {loading ? "Uploading..." : "Upload images to your file library"}
        </p>
        <p className="text-xs text-muted-foreground">
          Drop files here or click to browse
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/files/
git commit -m "feat(web): add Files page components (nav, list, details, upload)"
```

---

### Task 9: Files Page & Routing

**Files:**
- Create: `apps/web/src/pages/files-page.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/components/layout/sidebar.tsx`
- Modify: `apps/web/src/components/layout/app-layout.tsx`

- [ ] **Step 1: Create files-page.tsx**

```typescript
import { AppLayout } from "@/components/layout/app-layout";
import { FilesNav } from "@/components/files/files-nav";
import { FileList } from "@/components/files/file-list";
import { FileDetails } from "@/components/files/file-details";
import { FileUploadArea } from "@/components/files/file-upload-area";
import { useFilesPageStore } from "@/stores/files-page-store";

export function FilesPage() {
  const { activeTab } = useFilesPageStore();

  return (
    <AppLayout showToolPanel={false}>
      <div className="flex h-full w-full overflow-hidden">
        <FilesNav />
        {activeTab === "recent" ? (
          <>
            <FileList />
            <FileDetails />
          </>
        ) : (
          <FileUploadArea />
        )}
      </div>
    </AppLayout>
  );
}
```

- [ ] **Step 2: Add route in App.tsx**

Add import at top:

```typescript
import { FilesPage } from "./pages/files-page";
```

Add route before the `/:toolId` catch-all:

```typescript
<Route path="/files" element={<FilesPage />} />
```

- [ ] **Step 3: Re-add Files to sidebar.tsx**

Add `FolderOpen` back to the lucide-react import:

```typescript
import {
  LayoutGrid,
  Workflow,
  FolderOpen,
  HelpCircle,
  Settings,
  Grid3x3,
} from "lucide-react";
```

Add the Files item back to `topItems`:

```typescript
const topItems: SidebarItem[] = [
  { icon: LayoutGrid, label: "Tools", href: "/" },
  { icon: Grid3x3, label: "Grid", href: "/fullscreen" },
  { icon: Workflow, label: "Automate", href: "/automate" },
  { icon: FolderOpen, label: "Files", href: "/files" },
];
```

- [ ] **Step 4: Re-add Files to app-layout.tsx mobile nav**

Add `FolderOpen` back to the lucide-react import:

```typescript
import {
  LayoutGrid,
  Workflow,
  FolderOpen,
  Settings as SettingsIcon,
  Menu,
  X,
} from "lucide-react";
```

Add the Files mobile nav item back after the Automate item:

```typescript
<MobileNavItem icon={FolderOpen} label="Files" href="/files" />
```

- [ ] **Step 5: Verify the app builds**

Run: `cd /Users/sidd/Desktop/Personal/Projects/Stirling-Image && pnpm --filter web build`

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/files-page.tsx apps/web/src/App.tsx apps/web/src/components/layout/sidebar.tsx apps/web/src/components/layout/app-layout.tsx
git commit -m "feat: add Files page with routing, sidebar, and mobile nav"
```

---

### Task 10: Add serverFileId to FileEntry for Tool Integration

**Files:**
- Modify: `apps/web/src/stores/file-store.ts`
- Modify: `apps/web/src/hooks/use-tool-processor.ts`

- [ ] **Step 1: Add serverFileId to FileEntry**

In `apps/web/src/stores/file-store.ts`, add to the `FileEntry` interface:

```typescript
serverFileId?: string;  // ID from user_files table (for version tracking)
```

In `createEntry`, add: `serverFileId: undefined`

- [ ] **Step 2: Pass fileId in tool processor**

In `apps/web/src/hooks/use-tool-processor.ts`, in the `processFiles` callback, after `formData.append("settings", JSON.stringify(settings));`:

```typescript
// If this file came from the Files page, include its ID for version tracking
const currentEntry = useFileStore.getState().currentEntry;
if (currentEntry?.serverFileId) {
  formData.append("fileId", currentEntry.serverFileId);
}
```

In the `xhr.onload` success handler, after `setSizes(result.originalSize, result.processedSize);`, add:

```typescript
// Update serverFileId if a new version was saved
if (result.savedFileId) {
  const { entries, selectedIndex } = useFileStore.getState();
  if (entries[selectedIndex]) {
    useFileStore.getState().updateEntry(selectedIndex, {
      serverFileId: result.savedFileId,
    });
  }
}
```

Update the `ProcessResult` interface to include:

```typescript
savedFileId?: string;
```

- [ ] **Step 3: Update FileDetails Open File to set serverFileId**

In `apps/web/src/components/files/file-details.tsx`, in `handleOpenFile`, after `setFiles([file]);`:

```typescript
// Set the serverFileId so tool processing creates a new version
const entries = useFileStore.getState().entries;
if (entries.length > 0) {
  useFileStore.getState().updateEntry(0, { serverFileId: detail.id });
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/stores/file-store.ts apps/web/src/hooks/use-tool-processor.ts apps/web/src/components/files/file-details.tsx
git commit -m "feat: wire serverFileId through file store and tool processor for version tracking"
```

---

### Task 11: Mobile Layout for Files Page

**Files:**
- Modify: `apps/web/src/pages/files-page.tsx`

- [ ] **Step 1: Add mobile tabs and bottom sheet**

Update `files-page.tsx` to handle mobile layout:

```typescript
import { useState } from "react";
import { X } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { FilesNav } from "@/components/files/files-nav";
import { FileList } from "@/components/files/file-list";
import { FileDetails } from "@/components/files/file-details";
import { FileUploadArea } from "@/components/files/file-upload-area";
import { useFilesPageStore } from "@/stores/files-page-store";
import { useMobile } from "@/hooks/use-mobile";

export function FilesPage() {
  const { activeTab, setActiveTab, selectedFileId, selectFile } = useFilesPageStore();
  const isMobile = useMobile();
  const [showDetails, setShowDetails] = useState(false);

  // On mobile, show details as overlay when file selected
  const handleFileSelect = () => {
    if (isMobile && selectedFileId) setShowDetails(true);
  };

  if (isMobile) {
    return (
      <AppLayout showToolPanel={false}>
        <div className="flex flex-col h-full w-full overflow-hidden">
          {/* Mobile tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab("recent")}
              className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${
                activeTab === "recent"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${
                activeTab === "upload"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              }`}
            >
              Upload
            </button>
          </div>

          {activeTab === "recent" ? (
            <div className="flex-1 overflow-hidden" onClick={handleFileSelect}>
              <FileList />
            </div>
          ) : (
            <FileUploadArea />
          )}

          {/* Mobile detail bottom sheet */}
          {showDetails && selectedFileId && (
            <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowDetails(false)}>
              <div
                className="absolute bottom-0 left-0 right-0 bg-background rounded-t-xl p-4 max-h-[70vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold">File Details</span>
                  <button onClick={() => setShowDetails(false)}>
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
                <FileDetails />
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showToolPanel={false}>
      <div className="flex h-full w-full overflow-hidden">
        <FilesNav />
        {activeTab === "recent" ? (
          <>
            <FileList />
            <FileDetails />
          </>
        ) : (
          <FileUploadArea />
        )}
      </div>
    </AppLayout>
  );
}
```

- [ ] **Step 2: Make FileDetails render inline on mobile**

In `apps/web/src/components/files/file-details.tsx`, change the outer wrapper classes from `hidden lg:flex` to just `flex` so it renders when explicitly placed in the mobile bottom sheet. Add a prop for this:

The empty-state wrapper:
```typescript
// Change: "w-60 border-l border-border p-4 shrink-0 hidden lg:flex..."
// To: "w-60 border-l border-border p-4 shrink-0 hidden lg:flex..." (keep desktop hidden)
// But add md:flex as well for the main details div
```

Actually, simpler approach: keep the desktop version as-is (hidden lg:flex). For mobile, the bottom sheet renders `<FileDetails />` separately — just remove the `hidden lg:` prefix when it's rendered in the mobile context. Add a `className` prop:

In `file-details.tsx`, accept an optional `mobile` prop:

```typescript
export function FileDetails({ mobile = false }: { mobile?: boolean }) {
```

Change the two outer div classes to use `mobile` to toggle visibility:
- Empty state: `className={mobile ? "flex flex-col items-center justify-center text-muted-foreground py-8" : "w-60 border-l border-border p-4 shrink-0 hidden lg:flex flex-col items-center justify-center text-muted-foreground"}`
- Detail state: `className={mobile ? "flex flex-col gap-4" : "w-60 border-l border-border p-4 shrink-0 hidden lg:flex flex-col gap-4"}`

In the mobile bottom sheet in files-page.tsx, use: `<FileDetails mobile />`

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/files-page.tsx apps/web/src/components/files/file-details.tsx
git commit -m "feat: add mobile layout for Files page with bottom sheet details"
```

---

### Task 12: End-to-End Testing

- [ ] **Step 1: Start dev servers**

Run: `cd /Users/sidd/Desktop/Personal/Projects/Stirling-Image && pnpm dev`

- [ ] **Step 2: Test file upload via Files page**

Navigate to http://localhost:39411/files, click "Upload Files" tab, drop an image. Verify it appears in the "Recent" tab with V1 badge.

- [ ] **Step 3: Test file details**

Click a file in the list. Verify the right panel shows thumbnail, name, format, size, dimensions, version, tools used.

- [ ] **Step 4: Test "Open File"**

Click "Open File". Verify navigation to home page with the image pre-loaded.

- [ ] **Step 5: Test version tracking**

From home page (with file loaded from Files), pick a tool (e.g. Resize), process it. Go back to /files. Verify the file now shows V2 with the tool name in the chain.

- [ ] **Step 6: Test search**

Type part of a filename in the search box. Verify list filters.

- [ ] **Step 7: Test bulk operations**

Check multiple files, click delete. Verify they're removed. Check files and click download. Verify downloads trigger.

- [ ] **Step 8: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address issues found during Files page testing"
```

---

## Dependency Graph

```
Task 1 (DB schema)
  └─> Task 2 (env config)
        └─> Task 3 (file storage helpers)
              └─> Task 4 (API routes)
                    ├─> Task 5 (tool-factory integration)
                    └─> Task 6 (frontend API helpers)
                          └─> Task 7 (Zustand store)
                                └─> Task 8 (UI components)
                                      └─> Task 9 (page + routing)
                                            └─> Task 10 (file store + tool processor wiring)
                                                  └─> Task 11 (mobile layout)
                                                        └─> Task 12 (E2E testing)
```

Tasks are sequential — each builds on the previous.
