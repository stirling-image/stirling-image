# On-Demand AI Feature Downloads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce Docker image from ~30 GB to ~5-6 GB by making AI features downloadable post-install via a UI-driven bundle system.

**Architecture:** Six feature bundles (Background Removal, Face Detection, Object Eraser & Colorize, Upscale & Enhance, Photo Restoration, OCR) are defined in a JSON manifest baked into the image. A Python install script handles pip + model downloads to a persistent volume. The backend exposes install/uninstall APIs with SSE progress. The frontend shows download badges on uninstalled tools and an install prompt on tool pages.

**Tech Stack:** Fastify (API), Zustand (frontend state), Python (install script), Docker (image restructuring), SSE (progress streaming)

**Spec:** `docs/superpowers/specs/2026-04-17-on-demand-ai-features-design.md`

---

## File Map

```
NEW FILES:
  packages/shared/src/features.ts                              # Bundle definitions, tool-to-bundle map, types
  docker/feature-manifest.json                                  # Authoritative manifest baked into image
  apps/api/src/lib/feature-status.ts                            # Reads manifest + installed.json, provides status
  apps/api/src/routes/features.ts                               # GET /features, POST install/uninstall, GET disk-usage
  packages/ai/python/install_feature.py                         # Python install script (pip + model downloads)
  apps/web/src/stores/features-store.ts                         # Zustand store for bundle statuses
  apps/web/src/components/features/feature-install-prompt.tsx   # Install prompt card for tool pages
  apps/web/src/components/settings/ai-features-section.tsx      # Settings panel section
  tests/unit/features.test.ts                                   # Unit tests for feature logic

MODIFIED FILES:
  packages/ai/src/bridge.ts                                     # restartDispatcher(), FEATURE_NOT_INSTALLED handling
  packages/ai/src/index.ts                                      # Export restartDispatcher
  packages/ai/python/dispatcher.py                              # Read installed.json, gate scripts by feature
  apps/api/src/index.ts                                         # Register feature routes, startup venv check
  apps/api/src/routes/tool-factory.ts                           # Feature-installed guard before process()
  apps/api/src/routes/batch.ts                                  # Feature-installed check at gating point
  apps/api/src/routes/pipeline.ts                               # Feature-installed check in pre-validation
  apps/api/src/routes/tools/restore-photo.ts                    # Feature-installed guard
  apps/web/src/lib/api.ts                                       # Extend parseApiError for FEATURE_NOT_INSTALLED
  apps/web/src/components/common/tool-card.tsx                  # Download badge on uninstalled AI tools
  apps/web/src/pages/tool-page.tsx                              # Feature check then install prompt or "not enabled"
  apps/web/src/components/layout/tool-panel.tsx                 # Fetch features on mount
  apps/web/src/pages/fullscreen-grid-page.tsx                   # Fetch features on mount
  apps/web/src/components/settings/settings-dialog.tsx          # Add AI Features nav item + section
  docker/Dockerfile                                             # Remove ML packages/models, keep base
  docker/entrypoint.sh                                          # Venv bootstrap, /data/ai/ setup
```

---

### Task 1: Shared Feature Types and Bundle Definitions

**Files:**
- Create: `packages/shared/src/features.ts`
- Modify: `packages/shared/src/index.ts`
- Test: `tests/unit/features.test.ts`

- [ ] **Step 1: Write the failing test for bundle definitions**

Create `tests/unit/features.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  FEATURE_BUNDLES,
  getBundleForTool,
  getToolsForBundle,
  TOOL_BUNDLE_MAP,
} from "@ashim/shared/features";
import { PYTHON_SIDECAR_TOOLS } from "@ashim/shared";

describe("Feature bundles", () => {
  it("every PYTHON_SIDECAR_TOOL maps to exactly one bundle", () => {
    for (const toolId of PYTHON_SIDECAR_TOOLS) {
      const bundle = getBundleForTool(toolId);
      expect(bundle, `${toolId} has no bundle`).toBeDefined();
    }
  });

  it("getBundleForTool returns null for non-AI tools", () => {
    expect(getBundleForTool("resize")).toBeNull();
    expect(getBundleForTool("crop")).toBeNull();
  });

  it("getToolsForBundle returns correct tools", () => {
    const tools = getToolsForBundle("background-removal");
    expect(tools).toContain("remove-background");
    expect(tools).toContain("passport-photo");
    expect(tools).not.toContain("upscale");
  });

  it("all 6 bundles are defined", () => {
    expect(Object.keys(FEATURE_BUNDLES)).toHaveLength(6);
    expect(FEATURE_BUNDLES["background-removal"]).toBeDefined();
    expect(FEATURE_BUNDLES["face-detection"]).toBeDefined();
    expect(FEATURE_BUNDLES["object-eraser-colorize"]).toBeDefined();
    expect(FEATURE_BUNDLES["upscale-enhance"]).toBeDefined();
    expect(FEATURE_BUNDLES["photo-restoration"]).toBeDefined();
    expect(FEATURE_BUNDLES["ocr"]).toBeDefined();
  });

  it("TOOL_BUNDLE_MAP covers all sidecar tools", () => {
    const mappedTools = Object.keys(TOOL_BUNDLE_MAP);
    for (const toolId of PYTHON_SIDECAR_TOOLS) {
      expect(mappedTools, `${toolId} missing from TOOL_BUNDLE_MAP`).toContain(toolId);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:unit -- tests/unit/features.test.ts`
Expected: FAIL with module not found error.

- [ ] **Step 3: Create the feature definitions module**

Create `packages/shared/src/features.ts`:

```ts
export interface FeatureBundleInfo {
  id: string;
  name: string;
  description: string;
  estimatedSize: string;
  enablesTools: string[];
}

export type FeatureStatus = "not_installed" | "installing" | "installed" | "error";

export interface FeatureBundleState {
  id: string;
  name: string;
  description: string;
  status: FeatureStatus;
  installedVersion: string | null;
  estimatedSize: string;
  enablesTools: string[];
  progress: { percent: number; stage: string } | null;
  error: string | null;
}

export const FEATURE_BUNDLES: Record<string, FeatureBundleInfo> = {
  "background-removal": {
    id: "background-removal",
    name: "Background Removal",
    description: "Remove image backgrounds with AI",
    estimatedSize: "700 MB - 1 GB",
    enablesTools: ["remove-background", "passport-photo"],
  },
  "face-detection": {
    id: "face-detection",
    name: "Face Detection",
    description: "Detect and blur faces, fix red-eye, smart crop",
    estimatedSize: "200-300 MB",
    enablesTools: ["blur-faces", "red-eye-removal", "smart-crop"],
  },
  "object-eraser-colorize": {
    id: "object-eraser-colorize",
    name: "Object Eraser & Colorize",
    description: "Erase objects from photos and colorize B&W images",
    estimatedSize: "600-800 MB",
    enablesTools: ["erase-object", "colorize"],
  },
  "upscale-enhance": {
    id: "upscale-enhance",
    name: "Upscale & Enhance",
    description: "AI upscaling, face enhancement, and noise removal",
    estimatedSize: "4-5 GB",
    enablesTools: ["upscale", "enhance-faces", "noise-removal"],
  },
  "photo-restoration": {
    id: "photo-restoration",
    name: "Photo Restoration",
    description: "Restore old or damaged photos",
    estimatedSize: "800 MB - 1 GB",
    enablesTools: ["restore-photo"],
  },
  ocr: {
    id: "ocr",
    name: "OCR",
    description: "Extract text from images",
    estimatedSize: "3-4 GB",
    enablesTools: ["ocr"],
  },
};

export const TOOL_BUNDLE_MAP: Record<string, string> = {};
for (const [bundleId, bundle] of Object.entries(FEATURE_BUNDLES)) {
  for (const toolId of bundle.enablesTools) {
    TOOL_BUNDLE_MAP[toolId] = bundleId;
  }
}

export function getBundleForTool(toolId: string): FeatureBundleInfo | null {
  const bundleId = TOOL_BUNDLE_MAP[toolId];
  return bundleId ? FEATURE_BUNDLES[bundleId] : null;
}

export function getToolsForBundle(bundleId: string): string[] {
  return FEATURE_BUNDLES[bundleId]?.enablesTools ?? [];
}
```

- [ ] **Step 4: Export from shared package**

Add to the end of `packages/shared/src/index.ts`:

```ts
export * from "./features.js";
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test:unit -- tests/unit/features.test.ts`
Expected: PASS, all 5 tests green.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/features.ts packages/shared/src/index.ts tests/unit/features.test.ts
git commit -m "feat: add shared feature bundle definitions and tool-to-bundle mapping"
```

---

### Task 2: Feature Manifest File

**Files:**
- Create: `docker/feature-manifest.json`

- [ ] **Step 1: Create the feature manifest**

Create `docker/feature-manifest.json` containing the full bundle definitions with exact package versions, pip flags, platform-specific packages, and model download URLs. Source exact versions from the current Dockerfile (lines 167-206) and model URLs from `docker/download_models.py`.

Key details: amd64 uses `--extra-index-url https://download.pytorch.org/whl/cu126` for torch/realesrgan; amd64 uses `paddlepaddle-gpu>=3.2.1` from `https://www.paddlepaddle.org.cn/packages/stable/cu126/`; arm64 uses `mediapipe==0.10.18`; `codeformer-pip==0.0.4` needs `--no-deps`; `postInstall` re-pins `numpy==1.26.4`.

The file should contain a top-level `manifestVersion`, `imageVersion`, `pythonVersion`, `basePackages` array, and `bundles` object with all 6 bundles. Each bundle has `name`, `description`, `estimatedSize`, `packages` (with `common`/`amd64`/`arm64` arrays), `pipFlags`, `postInstall`, `models` array, and `enablesTools` array.

Model entries use either: `{ "id", "url", "path", "minSize" }` for direct downloads, `{ "id", "downloadFn": "rembg_session", "args": [...] }` for rembg models, or `{ "id", "downloadFn": "hf_snapshot", "args": [repo_id, local_subpath] }` for HuggingFace snapshots.

- [ ] **Step 2: Commit**

```bash
git add docker/feature-manifest.json
git commit -m "feat: add feature manifest with all 6 bundle definitions"
```

---

### Task 3: Backend Feature Status Service

**Files:**
- Create: `apps/api/src/lib/feature-status.ts`

- [ ] **Step 1: Create the feature status service**

Create `apps/api/src/lib/feature-status.ts`. This module reads/writes `/data/ai/installed.json`, provides `isFeatureInstalled(bundleId)`, `isToolInstalled(toolId)`, `getFeatureStates()`, `markInstalled()`, `markUninstalled()`, `setInstallProgress()`, and `ensureAiDirs()`.

Uses `FEATURE_BUNDLES` and `TOOL_BUNDLE_MAP` from `@ashim/shared`. Caches `installed.json` in memory with `invalidateCache()` for refresh after install/uninstall. Detects Docker environment via `existsSync("/.dockerenv")`.

See spec section "Persistent Storage" for directory structure: `/data/ai/venv/`, `/data/ai/models/`, `/data/ai/pip-cache/`, `/data/ai/installed.json`.

**Robustness requirements for this module:**

- **Atomic JSON writes:** `markInstalled()` and `markUninstalled()` must write to `installed.json.tmp` first, then `renameSync()` to `installed.json`. Never write directly to `installed.json`.
- **Corrupt JSON recovery:** `readInstalled()` wraps `JSON.parse` in try/catch. If the file is corrupt, treat as empty `{ bundles: {} }` and log a warning.
- **File-based install lock:** Instead of just in-memory `installInProgress`, use `/data/ai/install.lock` file containing `{ bundleId, startedAt, pid }`. Create lock before install, delete on completion/failure. `getInstallingBundle()` reads from the lock file, not memory.
- **`recoverInterruptedInstalls()`** function called on startup:
  1. Delete any `*.downloading` files in `/data/ai/models/` (recursive glob)
  2. Delete `installed.json.tmp` if it exists
  3. Delete `/data/ai/venv.bootstrapping/` if it exists
  4. If `install.lock` exists: check if PID is alive (via `process.kill(pid, 0)` in try/catch). If dead, delete the lock and log a warning. If alive, leave it (install is still running from a previous container lifecycle — unlikely but possible with shared volumes).
  5. For each bundle in `installed.json`, verify model files exist and meet `minSize` from the feature manifest. If any model is missing/undersized, set the bundle's error field to "Some model files are missing. Reinstall this feature." but do NOT remove from installed.json.
- **`acquireInstallLock(bundleId)`** and **`releaseInstallLock()`** functions that create/delete the lock file atomically.

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/lib/feature-status.ts
git commit -m "feat: add backend feature status service for tracking installed bundles"
```

---

### Task 4: Feature API Routes

**Files:**
- Create: `apps/api/src/routes/features.ts`
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: Create the features route file**

Create `apps/api/src/routes/features.ts` with 4 endpoints:

1. `GET /api/v1/features` (any authenticated user) — returns `{ bundles: FeatureBundleState[] }`. In non-Docker environments, returns all features as installed.
2. `POST /api/v1/admin/features/:bundleId/install` (admin only) — validates bundle exists, checks not already installed, checks no other install in progress (409). Spawns `install_feature.py` as child process via `spawn()`. Parses stderr JSON progress lines, updates progress via `updateSingleFileProgress()` from `progress.ts`. On success, calls `invalidateCache()` and `shutdownDispatcher()` (from `@ashim/ai`). Returns `{ jobId }`.
3. `POST /api/v1/admin/features/:bundleId/uninstall` (admin only) — removes model files listed in the manifest, calls `markUninstalled()`, calls `shutdownDispatcher()`. Returns `{ ok: true }`.
4. `GET /api/v1/admin/features/disk-usage` (admin only) — returns `{ totalBytes }` by recursively sizing `/data/ai/`.

Note: Use `spawn()` from `node:child_process` (not `exec()`) for the install script to avoid shell injection. Pass arguments as array elements.

**Robustness requirements for install endpoint:**
- Call `acquireInstallLock(bundleId)` before spawning the child process. If lock acquisition fails (lock file already exists with a live PID), return 409.
- Check available disk space before starting: `const { availableParallelism } = require("node:os"); const stats = statfsSync("/data"); const freeBytes = stats.bfree * stats.bsize;`. Compare against a rough estimate for the bundle. If insufficient, return 400 with disk space info.
- On child process `close` event with code 0: call `releaseInstallLock()`, `invalidateCache()`, `shutdownDispatcher()`.
- On child process `close` event with non-zero code: call `releaseInstallLock()`, set error state. Do NOT leave the lock file behind.
- On child process `error` event (spawn failure): call `releaseInstallLock()`, return error.
- The install endpoint returns `{ jobId }` immediately. The child process runs asynchronously. The HTTP response does not block on completion.

- [ ] **Step 2: Register feature routes in index.ts**

In `apps/api/src/index.ts`: import `registerFeatureRoutes`, call it after the settings routes registration. Also import and call `ensureAiDirs()` and `recoverInterruptedInstalls()` near the top of the startup sequence after `runMigrations()`.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/routes/features.ts apps/api/src/index.ts
git commit -m "feat: add feature install/uninstall API routes with SSE progress"
```

---

### Task 5: Python Install Script

**Files:**
- Create: `packages/ai/python/install_feature.py`

- [ ] **Step 1: Create the install script**

Create `packages/ai/python/install_feature.py`. Takes 3 CLI args: `bundleId`, `manifestPath`, `modelsDir`. Reads manifest JSON, detects architecture via `platform.machine()`, runs pip install for each package using `subprocess.run([sys.executable, "-m", "pip", "install", ...])`, downloads models with retry logic (exponential backoff, 3 retries, file size assertions).

Progress reported via stderr JSON lines: `{"progress": N, "stage": "..."}`. Result written to stdout JSON: `{"success": true, "bundleId": "...", "version": "...", "models": [...]}`.

Port the retry pattern from `docker/download_models.py` `_urlretrieve()` (lines 18-35). Handle rembg models via `rembg.new_session()` and HuggingFace models via `huggingface_hub.snapshot_download()`. Must be idempotent.

Writes to `/data/ai/installed.json` on success (matching the structure read by `feature-status.ts`).

**Additional requirements based on recent codebase changes:**

- **Parallel model downloads:** Use `concurrent.futures.ThreadPoolExecutor(max_workers=4)` for model downloads, matching the pattern in `docker/download_models.py` (lines 671-720). Collect errors from all downloads and report them together.
- **NCCL conflict handling:** After installing packages for any bundle, check if both `torch` and `paddlepaddle-gpu` are installed. If so, run the NCCL re-alignment: `pip install $($PYTHON -c "from importlib.metadata import requires; print([r.split(';')[0].strip() for r in requires('torch') if 'nccl' in r][0])")`. This prevents paddlepaddle-gpu from silently downgrading `nvidia-nccl-cu12`.
- **ONNX CUDA provider safety:** When installing `onnxruntime-gpu` at runtime (GPU is present), the CUDA EP shared library loads immediately on import. If the install script imports onnxruntime during model download (e.g., for rembg which uses ONNX), this should work fine at runtime (unlike build time where GPU drivers aren't available).
- **GPU detection for package variant selection:** Use the two-tier GPU detection from `gpu.py` (torch -> ONNX RT ctypes probe). If GPU is available, install GPU variants (onnxruntime-gpu, paddlepaddle-gpu, CUDA torch). If not, install CPU variants.

**Robustness requirements for the install script:**

- **Atomic model downloads:** For each URL-based model:
  1. Check if final path already exists and meets `minSize` — skip if so (idempotent)
  2. Delete any existing `<path>.downloading` file (orphan from a previous failed attempt)
  3. Download to `<path>.downloading`
  4. Verify file size against `minSize`. If too small, delete and raise error.
  5. `os.rename(<path>.downloading, <path>)` — atomic on same filesystem
  6. Never leave a `.downloading` file behind on success
- **Atomic JSON writes:** When writing `installed.json`:
  1. Write to `installed.json.tmp`
  2. `os.rename()` to `installed.json`
- **Disk space pre-check:** Before starting, check available disk space via `shutil.disk_usage()`. If free space is less than estimated bundle size, exit with a clear error message.
- **pip failure recovery:** If `pip install` fails for one package, emit the error and exit. The packages that were already installed remain (pip is idempotent — re-running skips them). The admin can retry.
- **Model failure isolation:** If one model fails to download after retries, continue downloading other models. At the end, report which models failed. Exit with non-zero code so the bundle is NOT marked as installed. On retry, only the failed models need downloading (others pass the exists+size check).

- [ ] **Step 2: Commit**

```bash
git add packages/ai/python/install_feature.py
git commit -m "feat: add Python install script for feature bundles"
```

---

### Task 6: Tool Route Guards

**Files:**
- Modify: `apps/api/src/routes/tool-factory.ts`
- Modify: `apps/api/src/routes/batch.ts`
- Modify: `apps/api/src/routes/pipeline.ts`
- Modify: `apps/api/src/routes/tools/restore-photo.ts`

- [ ] **Step 1: Add feature guard to tool-factory.ts**

Import `isToolInstalled` from `../lib/feature-status.js` and `TOOL_BUNDLE_MAP`, `getBundleForTool` from `@ashim/shared`. Inside `createToolRoute`, after settings validation and before `config.process()`, add:

```ts
const bundleId = TOOL_BUNDLE_MAP[config.toolId];
if (bundleId && !isToolInstalled(config.toolId)) {
  const bundle = getBundleForTool(config.toolId);
  return reply.status(501).send({
    error: "Feature not installed",
    code: "FEATURE_NOT_INSTALLED",
    feature: bundleId,
    featureName: bundle?.name ?? bundleId,
    estimatedSize: bundle?.estimatedSize ?? "unknown",
  });
}
```

- [ ] **Step 2: Add feature guard to batch.ts**

Same imports. After `getToolConfig(toolId)` returns (around line 35-37), add the same guard returning 501 with `FEATURE_NOT_INSTALLED` code.

- [ ] **Step 3: Add feature guard to pipeline.ts**

Same imports. In both pre-validation loops (execute at lines 143-172, batch at lines 441-462), after successful `getToolConfig(resolvedToolId)`, add the guard. Return 501 with step number in the error message.

- [ ] **Step 4: Add feature guard to restore-photo.ts**

This tool uses its own route handler, not the factory. Import `isToolInstalled` and add the guard before `restorePhoto()` is called.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/routes/tool-factory.ts apps/api/src/routes/batch.ts apps/api/src/routes/pipeline.ts apps/api/src/routes/tools/restore-photo.ts
git commit -m "feat: add feature-installed guards to tool routes, batch, and pipeline"
```

---

### Task 7: Python Sidecar Changes

**Files:**
- Modify: `packages/ai/python/dispatcher.py`

Note: `colorize.py` and `restore.py` do NOT need import changes. Their hard module-level imports (`numpy`, `cv2`, `PIL`) are base packages that will always be in the image. The ML-specific imports (`onnxruntime`, `torch`, `mediapipe`, `rembg`, `gfpgan`, `codeformer`) are already imported lazily inside functions in all Python scripts.

- [ ] **Step 1: Add feature gating to dispatcher.py**

Add a `TOOL_BUNDLE_MAP` dict mapping Python script names (without `.py`) to bundle IDs: `remove_bg` -> `background-removal`, `detect_faces` -> `face-detection`, `face_landmarks` -> `face-detection`, `red_eye_removal` -> `face-detection`, `inpaint` -> `object-eraser-colorize`, `colorize` -> `object-eraser-colorize`, `upscale` -> `upscale-enhance`, `enhance_faces` -> `upscale-enhance`, `noise_removal` -> `upscale-enhance`, `restore` -> `photo-restoration`, `ocr` -> `ocr`.

Add `_get_installed_bundles()` that reads `/data/ai/installed.json` and returns a set of installed bundle IDs.

In `_run_script_main()`, before the `exec()` call, check if the script's bundle is installed. If not, return a JSON error: `{"success": false, "error": "feature_not_installed", "feature": bundle_id, "message": "..."}`.

Also set `U2NET_HOME` to `/data/ai/models/rembg` on startup if `/data/ai/models` exists.

Note: The dispatcher eagerly pre-imports `PIL`, `mediapipe`, `numpy`, `gpu`, `rembg` at startup (lines 39-45). With on-demand features, `mediapipe` and `rembg` may not be installed. The existing `_try_import` pattern already catches `ImportError` and logs it (recently improved to log the error). No change needed — the dispatcher starts fine with missing optional modules. After a feature is installed, `shutdownDispatcher()` (called from the install endpoint) kills and re-spawns the dispatcher, picking up the new packages.

- [ ] **Step 2: Commit**

```bash
git add packages/ai/python/dispatcher.py
git commit -m "feat: add feature gating to Python dispatcher"
```

---

### Task 8: Frontend Features Store and API Error Extension

**Files:**
- Create: `apps/web/src/stores/features-store.ts`
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/hooks/use-tool-processor.ts`
- Modify: `apps/web/src/hooks/use-pipeline-processor.ts`

- [ ] **Step 1: Create the features store**

Create `apps/web/src/stores/features-store.ts` following the `settings-store.ts` pattern. Zustand store with `bundles: FeatureBundleState[]`, `loaded: boolean`, `fetch()` (one-shot), `refresh()` (force re-fetch), `isToolInstalled(toolId)`, `getBundleForTool(toolId)`. Fetches from `GET /api/v1/features`.

- [ ] **Step 2: Extend parseApiError for FEATURE_NOT_INSTALLED**

In `apps/web/src/lib/api.ts`, add a `FeatureNotInstalledError` interface export: `{ type: "feature_not_installed"; feature: string; featureName: string; estimatedSize: string }`.

Modify `parseApiError` return type to `string | FeatureNotInstalledError`. Add early return when `body.code === "FEATURE_NOT_INSTALLED"`.

- [ ] **Step 3: Update use-tool-processor.ts and use-pipeline-processor.ts**

In both hooks, where `parseApiError` is called and passed to `setError()`, add a type check:

```ts
const parsed = parseApiError(body, xhr.status);
if (typeof parsed === "object" && parsed.type === "feature_not_installed") {
  setError(`Feature "${parsed.featureName}" is not installed. Enable it in Settings.`);
} else {
  setError(parsed);
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/stores/features-store.ts apps/web/src/lib/api.ts apps/web/src/hooks/use-tool-processor.ts apps/web/src/hooks/use-pipeline-processor.ts
git commit -m "feat: add frontend features store and FEATURE_NOT_INSTALLED error handling"
```

---

### Task 9: Frontend Tool Grid Badge

**Files:**
- Modify: `apps/web/src/components/common/tool-card.tsx`
- Modify: `apps/web/src/components/layout/tool-panel.tsx`
- Modify: `apps/web/src/pages/fullscreen-grid-page.tsx`

- [ ] **Step 1: Add download badge to ToolCard**

Import `useFeaturesStore`, `PYTHON_SIDECAR_TOOLS`, and `Download` icon from lucide-react. Compute `showDownloadBadge` when the tool is an AI tool and not installed. Render a `<Download className="h-3.5 w-3.5 text-muted-foreground" />` icon after the experimental badge.

- [ ] **Step 2: Fetch features on app load**

In `tool-panel.tsx`, add `useFeaturesStore().fetch()` in a useEffect alongside the existing settings fetch. Do the same in `fullscreen-grid-page.tsx`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/common/tool-card.tsx apps/web/src/components/layout/tool-panel.tsx apps/web/src/pages/fullscreen-grid-page.tsx
git commit -m "feat: add download badge to uninstalled AI tools in tool grid"
```

---

### Task 10: Frontend Tool Page Install Prompt

**Files:**
- Create: `apps/web/src/components/features/feature-install-prompt.tsx`
- Modify: `apps/web/src/pages/tool-page.tsx`

- [ ] **Step 1: Create the FeatureInstallPrompt component**

Props: `{ bundle: FeatureBundleState; isAdmin: boolean }`.

For non-admins: show centered Download icon + "Feature Not Enabled" heading + "Ask your administrator" text.

For admins: show Download icon + bundle name/description + "requires additional download (~{estimatedSize})" + [Enable Feature] button. On click: POST to install endpoint, open EventSource for SSE progress, show progress bar with stage text and percent. On completion: call `useFeaturesStore().refresh()` to trigger re-render. On error: show error message with retry option.

Use same Tailwind patterns as existing components: `bg-primary text-primary-foreground` for buttons, `Loader2 animate-spin` for loading, `text-destructive` for errors.

**Robustness requirements for the frontend:**

- **Double-click prevention:** Set `installing = true` immediately on first click (before the API call). The button must be `disabled={installing || bundle.status === "installing"}`. This prevents any re-click.
- **Browser close / navigate away:** The server-side install continues regardless. On component mount, check `bundle.status` from the features store. If it's `"installing"`, immediately show the progress bar and open EventSource for the in-progress job (fetch `jobId` from the features endpoint or use the bundle's progress data).
- **SSE connection loss fallback:** If EventSource fires `onerror`, close it and fall back to polling `GET /api/v1/features` every 3 seconds via `setInterval`. When status changes from `"installing"` to `"installed"` or `"error"`, stop polling and update UI.
- **Page refresh during install:** The features store's `fetch()` returns current status. If a bundle is `"installing"`, the component renders progress state immediately — no need for the user to click anything.
- **Multiple admin sessions:** All sessions see the same `"installing"` status from the shared `GET /api/v1/features` endpoint. The server's install lock prevents concurrent installs. Any session trying to install gets a 409.
- **Retry after error:** Show a "Retry" button when status is `"error"`. On retry, call the install endpoint again (the lock is released on failure, so this works). pip cache means previously-downloaded wheels aren't re-downloaded. Idempotent model downloads skip already-complete files.

- [ ] **Step 2: Integrate into ToolPage**

In `tool-page.tsx`: import `useFeaturesStore`, `PYTHON_SIDECAR_TOOLS`, `useAuth`, and `FeatureInstallPrompt`. After the tool/registryEntry lookup, compute `isAiTool`, `toolInstalled`, `featureBundle`, `isAdmin`. After the "Tool not found" guard, add a guard that renders `<FeatureInstallPrompt>` wrapped in `<AppLayout>` when the tool is AI and not installed.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/features/feature-install-prompt.tsx apps/web/src/pages/tool-page.tsx
git commit -m "feat: add feature install prompt on uninstalled AI tool pages"
```

---

### Task 11: Settings AI Features Section

**Files:**
- Create: `apps/web/src/components/settings/ai-features-section.tsx`
- Modify: `apps/web/src/components/settings/settings-dialog.tsx`

- [ ] **Step 1: Create AiFeaturesSection component**

Follow the card-based layout of existing sections in `settings-dialog.tsx`. Use `useFeaturesStore()`. Render each bundle as a bordered card (`rounded-lg border border-border`) with: name, description, status indicator (green dot = installed, gray = not installed, spinning = installing), estimated size, Install/Uninstall button. Add "Install All" button at top. Show total disk usage at bottom (fetch from `GET /api/v1/admin/features/disk-usage`). Reuse the toggle/button patterns from `ToolsSection`.

- [ ] **Step 2: Add section to settings-dialog.tsx**

Add `"ai-features"` to the `Section` type union. Add to `NAV_ITEMS` between `"api-keys"` and `"tools"`: `{ id: "ai-features", label: "AI Features", icon: Sparkles, requiredPermission: "settings:write" }`. Import `Sparkles` from lucide-react. Add `{section === "ai-features" && <AiFeaturesSection />}` to the conditional render block. Lazy-import `AiFeaturesSection` from `"./ai-features-section"`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/settings/ai-features-section.tsx apps/web/src/components/settings/settings-dialog.tsx
git commit -m "feat: add AI Features settings panel for managing feature bundles"
```

---

### Task 12: Dockerfile Restructuring

**Files:**
- Modify: `docker/Dockerfile`
- Modify: `docker/entrypoint.sh`

- [ ] **Step 1: Modify the Dockerfile**

In `docker/Dockerfile` production stage. Be precise — the Dockerfile has changed significantly since the initial analysis. Current state uses cuDNN base, a node-bins donor stage, COPY-based Node.js install, pip cache mounts on all layers, and an NCCL re-alignment step.

1. **Keep**: cuDNN base image (`nvidia/cuda:12.6.3-cudnn-runtime-ubuntu24.04` on amd64, `node:22-bookworm` on arm64)
2. **Keep**: `node-bins` donor stage and COPY-based Node.js install (replaces old NodeSource apt repo)
3. **Keep**: pnpm setup, system packages with retry loop, caire binary
4. **Keep**: Python venv creation with base packages (numpy, Pillow, opencv) and pip cache mount
5. **Remove**: all ML pip install commands (onnxruntime, rembg, realesrgan, paddlepaddle, mediapipe, codeformer, NCCL fix)
6. **Remove**: download_models.py COPY and RUN (parallel model download step)
7. **Remove**: the `apt-get purge build-essential python3-dev` line — keep build-essential for runtime pip installs
8. **Add**: `COPY docker/feature-manifest.json /app/docker/feature-manifest.json`
9. **Add**: `COPY packages/ai/python/install_feature.py /app/packages/ai/python/install_feature.py`
10. **Update** env vars: `PYTHON_VENV_PATH=/data/ai/venv`, add `MODELS_PATH=/data/ai/models`, add `DATA_DIR=/data`

Note: The NCCL re-alignment step (dynamically reads torch's NCCL dependency after paddlepaddle-gpu silently downgrades it) is only needed when BOTH torch and paddlepaddle-gpu are installed. In the on-demand model, these would be installed at different times by different bundles (Upscale vs OCR). The install_feature.py script must handle this: if torch is already installed and paddlepaddle-gpu is being installed (or vice versa), run the NCCL re-alignment afterward.

- [ ] **Step 2: Update entrypoint.sh for venv bootstrap**

Add venv bootstrap after auth defaults and before volume permission fix. Use atomic directory rename to prevent corrupt venv from partial copy:

```sh
AI_VENV="/data/ai/venv"
AI_VENV_TMP="/data/ai/venv.bootstrapping"

# Clean up any interrupted bootstrap from a previous start
if [ -d "$AI_VENV_TMP" ]; then
  echo "Cleaning up interrupted venv bootstrap..."
  rm -rf "$AI_VENV_TMP"
fi

# Bootstrap AI venv from base image on first run
if [ ! -d "$AI_VENV" ] && [ -d "/opt/venv" ]; then
  echo "Bootstrapping AI venv from base image..."
  mkdir -p /data/ai/models /data/ai/pip-cache
  cp -r /opt/venv "$AI_VENV_TMP"
  mv "$AI_VENV_TMP" "$AI_VENV"
  echo "AI venv ready at $AI_VENV"
fi
```

The `cp -r` + `mv` pattern ensures `/data/ai/venv` is either fully present or absent — never half-copied. If the container is killed during `cp -r`, the `.bootstrapping` directory is cleaned up on next start.

- [ ] **Step 3: Build and verify**

```bash
docker build -f docker/Dockerfile -t ashim:dev .
docker images ashim:dev --format "{{.Size}}"
```
Expected: Image size ~5-6 GB (amd64) instead of ~30 GB.

- [ ] **Step 4: Commit**

```bash
git add docker/Dockerfile docker/entrypoint.sh
git commit -m "feat: restructure Dockerfile to remove ML packages and models

Base image now includes only Node.js + Sharp + Python with base deps.
AI features are downloaded on-demand via the feature install system.
Image reduced from ~30GB to ~5-6GB (amd64) / ~2-3GB (arm64)."
```

---

### Task 13: Integration Testing

**Files:**
- Create: `tests/e2e-docker/features.spec.ts`

- [ ] **Step 1: Create Docker e2e tests for feature system**

Create `tests/e2e-docker/features.spec.ts` using the existing `playwright.docker.config.ts` infrastructure:

```ts
import { expect, test } from "@playwright/test";

test.describe("On-demand AI features", () => {
  test("GET /api/v1/features returns all 6 bundles", async ({ request }) => {
    const response = await request.get("/api/v1/features");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.bundles).toHaveLength(6);
    for (const bundle of data.bundles) {
      expect(bundle).toHaveProperty("id");
      expect(bundle).toHaveProperty("name");
      expect(bundle).toHaveProperty("status");
      expect(bundle).toHaveProperty("enablesTools");
    }
  });

  test("AI tool returns 501 FEATURE_NOT_INSTALLED when bundle not installed", async ({ request }) => {
    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      "base64",
    );
    const response = await request.post("/api/v1/tools/remove-background", {
      multipart: {
        file: { name: "test.png", mimeType: "image/png", buffer: pngBuffer },
        settings: JSON.stringify({}),
      },
    });
    expect(response.status()).toBe(501);
    const body = await response.json();
    expect(body.code).toBe("FEATURE_NOT_INSTALLED");
    expect(body.feature).toBe("background-removal");
  });

  test("uninstalled AI tool page shows install prompt for admin", async ({ page }) => {
    await page.goto("/remove-background");
    await expect(page.getByText("Enable")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("additional download")).toBeVisible();
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e-docker/features.spec.ts
git commit -m "test: add e2e tests for on-demand AI feature system"
```

---

### Task Summary

| Task | Description | Key Files |
|------|------------|-----------|
| 1 | Shared types and bundle definitions | `packages/shared/src/features.ts` |
| 2 | Feature manifest JSON | `docker/feature-manifest.json` |
| 3 | Backend feature status service | `apps/api/src/lib/feature-status.ts` |
| 4 | Feature API routes | `apps/api/src/routes/features.ts` |
| 5 | Python install script | `packages/ai/python/install_feature.py` |
| 6 | Tool route guards | `tool-factory.ts`, `batch.ts`, `pipeline.ts` |
| 7 | Bridge + Python sidecar changes | `dispatcher.py`, `colorize.py`, `restore.py` |
| 8 | Frontend features store + error handling | `features-store.ts`, `api.ts` |
| 9 | Frontend tool grid badge | `tool-card.tsx`, `tool-panel.tsx` |
| 10 | Frontend tool page install prompt | `feature-install-prompt.tsx`, `tool-page.tsx` |
| 11 | Settings AI Features section | `ai-features-section.tsx`, `settings-dialog.tsx` |
| 12 | Dockerfile restructuring | `Dockerfile`, `entrypoint.sh` |
| 13 | Integration testing | `tests/e2e-docker/features.spec.ts` |
