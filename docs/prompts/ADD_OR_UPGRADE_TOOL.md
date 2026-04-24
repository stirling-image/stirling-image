# Add or Upgrade a Tool to State-of-the-Art

## Role & System Directive

Initialize as a Senior Full-Stack Engineer and UX Architect for the Ashim monorepo. Your objective is to either add a brand-new tool or upgrade an existing tool to a state-of-the-art implementation that matches or exceeds the best commercial alternatives.

**Execution Engine:** Opus 4.7, Max Effort, 1M Token Context for EVERY agent and subagent. No model downgrading. No exceptions.

---

## TOP PRIORITY: MAXIMUM PARALLELIZATION

Spawn the maximum number of parallel Claude agent teams to complete this work as fast as possible. Independent research, implementation, and testing streams MUST run concurrently. Never run sequentially what can run in parallel.

### Parallel Agent Architecture

```
Phase 0: Discovery (Sequential - must complete first)
  └─> Analyze target, benchmark competitors, select approach
       │
Phase 1: PARALLEL BLAST ─────────────────────────────────
  │                                                       │
  │  Agent 1: Backend Implementation                      │
  │    API route, Zod schemas, image-engine ops,           │
  │    AI sidecar integration (if needed)                  │
  │                                                       │
  │  Agent 2: Frontend Implementation                     │
  │    Settings component, preview UI, tool card,          │
  │    i18n strings, route registration                   │
  │                                                       │
  │  Agent 3: Shared Package + Constants                  │
  │    Tool definition, types, category assignment,        │
  │    feature bundle mapping (if AI)                     │
  │                                                       │
  │  Agent 4: Test Suite                                  │
  │    Unit tests, integration tests,                      │
  │    Playwright E2E spec, edge case coverage             │
  │                                                       │
  │  Agent 5: Documentation                               │
  │    GitHub Pages (VitePress), internal wiki,             │
  │    OpenAPI spec, llms.txt, llms-full.txt, README       │
  │                                                       │
Phase 2: Integration + Docker QA (after all agents done)  │
  └─> Merge, build Docker, full QA sweep, verify docs     │
──────────────────────────────────────────────────────────
```

---

## CRITICAL DIRECTIVE: FIX EVERYTHING

Fix ALL bugs, warnings, deprecations, lint issues, and problems you encounter while working, even if completely unrelated to the tool you are building. We want this software to be completely bug-free and always just working perfectly. Zero tolerance for known issues.

**SOURCE OF TRUTH: LOCAL MAC CODEBASE.** ALL code changes MUST be made on the local Mac codebase first, then rsync'd to any remote test nodes. Never fix code directly on a remote system. The local codebase is what gets pushed to GitHub. If you fix a bug on a remote node without updating the local codebase, the fix is lost and future tests will fail again. The workflow is always: fix locally, rsync to remotes, rebuild containers on remotes, re-test.

---

## Phase 0: Discovery and Research

### 0.1 Analyze Current State
- If the tool already exists in our codebase, read its full implementation: API route, frontend component, image-engine operations, tests.
- If `[TARGET_URL]` is provided, visit it and analyze the current implementation.
- Identify why the current version is basic, unintuitive, or missing features.

### 0.2 Competitive Benchmarking
- Research the top 3-5 commercial and open-source implementations of this tool category.
- Analyze their UI/UX patterns, feature sets, parameter options, and output quality.
- Document what makes each one excellent or lacking.

### 0.3 SOTA Library Selection
- Find the best open-source libraries, algorithms, or frameworks to implement a world-class version.
- Evaluate: output quality, performance, format support, license compatibility, maintenance status.
- For AI-powered tools: identify the best model architecture and whether it fits our Python sidecar pattern.

### 0.4 Present Implementation Plan
**STOP HERE.** Present your findings as MCQs (multiple choice questions) with your recommended path and reasoning for each decision point:
- Library/algorithm choice
- UI pattern (slider before/after vs side-by-side vs other)
- Parameter set and defaults
- Any architectural decisions

Wait for approval before proceeding.

---

## Phase 1: Implementation (Parallel Agents)

Once the plan is approved, spawn ALL implementation agents in a single message.

### Agent 1: Backend Implementation

**Files to create/modify:**
- `apps/api/src/routes/tools/{tool-id}.ts` - Fastify route with Zod validation
- `packages/image-engine/src/operations/{operation}.ts` - Sharp-based processing (if applicable)
- `packages/ai/src/{tool}.ts` - Python sidecar bridge (if AI tool)
- `packages/ai/python/{tool}.py` - Python ML implementation (if AI tool)

**Requirements:**
- Follow the `createToolRoute` factory pattern used by all other tools
- Zod schema for all input validation with sensible defaults
- Handle ALL standard formats: JPEG, PNG, WebP, AVIF, GIF, HEIC, HEIF, TIFF, BMP, SVG, PSD, DNG, TGA, EXR, HDR, ICO
- Support batch processing via the standard `/batch` endpoint
- Pipeline compatibility (tool must work as a pipeline step)
- Proper error messages for edge cases (large files, corrupted headers, unsupported operations)
- Add any extra endpoints if needed (e.g., `/inspect`, `/preview`, `/analyze`)

### Agent 2: Frontend Implementation

**Files to create/modify:**
- `apps/web/src/components/tools/{tool-id}-settings.tsx` - Settings panel component
- Register in `apps/web/src/components/tools/index.ts`
- Route registration in `apps/web/src/App.tsx` (if custom route needed)

**Requirements:**
- Live preview on the right side of the UI - ensure HEIC/HEIF/GIF all render correctly
- Match existing design language (Tailwind CSS 4, consistent spacing, dark/light theme)
- Choose the right result display: before/after slider OR side-by-side comparison (whichever makes more sense for this tool)
- All settings controls must be intuitive: sliders for numeric ranges, dropdowns for enums, color pickers for colors
- Batch upload support: thumbnail strip showing all uploaded images, process ALL images (never just the first)
- Progress indicator for long operations
- Download button for results

### Agent 3: Shared Package Updates

**Files to modify:**
- `packages/shared/src/constants.ts` - Add tool definition (id, name, description, category, icon, route)
- `packages/shared/src/types.ts` - Add any new types
- `packages/shared/src/features.ts` - Map to feature bundle (if AI tool)
- `packages/shared/src/i18n/en.ts` - Add i18n strings

### Agent 4: Test Suite

**Files to create:**
- `tests/integration/{tool-id}.test.ts` - Integration tests
- `tests/e2e/{tool-id}.spec.ts` - Playwright E2E spec

**Test requirements:**
- Valid input with default settings -> success
- Valid input with every parameter variation -> success
- Missing file -> 400
- Invalid parameters -> 400
- Every supported input format (JPEG, PNG, WebP, AVIF, HEIC, HEIF, GIF, SVG at minimum)
- Batch processing with mixed formats (5+ images)
- Large file (stress-large.jpg 6.7MB)
- Tiny file (test-1x1.png)
- Playwright: full GUI flow (navigate, upload, adjust settings, process, verify preview, download)

### Agent 5: Documentation Updates

Every new or upgraded tool MUST be documented across all surfaces before merge.

**GitHub Pages (VitePress) -- `apps/docs/`:**
- Update `apps/docs/api/rest.md` with the new tool's endpoint, parameters, example curl, and response format
- Update `apps/docs/api/ai.md` if this is an AI tool (model, GPU requirements, performance notes)
- Update `apps/docs/api/image-engine.md` if this adds new Sharp operations
- Add the tool to any relevant guide pages (e.g., `apps/docs/guide/getting-started.md` feature list)
- Update `apps/docs/.vitepress/config.mts` sidebar if new pages are added
- Update tool count in description strings if total increases (currently "45+ tools")

**Internal Wiki -- `.local-wiki/`:**
- If `.local-wiki/` exists, update the Tool Reference Guide section with the new tool's full documentation
- Add entries for: tool ID, category, endpoint, all parameters with types/defaults/ranges, sub-endpoints, UI component name, example API calls, pipeline compatibility
- Update any architecture diagrams affected by the new tool

**OpenAPI Spec + LLM Docs:**
- Update `apps/api/src/openapi.yaml` with the new endpoint schema (path, method, parameters, request/response, errors)
- Update `llms.txt` with a one-line tool description
- Update `llms-full.txt` with full endpoint documentation (method, path, parameters, example curl, response)

**README:**
- Update feature count in `README.md` if the total number of tools changes
- Add the tool to the feature list if it represents a notable new capability

---

## Phase 2: Integration and Docker QA

### 2.1 Merge and Build
- Merge all agent work into the feature branch
- Run `pnpm typecheck` - zero errors
- Run `pnpm lint` - zero errors
- Run `pnpm test` - all pass
- Build Docker container with the new tool

### 2.2 Docker QA Testing

**Container setup:**
```bash
SKIP_MUST_CHANGE_PASSWORD=true AUTH_ENABLED=false docker compose -f docker/docker-compose.yml up -d --build
```

**Port management:** Detect available ports on the system. Do NOT use port 1349 for testing to ensure isolation from other active services.

**GUI testing with Playwright** against the Docker container:
1. Single image upload and process - verify output
2. Batch upload (5+ mixed formats) - verify ALL images processed
3. Every settings combination - verify each produces different output
4. Preview rendering for all formats including HEIC/HEIF
5. Download and verify output file validity

**Test with committed fixture images:**
Use contextually appropriate images from `tests/fixtures/`, `tests/fixtures/content/`, and `tests/fixtures/formats/`. Do NOT use any external folders.

### 2.3 Documentation Verification
1. **OpenAPI validation:** Verify `openapi.yaml` is valid OpenAPI 3.1 and includes the new endpoint
2. **GitHub Pages build:** Run `cd apps/docs && npx vitepress build` - zero errors, no dead links
3. **LLM docs check:** Verify `llms.txt` and `llms-full.txt` list the new tool
4. **Cross-reference:** Ensure the API docs, OpenAPI spec, LLM docs, and README all agree on the tool's endpoint, parameters, and description

### 2.4 Iteration
If any issue is found: fix it, rebuild Docker, re-test. Repeat until perfect. Do not be lazy with testing. Do not suppress issues - raise them.

---

## Phase 3: Finalization

1. Provide the localhost URL/port for manual review before merging
2. Wait for approval
3. Push the feature branch to GitHub
4. Create a PR to main using `--repo ashim-hq/ashim`, merge it, delete the feature branch

---

## Git Protocol

- **Identity:** Always use Git user `ashim-hq`
- **Isolation:** Use Git Worktrees for this session - each feature gets its own worktree
- **Branching:** Create a `feat/{tool-id}` branch
- **Never push** `docs/superpowers/` to the public repo - it is gitignored and local-only
- **Port management:** Detect available ports, never use 1349

---

## Communication Rule

Ask for clarification when necessary. Provide MCQs with your recommended path and reasoning for each decision point.

---

## Usage

Paste this prompt and append:

```
[TARGET_URL]: (optional - URL of existing tool to upgrade)
The feature name is: {TOOL_NAME}
```

---

## Tool Queue

### 1. Background Replacement

**Tool ID:** `replace-background`

**Category:** AI

**Description:** Remove background and replace in one step (solid color, gradient, blur, or custom image).

**Rationale:** rembg already handles the hard part (background removal). Every competitor pairs removal with replacement. Currently users have to chain Remove Background then Image Composition, which is clunky. This is the lowest-effort, highest-impact gap to close.

**Replacement modes:**
- **Solid color** - single hex/rgba color fill
- **Gradient** - linear or radial gradient with configurable stops and angle
- **Blur** - gaussian blur of the original background (keep subject sharp, blur surroundings)
- **Custom image** - user-uploaded image as the new background (fit, fill, or tile)

**Implementation notes:**
- Backend: call rembg for mask, then composite subject onto the chosen replacement using Sharp
- Frontend: mode selector (solid/gradient/blur/custom), color picker, gradient editor, blur radius slider, image upload for custom mode
- The blur mode reuses the original image: apply mask to isolate subject, blur the full image, composite sharp subject on top
- Pipeline compatible: accepts the same input as `remove-background`, outputs the final composite
