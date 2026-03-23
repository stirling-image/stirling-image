# Resize & Rotate/Flip UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the before/after slider with intuitive side-by-side comparison for resize and live CSS preview for rotate/flip.

**Architecture:** Frontend-only changes. Resize gets a tab-based settings panel (Presets/Custom Size/Scale) and a new SideBySideComparison result view. Rotate/flip gets live CSS transform preview on the ImageViewer with an "Apply" button. The tool-page.tsx conditionally renders the appropriate result view per tool. No backend changes.

**Tech Stack:** React, TypeScript, Tailwind CSS, Zustand, lucide-react

**Spec:** `docs/superpowers/specs/2026-03-23-resize-rotate-redesign.md`

---

### Task 1: Create SideBySideComparison Component

**Files:**
- Create: `apps/web/src/components/common/side-by-side-comparison.tsx`

- [ ] **Step 1: Create the component file**

```tsx
import { useState } from "react";

interface SideBySideComparisonProps {
  beforeSrc: string;
  afterSrc: string;
  beforeSize?: number;
  afterSize?: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function SideBySideComparison({
  beforeSrc,
  afterSrc,
  beforeSize,
  afterSize,
}: SideBySideComparisonProps) {
  const [beforeDims, setBeforeDims] = useState<{ w: number; h: number } | null>(null);
  const [afterDims, setAfterDims] = useState<{ w: number; h: number } | null>(null);

  const savingsPercent =
    beforeSize && afterSize && beforeSize > 0
      ? ((1 - afterSize / beforeSize) * 100).toFixed(1)
      : null;

  const checkerboard = {
    backgroundImage: `linear-gradient(45deg, #ccc 25%, transparent 25%),
      linear-gradient(-45deg, #ccc 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #ccc 75%),
      linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
    backgroundSize: "16px 16px",
    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-3xl mx-auto">
      {/* Side-by-side images */}
      <div className="flex flex-col sm:flex-row gap-4 w-full">
        {/* Original */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Original
          </span>
          <div
            className="w-full aspect-video rounded-lg border border-border overflow-hidden flex items-center justify-center"
            style={checkerboard}
          >
            <img
              src={beforeSrc}
              alt="Original"
              className="max-w-full max-h-full object-contain"
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget;
                setBeforeDims({ w: img.naturalWidth, h: img.naturalHeight });
              }}
            />
          </div>
          <div className="text-xs text-muted-foreground text-center space-y-0.5">
            {beforeDims && (
              <p>
                {beforeDims.w} × {beforeDims.h}
              </p>
            )}
            {beforeSize != null && <p>{formatSize(beforeSize)}</p>}
          </div>
        </div>

        {/* Resized */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Resized
          </span>
          <div
            className="w-full aspect-video rounded-lg border border-border overflow-hidden flex items-center justify-center"
            style={checkerboard}
          >
            <img
              src={afterSrc}
              alt="Resized"
              className="max-w-full max-h-full object-contain"
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget;
                setAfterDims({ w: img.naturalWidth, h: img.naturalHeight });
              }}
            />
          </div>
          <div className="text-xs text-muted-foreground text-center space-y-0.5">
            {afterDims && (
              <p>
                {afterDims.w} × {afterDims.h}
              </p>
            )}
            {afterSize != null && <p>{formatSize(afterSize)}</p>}
          </div>
        </div>
      </div>

      {/* Size savings */}
      {savingsPercent !== null && (
        <p
          className={`text-sm font-medium ${Number(savingsPercent) > 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}
        >
          {Number(savingsPercent) > 0
            ? `${savingsPercent}% smaller`
            : `${Math.abs(Number(savingsPercent))}% larger`}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/sidd/Desktop/Personal/Projects/Stirling-Image && pnpm --filter @stirling-image/web build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/common/side-by-side-comparison.tsx
git commit -m "feat: add SideBySideComparison component for resize results"
```

---

### Task 2: Rewrite ResizeSettings with Tab-Based UI

**Files:**
- Modify: `apps/web/src/components/tools/resize-settings.tsx`

- [ ] **Step 1: Rewrite resize-settings.tsx with three tabs**

Replace the entire file content with:

```tsx
import { useState } from "react";
import { SOCIAL_MEDIA_PRESETS } from "@stirling-image/shared";
import { useFileStore } from "@/stores/file-store";
import { useToolProcessor } from "@/hooks/use-tool-processor";
import { Download, Link, Unlink } from "lucide-react";
import { ProgressCard } from "@/components/common/progress-card";

type ResizeTab = "presets" | "custom" | "scale";
type FitMode = "cover" | "contain" | "fill";

const FIT_LABELS: Record<FitMode, string> = {
  cover: "Crop to fit",
  contain: "Fit inside",
  fill: "Stretch",
};

// Group presets by platform
const platforms = [...new Set(SOCIAL_MEDIA_PRESETS.map((p) => p.platform))];

export function ResizeSettings() {
  const { files } = useFileStore();
  const { processFiles, processing, error, downloadUrl, progress } =
    useToolProcessor("resize");

  const [tab, setTab] = useState<ResizeTab>("presets");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [percentage, setPercentage] = useState<string>("50");
  const [fit, setFit] = useState<FitMode>("cover");
  const [lockAspect, setLockAspect] = useState(true);
  const [withoutEnlargement, setWithoutEnlargement] = useState(false);

  const handlePreset = (preset: (typeof SOCIAL_MEDIA_PRESETS)[number]) => {
    const key = `${preset.platform}-${preset.name}`;
    if (selectedPreset === key) {
      setSelectedPreset(null);
      setWidth("");
      setHeight("");
    } else {
      setSelectedPreset(key);
      setWidth(String(preset.width));
      setHeight(String(preset.height));
    }
  };

  const handleProcess = () => {
    const settings: Record<string, unknown> = {};

    if (tab === "scale") {
      settings.percentage = Number(percentage);
    } else {
      if (width) settings.width = Number(width);
      if (height) settings.height = Number(height);
      settings.fit = tab === "presets" ? "cover" : fit;
      settings.withoutEnlargement = withoutEnlargement;
    }

    processFiles(files, settings);
  };

  const hasFile = files.length > 0;
  const canProcess =
    hasFile &&
    !processing &&
    (tab === "scale"
      ? Number(percentage) > 0
      : Boolean(width) || Boolean(height));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canProcess) handleProcess();
  };

  const tabClass = (t: ResizeTab) =>
    `flex-1 text-xs py-1.5 rounded ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tab selector */}
      <div>
        <div className="flex gap-1">
          <button type="button" onClick={() => setTab("presets")} className={tabClass("presets")}>
            Presets
          </button>
          <button type="button" onClick={() => setTab("custom")} className={tabClass("custom")}>
            Custom Size
          </button>
          <button type="button" onClick={() => setTab("scale")} className={tabClass("scale")}>
            Scale
          </button>
        </div>
      </div>

      {/* Presets tab */}
      {tab === "presets" && (
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {platforms.map((platform) => (
            <div key={platform}>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">{platform}</p>
              <div className="space-y-1">
                {SOCIAL_MEDIA_PRESETS.filter((p) => p.platform === platform).map((preset) => {
                  const key = `${preset.platform}-${preset.name}`;
                  const isSelected = selectedPreset === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handlePreset(preset)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded border text-sm transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      <span>{preset.name}</span>
                      <span className="text-xs tabular-nums">
                        {preset.width} × {preset.height}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Don't enlarge */}
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={withoutEnlargement}
              onChange={(e) => setWithoutEnlargement(e.target.checked)}
              className="rounded"
            />
            Don&apos;t enlarge
          </label>
        </div>
      )}

      {/* Custom Size tab */}
      {tab === "custom" && (
        <div className="space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Width (px)</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="Auto"
                className="w-full mt-0.5 px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground"
              />
            </div>
            <button
              type="button"
              onClick={() => setLockAspect(!lockAspect)}
              className="p-1.5 rounded border border-border text-muted-foreground hover:text-foreground"
              title={lockAspect ? "Unlock aspect ratio" : "Lock aspect ratio"}
            >
              {lockAspect ? <Link className="h-4 w-4" /> : <Unlink className="h-4 w-4" />}
            </button>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Height (px)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="Auto"
                className="w-full mt-0.5 px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground"
              />
            </div>
          </div>

          {/* Fit mode */}
          <div>
            <label className="text-xs text-muted-foreground">Fit Mode</label>
            <div className="flex gap-1 mt-1">
              {(Object.keys(FIT_LABELS) as FitMode[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFit(f)}
                  className={`flex-1 text-xs py-1.5 rounded ${fit === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  {FIT_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          {/* Don't enlarge */}
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={withoutEnlargement}
              onChange={(e) => setWithoutEnlargement(e.target.checked)}
              className="rounded"
            />
            Don&apos;t enlarge
          </label>
        </div>
      )}

      {/* Scale tab */}
      {tab === "scale" && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Scale (%)</label>
            <input
              type="number"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              min={1}
              className="w-full mt-0.5 px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground"
            />
          </div>
          <div className="flex gap-1">
            {[25, 50, 75].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setPercentage(String(pct))}
                className={`flex-1 text-xs py-1.5 rounded ${
                  percentage === String(pct)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Process button */}
      {processing ? (
        <ProgressCard
          active={processing}
          phase={progress.phase === "idle" ? "uploading" : progress.phase}
          label="Resizing"
          stage={progress.stage}
          percent={progress.percent}
          elapsed={progress.elapsed}
        />
      ) : (
        <button
          type="submit"
          disabled={!canProcess}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Resize
        </button>
      )}

      {/* Download */}
      {downloadUrl && (
        <a
          href={downloadUrl}
          download
          className="w-full py-2.5 rounded-lg border border-primary text-primary font-medium flex items-center justify-center gap-2 hover:bg-primary/5"
        >
          <Download className="h-4 w-4" />
          Download
        </a>
      )}
    </form>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/sidd/Desktop/Personal/Projects/Stirling-Image && pnpm --filter @stirling-image/web build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/tools/resize-settings.tsx
git commit -m "feat: rewrite resize settings with tab-based UI (presets, custom, scale)"
```

---

### Task 3: Add CSS Transform Props to ImageViewer

**Files:**
- Modify: `apps/web/src/components/common/image-viewer.tsx`

- [ ] **Step 1: Add optional CSS transform props to the ImageViewer interface and apply them**

Add `cssRotate`, `cssFlipH`, `cssFlipV` optional props to the `ImageViewerProps` interface. In the `imageStyle` computation, compose CSS transforms when these props are provided.

Changes to make:

1. Update the interface (line 5-8):

```tsx
interface ImageViewerProps {
  src: string;
  filename: string;
  fileSize: number;
  cssRotate?: number;
  cssFlipH?: boolean;
  cssFlipV?: boolean;
}
```

2. Update the component destructuring (line 14):

```tsx
export function ImageViewer({ src, filename, fileSize, cssRotate, cssFlipH, cssFlipV }: ImageViewerProps) {
```

3. Update the `imageStyle` computation (lines 65-68) to compose CSS transforms:

```tsx
  const previewTransform = [
    cssRotate ? `rotate(${cssRotate}deg)` : "",
    cssFlipH ? "scaleX(-1)" : "",
    cssFlipV ? "scaleY(-1)" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const imageStyle =
    fitMode === "fit"
      ? {
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain" as const,
          ...(previewTransform && { transform: previewTransform }),
        }
      : {
          transform: `scale(${zoom / 100})${previewTransform ? ` ${previewTransform}` : ""}`,
          transformOrigin: "center center",
        };
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/sidd/Desktop/Personal/Projects/Stirling-Image && pnpm --filter @stirling-image/web build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/common/image-viewer.tsx
git commit -m "feat: add CSS transform props to ImageViewer for live rotate/flip preview"
```

---

### Task 4: Update RotateSettings with Live Preview Callback

**Files:**
- Modify: `apps/web/src/components/tools/rotate-settings.tsx`

- [ ] **Step 1: Add onPreviewTransform callback prop and change button label**

The component needs to:
1. Accept an optional `onPreviewTransform` callback
2. Call it on every state change (angle, flipH, flipV) via useEffect
3. Change the submit button label from "Rotate" to "Apply"

Replace the entire file:

```tsx
import { useState, useEffect } from "react";
import { useFileStore } from "@/stores/file-store";
import { useToolProcessor } from "@/hooks/use-tool-processor";
import {
  Download,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
} from "lucide-react";
import { ProgressCard } from "@/components/common/progress-card";

export interface PreviewTransform {
  rotate: number;
  flipH: boolean;
  flipV: boolean;
}

interface RotateSettingsProps {
  onPreviewTransform?: (transform: PreviewTransform) => void;
}

export function RotateSettings({ onPreviewTransform }: RotateSettingsProps) {
  const { files } = useFileStore();
  const { processFiles, processing, error, downloadUrl, progress } =
    useToolProcessor("rotate");

  const [angle, setAngle] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // Emit preview transform on every change
  useEffect(() => {
    onPreviewTransform?.({ rotate: angle, flipH, flipV });
  }, [angle, flipH, flipV, onPreviewTransform]);

  const rotateLeft = () => setAngle((a) => (a - 90 + 360) % 360);
  const rotateRight = () => setAngle((a) => (a + 90) % 360);

  const handleProcess = () => {
    processFiles(files, {
      angle,
      horizontal: flipH,
      vertical: flipV,
    });
  };

  const hasFile = files.length > 0;
  const hasChanges = angle !== 0 || flipH || flipV;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasFile && hasChanges && !processing) handleProcess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Quick rotate buttons */}
      <div>
        <label className="text-xs text-muted-foreground">Quick Rotate</label>
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={rotateLeft}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors text-sm"
          >
            <RotateCcw className="h-4 w-4" />
            90 Left
          </button>
          <button
            type="button"
            onClick={rotateRight}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors text-sm"
          >
            <RotateCw className="h-4 w-4" />
            90 Right
          </button>
        </div>
      </div>

      {/* Angle slider */}
      <div>
        <div className="flex justify-between items-center">
          <label className="text-xs text-muted-foreground">Angle</label>
          <span className="text-xs font-mono text-foreground">{angle} deg</span>
        </div>
        <input
          type="range"
          min={0}
          max={360}
          value={angle}
          onChange={(e) => setAngle(Number(e.target.value))}
          className="w-full mt-1"
        />
      </div>

      {/* Flip buttons */}
      <div>
        <label className="text-xs text-muted-foreground">Flip</label>
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={() => setFlipH(!flipH)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded text-sm transition-colors ${
              flipH
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-primary/10"
            }`}
          >
            <FlipHorizontal className="h-4 w-4" />
            Horizontal
          </button>
          <button
            type="button"
            onClick={() => setFlipV(!flipV)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded text-sm transition-colors ${
              flipV
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-primary/10"
            }`}
          >
            <FlipVertical className="h-4 w-4" />
            Vertical
          </button>
        </div>
      </div>

      {/* Error */}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Process */}
      {processing ? (
        <ProgressCard
          active={processing}
          phase={progress.phase === "idle" ? "uploading" : progress.phase}
          label="Applying"
          stage={progress.stage}
          percent={progress.percent}
          elapsed={progress.elapsed}
        />
      ) : (
        <button
          type="submit"
          disabled={!hasFile || !hasChanges || processing}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Apply
        </button>
      )}

      {/* Download */}
      {downloadUrl && (
        <a
          href={downloadUrl}
          download
          className="w-full py-2.5 rounded-lg border border-primary text-primary font-medium flex items-center justify-center gap-2 hover:bg-primary/5"
        >
          <Download className="h-4 w-4" />
          Download
        </a>
      )}
    </form>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/sidd/Desktop/Personal/Projects/Stirling-Image && pnpm --filter @stirling-image/web build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/tools/rotate-settings.tsx
git commit -m "feat: add live preview callback to RotateSettings, rename button to Apply"
```

---

### Task 5: Update tool-page.tsx for Conditional Rendering

**Files:**
- Modify: `apps/web/src/pages/tool-page.tsx`

- [ ] **Step 1: Add imports, preview transform state, and conditional result rendering**

Changes to make in `tool-page.tsx`:

1. Add imports at the top (after existing imports, around line 8):

```tsx
import { SideBySideComparison } from "@/components/common/side-by-side-comparison";
import type { PreviewTransform } from "@/components/tools/rotate-settings";
```

2. Add a set for tools that use alternate result views (after `NO_DROPZONE_TOOLS` on line 63):

```tsx
const SIDE_BY_SIDE_TOOLS = new Set(["resize"]);
const LIVE_PREVIEW_TOOLS = new Set(["rotate"]);
```

3. Update `ToolSettingsPanel` to accept and pass through the preview transform callback (replace the function starting at line 65):

```tsx
function ToolSettingsPanel({
  toolId,
  onPreviewTransform,
}: {
  toolId: string;
  onPreviewTransform?: (t: PreviewTransform) => void;
}) {
  // Phase 2: Core tools
  if (toolId === "resize") return <ResizeSettings />;
  if (toolId === "crop") return <CropSettings />;
  if (toolId === "rotate") return <RotateSettings onPreviewTransform={onPreviewTransform} />;
```

(Rest of ToolSettingsPanel stays identical)

4. In the `ToolPage` component, add preview transform state (after `const [mobileSettingsOpen, setMobileSettingsOpen]` on line 177):

```tsx
const [previewTransform, setPreviewTransform] = useState<PreviewTransform | null>(null);
```

5. Update ToolSettingsPanel usage in both mobile and desktop layouts — pass the callback:

```tsx
<ToolSettingsPanel
  toolId={tool.id}
  onPreviewTransform={LIVE_PREVIEW_TOOLS.has(tool.id) ? setPreviewTransform : undefined}
/>
```

6. Replace the result rendering logic in the main area for **both mobile and desktop layouts**. Replace the entire conditional block (from `{isNoDropzone ?` through the closing `}`). Apply this **identically** in both the mobile layout (around line 286) and the desktop layout (around line 372):

```tsx
{isNoDropzone ? (
  <div className="text-center text-muted-foreground">
    <p className="text-sm">Configure settings and generate.</p>
  </div>
) : hasProcessed && originalBlobUrl && SIDE_BY_SIDE_TOOLS.has(tool.id) ? (
  <SideBySideComparison
    beforeSrc={originalBlobUrl}
    afterSrc={processedUrl}
    beforeSize={originalSize ?? undefined}
    afterSize={processedSize ?? undefined}
  />
) : hasProcessed && originalBlobUrl && LIVE_PREVIEW_TOOLS.has(tool.id) ? (
  <ImageViewer
    src={processedUrl}
    filename={processedFileName}
    fileSize={processedSize ?? 0}
  />
) : hasProcessed && originalBlobUrl ? (
  <BeforeAfterSlider
    beforeSrc={originalBlobUrl}
    afterSrc={processedUrl}
    beforeSize={originalSize ?? undefined}
    afterSize={processedSize ?? undefined}
  />
) : hasFile && originalBlobUrl ? (
  <ImageViewer
    src={originalBlobUrl}
    filename={selectedFileName ?? files[0].name}
    fileSize={selectedFileSize ?? files[0].size}
    {...(LIVE_PREVIEW_TOOLS.has(tool.id) && previewTransform
      ? {
          cssRotate: previewTransform.rotate,
          cssFlipH: previewTransform.flipH,
          cssFlipV: previewTransform.flipV,
        }
      : {})}
  />
) : (
  <Dropzone
    onFiles={handleFiles}
    accept="image/*"
    multiple
    currentFiles={files}
  />
)}
```

**Important:** The `BeforeAfterSlider` is kept for all tools except resize (SideBySideComparison) and rotate (ImageViewer). The `BeforeAfterSlider` import must NOT be removed.

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/sidd/Desktop/Personal/Projects/Stirling-Image && pnpm --filter @stirling-image/web build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/tool-page.tsx
git commit -m "feat: conditional result views — side-by-side for resize, live preview for rotate"
```

---

### Task 6: Docker Rebuild and Test

**Files:**
- No file changes — build and run existing Docker setup

- [ ] **Step 1: Build Docker image**

```bash
cd /Users/sidd/Desktop/Personal/Projects/Stirling-Image
docker compose -f docker/docker-compose.yml build
```

- [ ] **Step 2: Start the container**

```bash
docker compose -f docker/docker-compose.yml up -d
```

- [ ] **Step 3: Verify the app is running**

```bash
curl -f http://localhost:1349/api/v1/health
```

Expected: Health check passes

- [ ] **Step 4: Report to user for UI testing**

App is running at `http://localhost:1349`. User can test:
- Resize tool: tab-based settings (Presets, Custom Size, Scale), side-by-side result view
- Rotate tool: live CSS preview as controls change, "Apply" button, processed result in standard viewer
