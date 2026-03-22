# Real Progress Bars for All Tools

## Problem

The current progress indicators are either fake (AI tools use time-based guessing) or nonexistent (fast tools show only a spinner icon on the button). Users have no real visibility into what's happening during processing.

## Solution

Replace all progress indicators with a unified, honest `ProgressCard` component backed by real progress data:

- **Upload phase**: real byte-level tracking via `XMLHttpRequest.upload.onprogress`
- **Processing phase**: real server-side progress via SSE for AI tools; honest brief state for fast tools
- **Completion**: card disappears immediately, download button appears

## Architecture

### Data Flow

```
Frontend                              Backend
  |                                      |
  |-- Open SSE (jobId) ----------------->|  (side channel ready)
  |-- POST file + settings + jobId ----->|
  |   (XMLHttpRequest tracks upload %)   |-- parse multipart
  |                                      |-- call tool.process()
  |                                      |    |-- bridge.ts spawns Python
  |                                      |    |   Python emits progress to stderr
  |                                      |    |   bridge.ts parses, calls updateJobProgress()
  |<-- SSE: {stage, percent} ------------|
  |<-- SSE: {stage, percent} ------------|
  |                                      |    |-- processing done
  |<-- POST response (result) ----------|
  |-- Close SSE ----------------------->|
```

The frontend opens an SSE connection *before* POSTing the file, using a client-generated jobId. This avoids restructuring the existing synchronous API. The SSE is a parallel side-channel for progress updates. Fast tools skip the SSE step entirely.

### Progress Phases

| Phase | Source | Data |
|-------|--------|------|
| Upload | `XMLHttpRequest.upload.onprogress` | Real bytes sent / total bytes |
| Processing (fast tools) | Implied — between upload complete and POST response | No sub-stages, honest "Processing..." |
| Processing (AI tools) | SSE from backend, driven by Python stderr | Real stage labels + granular percentages |
| Complete | POST response received | Card disappears, download button shown |

## Frontend

### `ProgressCard` Component

Replaces the existing `AIProgressBar`. Card-style compact design.

**Visual structure:**
```
┌─────────────────────────────────────────────┐
│  [icon]  Removing background         45%    │
│          Analyzing image · 8s               │
│  ████████████████░░░░░░░░░░░░░░░░░░░░░░░░  │
└─────────────────────────────────────────────┘
```

- **Icon**: upload arrow during upload, spinner during processing
- **Primary label**: action name ("Uploading image" / "Removing background")
- **Sub-label**: current stage + elapsed time
- **Percentage**: monospace, right-aligned, blue
- **Progress bar**: thin (4px), rounded, blue fill on dark track
- **Container**: dark card with subtle border, rounded corners

**Props:**
```typescript
interface ProgressCardProps {
  /** Whether processing is active */
  active: boolean;
  /** Current phase */
  phase: 'uploading' | 'processing' | 'complete';
  /** Primary action label (e.g., "Removing background") */
  label: string;
  /** Current stage detail (e.g., "Analyzing image") */
  stage?: string;
  /** Progress percentage 0-100 */
  percent: number;
  /** Elapsed seconds */
  elapsed: number;
}
```

**Location:** `apps/web/src/components/common/progress-card.tsx`

The old `AIProgressBar` component (`apps/web/src/components/common/ai-progress-bar.tsx`) will be deleted after all tools are migrated.

### `useToolProcessor` Hook Changes

Rewrite to support real progress tracking.

**New return type:**
```typescript
interface ToolProcessorResult {
  processFiles: (files: File[], settings: Record<string, unknown>) => void;
  processing: boolean;
  error: string | null;
  downloadUrl: string | null;
  originalSize: number | null;
  processedSize: number | null;
  /** New: real-time progress state */
  progress: {
    phase: 'idle' | 'uploading' | 'processing' | 'complete';
    percent: number;
    stage?: string;
    elapsed: number;
  };
}
```

**Implementation changes:**
1. Generate a UUID `clientJobId` client-side before each operation
2. Replace `fetch` with `XMLHttpRequest` for upload progress tracking
3. For AI tools: open an `EventSource` SSE connection to `/api/v1/jobs/{clientJobId}/progress` before starting the upload
4. Track elapsed time internally
5. Merge upload progress and SSE progress into unified `progress` state

**State location:** The `progress` object is local React state within the hook (via `useState`), not stored in the Zustand `useFileStore`. Progress is transient per-request and only relevant to the component rendering it. The existing Zustand fields (`processing`, `error`, `processedUrl`, `originalSize`, `processedSize`) remain in the store unchanged.

**Note:** The hook returns `progress.phase` with `'idle'` as a possible value. The `ProgressCard` component accepts only `'uploading' | 'processing' | 'complete'` — the card is simply not rendered when phase is `'idle'` (controlled by the `active` prop).

**Determining if a tool is AI-powered:** Import the tool category from `@stirling-image/shared`. If `category === 'ai'`, enable SSE progress. Otherwise, skip SSE.

### Tool Settings Components

All ~37 tool settings components that currently show `AIProgressBar` or just a spinner need to:
1. Use the new `progress` field from `useToolProcessor`
2. Render `<ProgressCard>` instead of `<AIProgressBar>` or inline `<Loader2>` spinner
3. Show the progress card in place of the process button while active

The `ProgressCard` replaces both the process button AND any progress indicator during processing. When complete, the process button reappears along with the download button.

## Backend

### `progress.ts` — Extend for Single-File Progress

Add a discriminated union type that encompasses both batch and single-file progress:

```typescript
interface BaseProgress {
  jobId: string;
  type: 'batch' | 'single';
}

interface BatchProgress extends BaseProgress {
  type: 'batch';
  status: 'processing' | 'completed' | 'failed';
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  errors: Array<{ filename: string; error: string }>;
  currentFile?: string;
}

interface SingleFileProgress extends BaseProgress {
  type: 'single';
  phase: 'processing' | 'complete' | 'failed';
  stage?: string;       // "Loading model", "Running inference"
  percent: number;      // 0-100
  error?: string;
}

type ProgressEvent = BatchProgress | SingleFileProgress;
```

Update the listener map type to `Map<string, Set<(data: ProgressEvent) => void>>`. The existing `updateJobProgress` function wraps its data with `type: 'batch'`. Add a new `updateSingleFileProgress(progress: Omit<SingleFileProgress, 'type'>)` function that adds `type: 'single'` and pushes through the same listener infrastructure. The existing SSE endpoint `/api/v1/jobs/:jobId/progress` serves both — the frontend discriminates on the `type` field.

### `bridge.ts` — Stream Python Stderr

Switch from `execFile` to `spawn` for child process management:

```typescript
function runPythonWithProgress(
  script: string,
  args: string[],
  options: {
    jobId?: string;
    onProgress?: (percent: number, stage: string) => void;
    timeout?: number;
    maxBuffer?: number;
  }
): Promise<string>
```

- Use `child_process.spawn` instead of `execFile`
- Capture stderr line-by-line
- Parse each line as JSON: `{ "progress": number, "stage": string }`
- Non-JSON stderr lines are collected as error output (backward compatible)
- Forward parsed progress to `onProgress` callback
- Stdout is still collected as the final result (JSON output)
- Timeout and cleanup behavior remains the same

**Venv fallback handling:** The current `bridge.ts` retries with system `python3` if the venv binary throws ENOENT. With `spawn`, ENOENT surfaces as an `'error'` event on the child process (not a thrown exception). The implementation must listen for the `'error'` event with code `ENOENT` and retry with the fallback `python3` path, preserving the existing behavior.

### Custom AI Route Handlers — Extract `clientJobId`

The 5 AI tools have custom route handlers (not using `createToolRoute`). Each needs to:
1. Extract `clientJobId` from the multipart form data (alongside `file` and `settings`)
2. Pass it through to the AI wrapper function, which forwards it to `bridge.ts`

Files to modify:
- `apps/api/src/routes/tools/remove-background.ts`
- `apps/api/src/routes/tools/upscale.ts`
- `apps/api/src/routes/tools/blur-faces.ts`
- `apps/api/src/routes/tools/erase-object.ts`
- `apps/api/src/routes/tools/ocr.ts`

Non-AI tools use `createToolRoute` and do not need SSE progress — no changes needed to `tool-factory.ts`.

**JobId lifecycle:** Two IDs exist per request:
- `clientJobId` (from frontend): used only for SSE progress correlation. Sent by frontend in the multipart form. Frontend opens SSE at `/api/v1/jobs/{clientJobId}/progress` before uploading.
- `jobId` (server-generated): used for workspace paths and download URLs. Returned in the response as today. These never cross; they serve different purposes.

### AI Tool TypeScript Wrappers

Each AI tool wrapper (`packages/ai/src/*.ts`) needs to:
1. Accept optional `jobId` parameter
2. Pass it to `runPythonWithProgress`
3. Wire up the `onProgress` callback to `updateSingleFileProgress`

### Python Scripts — Emit Progress

Each Python script emits progress as JSON lines to stderr:

```python
import sys, json

def emit_progress(percent: int, stage: str):
    print(json.dumps({"progress": percent, "stage": stage}), file=sys.stderr, flush=True)
```

**Per-script progress granularity:**

#### `remove_bg.py`
- Replace existing `sys.stderr.write()` calls with `emit_progress()` JSON calls
- `emit_progress(10, "Loading model")` — before session creation
- `emit_progress(25, "Model loaded")` — after session ready
- `emit_progress(30, "Analyzing image")` — before `rembg.remove()`
- `emit_progress(80, "Background removed")` — after remove completes
- `emit_progress(90, "Applying alpha matting")` — if alpha matting enabled
- `emit_progress(95, "Saving result")` — before file write

#### `detect_faces.py`
- `emit_progress(10, "Loading face detection model")`
- `emit_progress(20, "Model ready")`
- `emit_progress(25, "Scanning for faces")`
- `emit_progress(50, "Found N faces")` — after detection
- `emit_progress(50 + (i/N)*40, "Blurring face {i+1} of {N}")` — per-face progress
- `emit_progress(95, "Saving result")`

#### `upscale.py`
- `emit_progress(10, "Loading upscale model")`
- `emit_progress(20, "Model ready")`
- For Real-ESRGAN with tiles: `emit_progress(20 + (tile/total)*70, "Upscaling tile {tile} of {total}")`
- For Lanczos fallback: `emit_progress(50, "Upscaling with Lanczos")`
- `emit_progress(95, "Saving result")`

#### `inpaint.py`
- `emit_progress(10, "Loading inpainting model")`
- `emit_progress(25, "Analyzing mask")`
- `emit_progress(40, "Inpainting region")`
- `emit_progress(85, "Refining edges")`
- `emit_progress(95, "Saving result")`

#### `ocr.py`
- `emit_progress(10, "Loading OCR engine")`
- `emit_progress(30, "Analyzing text regions")`
- `emit_progress(70, "Extracting text")`
- `emit_progress(95, "Formatting results")`

#### Smart Crop (no Python script — uses Sharp)
- Smart crop is implemented in TypeScript/Sharp, not Python. It does not go through `bridge.ts`, so it behaves like a fast tool (upload progress only, brief "Processing..." state). No SSE progress needed.

## File Changes Summary

### New Files
- `apps/web/src/components/common/progress-card.tsx` — new ProgressCard component

### Modified Files
- `apps/web/src/hooks/use-tool-processor.ts` — add XHR upload progress + SSE progress
- `apps/api/src/routes/progress.ts` — add ProgressEvent union type + updateSingleFileProgress function
- `apps/api/src/routes/tools/remove-background.ts` — extract clientJobId, pass to AI wrapper
- `apps/api/src/routes/tools/upscale.ts` — extract clientJobId, pass to AI wrapper
- `apps/api/src/routes/tools/blur-faces.ts` — extract clientJobId, pass to AI wrapper
- `apps/api/src/routes/tools/erase-object.ts` — extract clientJobId, pass to AI wrapper
- `apps/api/src/routes/tools/ocr.ts` — extract clientJobId, pass to AI wrapper
- `packages/ai/src/bridge.ts` — switch to spawn, stream stderr progress, preserve venv fallback
- `packages/ai/src/background-removal.ts` — accept progressJobId, wire progress callback
- `packages/ai/src/face-detection.ts` — accept progressJobId, wire progress callback
- `packages/ai/src/upscaling.ts` — accept progressJobId, wire progress callback
- `packages/ai/src/inpainting.ts` — accept progressJobId, wire progress callback
- `packages/ai/src/ocr.ts` — accept progressJobId, wire progress callback
- `packages/ai/python/remove_bg.py` — replace stderr writes with emit_progress() JSON calls
- `packages/ai/python/detect_faces.py` — add emit_progress() calls
- `packages/ai/python/upscale.py` — add emit_progress() calls
- `packages/ai/python/inpaint.py` — add emit_progress() calls
- `packages/ai/python/ocr.py` — add emit_progress() calls
- 33 tool settings components in `apps/web/src/components/tools/` — swap AIProgressBar/spinner for ProgressCard (4 currently use AIProgressBar, 29 use only a Loader2 spinner)

### Deleted Files
- `apps/web/src/components/common/ai-progress-bar.tsx` — replaced by ProgressCard

## Edge Cases

- **SSE connection fails**: Fall back to upload-progress-only mode. Processing phase shows "Processing..." without percentage. System still works.
- **Python script doesn't emit progress**: Bridge treats it as zero progress updates — frontend shows "Processing..." until POST completes. Backward compatible.
- **Very large file upload**: Upload phase shows real progress, which is the most useful part for large files.
- **User navigates away mid-processing**: XHR abort + SSE close. Backend process may continue but workspace cleanup handles orphaned files.
- **Multiple rapid requests**: Each gets its own jobId, progress is isolated. Previous progress card is replaced.
- **Cancellation**: No explicit cancel button in v1. Users can navigate away to abort (XHR abort + SSE close). A cancel button for long-running AI operations (60s+ BiRefNet) is a natural follow-up but out of scope for this spec.
