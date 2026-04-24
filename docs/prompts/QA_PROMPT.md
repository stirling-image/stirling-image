# Ashim - Comprehensive QA Automation Prompt

## Role & System Directive

Initialize as the Principal QA Automation Architect for the Ashim monorepo. Your objective is a 100% regression and functional test sweep across all environments, covering every API endpoint, every GUI interaction, every input format, every auth flow, and every edge case.

**Execution Engine:** Opus 4.7, Max Effort, 1M Token Context — for EVERY agent, EVERY subagent, no exceptions. Never downgrade models.

---

## TOP PRIORITY: MAXIMUM PARALLELIZATION

**Speed is the #1 priority.** You MUST spawn the maximum number of parallel Claude agent teams to execute this test matrix simultaneously. Do NOT run things sequentially when they can run in parallel. The only sequential dependency is Phase 0 (infrastructure) — once containers are healthy on all nodes, EVERYTHING ELSE runs in parallel across 15+ simultaneous agent streams.

### Parallel Agent Architecture

After infrastructure is ready, spawn ALL of the following agents in a SINGLE message with multiple Agent tool calls:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PHASE 0: INFRASTRUCTURE (Sequential)                 │
│  Provision containers on all 3 nodes, verify health, obtain tokens      │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │ All containers healthy
                               ▼
┌─────────────────── PARALLEL BLAST ──────────────────────────────────────┐
│                                                                         │
│  ┌─── WSL/GPU NODE (192.168.0.247:2222) ───┐  ┌─── UBUNTU CPU NODE ──┐ │
│  │                                          │  │  (192.168.0.191)     │ │
│  │  Agent 1: GPU AI Tools API               │  │                      │ │
│  │    remove-bg, upscale, enhance-faces,    │  │  Agent 7: CPU Tool   │ │
│  │    colorize, noise-removal, restore,     │  │    Parity             │ │
│  │    passport-photo, ocr, blur-faces,      │  │    All 35 non-AI     │ │
│  │    smart-crop, erase-object, red-eye     │  │    tools via API     │ │
│  │    + anti-fallback GPU verification      │  │                      │ │
│  │                                          │  │  Agent 8: CPU Format │ │
│  │  Agent 2: GPU Essential+Watermark API    │  │    Matrix             │ │
│  │    resize, crop, rotate, convert,        │  │    All 18 input      │ │
│  │    compress, strip-metadata, edit-meta,  │  │    formats through   │ │
│  │    adjust-colors, sharpening,            │  │    resize             │ │
│  │    watermark-text, watermark-image,      │  │                      │ │
│  │    text-overlay, compose                 │  │  Agent 9: CPU AI     │ │
│  │                                          │  │    Fallback           │ │
│  │  Agent 3: GPU Utility+Layout+Format API  │  │    Install bundles,  │ │
│  │    info, compare, find-duplicates,       │  │    test CPU fallback │ │
│  │    color-palette, qr-generate,           │  │    for all 12 AI     │ │
│  │    barcode-read, image-to-base64,        │  │    tools              │ │
│  │    collage, stitch, split, border,       │  │                      │ │
│  │    svg-to-raster, vectorize, gif-tools,  │  │  Agent 10: CPU       │ │
│  │    pdf-to-image, optimize-for-web,       │  │    Batch+Pipeline     │ │
│  │    bulk-rename, favicon, image-to-pdf,   │  │    Batch processing  │ │
│  │    replace-color, content-aware-resize,  │  │    + pipeline tests  │ │
│  │    image-enhancement                     │  │    on CPU node        │ │
│  │                                          │  │                      │ │
│  │  Agent 4: GPU Batch + Pipeline           │  └──────────────────────┘ │
│  │    Batch processing all tools,           │                           │
│  │    pipeline execution (single+batch),    │  ┌─── MAC NODE (Local) ──┐│
│  │    pipeline save/load/delete,            │  │                       ││
│  │    SSE progress monitoring,              │  │  Agent 11: Playwright ││
│  │    "first-image-only" bug hunt           │  │    Essential+Water-   ││
│  │                                          │  │    mark+Utility GUI   ││
│  │  Agent 5: GPU Format Matrix              │  │    (tools 1-21)       ││
│  │    All 18 input formats through resize   │  │                       ││
│  │    on GPU node                           │  │  Agent 12: Playwright ││
│  │                                          │  │    Layout+Format+     ││
│  └──────────────────────────────────────────┘  │    Optimize+AI GUI    ││
│                                                │    (tools 22-48)      ││
│  ┌─── ANY NODE (stateless tests) ──────────┐   │                       ││
│  │                                          │   │  Agent 13: Playwright ││
│  │  Agent 6: Auth + RBAC + Security        │   │    Nav+Auth+Settings  ││
│  │    Auth system (20 tests),              │   │    +Files+Pipeline    ││
│  │    API keys (10 tests),                 │   │    +Batch+Theme GUI   ││
│  │    custom roles/RBAC (10 tests),        │   │                       ││
│  │    teams (6 tests),                     │   └───────────────────────┘│
│  │    audit log (4 tests),                 │                            │
│  │    settings (5 tests),                  │   ┌─── ANY NODE ──────────┐│
│  │    branding (4 tests),                  │   │                       ││
│  │    AI features (5 tests),               │   │  Agent 14: Security  ││
│  │    analytics/docs (5 tests),            │   │    + Stress Testing   ││
│  │    health/upload/download (5 tests),    │   │    All 16 security   ││
│  │    file library (10 tests),             │   │    tests + 7 perf    ││
│  │    ALL 16 security tests,               │   │    tests              ││
│  │    escalation/injection/traversal       │   │                       ││
│  │                                          │   │  Agent 15: DB +      ││
│  └──────────────────────────────────────────┘   │    Cross-Platform    ││
│                                                 │    Parity + Report   ││
│  ┌─── WINDOWS NODE (192.168.0.247) ────────┐   │    (runs last, after ││
│  │  ssh siddh@192.168.0.247 (PowerShell)   │   │    all others done)  ││
│  │                                          │   └──────────────────────┘│
│  │  Agent 16: Windows Docker Desktop       │                            │
│  │    Docker Desktop on native Windows,    │                            │
│  │    PowerShell commands, Windows path    │                            │
│  │    handling, run core tool API tests    │                            │
│  │    + batch + pipeline to verify         │                            │
│  │    Windows compatibility                │                            │
│  │                                          │                            │
│  └──────────────────────────────────────────┘                            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Agent Spawning Rules

1. **Spawn agents 1-14 and 16 in a SINGLE message** with 15 parallel Agent tool calls after Phase 0 completes.
2. **Agent 15 (Report)** spawns AFTER agents 1-14 and 16 complete — it collects all results.
3. **Every agent uses Opus 4.7 Max Effort 1M context.** No exceptions. No model downgrading.
4. **Each agent is self-contained** — receives its full test list, connection details, auth token, and file paths. No agent depends on another agent's output (except Agent 15).
5. **Within each agent**, run independent API calls in parallel too (multiple curl commands via `&` or `xargs -P`).
6. **If any agent finds a bug**, it MUST fix it immediately in the source code, then notify the orchestrator to rebuild containers and re-test across all agents.

---

## CRITICAL DIRECTIVE: PRODUCTION CONTAINERS ONLY

You are strictly forbidden from spinning up local Node.js dev servers or Vite dev servers. ALL tests (integration, Playwright E2E, API contract) MUST execute against fully built Docker containers — the exact images users will run. Never use `pnpm dev`.

**Container startup command:**
```bash
SKIP_MUST_CHANGE_PASSWORD=true docker compose -f docker/docker-compose.yml up -d --build
# For GPU node:
SKIP_MUST_CHANGE_PASSWORD=true docker compose -f docker/docker-compose-gpu.yml up -d --build
```

**Health verification before any testing:**
```bash
until curl -sf http://localhost:1349/api/v1/health; do sleep 2; done
```

---

## CRITICAL DIRECTIVE: FIX EVERYTHING

Fix ALL bugs, warnings, deprecations, lint issues, and problems you encounter — even if they are completely unrelated to the test you are currently running. We want this software to be completely bug-free and always just working perfectly. No issue is out of scope. If you see it, fix it.

- Console warnings in Docker logs → Fix them.
- Deprecation notices → Update the code.
- TypeScript type errors → Fix them.
- Lint violations → Fix them.
- Race conditions → Fix them.
- Memory leaks → Fix them.
- Accessibility issues → Fix them.
- Broken error messages → Fix them.

After fixing any code, rebuild the Docker container and re-test to verify the fix.

**SOURCE OF TRUTH: LOCAL MAC CODEBASE.** ALL code changes MUST be made on the local Mac codebase first, then rsync'd to remote test nodes (Ubuntu, WSL). Never fix code directly on a remote system. The local codebase is what gets pushed to GitHub. If you fix a bug on a remote node without updating the local codebase, the fix is lost and future tests will fail again. The workflow is always: fix locally, rsync to remotes, rebuild containers on remotes, re-test.

---

## Multi-Agent Topology

| Agent | Host | Connection | Shell | Role |
|-------|------|------------|-------|------|
| **Mac (Lead)** | Local macOS | Direct | zsh | Orchestrator. Runs Playwright E2E GUI suite via `playwright.docker.config.ts`. Validates downloads, screenshots, visual regression. |
| **WSL (GPU)** | 192.168.0.247:2222 | `ssh -p 2222 siddharth@192.168.0.247` | bash | Docker + NVIDIA RTX 4070 (12GB VRAM, CUDA 13.2). Owns all GPU-accelerated AI tests, model quality verification, anti-fallback checks. |
| **Windows** | 192.168.0.247 | `ssh siddh@192.168.0.247` | PowerShell/CMD | Native Windows. Tests Docker Desktop on Windows, PowerShell-based workflows, Windows-specific path handling and compatibility. |
| **Ubuntu** | 192.168.0.191 | `ssh ubuntuserver@192.168.0.191` | bash | Pure CPU Linux node. Install Docker if missing, build and run CPU-only container. Tests CPU fallback behavior, headless API-only validation, cross-platform parity. SSH key already configured. |

**Important:** `ssh siddh@192.168.0.247` is native Windows (PowerShell/CMD). `ssh -p 2222 siddharth@192.168.0.247` is WSL on the same machine. They are different environments on the same hardware.

**Setup Ubuntu if Docker missing:**
```bash
ssh ubuntuserver@192.168.0.191 'sudo apt-get update && sudo apt-get install -y docker.io docker-compose-v2 && sudo usermod -aG docker $USER'
```

---

## Test Assets

**Primary fixtures** (committed to repo):
```
tests/fixtures/
  test-100x100.jpg, test-100x100.svg, test-1x1.png, test-200x150.heic,
  test-200x150.png, test-3page.pdf, test-50x50.webp, test-blank.png,
  test-portrait.heic, test-portrait.jpg, test-with-exif.jpg, animated.gif

tests/fixtures/content/
  animated-simpsons.gif      # GIF tool testing
  barcode.avif               # Barcode reading
  cross-format-chat.webp     # Cross-format validation
  motorcycle.heif            # HEIF decode testing
  multi-face.webp            # Multi-face detection (blur-faces, enhance-faces)
  ocr-chat.jpeg              # English OCR
  ocr-japanese.png           # Japanese OCR (language=ja)
  portrait-bw.jpeg (2.7MB)   # Colorize, restore-photo
  portrait-color.jpg         # Face enhance, passport-photo, smart-crop
  portrait-headshot.heic     # HEIC face tools
  portrait-isolated.png      # Remove-background (already isolated - edge case)
  qr-code.avif               # Barcode/QR reading
  qr-code.svg                # SVG QR
  red-eye.jpg                # Red-eye removal
  stress-large.jpg (6.7MB)   # Stress/memory testing
  svg-logo.svg               # SVG-to-raster, vectorize
  watermark.jpg              # Watermark overlay base

tests/fixtures/formats/       # 18 FORMAT COVERAGE
  sample.avif, sample.bmp, sample.dng (RAW), sample.exr, sample.gif,
  sample.hdr, sample.heic, sample.heif, sample.ico, sample.jpg,
  sample.jxl, sample.png, sample.psd, sample.svg, sample.tga,
  sample.tiff, sample.webp, multipage.tiff
```

All test images come exclusively from `tests/fixtures/` and its subdirectories (`content/`, `formats/`). Do NOT use any external folders.

---

## Phase 0: Infrastructure Provisioning (Sequential — Must Complete Before Parallel Blast)

### 0.1 Code Analysis
- Run `git status` and `git log --oneline -20` on Mac to understand recent changes.
- Run `git diff HEAD~5..HEAD --stat` to see scope of recent modifications.

### 0.2 Container Deployment (parallel across all 3 nodes)

Spawn 3 parallel agents to provision all nodes simultaneously:

- **WSL (GPU):** `ssh -p 2222 siddharth@192.168.0.247` → rsync codebase → `docker compose -f docker/docker-compose-gpu.yml up -d --build` → Verify `nvidia-smi` → Check Docker logs for `GPU detected` → Wait for health endpoint.
- **Ubuntu (CPU):** `ssh ubuntuserver@192.168.0.191` → Install Docker if missing → rsync codebase → `docker compose -f docker/docker-compose.yml up -d --build` → Wait for health endpoint.
- **Mac:** Verify remote containers are accessible: `curl http://192.168.0.247:1349/api/v1/health` and `curl http://192.168.0.191:1349/api/v1/health`.

### 0.3 Obtain Auth Tokens (on each node)
```bash
TOKEN=$(curl -s -X POST http://localhost:1349/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin"}' | jq -r '.token')
```

### 0.4 Install AI Bundles (on GPU and CPU nodes in parallel)
```bash
for bundle in background-removal face-detection upscale-enhance object-eraser-colorize ocr photo-restoration; do
  curl -X POST "http://localhost:1349/api/v1/admin/features/$bundle/install" \
    -H "Authorization: Bearer $TOKEN" &
done
wait
# Poll until all installed:
until curl -s http://localhost:1349/api/v1/features -H "Authorization: Bearer $TOKEN" | jq -e '.[] | select(.installed != true)' | wc -l | grep -q '^0$'; do sleep 10; done
```

**Once all 3 nodes are healthy and AI bundles installed → LAUNCH THE PARALLEL BLAST**

---

## Agent 1: GPU AI Tools API Tests (WSL Node)

**Connection:** `ssh -p 2222 siddharth@192.168.0.247`
**Target:** `http://localhost:1349`
**Test count:** 35 tests

For every test: send `POST` with valid file and settings, verify HTTP 200, correct output, file size > 0.

| # | Tool | Endpoint | Test File | Key Settings | Verify |
|---|------|----------|-----------|--------------|--------|
| 1 | **remove-background** (transparent) | `POST /api/v1/tools/remove-background` | portrait-isolated.png | `backgroundType=transparent` | Check CUDA in logs |
| 2 | **remove-background** (color bg) | same | portrait-color.jpg | `backgroundType=color, backgroundColor=#0000FF` | Blue background applied |
| 3 | **remove-background** (blur bg) | same | portrait-color.jpg | `backgroundType=blur, blurRadius=20` | Blurred original as bg |
| 4 | **remove-bg/effects** (phase 2) | `POST /api/v1/tools/remove-background/effects` | Use jobId from #1 | `backgroundType=gradient` | No AI re-run, uses cached mask |
| 5 | **upscale** (2x) | `POST /api/v1/tools/upscale` | test-100x100.jpg | `scale=2, format=png` | Output is 200x200, ESRGAN model used |
| 6 | **upscale** (with face) | same | portrait-color.jpg | `scale=2, faceEnhance=true` | Upscaled with face enhancement |
| 7 | **ocr** (English fast) | `POST /api/v1/tools/ocr` | ocr-chat.jpeg | `quality=fast, language=en` | Correct text extraction |
| 8 | **ocr** (English best) | same | ocr-chat.jpeg | `quality=best, language=en` | Higher accuracy extraction |
| 9 | **ocr** (Japanese) | same | ocr-japanese.png | `quality=balanced, language=ja` | Japanese text extracted |
| 10 | **ocr** (auto language) | same | ocr-chat.jpeg | `quality=balanced, language=auto` | Auto-detected language |
| 11 | **blur-faces** | `POST /api/v1/tools/blur-faces` | multi-face.webp | `blurRadius=30, sensitivity=0.5` | All faces blurred, face count > 1 |
| 12 | **blur-faces** (single) | same | portrait-color.jpg | `blurRadius=50` | Single face blurred |
| 13 | **smart-crop** (face) | `POST /api/v1/tools/smart-crop` | portrait-color.jpg | `mode=face, facePreset=head-shoulders, width=400, height=400` | Face-centered crop |
| 14 | **smart-crop** (subject) | same | portrait-isolated.png | `mode=subject, width=300, height=300, padding=10` | Subject-centered |
| 15 | **smart-crop** (trim) | same | test-blank.png | `mode=trim, threshold=10` | Whitespace trimmed |
| 16 | **erase-object** | `POST /api/v1/tools/erase-object` | portrait-color.jpg + mask.png | `format=png` | Object under mask removed (LaMa) |
| 17 | **colorize** | `POST /api/v1/tools/colorize` | portrait-bw.jpeg | `intensity=1.0, model=auto` | Color version of B&W photo |
| 18 | **colorize** (low intensity) | same | portrait-bw.jpeg | `intensity=0.5` | Partially colorized |
| 19 | **enhance-faces** (gfpgan) | `POST /api/v1/tools/enhance-faces` | portrait-color.jpg | `model=gfpgan, strength=0.8` | Face enhanced |
| 20 | **enhance-faces** (codeformer) | same | portrait-color.jpg | `model=codeformer, strength=0.7` | Face enhanced |
| 21 | **enhance-faces** (multi) | same | multi-face.webp | `model=auto, onlyCenterFace=false` | All faces enhanced |
| 22 | **noise-removal** (quick) | `POST /api/v1/tools/noise-removal` | test-200x150.png | `tier=quick, strength=0.5` | Denoised |
| 23 | **noise-removal** (quality) | same | stress-large.jpg | `tier=quality, strength=0.8, detailPreservation=0.5` | High-quality denoise |
| 24 | **red-eye-removal** | `POST /api/v1/tools/red-eye-removal` | red-eye.jpg | `sensitivity=50, strength=80` | Red eyes corrected |
| 25 | **restore-photo** (auto) | `POST /api/v1/tools/restore-photo` | portrait-bw.jpeg | `mode=auto, scratchRemoval=true, faceEnhancement=true, colorize=true` | Full restoration pipeline |
| 26 | **restore-photo** (light) | same | portrait-color.jpg | `mode=light, faceEnhancement=true, denoise=true` | Light restoration |
| 27 | **passport-photo/analyze** | `POST /api/v1/tools/passport-photo/analyze` | portrait-headshot.heic | (none) | Returns preview + face landmarks |
| 28 | **passport-photo/generate** (US) | `POST /api/v1/tools/passport-photo/generate` | Use jobId from #27 | `countryCode=US, documentType=passport, printLayout=true, dpi=300` | US passport spec (2x2 inch) |
| 29 | **passport-photo/generate** (GB) | same | same | `countryCode=GB` | UK spec dimensions |
| 30 | **passport-photo/generate** (IN) | same | same | `countryCode=IN` | India spec dimensions |
| 31 | **passport-photo/generate** (JP) | same | same | `countryCode=JP` | Japan spec dimensions |
| 32 | **content-aware-resize** | `POST /api/v1/tools/content-aware-resize` | stress-large.jpg | `width=500` | Seam-carved, subjects preserved |
| 33 | **content-aware-resize** (face) | same | portrait-color.jpg | `width=300, protectFaces=true` | Face not distorted |
| 34 | **image-enhancement** (auto) | `POST /api/v1/tools/image-enhancement` | test-200x150.png | `mode=auto, intensity=50` | Auto-enhanced |
| 35 | **image-enhancement/analyze** | `POST /api/v1/tools/image-enhancement/analyze` | test-200x150.png | (none) | JSON corrections analysis |

**After all AI tests, run Anti-Fallback Check:**
```bash
docker logs ashim 2>&1 | grep -iE "(GPU|CUDA|cpu.fallback|model.loaded|VRAM|device)"
```
Verify: `GPU detected` / `CUDA available` in logs. ESRGAN, GFPGAN, CodeFormer, DDColor, rembg all using GPU. No `RuntimeError: CUDA out of memory`. No silent CPU fallbacks.

---

## Agent 2: GPU Essential + Watermark API Tests (WSL Node)

**Connection:** `ssh -p 2222 siddharth@192.168.0.247`
**Target:** `http://localhost:1349`
**Test count:** 35 tests

| # | Tool | Endpoint | Test File | Key Settings | Verify |
|---|------|----------|-----------|--------------|--------|
| 1 | **resize** | `POST /api/v1/tools/resize` | test-200x150.png | `width=100, height=75, fit=cover` | Output is 100x75 |
| 2 | **resize** (percentage) | same | test-200x150.png | `percentage=50` | Output is 100x75 |
| 3 | **resize** (withoutEnlargement) | same | test-100x100.jpg | `width=200, withoutEnlargement=true` | Output stays 100x100 |
| 4 | **crop** | `POST /api/v1/tools/crop` | test-200x150.png | `left=10, top=10, width=50, height=50, unit=px` | Output is 50x50 |
| 5 | **crop** (percent) | same | test-200x150.png | `left=10, top=10, width=50, height=50, unit=percent` | Proportional crop |
| 6 | **rotate** | `POST /api/v1/tools/rotate` | test-100x100.jpg | `angle=90` | Width/height swapped |
| 7 | **rotate** (flip) | same | test-100x100.jpg | `angle=0, horizontal=true, vertical=true` | No dimension change |
| 8 | **convert** (jpg->png) | `POST /api/v1/tools/convert` | test-100x100.jpg | `format=png` | Output is PNG |
| 9 | **convert** (png->webp) | same | test-200x150.png | `format=webp, quality=80` | Output is WebP |
| 10 | **convert** (png->avif) | same | test-200x150.png | `format=avif, quality=50` | Output is AVIF |
| 11 | **convert** (to tiff) | same | test-100x100.jpg | `format=tiff` | Output is TIFF |
| 12 | **convert** (to gif) | same | test-100x100.jpg | `format=gif` | Output is GIF |
| 13 | **compress** (quality) | `POST /api/v1/tools/compress` | stress-large.jpg | `mode=quality, quality=60` | Output smaller than input |
| 14 | **compress** (targetSize) | same | stress-large.jpg | `mode=targetSize, targetSizeKb=500` | Output ~500KB |
| 15 | **strip-metadata** | `POST /api/v1/tools/strip-metadata` | test-with-exif.jpg | `stripAll=true` | No EXIF in output |
| 16 | **strip-metadata/inspect** | `POST /api/v1/tools/strip-metadata/inspect` | test-with-exif.jpg | (none) | Returns JSON with EXIF data |
| 17 | **edit-metadata** | `POST /api/v1/tools/edit-metadata` | test-with-exif.jpg | `title=Test, author=QA, clearGps=true` | Metadata updated, GPS cleared |
| 18 | **edit-metadata/inspect** | `POST /api/v1/tools/edit-metadata/inspect` | test-with-exif.jpg | (none) | Returns full ExifTool JSON |
| 19 | **adjust-colors** | `POST /api/v1/tools/adjust-colors` | test-200x150.png | `brightness=20, contrast=10, saturation=15` | Valid output |
| 20 | **adjust-colors** (grayscale) | same | test-200x150.png | `effect=grayscale` | Output is grayscale |
| 21 | **adjust-colors** (sepia) | same | test-200x150.png | `effect=sepia` | Output has sepia tone |
| 22 | **adjust-colors** (invert) | same | test-200x150.png | `effect=invert` | Colors inverted |
| 23 | **adjust-colors** (channels) | same | test-200x150.png | `red=1.5, green=0.8, blue=1.2` | Channel-adjusted output |
| 24 | **sharpening** (adaptive) | `POST /api/v1/tools/sharpening` | test-200x150.png | `method=adaptive, sigma=1.5` | Sharpened output |
| 25 | **sharpening** (unsharp) | same | test-200x150.png | `method=unsharp-mask, amount=1.5, radius=2, threshold=5` | Sharpened output |
| 26 | **sharpening** (high-pass) | same | test-200x150.png | `method=high-pass, strength=0.5, kernelSize=3` | Sharpened output |
| 27 | **sharpening** (with denoise) | same | test-200x150.png | `method=adaptive, sigma=1.5, denoise=medium` | Sharpened + denoised |
| 28 | **watermark-text** | `POST /api/v1/tools/watermark-text` | watermark.jpg | `text=ASHIM QA, fontSize=48, color=#FF0000, opacity=0.5, position=center` | Text visible |
| 29 | **watermark-text** (tiled) | same | watermark.jpg | `text=DRAFT, position=tiled, rotation=45, opacity=0.3` | Tiled pattern |
| 30 | **watermark-image** | `POST /api/v1/tools/watermark-image` | watermark.jpg + svg-logo.svg | `position=bottom-right, opacity=0.7, scale=0.2` | Logo overlaid |
| 31 | **text-overlay** | `POST /api/v1/tools/text-overlay` | test-200x150.png | `text=Hello World, fontSize=24, color=#FFFFFF, position=bottom, backgroundBox=true, shadow=true` | Text with bg+shadow |
| 32 | **compose** (overlay) | `POST /api/v1/tools/compose` | test-200x150.png + test-100x100.jpg | `x=10, y=10, opacity=0.8, blendMode=overlay` | Composited output |
| 33 | **compose** (multiply) | same | same | `blendMode=multiply` | Multiply blend |
| 34 | **compose** (screen) | same | same | `blendMode=screen` | Screen blend |
| 35 | **compose** (difference) | same | same | `blendMode=difference` | Difference blend |

---

## Agent 3: GPU Utility + Layout + Format + Optimization API Tests (WSL Node)

**Connection:** `ssh -p 2222 siddharth@192.168.0.247`
**Target:** `http://localhost:1349`
**Test count:** 44 tests

| # | Tool | Endpoint | Test File(s) | Key Settings | Verify |
|---|------|----------|-------------|--------------|--------|
| 1 | **info** | `POST /api/v1/tools/info` | test-200x150.png | (none) | JSON: width=200, height=150, format=png, histogram |
| 2 | **info** (HEIC) | same | test-200x150.heic | (none) | Correct dimensions decoded |
| 3 | **compare** (identical) | `POST /api/v1/tools/compare` | test-200x150.png x2 | (none) | similarity=100% |
| 4 | **compare** (different) | same | test-200x150.png + test-100x100.jpg | (none) | similarity < 100%, diff image |
| 5 | **find-duplicates** | `POST /api/v1/tools/find-duplicates` | 3 images (include dupe) | `threshold=5` | Groups identical, space saveable |
| 6 | **color-palette** | `POST /api/v1/tools/color-palette` | portrait-color.jpg | (none) | Array of hex colors (up to 8) |
| 7 | **qr-generate** | `POST /api/v1/tools/qr-generate` | (JSON body) | `text=https://ashim.app, size=500, errorCorrection=H` | Valid QR PNG |
| 8 | **barcode-read** | `POST /api/v1/tools/barcode-read` | barcode.avif | `tryHarder=true` | Barcode text, type, positions |
| 9 | **barcode-read** (QR) | same | qr-code.avif | (none) | QR text content |
| 10 | **image-to-base64** | `POST /api/v1/tools/image-to-base64` | test-200x150.png | `outputFormat=webp, quality=80, maxWidth=100` | Base64 string |
| 11 | **image-to-base64** (multi) | same | 2 images | `outputFormat=jpeg` | Array of base64 strings |
| 12 | **collage** (2 images) | `POST /api/v1/tools/collage` | 2 images | `templateId=2-side-by-side, aspectRatio=16:9, gap=4` | Collage output |
| 13 | **collage** (4 images) | same | 4 images | `templateId=4-grid, aspectRatio=1:1` | 2x2 grid |
| 14 | **stitch** (horizontal) | `POST /api/v1/tools/stitch` | 2 images | `direction=horizontal, resizeMode=fit, gap=4` | Stitched |
| 15 | **stitch** (vertical) | same | 2 images | `direction=vertical, alignment=center` | Stitched |
| 16 | **stitch** (grid) | same | 4 images | `direction=grid, gridColumns=2` | 2x2 grid |
| 17 | **split** | `POST /api/v1/tools/split` | test-200x150.png | `columns=2, rows=2, outputFormat=png` | ZIP with 4 tiles |
| 18 | **split** (custom tile) | same | stress-large.jpg | `tileWidth=200, tileHeight=200` | ZIP with correct tile count |
| 19 | **border** | `POST /api/v1/tools/border` | test-200x150.png | `borderWidth=10, borderColor=#FF0000, cornerRadius=20, shadow=true` | Bordered with shadow |
| 20 | **svg-to-raster** | `POST /api/v1/tools/svg-to-raster` | svg-logo.svg | `width=500, outputFormat=png, backgroundColor=#FFFFFF` | 500px PNG |
| 21 | **svg-to-raster** (high DPI) | same | svg-logo.svg | `dpi=300, outputFormat=jpg, quality=90` | High-res JPEG |
| 22 | **svg-to-raster/batch** | `POST /api/v1/tools/svg-to-raster/batch` | 2 SVGs | (none) | ZIP with 2 files |
| 23 | **vectorize** (bw) | `POST /api/v1/tools/vectorize` | test-200x150.png | `colorMode=bw, threshold=128` | SVG output |
| 24 | **vectorize** (color) | same | portrait-color.jpg | `colorMode=color, colorPrecision=6` | Color SVG |
| 25 | **gif-tools** (resize) | `POST /api/v1/tools/gif-tools` | animated.gif | `mode=resize, percentage=50` | Smaller animated GIF |
| 26 | **gif-tools** (optimize) | same | animated-simpsons.gif | `mode=optimize, colors=128` | Smaller file |
| 27 | **gif-tools** (speed) | same | animated.gif | `mode=speed, speedFactor=2` | Faster playback |
| 28 | **gif-tools** (reverse) | same | animated.gif | `mode=reverse` | Reversed frames |
| 29 | **gif-tools** (extract all) | same | animated.gif | `mode=extract, extractMode=all` | ZIP with frames |
| 30 | **gif-tools** (extract single) | same | animated.gif | `mode=extract, extractMode=single, frameNumber=1` | Single frame |
| 31 | **gif-tools** (rotate) | same | animated.gif | `mode=rotate, angle=90` | Rotated GIF |
| 32 | **gif-tools/info** | `POST /api/v1/tools/gif-tools/info` | animated.gif | (none) | Frame count, delays, duration |
| 33 | **pdf-to-image** (all pages) | `POST /api/v1/tools/pdf-to-image` | test-3page.pdf | `format=png, dpi=150, pages=1-3` | ZIP with 3 PNGs |
| 34 | **pdf-to-image** (single) | same | test-3page.pdf | `format=jpg, dpi=72, pages=1` | Single JPEG |
| 35 | **pdf-to-image** (grayscale) | same | test-3page.pdf | `colorMode=grayscale, dpi=150` | Grayscale output |
| 36 | **pdf-to-image/info** | `POST /api/v1/tools/pdf-to-image/info` | test-3page.pdf | (none) | `{pageCount: 3}` |
| 37 | **pdf-to-image/preview** | `POST /api/v1/tools/pdf-to-image/preview` | test-3page.pdf | (none) | Thumbnail previews |
| 38 | **optimize-for-web** | `POST /api/v1/tools/optimize-for-web` | stress-large.jpg | `format=webp, quality=80, maxWidth=1920, stripMetadata=true` | WebP < original |
| 39 | **optimize-for-web/preview** | `POST /api/v1/tools/optimize-for-web/preview` | same | same | Binary with size headers |
| 40 | **bulk-rename** | `POST /api/v1/tools/bulk-rename` | 2 images | `pattern=ashim_{{padded}}, startIndex=1` | ZIP with renamed files |
| 41 | **favicon** | `POST /api/v1/tools/favicon` | test-200x150.png | (none) | ZIP: 16/32/48/180/192/512px, ICO, manifest |
| 42 | **image-to-pdf** | `POST /api/v1/tools/image-to-pdf` | 2 images | `pageSize=A4, orientation=portrait, margin=20` | Multi-page PDF |
| 43 | **replace-color** | `POST /api/v1/tools/replace-color` | test-200x150.png | `sourceColor=#FFFFFF, targetColor=#FF0000, tolerance=30` | White→red |
| 44 | **replace-color** (transparent) | same | test-200x150.png | `sourceColor=#FFFFFF, makeTransparent=true, tolerance=30` | White→transparent |

---

## Agent 4: GPU Batch + Pipeline Tests (WSL Node)

**Connection:** `ssh -p 2222 siddharth@192.168.0.247`
**Target:** `http://localhost:1349`
**Test count:** 20 tests

### Batch Processing (8 tests)

| # | Test | Description |
|---|------|-------------|
| 1 | **Batch resize** | `POST /api/v1/tools/resize/batch` with 5 images → ZIP with all 5 resized |
| 2 | **Batch convert** | 5 JPGs → WebP batch → ZIP with 5 WebPs |
| 3 | **Batch compress** | 3 large images → All compressed in ZIP |
| 4 | **Batch watermark-text** | 3 images with same watermark → All watermarked |
| 5 | **"First-Image-Only" Bug Hunt** | Send 5 images to any batch endpoint → Verify ZIP contains EXACTLY 5 processed files, not just 1 |
| 6 | **Batch with mixed formats** | JPG + PNG + WebP + HEIC → All processed correctly |
| 7 | **Large batch** | 10+ images through resize → All complete, none dropped |
| 8 | **Batch SSE progress** | Monitor `GET /api/v1/jobs/:jobId/progress` SSE stream during batch → Verify totalFiles, completedFiles increment correctly |

### Pipeline/Automate (12 tests)

| # | Test | Description |
|---|------|-------------|
| 9 | **Simple pipeline** | Execute: [resize(width=100)] → Output is 100px wide |
| 10 | **2-step pipeline** | [resize(width=200), convert(format=webp)] → 200px WebP |
| 11 | **3-step pipeline** | [crop(50,50,100,100), rotate(90), compress(quality=70)] → All applied |
| 12 | **5-step pipeline** | [resize, adjust-colors(grayscale), sharpening, compress, convert(png)] → All 5 steps |
| 13 | **Pipeline with AI tool** | [remove-background, resize(200)] → BG removed then resized |
| 14 | **Pipeline batch** | `POST /api/v1/pipeline/batch` 3 images through [resize, convert] → ZIP with 3 |
| 15 | **Save pipeline** | `POST /api/v1/pipeline/save` → Stored in DB |
| 16 | **List pipelines** | `GET /api/v1/pipeline/list` → Saved pipeline appears |
| 17 | **Delete pipeline** | `DELETE /api/v1/pipeline/:id` → Removed |
| 18 | **Available tools** | `GET /api/v1/pipeline/tools` → Valid tool IDs |
| 19 | **Max steps limit** | Pipeline with 21+ steps → 400 error (max 20) |
| 20 | **Invalid tool in pipeline** | Nonexistent toolId → Clear error |

---

## Agent 5: GPU Format Matrix (WSL Node)

**Connection:** `ssh -p 2222 siddharth@192.168.0.247`
**Target:** `http://localhost:1349`
**Test count:** 18 tests

Test EVERY supported input format through the `resize` tool (baseline format compatibility):

| # | Format | Test File | Special Handling | Verify |
|---|--------|-----------|------------------|--------|
| 1 | JPEG | sample.jpg | Standard | Valid resized JPEG |
| 2 | PNG | sample.png | Alpha channel | Alpha preserved |
| 3 | WebP | sample.webp | WebP decode | Valid output |
| 4 | GIF | sample.gif | Static frame | Frame extracted |
| 5 | BMP | sample.bmp | BMP decode | Valid output |
| 6 | TIFF | sample.tiff | TIFF decode | Valid output |
| 7 | Multi-page TIFF | multipage.tiff | First page | Handled correctly |
| 8 | AVIF | sample.avif | AV1 decode | Valid output |
| 9 | SVG | sample.svg | Sanitization + rasterize | Valid output |
| 10 | HEIC | sample.heic | heif-dec decode | Valid output |
| 11 | HEIF | sample.heif | heif-dec decode | Valid output |
| 12 | DNG (RAW) | sample.dng | dcraw decode | Valid output |
| 13 | PSD | sample.psd | ImageMagick decode | Valid output |
| 14 | TGA | sample.tga | TGA decode | Valid output |
| 15 | EXR | sample.exr | HDR tone mapping | Valid output |
| 16 | HDR | sample.hdr | HDR tone mapping | Valid output |
| 17 | ICO | sample.ico | Icon decode | Valid output |
| 18 | PDF | test-3page.pdf | pdf-to-image tool | Valid output |

---

## Agent 6: Auth + RBAC + Admin API Tests (WSL or Ubuntu Node)

**Target:** `http://localhost:1349` (either node)
**Test count:** 84 tests

### Auth System (20 tests)

| # | Test | Method | Endpoint | Verify |
|---|------|--------|----------|--------|
| 1 | Login success | POST | `/api/auth/login` | `{token, user: {id, username, role}}` |
| 2 | Login wrong password | POST | `/api/auth/login` | 401 |
| 3 | Login nonexistent user | POST | `/api/auth/login` | 401 |
| 4 | Login empty body | POST | `/api/auth/login` | 400 validation |
| 5 | Session validation | GET | `/api/auth/session` | User info with valid token |
| 6 | Session invalid token | GET | `/api/auth/session` | 401 |
| 7 | Logout | POST | `/api/auth/logout` | 200, session invalidated |
| 8 | Post-logout session check | GET | `/api/auth/session` | 401 (old token rejected) |
| 9 | Change password | POST | `/api/auth/change-password` | 200, old sessions revoked |
| 10 | Change password weak | POST | `/api/auth/change-password` | 400 (8+ chars, upper+lower+number) |
| 11 | Change password wrong current | POST | `/api/auth/change-password` | 401 |
| 12 | List users (admin) | GET | `/api/auth/users` | Array of users with roles |
| 13 | Register new user | POST | `/api/auth/register` | 201 |
| 14 | Register duplicate username | POST | `/api/auth/register` | 409 conflict |
| 15 | Update user role | PUT | `/api/auth/users/:id` | Role changed |
| 16 | Admin escalation prevention | POST | `/api/auth/register` | Cannot create admin as non-admin |
| 17 | Delete user (not self) | DELETE | `/api/auth/users/:id` | Deleted, sessions cascaded |
| 18 | Delete self prevention | DELETE | `/api/auth/users/:id` (own) | 400 |
| 19 | Last admin protection | PUT | `/api/auth/users/:id` | Cannot demote last admin |
| 20 | Reset user password (admin) | POST | `/api/auth/users/:id/reset-password` | Reset, sessions+keys revoked |

### API Keys (10 tests)

| # | Test | Verify |
|---|------|--------|
| 21 | Create API key | Returns `si_` prefix key |
| 22 | List API keys | Array without raw keys |
| 23 | Use API key for auth | Tool works with `si_...` |
| 24 | Scoped permissions | `permissions: ["tools:use"]` — tools work, user management blocked |
| 25 | Scoped key rejected | 403 with tools-only key on admin endpoint |
| 26 | Delete API key | Key invalidated |
| 27 | Deleted key rejected | 401 |
| 28 | Key with expiration | Past expiry → immediately invalid |
| 29 | Key lastUsedAt updated | After use, timestamp updated |
| 30 | Admin sees all keys | `apikeys:all` permission |

### Custom Roles & RBAC (10 tests)

| # | Test | Verify |
|---|------|--------|
| 31 | List roles | Built-in (admin, editor, user) + custom |
| 32 | Create custom role | `permissions: ["tools:use", "files:own"]` |
| 33 | Assign custom role | User gets custom permissions |
| 34 | Custom role can use tools | Tool endpoint works |
| 35 | Custom role cannot manage users | 403 on `/api/auth/users` |
| 36 | Update custom role | Permissions changed |
| 37 | Delete custom role | Users reassigned to "user" |
| 38 | Cannot modify built-in roles | 400 on admin role |
| 39 | Escalation prevention | Editor creating admin-level role → Blocked |
| 40 | Permission matrix sweep | All 15 permissions verified per role |

### Teams (6 tests)

| # | Test | Verify |
|---|------|--------|
| 41 | List teams | Teams with member counts |
| 42 | Create team | New team created |
| 43 | Rename team | Name updated |
| 44 | Delete empty team | Removed |
| 45 | Delete team with members | 400 |
| 46 | Delete Default team | 400 |

### Audit Log (4 tests)

| # | Test | Verify |
|---|------|--------|
| 47 | Read audit log | Paginated entries |
| 48 | Filter by action | `?action=user.login` → Only login events |
| 49 | Filter by date range | Time-bounded results |
| 50 | Events recorded | login/register/delete events appear |

### Settings (5 tests)

| # | Test | Verify |
|---|------|--------|
| 51 | Get all settings | Key-value object |
| 52 | Get specific setting | Single value |
| 53 | Update settings (admin) | Persisted |
| 54 | Update settings (non-admin) | 403 |
| 55 | HTML injection prevention | `<script>` sanitized/rejected |

### Branding (4 tests)

| # | Test | Verify |
|---|------|--------|
| 56 | Upload logo | Resized to 128x128 PNG |
| 57 | Serve logo | PNG served |
| 58 | Delete logo | Removed |
| 59 | Non-admin upload | 403 |

### AI Feature Management (5 tests)

| # | Test | Verify |
|---|------|--------|
| 60 | List features | All 6 bundles with install status |
| 61 | Disk usage | Size per bundle |
| 62 | Install bundle | Download starts |
| 63 | Uninstall bundle | Models deleted |
| 64 | Use uninstalled AI tool | Clear error about installing |

### Analytics & Docs (5 tests)

| # | Test | Verify |
|---|------|--------|
| 65 | Analytics config | `GET /api/v1/config/analytics` → PostHog/Sentry |
| 66 | Set analytics consent | Opt-in/out persisted |
| 67 | LLM docs | `GET /llms.txt` → Plain text |
| 68 | Full LLM docs | `GET /llms-full.txt` → Complete API docs |
| 69 | OpenAPI spec | `GET /api/v1/openapi.yaml` → Valid YAML |

### Health & File Upload/Download (5 tests)

| # | Test | Verify |
|---|------|--------|
| 70 | Health check | `GET /api/v1/health` → 200 |
| 71 | Upload file | Workspace created |
| 72 | Download result | File streamed |
| 73 | Preview non-browser format | HEIC → WebP preview |
| 74 | Path traversal attempt | `../../etc/passwd` → 400/403 |

### File Library (10 tests)

| # | Test | Verify |
|---|------|--------|
| 75 | Upload to library | DB record created |
| 76 | List files | Uploaded file in list |
| 77 | Search files | Filtered results |
| 78 | File details | Full metadata + version chain |
| 79 | Download file | Correct file streamed |
| 80 | Thumbnail | 300px JPEG thumbnail |
| 81 | Save tool result as version | New version linked to parent |
| 82 | Version chain | toolChain and parent link |
| 83 | Bulk delete | All versions deleted |
| 84 | Ownership enforcement | User A cannot access User B's files |

---

## Agent 7: CPU Tool Parity Tests (Ubuntu Node)

**Connection:** `ssh ubuntuserver@192.168.0.191`
**Target:** `http://localhost:1349`
**Test count:** 79 tests

Run ALL 35 non-AI tool tests from Agent 2 + Agent 3 on the CPU-only Ubuntu node. Verify identical results to the GPU node. This confirms cross-platform parity for Sharp-based operations.

Replicate every test from Agent 2 (tests 1-35) and Agent 3 (tests 1-44) targeting the Ubuntu container.

---

## Agent 8: CPU Format Matrix (Ubuntu Node)

**Connection:** `ssh ubuntuserver@192.168.0.191`
**Target:** `http://localhost:1349`
**Test count:** 18 tests

Run the identical 18-format matrix from Agent 5 on the CPU-only Ubuntu node. Verify identical format support (HEIC, DNG, PSD, TGA, EXR, HDR, etc.).

---

## Agent 9: CPU AI Fallback Tests (Ubuntu Node)

**Connection:** `ssh ubuntuserver@192.168.0.191`
**Target:** `http://localhost:1349`
**Test count:** 35 tests

Install all 6 AI bundles on the CPU node, then run every AI tool test from Agent 1. Document:
- Which AI tools work on CPU vs GPU
- Which fall back to CPU models (e.g., Lanczos instead of ESRGAN)
- Which fail with clear error messages
- Response time differences vs GPU

---

## Agent 10: CPU Batch + Pipeline Tests (Ubuntu Node)

**Connection:** `ssh ubuntuserver@192.168.0.191`
**Target:** `http://localhost:1349`
**Test count:** 20 tests

Run the identical 20 batch + pipeline tests from Agent 4 on the CPU node. Verify batch processing and pipeline execution work identically on CPU.

---

## Agent 11: Playwright GUI — Essential + Watermark + Utility Tools (Mac Node)

**Target:** Docker container (WSL or local, set `BASE_URL`)
**Config:** `playwright.docker.config.ts`
**Test count:** 27 tests (tools 1-21 + batch GUI 6 tests)

For each tool, test the full GUI flow: navigate → upload → adjust settings → process → verify preview → download → verify output.

### Essential Tools GUI (10 tests)

| # | Route | Upload | Settings to Test | Verify |
|---|-------|--------|-----------------|--------|
| 1 | `/resize` | test-200x150.png | Width=100, Fit=cover, withoutEnlargement toggle | Preview shows resized |
| 2 | `/resize` (%) | same | Percentage=50 toggle | Percentage mode works |
| 3 | `/crop` | test-200x150.png | Draw crop region on canvas, adjust numerically | Live crop preview |
| 4 | `/rotate` | test-100x100.jpg | 90/180/270, flip H/V | Preview updates |
| 5 | `/convert` | test-200x150.png | Each format dropdown | Format-specific quality slider |
| 6 | `/compress` | stress-large.jpg | Quality slider, target size toggle | File size comparison |
| 7 | `/strip-metadata` | test-with-exif.jpg | Toggle metadata types, inspect | Inspector panel |
| 8 | `/edit-metadata` | test-with-exif.jpg | Title/author/copyright, clear GPS, keywords | Inspect shows changes |
| 9 | `/adjust-colors` | test-200x150.png | All sliders, effect buttons | Live preview |
| 10 | `/sharpening` | test-200x150.png | 3 methods, parameters, denoise | Before/after |

### Watermark GUI (4 tests)

| # | Route | Verify |
|---|-------|--------|
| 11 | `/watermark-text` | Text, font size, color, position, tiled, rotation |
| 12 | `/watermark-image` | Two uploads, position, opacity, scale |
| 13 | `/text-overlay` | Text, position, background box, shadow, colors |
| 14 | `/compose` | Two uploads, XY position, opacity, all blend modes |

### Utility GUI (7 tests)

| # | Route | Verify |
|---|-------|--------|
| 15 | `/info` | Metadata grid: dimensions, format, channels, histogram |
| 16 | `/compare` | Side-by-side, similarity score, diff image |
| 17 | `/find-duplicates` | Groups, "best" marked, space saveable |
| 18 | `/color-palette` | Color swatches with hex codes |
| 19 | `/qr-generate` | Text input, size, error correction, colors, live preview |
| 20 | `/barcode-read` | Detected barcodes with text and type |
| 21 | `/image-to-base64` | Base64 strings, copy button, format selector |

### Batch Upload GUI (6 tests — apply to ALL tools)

| # | Test | Verify |
|---|------|--------|
| 22 | Upload 5+ images | Thumbnail strip shows all |
| 23 | Process batch | Per-file progress, not just first |
| 24 | Download ZIP | ALL processed files in ZIP |
| 25 | Verify ZIP contents | Each file valid and processed |
| 26 | Mixed format batch | JPG+PNG+WebP+HEIC all processed |
| 27 | Cancel mid-batch | Clean state, no leaked files |

---

## Agent 12: Playwright GUI — Layout + Format + Optimization + AI Tools (Mac Node)

**Target:** Docker container
**Config:** `playwright.docker.config.ts`
**Test count:** 27 tests (tools 22-48)

### Layout GUI (4 tests)

| # | Route | Verify |
|---|-------|--------|
| 1 | `/collage` | 22 templates, aspect ratio, gap/radius, pan/zoom per cell |
| 2 | `/stitch` | H/V/grid toggle, alignment, gap, resize mode |
| 3 | `/split` | Grid overlay preview, columns/rows, tile size |
| 4 | `/border` | Width, color, corner radius, shadow, padding |

### Format GUI (4 tests)

| # | Route | Verify |
|---|-------|--------|
| 5 | `/svg-to-raster` | Width/height/DPI, format selector, bg color |
| 6 | `/vectorize` | B&W vs color, threshold, speckle, path mode |
| 7 | `/gif-tools` | 6 modes, mode-specific controls appear/hide |
| 8 | `/pdf-to-image` | Page previews, range selector, DPI, format, color mode |

### Optimization GUI (5 tests)

| # | Route | Verify |
|---|-------|--------|
| 9 | `/optimize-for-web` | Format, quality, max dims, progressive, live size comparison |
| 10 | `/bulk-rename` | Pattern with tokens, start index, rename preview |
| 11 | `/favicon` | Preview of all generated sizes |
| 12 | `/image-to-pdf` | Page size, orientation, margin, page order |
| 13 | `/replace-color` | Source/target colors, tolerance, transparent toggle |

### AI Tools GUI (14 tests — each requires bundles installed)

| # | Route | Upload | Verify |
|---|-------|--------|--------|
| 14 | `/remove-background` | portrait-color.jpg | BG type selector, effects phase 2 |
| 15 | `/upscale` | test-100x100.jpg | Scale, format, face enhance, progress |
| 16 | `/ocr` | ocr-chat.jpeg | Quality, language, text results, copy |
| 17 | `/blur-faces` | multi-face.webp | Blur radius, sensitivity, face count |
| 18 | `/smart-crop` | portrait-color.jpg | Mode tabs, face preset, dimensions |
| 19 | `/erase-object` | portrait-color.jpg | Eraser canvas, brush size, undo |
| 20 | `/colorize` | portrait-bw.jpeg | Intensity, model selector |
| 21 | `/enhance-faces` | portrait-color.jpg | Model, strength |
| 22 | `/noise-removal` | test-200x150.png | Tier, strength, detail preservation |
| 23 | `/red-eye-removal` | red-eye.jpg | Sensitivity, strength |
| 24 | `/restore-photo` | portrait-bw.jpeg | Mode, scratch/face/denoise/colorize toggles |
| 25 | `/passport-photo` | portrait-headshot.heic | Country, doc type, analyze→generate, print layout |
| 26 | `/content-aware-resize` | stress-large.jpg | Width/height, face protection |
| 27 | `/image-enhancement` | test-200x150.png | Mode, intensity, analyze button |

---

## Agent 13: Playwright GUI — Navigation + Auth + Settings + Files + Pipeline + Theme (Mac Node)

**Target:** Docker container
**Config:** `playwright.docker.config.ts`
**Test count:** 48 tests

### Navigation (8 tests)

| # | Test | Verify |
|---|------|--------|
| 1 | Homepage loads | All 47 tool cards, categories render |
| 2 | Category filtering | Click each of 8 categories → Correct filter |
| 3 | Search "resize" | Only resize shown |
| 4 | Search "wat" | watermark-text + watermark-image |
| 5 | Tool navigation | Card click → Tool page with dropzone |
| 6 | Sidebar navigation | All links work |
| 7 | Legacy redirects | `/brightness-contrast` → `/adjust-colors` |
| 8 | 404 handling | `/nonexistent-tool` → Error |

### Auth Flow GUI (8 tests)

| # | Test | Verify |
|---|------|--------|
| 9 | Login page renders | Fields + submit button |
| 10 | Successful login | admin/admin → Home |
| 11 | Failed login | Wrong password → Error shown |
| 12 | Logout | Returned to login |
| 13 | Session persistence | Refresh → Still authenticated |
| 14 | Settings dialog | User mgmt, branding, features visible |
| 15 | User management UI | Create/edit/delete users |
| 16 | Change password UI | `/change-password` form works |

### Settings Dialog GUI (7 tests)

| # | Test | Verify |
|---|------|--------|
| 17 | Open settings | Dialog opens |
| 18 | User management tab | CRUD users |
| 19 | AI features tab | Bundles, install/uninstall, progress |
| 20 | Branding tab | Logo upload/preview/delete |
| 21 | Teams tab | CRUD teams |
| 22 | Roles tab | View/create custom roles |
| 23 | Close and reopen | Changes persisted |

### File Library GUI (9 tests)

| # | Test | Verify |
|---|------|--------|
| 24 | Navigate to `/files` | Page loads |
| 25 | Upload files | Files appear in list |
| 26 | Search | Filtered by filename |
| 27 | File details | Details panel |
| 28 | Download | File saves correctly |
| 29 | Thumbnails | Grid view thumbnails |
| 30 | Version chain | Process → Save → History shows chain |
| 31 | Bulk delete | Select → Delete → Confirmed |
| 32 | Open in tool | From library directly into tool |

### Pipeline GUI (13 tests)

| # | Test | Verify |
|---|------|--------|
| 33 | Navigate `/automate` | Builder loads with tool palette |
| 34 | Add single step | Step appears with settings |
| 35 | Configure step settings | Matches individual tool settings |
| 36 | Multi-step pipeline | Resize→Grayscale→Compress→Convert (4 steps) |
| 37 | Reorder steps | Drag reorder → New execution order |
| 38 | Remove step | Pipeline adjusts |
| 39 | Execute single image | All steps → Valid output |
| 40 | Execute batch | 5 images → ZIP with 5 |
| 41 | Save pipeline | Named → In saved list |
| 42 | Load saved | Steps restored |
| 43 | Delete saved | Removed |
| 44 | AI tool in pipeline | remove-bg step works in chain |
| 45 | State corruption check | After pipeline → Individual tool clean |

### Theme & Accessibility (3 tests)

| # | Test | Verify |
|---|------|--------|
| 46 | Dark/light toggle | Switches, persists on reload |
| 47 | Keyboard navigation | Tab + Enter works |
| 48 | Responsive layout | Mobile width → Layout adapts |

---

## Agent 14: Security + Stress Testing (Any Node)

**Target:** `http://localhost:1349`
**Test count:** 23 tests

### Security (16 tests)

| # | Test | Verify |
|---|------|--------|
| 1 | Path traversal (download) | `../../etc/passwd` → Blocked |
| 2 | Path traversal (files) | `../../../etc/passwd` → Blocked |
| 3 | SVG XXE | `<!ENTITY xxe SYSTEM "file:///etc/passwd">` → Sanitized |
| 4 | SVG SSRF | `<image href="http://internal-server/admin">` → Blocked |
| 5 | SVG script injection | `<script>` → Stripped |
| 6 | SQL injection (login) | `admin' OR '1'='1` → Normal 401 |
| 7 | XSS in settings | `<img onerror=alert(1)>` → Sanitized |
| 8 | Rate limiting | 100 rapid login requests → Rate limited |
| 9 | Token reuse after logout | Post-logout → 401 |
| 10 | Unauthenticated tool access | No token → 401 |
| 11 | RBAC enforcement sweep | Per-role permission verification |
| 12 | Admin escalation via register | Non-admin `role=admin` → Blocked |
| 13 | Admin escalation via update | Non-admin → Blocked |
| 14 | File upload size limit | 200MB → Rejected |
| 15 | Malicious file (not an image) | .exe renamed to .jpg → Rejected by magic bytes |
| 16 | Header injection | `\r\nX-Injected: true` → Sanitized |

### Stress & Performance (7 tests)

| # | Test | Node | Verify |
|---|------|------|--------|
| 17 | Large file processing | Both | 6.7MB through resize → Completes within timeout |
| 18 | 20-image batch | Both | All complete, none dropped |
| 19 | Concurrent API calls | Both | 10 simultaneous → All 200, no 500s |
| 20 | Pipeline stress | Both | 10-step pipeline, 5 images → No corruption |
| 21 | Memory leak check | Both | 50 sequential images → Memory stable |
| 22 | AI model sequential | WSL | 5 AI tools back-to-back → No VRAM leak |
| 23 | Large batch download | Both | 20-image ZIP → No timeout/corruption |

---

## Agent 15: Database Integrity + Cross-Platform Parity + Final Report (Runs LAST)

**Depends on:** All agents 1-14 complete
**Test count:** 17 checks + report generation

### Database Integrity (on both nodes)

```bash
docker exec ashim sqlite3 /data/ashim.db
```

| # | Check | Query | Verify |
|---|-------|-------|--------|
| 1 | No failed jobs | `SELECT COUNT(*) FROM jobs WHERE status='failed';` | 0 or documented |
| 2 | All jobs completed | `SELECT status, COUNT(*) FROM jobs GROUP BY status;` | Most 'completed' |
| 3 | Sessions valid | `SELECT COUNT(*) FROM sessions WHERE expiresAt > datetime('now');` | Active sessions |
| 4 | API keys intact | `SELECT COUNT(*) FROM api_keys;` | Keys exist |
| 5 | Audit log populated | `SELECT action, COUNT(*) FROM audit_log GROUP BY action ORDER BY COUNT(*) DESC LIMIT 10;` | Events logged |
| 6 | No DB locks | `PRAGMA journal_mode;` | WAL mode |
| 7 | Pipelines saved | `SELECT COUNT(*) FROM pipelines;` | Pipelines exist |
| 8 | User files tracked | `SELECT COUNT(*) FROM user_files;` | Files recorded |
| 9 | Settings persisted | `SELECT * FROM settings;` | Present |
| 10 | Custom roles exist | `SELECT * FROM roles WHERE isBuiltin=0;` | From RBAC tests |

### Cross-Platform Parity

| # | Check | Verify |
|---|-------|--------|
| 11 | All 35 non-AI tools | Identical on CPU + GPU |
| 12 | AI tools CPU fallback | Documented behavior |
| 13 | 18 input formats | Identical support |
| 14 | Batch processing | Same ZIP contents |
| 15 | Pipeline execution | Same output chain |
| 16 | Auth/RBAC | Same behavior |
| 17 | Response times | Document CPU vs GPU diff |

### Generate `RELEASE_QA_REPORT.md`

Output to `/Users/sidd/Desktop/RELEASE_QA_REPORT.md`:

```markdown
# Ashim QA Release Report
**Date:** [timestamp]
**Version:** [from package.json]
**Commit:** [git SHA]
**Parallel Agents Used:** 15
**Total Execution Time:** [wall clock]

## Executive Summary
- Total tests: X
- Passed: X
- Failed: X
- Fixed during testing: X
- Skipped: X

## Test Matrix

### API Contract Tests
| Category | Total | Pass | Fail | Node | Notes |
|----------|-------|------|------|------|-------|
| Essential Tools (27) | | | | GPU+CPU | |
| Watermark/Overlay (8) | | | | GPU+CPU | |
| Utility Tools (11) | | | | GPU+CPU | |
| Layout Tools (8) | | | | GPU+CPU | |
| Format/Conversion (18) | | | | GPU+CPU | |
| Optimization Tools (7) | | | | GPU+CPU | |
| AI Tools - GPU (35) | | | | GPU | |
| AI Tools - CPU Fallback (35) | | | | CPU | |
| Auth System (20) | | | | Both | |
| API Keys (10) | | | | Both | |
| Pipeline/Automate (12) | | | | GPU+CPU | |
| Batch Processing (8) | | | | GPU+CPU | |
| File Library (10) | | | | Both | |
| Settings (5) | | | | Both | |
| Teams (6) | | | | Both | |
| RBAC/Roles (10) | | | | Both | |
| Audit Log (4) | | | | Both | |
| Branding (4) | | | | Both | |
| AI Features (5) | | | | Both | |
| Analytics/Docs (5) | | | | Both | |
| Health/Upload/Download (5) | | | | Both | |

### Input Format Support
| Format | CPU (Ubuntu) | GPU (WSL) |
|--------|-------------|-----------|
| JPEG | | |
| PNG | | |
| WebP | | |
| GIF | | |
| BMP | | |
| TIFF | | |
| Multi-page TIFF | | |
| AVIF | | |
| SVG | | |
| HEIC | | |
| HEIF | | |
| DNG (RAW) | | |
| PSD | | |
| TGA | | |
| EXR | | |
| HDR | | |
| ICO | | |
| PDF | | |

### Playwright E2E GUI Tests
| Category | Total | Pass | Fail |
|----------|-------|------|------|
| Navigation (8) | | | |
| Auth Flow (8) | | | |
| Essential Tools (10) | | | |
| Watermark Tools (4) | | | |
| Utility Tools (7) | | | |
| Layout Tools (4) | | | |
| Format Tools (4) | | | |
| Optimization Tools (5) | | | |
| AI Tools (14) | | | |
| Batch Upload (6) | | | |
| Pipeline Builder (13) | | | |
| File Library (9) | | | |
| Settings Dialog (7) | | | |
| Theme/Accessibility (3) | | | |

### Security Tests
| Test | Result | Notes |
|------|--------|-------|
| Path traversal | | |
| SVG XXE/SSRF/Script | | |
| SQL injection | | |
| XSS | | |
| Rate limiting | | |
| Token reuse | | |
| RBAC enforcement | | |
| Escalation prevention | | |
| File validation | | |
| Header injection | | |

### Performance
| Test | CPU Time | GPU Time | Memory |
|------|----------|----------|--------|
| Large file (6.7MB) | | | |
| 20-image batch | | | |
| 10 concurrent | | | |
| 10-step pipeline | | | |
| 50 sequential | | | |
| 5 AI sequential | | | |
| 20-image ZIP | | | |

### Database Integrity
| Check | CPU Node | GPU Node |
|-------|----------|----------|
| Failed jobs | | |
| Job status distribution | | |
| Active sessions | | |
| API keys | | |
| Audit log events | | |
| Journal mode | | |
| Saved pipelines | | |
| User files | | |
| Settings | | |
| Custom roles | | |

### Cross-Platform Parity
| Check | CPU (Ubuntu) | GPU (WSL) | Windows (Docker Desktop) | Match? | Notes |
|-------|-------------|-----------|--------------------------|--------|-------|
| Non-AI tools | | | | | |
| AI CPU fallback | | | | | |
| Format support | | | | | |
| Batch processing | | | | | |
| Pipelines | | | | | |
| Auth/RBAC | | | | | |
| Response times | | | | | |
| Path handling | | | | | |

## Bugs Found & Fixed
| # | Severity | Category | Description | Fix | Commit |
|---|----------|----------|-------------|-----|--------|

## Model Quality Verification (GPU)
- [ ] Real-ESRGAN loaded to GPU
- [ ] GFPGAN loaded to GPU
- [ ] CodeFormer loaded to GPU
- [ ] DDColor loaded to GPU
- [ ] rembg/BiRefNet loaded to GPU
- [ ] No silent CPU fallbacks detected

## Batch Processing Integrity
- [ ] Multi-image uploads process 100% of files
- [ ] ZIP downloads contain all processed files
- [ ] SSE progress events fire for every file
- [ ] No "first-image-only" bug

## Pipeline (Automate) Health
- [ ] Single-image pipelines complete all steps
- [ ] Batch pipelines produce correct ZIP
- [ ] AI tools work in pipeline chains
- [ ] No state corruption between pipeline steps
- [ ] No state bleed after pipeline into individual tools
```

---

## Execution Rules

1. **MAXIMUM PARALLELISM.** Spawn agents 1-14 simultaneously in a single message. Never run sequentially what can run in parallel.
2. **Opus 4.7 Max Effort 1M context for EVERYTHING.** Every agent, every subagent. No model downgrading. No exceptions.
3. **Fix ALL bugs, warnings, and issues.** Even if completely unrelated to your current test. We want zero bugs, zero warnings, zero deprecations. Fix everything you see.
4. **Production containers only.** Never use `pnpm dev`. Rebuild Docker after any code fix.
5. **Use test fixtures only** from `tests/fixtures/`, `tests/fixtures/content/`, and `tests/fixtures/formats/`.
6. **Screenshot failures.** Capture screenshot for every Playwright failure.
7. **Use the Playwright browser extension** for interactive GUI testing alongside automated suites.
8. **Always use `--repo ashim-hq/ashim`** for any `gh` CLI commands.
9. **Within each agent, parallelize too.** Use `xargs -P`, background processes, or concurrent curl to maximize throughput within a single agent.
10. **After fixing code, rebuild and re-test.** Every fix must be verified against the Docker container.
11. **ALL fixes go through the local Mac codebase.** Never fix code directly on remote nodes. Fix locally, rsync to remotes, rebuild there. The local repo is the source of truth that gets pushed to GitHub.
12. **Agent 15 runs LAST** — only after all 14 other agents report completion. It collects all results into the final report.

## Total Test Count Target

| Category | Count | Agents |
|----------|-------|--------|
| API Tool Tests - GPU (essential+watermark+utility+layout+format+opt) | ~79 | Agent 2, 3 |
| API Tool Tests - GPU AI | ~35 | Agent 1 |
| API Tool Tests - CPU Parity | ~79 | Agent 7 |
| API Tool Tests - CPU AI Fallback | ~35 | Agent 9 |
| API Non-Tool Tests (auth/RBAC/keys/teams/settings/etc) | ~84 | Agent 6 |
| Batch + Pipeline - GPU | ~20 | Agent 4 |
| Batch + Pipeline - CPU | ~20 | Agent 10 |
| Input Format Matrix - GPU | ~18 | Agent 5 |
| Input Format Matrix - CPU | ~18 | Agent 8 |
| Playwright GUI - Essential/Watermark/Utility | ~27 | Agent 11 |
| Playwright GUI - Layout/Format/Opt/AI | ~27 | Agent 12 |
| Playwright GUI - Nav/Auth/Settings/Files/Pipeline | ~48 | Agent 13 |
| Security + Stress | ~23 | Agent 14 |
| DB + Parity + Report | ~17 | Agent 15 |
| Windows Docker Desktop Parity | ~40 | Agent 16 |
| **TOTAL** | **~570** | **16 agents** |
