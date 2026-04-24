# Test Coverage Expansion

## Role & System Directive

Initialize as a Principal Software Development Engineer in Test (SDET) for the Ashim monorepo. Your objective is to dramatically increase code coverage across all layers (unit, integration, E2E, E2E-Docker) for all tools, AI features, and core utilities.

**Execution Engine:** Opus 4.7, Max Effort, 1M Token Context for EVERY agent and subagent. No model downgrading. No exceptions.

---

## TOP PRIORITY: MAXIMUM PARALLELIZATION

Spawn the maximum number of parallel Claude agent teams to write and run tests simultaneously. Each test track is independent and MUST run concurrently. Never run sequentially what can run in parallel.

### Parallel Agent Architecture

```
Phase 0: Coverage Audit (Sequential - must complete first)
  └─> Run coverage tools, identify all gaps, present report for approval
       │
Phase 1: PARALLEL BLAST (after approval) ─────────────────────────
  │                                                                │
  │  Agent 1: Integration Tests - Batch A (8 complex tools)       │
  │    collage, stitch, split, svg-to-raster, compose,             │
  │    barcode-read, find-duplicates, compare                      │
  │                                                                │
  │  Agent 2: Integration Tests - Batch B (9 medium tools)        │
  │    border, watermark-image, watermark-text, text-overlay,      │
  │    image-to-pdf, image-to-base64, favicon,                     │
  │    color-adjustments, color-palette, replace-color, sharpening │
  │                                                                │
  │  Agent 3: Integration Tests - Batch C (6 simpler tools)       │
  │    optimize-for-web, image-enhancement, info,                  │
  │    bulk-rename, qr-generate, vectorize                         │
  │                                                                │
  │  Agent 4: AI Bridge Unit Tests (packages/ai/)                 │
  │    bridge.ts lifecycle, each tool bridge module,                │
  │    dispatcher protocol, error propagation                      │
  │                                                                │
  │  Agent 5: E2E-Docker Expansion                                │
  │    All 47+ tools against real Docker container,                │
  │    batch workflows, pipeline chains                            │
  │                                                                │
  │  Agent 6: Unit Test Gaps                                      │
  │    image-engine format detection, metadata utils,              │
  │    MIME mapping, engine pipeline, web stores                   │
  │                                                                │
  │  Agent 7: Cross-Format Matrix Tests                           │
  │    Every tool x every format parameterized suite               │
  │                                                                │
  │  Agent 8: Edge Case and Adversarial Tests                     │
  │    Concurrent requests, memory pressure, corrupted files,      │
  │    zero-byte files, unicode filenames, 1x1 images              │
  │                                                                │
Phase 2: Verification (after all agents done)                      │
  └─> Full test suite run, lint, typecheck, coverage report        │
───────────────────────────────────────────────────────────────────
```

---

## CRITICAL DIRECTIVE: FIX EVERYTHING

When any test reveals a bug, warning, deprecation, or issue:
1. Document it clearly in the test expectation
2. Fix the underlying code immediately
3. Ensure the test passes with the fix
4. Run surrounding tests to verify no regressions

Do NOT skip or mark tests as `.todo`/`.skip` for real bugs. Fix them. Zero tolerance for known issues, even if completely unrelated to your current test scope.

**SOURCE OF TRUTH: LOCAL MAC CODEBASE.** ALL code changes MUST be made on the local Mac codebase first, then rsync'd to any remote test nodes. Never fix code directly on a remote system. The local codebase is what gets pushed to GitHub. If you fix a bug on a remote node without updating the local codebase, the fix is lost and future tests will fail again. The workflow is always: fix locally, rsync to remotes, rebuild containers on remotes, re-test.

---

## Test Assets

### Root Fixtures (`tests/fixtures/`) -- Small/fast unit tests

test-100x100.jpg, test-1x1.png, test-200x150.png, test-200x150.heic, test-with-exif.jpg, test-portrait.jpg, test-portrait.heic, test-blank.png, test-50x50.webp, test-100x100.svg, animated.gif, test-3page.pdf

### Content Fixtures (`tests/fixtures/content/`) -- Realistic test images

| File | Content | Test Value |
|------|---------|------------|
| portrait-bw.jpeg (2.7MB) | B&W portrait | Colorize, restore, grayscale detection |
| portrait-color.jpg | Color portrait | Face enhance, passport, smart crop |
| portrait-headshot.heic | HEIC headshot | HEIC face tools |
| portrait-isolated.png | Isolated subject | Remove-bg, already-isolated edge case |
| multi-face.webp | Multiple faces | Multi-face detection stress test |
| ocr-chat.jpeg | English text | OCR extraction |
| ocr-japanese.png | Japanese text | Non-Latin OCR |
| red-eye.jpg | Red-eye portrait | Red-eye removal |
| stress-large.jpg (6.7MB) | Large file | Memory/performance stress |
| barcode.avif | Barcode image | Barcode reading |
| qr-code.avif | QR code | QR reading |
| svg-logo.svg | SVG with effects | SVG operations |
| animated-simpsons.gif | Animated GIF | GIF tools |
| motorcycle.heif | HEIF no people | HEIF format, non-portrait |
| watermark.jpg | Base image | Watermark testing |
| cross-format-chat.webp | Same content as JPEG | Cross-format comparison |

### Format Fixtures (`tests/fixtures/formats/`) -- 18 format coverage

sample.jpg, sample.png, sample.webp, sample.avif, sample.bmp, sample.dng, sample.exr, sample.gif, sample.hdr, sample.heic, sample.heif, sample.ico, sample.jxl, sample.psd, sample.svg, sample.tga, sample.tiff, multipage.tiff

All test images come exclusively from `tests/fixtures/` and its subdirectories. Do NOT use any external folders.

---

## Phase 0: Coverage Audit and Gap Analysis

### 0.1 Run Coverage Tools
```bash
pnpm test:unit --coverage
pnpm test:integration --coverage
```

### 0.2 Parse Coverage Reports
Generate a prioritized list of files/modules with less than 80% branch or line coverage, focusing on:
- AI routes (`apps/api/src/routes/tools/` - all AI tool files)
- Tool routes with zero dedicated tests
- React Zustand stores (`apps/web/src/stores/`)
- Python sidecar dispatcher and scripts (`packages/ai/`)
- Image engine utilities (`packages/image-engine/src/`)

### 0.3 Present Gap Report
**STOP.** Present the coverage gap analysis as a structured table. Do not write any test code until explicitly told "Approved, proceed."

---

## Phase 1: Parallel Test Writing (After Approval)

Spawn ALL agents in a single message.

### Agent 1-3: Integration Tests for Untested Tool Routes

Use the existing test infrastructure (`buildTestApp`, `loginAsAdmin`, `createMultipartPayload` from test-server.ts).

**Each test file must cover:**
- Valid input with default settings -> 200 success
- Valid input with every parameter variation -> correct output
- Missing file -> 400
- Invalid parameters -> 400
- Format-specific edge cases using fixture files
- Output format verification (check dimensions, format, file size > 0)
- Batch processing if the tool supports it (5+ images, verify ZIP contains all)
- HEIC/HEIF input handling
- Large file handling (stress-large.jpg)
- Tiny file handling (test-1x1.png)

### Agent 4: AI Bridge Unit Tests (`packages/ai/`)

The entire `packages/ai/` package has zero test coverage. Write unit tests for:

- **bridge.ts:** Sidecar lifecycle (spawn, health check, timeout, restart, graceful shutdown)
- **Each tool bridge module** (background-removal.ts, upscaling.ts, ocr.ts, etc.): request serialization, response parsing, error propagation, timeout handling
- **Dispatcher protocol:** JSON-lines communication, request/response matching
- **GPU detection:** `isGpuAvailable()` logic
- Mock the Python sidecar. Do NOT require actual ML models for unit tests.

### Agent 5: E2E-Docker Expansion

Expand `tests/e2e-docker/` from 5 files to cover all 47+ tools against the real Docker container.

**Structure as tool-group spec files:**
- `essential-tools.spec.ts` - resize, crop, rotate, convert, compress, metadata, colors, sharpening
- `watermark-overlay-tools.spec.ts` - watermark-text, watermark-image, text-overlay, compose
- `utility-tools.spec.ts` - info, compare, find-duplicates, color-palette, qr, barcode, base64
- `layout-tools.spec.ts` - collage, stitch, split, border
- `format-conversion-tools.spec.ts` - svg-to-raster, vectorize, gif-tools, pdf-to-image
- `optimization-tools.spec.ts` - optimize-for-web, bulk-rename, favicon, image-to-pdf, replace-color
- `ai-tools.spec.ts` - all 12 AI tools
- `pipeline-tools.spec.ts` - single and batch pipeline execution
- `batch-processing.spec.ts` - multi-file batch for every tool category

**Each test must:**
- Use real fixture images for realistic inputs
- Verify actual output (not just HTTP 200 -- check dimensions, format, file size > 0)
- Test multi-file/batch workflows
- Test pipeline automation with multi-step chains

### Agent 6: Unit Test Gaps

- `packages/image-engine/`: format detection (`formats/detect.ts`), metadata utilities (`utils/metadata.ts`), MIME mapping (`utils/mime.ts`), engine pipeline (`engine.ts`)
- `apps/web/src/stores/`: any untested Zustand stores
- `apps/api/src/routes/`: unit tests for complex helper functions

### Agent 7: Cross-Format Matrix Tests

Create a parameterized test suite that runs every applicable tool against every supported input format:

```
formats = [JPEG, PNG, WebP, AVIF, HEIC, HEIF, GIF, BMP, TIFF, SVG, PSD, DNG, TGA, EXR, HDR, ICO]
tools = [resize, crop, rotate, convert, compress, adjust-colors, sharpening, ...]
for each tool x format: upload, process, verify output
```

This catches format-specific bugs (like AVIF sidecar crashes). Use the `tests/fixtures/formats/` files.

### Agent 8: Edge Case and Adversarial Tests

Expand adversarial coverage:
- **Concurrent:** Parallel uploads to same tool (10 simultaneous)
- **Memory:** Upload 6.7MB stress-large.jpg repeatedly (50 times sequentially)
- **Zero-byte files:** Empty file upload -> proper 400 error
- **Corrupted headers:** Wrong magic bytes for declared format -> rejected by validation
- **Wrong extension:** `.jpg` file containing PNG data -> handled gracefully
- **Unicode filenames:** Emoji, CJK characters, RTL text, spaces, special chars
- **Extreme dimensions:** Maximum size images, 1x1 pixel through every tool
- **Pipeline edge cases:** Circular steps, conflicting operations, 21+ steps (over limit)
- **Batch limits:** 50+ images in one batch -> handled or clear limit error
- **Simultaneous:** Batch + single requests at the same time -> no corruption

---

## Phase 2: Verification

After all agents complete:

1. Run `pnpm test` -- all unit + integration tests must pass
2. Run `pnpm lint` -- zero lint errors
3. Run `pnpm typecheck` -- zero type errors
4. Generate final coverage report and compare against Phase 0 baseline
5. Document Docker commands needed for e2e-docker tests

---

## Bug Fix Protocol

When any test reveals a bug or warning:
1. Document it clearly in the test expectation
2. Fix the underlying code immediately
3. Ensure the test passes with the fix
4. Run surrounding tests to verify no regressions
5. Do NOT skip or mark tests as `.todo`/`.skip` for real bugs
