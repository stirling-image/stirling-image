# API Synchronization and Documentation Audit

## Role & System Directive

Initialize as a Senior Technical Architect and Lead API Engineer for the Ashim monorepo. The product has undergone significant feature and tool updates. The current API documentation, GitHub Pages, and README are outdated. There is a parity gap between tool functionality and API accessibility.

**Objective:** Achieve 100% API coverage, 100% GitHub Pages coverage, 100% README coverage. Every tool and feature must have a corresponding, functional, and documented API endpoint. All documentation surfaces must reflect the current state of the software.

**Execution Engine:** Opus 4.7, Max Effort, 1M Token Context for EVERY agent and subagent. No model downgrading. No exceptions.

---

## TOP PRIORITY: MAXIMUM PARALLELIZATION

Spawn the maximum number of parallel Claude agent teams to complete this audit as fast as possible. Each tool's audit and documentation can run independently. Never run sequentially what can run in parallel.

### Parallel Agent Architecture

```
Phase 0: Audit Scan (Sequential)
  └─> Scan all tools, identify all gaps, build work manifest
       │
Phase 1: PARALLEL BLAST ──────────────────────────────────────────
  │                                                                │
  │  Agent 1: Essential Tools API Parity (9 tools)                │
  │    resize, crop, rotate, convert, compress,                    │
  │    strip-metadata, edit-metadata, adjust-colors, sharpening    │
  │                                                                │
  │  Agent 2: Watermark + Utility Tools API Parity (11 tools)     │
  │    watermark-text, watermark-image, text-overlay, compose,     │
  │    info, compare, find-duplicates, color-palette,              │
  │    qr-generate, barcode-read, image-to-base64                 │
  │                                                                │
  │  Agent 3: Layout + Format + Optimization API Parity (13 tools)│
  │    collage, stitch, split, border, svg-to-raster, vectorize,  │
  │    gif-tools, pdf-to-image, optimize-for-web, bulk-rename,    │
  │    favicon, image-to-pdf, replace-color                        │
  │                                                                │
  │  Agent 4: AI Tools API Parity (14 tools)                      │
  │    remove-background, upscale, ocr, blur-faces, smart-crop,   │
  │    erase-object, colorize, enhance-faces, noise-removal,      │
  │    red-eye-removal, restore-photo, passport-photo,             │
  │    content-aware-resize, image-enhancement                     │
  │                                                                │
  │  Agent 5: Non-Tool APIs Parity                                │
  │    Auth, API keys, pipelines, file library, settings,          │
  │    teams, roles, audit log, branding, features, analytics      │
  │                                                                │
  │  Agent 6: OpenAPI Spec + Scalar Docs                          │
  │    Update apps/api/src/openapi.yaml completely,                │
  │    update Scalar interactive docs, version bumps               │
  │                                                                │
  │  Agent 7: LLM Docs + README + GitHub Pages                   │
  │    Update llms.txt, llms-full.txt, README.md,                  │
  │    GitHub Pages documentation site                             │
  │                                                                │
Phase 2: Verification (after all agents done)                      │
  └─> Cross-check all docs against live API, fix discrepancies    │
───────────────────────────────────────────────────────────────────
```

---

## CRITICAL DIRECTIVE: FIX EVERYTHING

Fix ALL bugs, warnings, deprecations, broken endpoints, missing error handling, and documentation inaccuracies you encounter, even if unrelated to your current documentation task. We want this software to be completely bug-free and always just working perfectly.

**SOURCE OF TRUTH: LOCAL MAC CODEBASE.** ALL code changes MUST be made on the local Mac codebase first, then rsync'd to any remote test nodes. Never fix code directly on a remote system. The local codebase is what gets pushed to GitHub. If you fix a bug on a remote node without updating the local codebase, the fix is lost and future tests will fail again.

---

## Operational Environment and Safety

- **Git Identity:** All commits under user `ashim-hq`. Public repo: `https://github.com/ashim-hq/ashim`
- **Never push** `docs/superpowers/` folder to the public repo - it is gitignored and local-only
- **Workflow:** Use Git Worktrees. Create a dedicated worktree for this session.
- **Port management:** Use unique ports for local testing. Do NOT use port 1349 (reserved). Check which ports are available.
- **Always use `--repo ashim-hq/ashim`** for any `gh` CLI commands.

---

## Phase 0: Audit Scan

### 0.1 Full Codebase Inventory
Scan every file in these directories:
- `apps/api/src/routes/tools/` - all tool route files
- `apps/api/src/routes/` - all non-tool route files
- `apps/api/src/openapi.yaml` - current OpenAPI spec
- `packages/shared/src/constants.ts` - tool definitions
- Root `README.md`
- `apps/docs/` - GitHub Pages / VitePress documentation

### 0.2 Gap Analysis
For each tool and API endpoint, check:
- Does the endpoint exist and work? (functional parity)
- Is it documented in `openapi.yaml`? (spec parity)
- Is it documented in `llms.txt` and `llms-full.txt`? (LLM docs parity)
- Is it documented in the README? (user docs parity)
- Is it documented in GitHub Pages? (web docs parity)
- Are request/response schemas accurate? (schema parity)
- Are all parameters documented with types, defaults, and descriptions? (parameter parity)
- Are error responses documented? (error parity)

### 0.3 Present Gap Report
**STOP.** Present the gap analysis as a structured table showing every endpoint and its documentation status across all surfaces. Wait for approval before proceeding.

---

## Phase 1: Parallel Execution

Once approved, spawn ALL agents in a single message.

### Per-Tool Agent Protocol (Agents 1-4)

For each tool assigned to the agent:

1. **Codebase Audit:** Read the tool's source code. Identify every feature, parameter, endpoint (including sub-endpoints like `/inspect`, `/preview`, `/analyze`, `/batch`).

2. **Parity Check:** Compare against existing documentation.

3. **Fix/Implement:**
   - Add missing API endpoints to achieve 100% coverage
   - Remove deprecated or redundant endpoints
   - Fix broken logic to meet RESTful best practices (clear status codes, proper error handling, consistent response shapes)
   - Ensure every endpoint has proper Zod validation

4. **Document:** Update all documentation surfaces for this tool.

### Agent 5: Non-Tool APIs

Audit and document every non-tool API:

| System | Endpoints |
|--------|-----------|
| Auth | login, logout, session, change-password, register, users CRUD, reset-password |
| API Keys | create, list, delete, scoped permissions |
| Pipelines | execute, batch, save, list, delete, available tools |
| File Library | upload, list, details, download, thumbnail, delete, save-result |
| Settings | get all, get one, update |
| Teams | list, create, rename, delete |
| Roles | list, create, update, delete |
| Audit Log | list with filters |
| Branding | upload logo, serve logo, delete logo |
| Features | list, install, uninstall, disk usage |
| Analytics | config, consent |
| Health | health check |
| Docs | llms.txt, llms-full.txt, openapi.yaml, Scalar UI |

### Agent 6: OpenAPI Spec + Scalar Docs

**Complete rewrite of `apps/api/src/openapi.yaml`:**
- Every endpoint with accurate paths, methods, parameters
- Request body schemas matching Zod validators exactly
- Response schemas matching actual API responses
- Authentication requirements (Bearer token, API key)
- Error response schemas (400, 401, 403, 404, 409, 500)
- Proper tagging and grouping by category
- Version bump to match current app version
- Multipart file upload schemas for tool endpoints

**Update Scalar interactive docs:**
- Verify the Scalar UI at `/api/docs` renders correctly
- All endpoints testable from the Scalar interface
- Example requests and responses for every endpoint

### Agent 7: LLM Docs + README + GitHub Pages

**Update `llms.txt`:**
- Concise plain-text overview of all capabilities
- Every tool listed with one-line description
- API authentication instructions
- Base URL and versioning info

**Update `llms-full.txt`:**
- Complete API reference in plain text
- Every endpoint with method, path, parameters, example curl
- Response format documentation
- Error handling guide

**Update `README.md`:**
- Feature list reflecting all 47+ tools
- Updated screenshots if UI has changed
- Docker deployment instructions (CPU and GPU)
- Environment variable reference
- API quickstart guide
- Link to full documentation

**Update GitHub Pages / VitePress docs:**
- Tool reference pages for every tool
- API guide with authentication, rate limiting, batch processing
- Pipeline/automation documentation
- Self-hosting guide
- Contributing guide

---

## Phase 2: Verification

After all agents complete:

1. **Live API Test:** For every documented endpoint, make an actual API call against the Docker container. Verify the response matches the documentation.
2. **Schema Validation:** Validate `openapi.yaml` is valid OpenAPI 3.1 spec.
3. **Link Check:** Verify all documentation links resolve correctly.
4. **Render Check:** Boot the docs site and verify all pages render.
5. **Cross-Reference:** Ensure `llms.txt`, `llms-full.txt`, `openapi.yaml`, README, and GitHub Pages all agree on the same endpoint list.

---

## Phase 3: Finalization

1. Run `pnpm typecheck` and `pnpm lint` - zero errors
2. Build Docker container to verify nothing is broken
3. Push feature branch to GitHub
4. Create PR to main using `--repo ashim-hq/ashim`, merge, delete branch
