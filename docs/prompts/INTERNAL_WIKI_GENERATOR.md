# Internal Wiki Generator

## Role & System Directive

Initialize as the Principal Knowledge Architect for the SnapOtter monorepo. Your objective is to autonomously generate a detailed internal wiki documenting every component, API, data flow, and infrastructure detail in this project.

**Model Routing:** Follow CLAUDE.md model routing. Haiku for file search and quick lookups, Sonnet for standard writing and documentation, Opus only for complex architecture analysis. Do not over-provision agents.

---

## TOP PRIORITY: MAXIMUM PARALLELIZATION

After the wiki structure is approved, spawn the maximum number of parallel agent teams to write all documentation sections simultaneously. Each domain is independent and MUST run concurrently. Never run sequentially what can run in parallel.

### Parallel Agent Architecture

```
Phase 0: Scaffolding (Sequential - needs approval)
  └─> Create .local-wiki/, scaffold VitePress, generate WIKI_PLAN.md
       │
Phase 1: PARALLEL BLAST (after approval) ──────────────────────
  │                                                              │
  │  Agent 1: Frontend Architecture (Sonnet)                    │
  │    React 19 components, 14 Zustand stores, routing,          │
  │    Vite config, Tailwind 4, 9 pages, hooks, tool registry    │
  │                                                              │
  │  Agent 2: Backend Architecture (Sonnet)                     │
  │    Fastify routes (16 + 48 tool routes), plugins, auth,      │
  │    Drizzle ORM (10 tables), job system, SSE, 20 lib modules  │
  │                                                              │
  │  Agent 3: AI/ML Pipeline (Sonnet)                           │
  │    Python sidecar (16 scripts), bridge layer (14 modules),   │
  │    GPU detection, model architectures, feature bundles        │
  │                                                              │
  │  Agent 4: Image Engine (Sonnet)                             │
  │    18 Sharp operations, format detection (18 formats),       │
  │    metadata handling, pipeline engine                         │
  │                                                              │
  │  Agent 5: Infrastructure & DevOps (Sonnet)                  │
  │    Docker (3 Dockerfiles, 3 compose files), entrypoint,      │
  │    4 GitHub Actions workflows, semantic-release               │
  │                                                              │
  │  Agent 6: Testing Architecture (Sonnet)                     │
  │    42 unit, 57 integration, 33 e2e, 21 e2e-docker tests,    │
  │    3 benchmarks, Vitest + Playwright configs                  │
  │                                                              │
  │  Agent 7: Tool Reference Guide (Sonnet)                     │
  │    All 48 tools documented: API, parameters, UI, examples    │
  │                                                              │
  │  Agent 8: Landing & Docs Sites (Sonnet)                     │
  │    Next.js landing (11 components, 6 pages),                 │
  │    VitePress docs (12 guides, llms.txt, custom theme)        │
  │                                                              │
Phase 2: Assembly (after all agents done)                        │
  └─> Wire sidebar, dead-link check, boot dev server            │
────────────────────────────────────────────────────────────────
```

---

## CRITICAL DIRECTIVES

1. **Ghost Directory:** All documentation goes in `.local-wiki/`. This directory must NEVER leak into version control.
2. **No Git:** Ensure `.local-wiki/` is in the root `.gitignore`.
3. **Read Source, Don't Guess:** Every agent must read actual `.ts`, `.py`, `.yml`, and config files. Do not guess or hallucinate architecture details.
4. **Fix Everything:** If you discover bugs, broken code, or issues while reading the source, fix them. We want zero known issues.

---

## Phase 0: Scaffolding and Master Index

### 0.1 Setup
```bash
mkdir -p .local-wiki
echo ".local-wiki/" >> .gitignore  # if not already present
```

### 0.2 Scaffold VitePress
Initialize a VitePress installation inside `.local-wiki/` with:
- Clean theme configuration
- Sidebar navigation structure
- Search enabled
- Dark/light theme support

### 0.3 Generate WIKI_PLAN.md

Scan the entire monorepo and generate `.local-wiki/WIKI_PLAN.md` — a detailed table of contents that assigns every documentation file to a specific agent based on domain expertise.

**Required sections (minimum):**

**Frontend (Agent 1):**
- Component architecture — 58 tool components, 17 common, 5 layout, 5 file management, plus features/help/settings
- Zustand state management — all 14 stores (analytics, base64, collage, connection, duplicate, features, file, files-page, pdf-to-image, pipeline, qr, settings, split, theme)
- Routing and navigation — App.tsx, 9 pages, lazy-with-retry loading
- Build system — Vite 6 config, Tailwind CSS 4, PostCSS, asset handling
- Hooks — 8 custom hooks (auth, connection-monitor, gif-info, keyboard-shortcuts, mobile, pipeline-processor, theme, tool-processor)
- Utility libraries — 11 modules (api, analytics, collage-templates, download, icon-map, image-preview, metadata-utils, suggested-tools, tool-registry, utils, lazy-with-retry)
- i18n system (packages/shared/src/i18n/)

**Backend (Agent 2):**
- Fastify server architecture — plugins (auth, static, upload), hooks, lifecycle
- Route registration — 16 top-level route files + tool-factory.ts pattern
- Tool routes — all 48 tools in `src/routes/tools/`
- Authentication flow — session tokens, API keys, RBAC (auth.ts plugin)
- Database schema — all 10 Drizzle ORM tables with relationships:
  - users, teams, sessions, settings, jobs, apiKeys, pipelines, auditLog, roles, userFiles
- Job system — queuing, progress tracking, SSE (progress.ts)
- File handling — upload plugin, user-files.ts (18.5KB), file-storage lib
- Library modules — 20 modules in src/lib/ (analytics, audit, auto-orient, bg-effects, cleanup, env, errors, exiftool, feature-status, file-storage, file-validation, filename, format-decoders, heic-converter, image-worker, output-format, svg-sanitize, timeout, worker-pool, workspace)
- Rate limiting, security middleware, OpenAPI spec
- Pipeline engine (pipeline.ts, 25.6KB)
- Batch processing (batch.ts)
- Branding system (branding.ts)

**AI/ML (Agent 3):**
- Python sidecar architecture — dispatcher.py, JSON-lines protocol
- TypeScript bridge layer — bridge.ts (13.6KB) + 13 capability modules (background-removal, colorization, face-detection, face-enhancement, face-landmarks, inpainting, noise-removal, ocr, red-eye-removal, restoration, seam-carving, upscaling)
- Python scripts — 16 scripts (colorize, detect_faces, enhance_faces, face_landmarks, inpaint, noise_removal, ocr, ocr_preprocess, red_eye_removal, remove_bg, restore, upscale, dispatcher, gpu, install_feature)
- Model architectures — NAFNet (nafnet_arch.py), SCUNet (scunet_arch.py)
- GPU detection and fallback behavior (gpu.py)
- Feature bundle install/uninstall system (install_feature.py)
- Model management — download_models.py, feature-manifest.json
- Memory management (VRAM, model loading/unloading)

**Image Engine (Agent 4):**
- Sharp operation library — all 18 operations (auto-enhance, brightness, color-channels, compress, contrast, convert, crop, edit-metadata, flip, grayscale, invert, optimize-for-web, resize, rotate, saturation, sepia, sharpen, strip-metadata)
- Format support — detection system (formats/detect.ts), 18+ input formats (avif, bmp, dng, exr, gif, hdr, heic, heif, ico, jpg, jxl, png, psd, svg, tga, tiff, webp)
- Metadata handling — EXIF, GPS, ICC, XMP via ExifTool (lib/exiftool.ts)
- Engine architecture — engine.ts, types.ts, index.ts exports
- Utility modules — metadata.ts, mime.ts
- External tool integration — heif-dec, dcraw, ImageMagick, potrace, vtracer, caire

**Infrastructure (Agent 5):**
- Docker build — 3 Dockerfiles (production, test, test.dockerignore)
- Compose configurations — 3 files (standard, GPU, test)
- Entrypoint script — entrypoint.sh logic and environment variables
- CI/CD — 4 GitHub Actions workflows (ci.yml, release.yml, deploy-docs.yml, deploy-landing.yml)
- Semantic-release configuration (.releaserc.json)
- Multi-arch build process
- Volume management (data, workspace)
- Model download pipeline (download_models.py, feature-manifest.json)
- Scripts — sync-version.sh, test-docker-fixes.sh
- Hooks — 5 Claude Code hooks in .claude/hooks/ (auto-tmux-dev, block-no-verify, config-protection, post-edit-format, suggest-compact)

**Testing (Agent 6):**
- Test architecture overview and file counts:
  - 42 unit tests (api: 11, web: 8, ai: 3, image-engine: 5, landing: 6, root: 9)
  - 57 integration tests + test-server helper
  - 33 e2e Playwright specs + auth setup + helpers
  - 21 e2e-docker specs + full-tool-audit script
  - 3 benchmark scripts (bench.sh, bench-ai.sh, bench-limits.sh)
  - 1 image-engine package test
- Vitest configuration — vitest.config.ts (unit + integration)
- Playwright configuration — 3 configs (main, analytics, docker)
- Test helpers and fixtures — 14 base fixtures, 17 content fixtures, 18 format samples
- Coverage tooling

**Tool Reference (Agent 7):**
- Every tool: ID, category, endpoint, all parameters with types/defaults/ranges
- Organized by category:
  - **AI-powered** (12): blur-faces, colorize, content-aware-resize, enhance-faces, erase-object, noise-removal, ocr, red-eye-removal, remove-background, restore-photo, smart-crop, upscale
  - **Image manipulation** (11): border, color-adjustments, compare, compose, compress, convert, crop, image-enhancement, optimize-for-web, replace-color, resize, rotate, sharpening
  - **Metadata** (4): color-palette, edit-metadata, info, strip-metadata
  - **Conversion/Export** (6): favicon, image-to-base64, image-to-pdf, pdf-to-image, svg-to-raster, vectorize
  - **Multi-image** (4): collage, find-duplicates, split, stitch
  - **Barcode/QR** (2): barcode-read, qr-generate
  - **GIF** (1): gif-tools
  - **Watermark** (2): watermark-image, watermark-text
  - **Text** (1): text-overlay
  - **Rename** (1): bulk-rename
  - **Specialty** (1): passport-photo
- Sub-endpoints (inspect, preview, analyze, batch)
- UI component name and settings panel
- Example API calls (curl)
- Pipeline compatibility notes

**Landing & Docs (Agent 8):**
- Landing site — Next.js static export, 11 components (bento-grid, enterprise, fade-in, footer, hero, how-it-works, navbar, open-source, pricing, typing-cursor, why-choose), 6 pages (home, contact, faq, privacy, terms)
- Docs site — VitePress with custom theme (Layout.vue, GitHubStars.vue), 9 guide pages, 3 API reference pages, llms.txt integration (vitepress-plugin-llms), CNAME configuration
- Shared package — constants.ts (28.3KB, all tool definitions), types.ts, features.ts, permissions.ts, analytics modules (consent, events, types), i18n/en.ts (11.9KB)

### 0.4 Present Plan
**STOP.** Present `WIKI_PLAN.md` for approval before dispatching agents.

---

## Phase 1: Parallel Deep-Dive (After Approval)

Spawn ALL 8 agents in a single message.

### Agent Writing Protocol (All Agents)

1. **Read the actual source code** for your assigned domain. Open and read every relevant file.
2. **Write detailed Markdown** in `.local-wiki/docs/{domain}/`
3. **Include:**
   - Code snippets showing key patterns
   - "Why" explanations for architectural decisions
   - Mermaid.js diagrams for:
     - Sequence diagrams (e.g., Image Upload → Fastify → Sharp/Python → SQLite → Response)
     - Database ERD diagrams
     - Component hierarchy diagrams
     - Data flow diagrams
   - Configuration reference tables
   - Environment variable documentation
4. **Report completion** when each file is done

---

## Phase 2: Assembly and Wiring

After all agents complete:

1. **Update sidebar config** in `.local-wiki/.vitepress/config.mts` — wire every Markdown file into a categorized left-hand navigation
2. **Dead-link check** across all generated Markdown
3. **Cross-reference check** — ensure all internal links between pages resolve
4. **Boot dev server** and provide the exact command:
   ```bash
   cd .local-wiki && npm run docs:dev
   ```
5. **Provide the localhost URL** for review
