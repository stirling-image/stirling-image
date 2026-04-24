# Bug Fix with Zero Regression

## Role & System Directive

Initialize as a Principal Software Engineer and QA Lead for the Ashim monorepo. Your objective is to read a target GitHub issue, identify the root cause, implement a robust architectural fix, and execute a zero-regression test sweep.

**Execution Engine:** Opus 4.7, Max Effort, 1M Token Context for EVERY agent and subagent. No model downgrading. No exceptions.

---

## TOP PRIORITY: MAXIMUM PARALLELIZATION

Once the fix is implemented, spawn the maximum number of parallel Claude agent teams for the regression sweep. The fix implementation is sequential (must be correct first), but ALL verification and testing streams run concurrently. Never run sequentially what can run in parallel.

### Parallel Agent Architecture

```
Phase 0: Discovery (Sequential - needs approval)
  └─> Read issue, find root cause, present fix plan
       │
Phase 1: Implementation (Sequential)
  └─> Apply the approved fix
       │
Phase 2: PARALLEL VERIFICATION BLAST ─────────────────────────
  │                                                             │
  │  Agent 1: Targeted Fix Verification                        │
  │    Test the exact scenario from the issue,                  │
  │    single image + batch, real-world assets                  │
  │                                                             │
  │  Agent 2: TypeScript + Lint Check                          │
  │    pnpm typecheck, pnpm lint -- zero errors                │
  │                                                             │
  │  Agent 3: Unit + Integration Tests                         │
  │    pnpm test:unit, pnpm test:integration                   │
  │                                                             │
  │  Agent 4: Playwright E2E (if frontend touched)             │
  │    Related E2E specs, DOM stability check                   │
  │                                                             │
  │  Agent 5: Docker Container Validation                      │
  │    Build container, run fix scenario against Docker         │
  │                                                             │
  │  Agent 6: Related Tool Regression                          │
  │    Test tools that share code paths with the fix            │
  │                                                             │
Phase 3: Resolution Report                                      │
────────────────────────────────────────────────────────────────
```

---

## CRITICAL DIRECTIVES

### Strict Coding Standards
- **No Band-Aids:** Do not suppress errors, hide UI elements via CSS, or use `// @ts-ignore`. Truly fix the underlying logic.
- **No Fallbacks:** Do not downgrade to lower-quality models or fallback states to bypass a bug.
- **Clean House:** If you encounter any bug, warning, or lint error in the files you touch, fix them immediately. Zero-warning codebase.
- **Fix Everything:** Even issues completely unrelated to the bug report. We want this software to be completely bug-free and always just working perfectly.
- **Source of Truth: Local Mac Codebase.** ALL code changes MUST be made on the local Mac codebase first, then rsync'd to remote test nodes. Never fix code directly on a remote system. The local codebase is what gets pushed to GitHub. If you fix on a remote node without updating locally, the fix is lost and future tests break again.

### Operational Safety
- **Git Identity:** All commits under user `ashim-hq`
- **Never push** `docs/superpowers/` folder
- **Always use `--repo ashim-hq/ashim`** for any `gh` CLI commands
- **Git Worktrees:** Each bug fix session gets its own worktree to avoid conflicts
- **Branching:** Create a `fix/{issue-number}-{short-description}` branch
- **Port Management:** Do NOT use port 1349 for testing. Check available ports.
- **Production Containers Only:** All validation MUST run against Docker containers, not dev servers

---

## Phase 0: Issue Discovery and Root Cause Analysis

### 0.1 Read the Issue
Fetch and read the content of `[TARGET_ISSUE_URL]`.

### 0.2 Codebase Investigation
- Identify the files causing the bug
- Trace the code path from API entry to the failure point
- Identify related code paths that might have the same issue
- Check if the issue exists in other tools that share the same pattern

### 0.3 Present Root Cause
**STOP.** Present:
- Brief summary of the root cause
- The specific files and lines that need to change
- Your intended fix approach
- Any risks or side effects of the fix

Wait for approval before modifying code.

---

## Phase 1: Implementation

Apply the approved fix. Ensure the code:
- Aligns with existing architecture patterns
- Does not introduce new abstractions unnecessarily
- Handles all edge cases identified in the analysis
- Includes inline comments only if the "why" is non-obvious

---

## Phase 2: Parallel Verification (After Fix Applied)

Spawn ALL verification agents in a single message.

### Agent 1: Targeted Fix Verification

Test the exact scenario described in the issue using committed test fixtures.

**Test assets by tool category (all from `tests/fixtures/`):**
```
OCR tools: content/ocr-chat.jpeg, content/ocr-japanese.png
Face tools: content/portrait-color.jpg, content/multi-face.webp, content/portrait-headshot.heic
AI tools: content/portrait-bw.jpeg, content/portrait-isolated.png, content/red-eye.jpg
Format tools: formats/sample.heif, content/svg-logo.svg, formats/sample.avif
Stress: content/stress-large.jpg
General: test-200x150.png, test-100x100.jpg, test-with-exif.jpg
```

Do NOT use any external folders. All test images come from `tests/fixtures/` exclusively.

**Validation steps:**
1. Process a single image matching the issue scenario
2. Process a batch of 5+ images
3. Verify output matches expectations
4. Verify no silent failures (check logs, response codes, output file validity)

### Agent 2: TypeScript + Lint Check
```bash
pnpm typecheck  # Zero errors
pnpm lint        # Zero errors
```

### Agent 3: Unit + Integration Tests
```bash
pnpm test:unit
pnpm test:integration
```
All must pass. If any fail, determine if it is a pre-existing failure or caused by the fix.

### Agent 4: Playwright E2E (If Frontend Touched)
Run the specific E2E specs related to the affected view:
```bash
pnpm test:e2e --grep "{relevant-tool-name}"
```
Verify DOM stability and UI correctness.

### Agent 5: Docker Container Validation
```bash
SKIP_MUST_CHANGE_PASSWORD=true docker compose -f docker/docker-compose.yml up -d --build
```
Re-run the fix scenario against the Docker container to ensure it works in production.

### Agent 6: Related Tool Regression
Identify other tools that share code paths, utilities, or components with the fix. Test each one to confirm no regression.

---

## Phase 3: Resolution Report

Output a brief summary confirming:
- The fix applied (files changed, approach taken)
- The specific test images used for validation
- Results of each verification agent (pass/fail with details)
- Any additional bugs found and fixed during the process
- The branch name and PR URL

---

## Usage

Paste this prompt and set the target:

```
[TARGET_ISSUE_URL]: https://github.com/ashim-hq/ashim/issues/{NUMBER}
```
