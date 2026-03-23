# Interactive Crop Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the numbers-only crop UI with a visual, interactive Photoshop-style crop tool with draggable rectangle overlay, aspect ratio presets, bidirectional pixel inputs, and rule-of-thirds grid.

**Architecture:** `react-image-crop` renders the visual crop overlay on the image in a new `CropCanvas` component. `CropSettings` is redesigned with aspect ratio presets and pixel inputs that sync bidirectionally with the visual overlay. Crop state is lifted to `tool-page.tsx` and shared between both components via props. Backend is unchanged — the same `{ left, top, width, height }` pixel values are sent to Sharp's `.extract()`.

**Tech Stack:** React, TypeScript, react-image-crop, Tailwind CSS, Sharp (backend, unchanged)

**Spec:** `docs/superpowers/specs/2026-03-23-interactive-crop-tool-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/web/package.json` | Modify | Add `react-image-crop` dependency |
| `apps/web/src/components/tools/crop-canvas.tsx` | Create | Visual crop overlay component with react-image-crop, rule-of-thirds grid, dimension badge, keyboard controls |
| `apps/web/src/components/tools/crop-settings.tsx` | Rewrite | Aspect ratio presets, bidirectional pixel inputs, grid toggle, process/download buttons |
| `apps/web/src/pages/tool-page.tsx` | Modify | Lift crop state, add `INTERACTIVE_CROP_TOOLS` rendering path, pass crop props |

---

### Task 1: Install react-image-crop

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Install the dependency**

```bash
cd /Users/sidd/Desktop/Personal/Projects/Stirling-Image && pnpm add react-image-crop --filter @stirling-image/web
```

- [ ] **Step 2: Verify installation**

```bash
cd /Users/sidd/Desktop/Personal/Projects/Stirling-Image && pnpm ls react-image-crop --filter @stirling-image/web
```

Expected: `react-image-crop` appears in the dependency list.

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml && git commit -m "feat(crop): add react-image-crop dependency"
```

---

### Task 2: Create CropCanvas component

**Files:**
- Create: `apps/web/src/components/tools/crop-canvas.tsx`

This component renders the image with `ReactCrop` overlay, rule-of-thirds grid, dimension badge, and keyboard controls.

- [ ] **Step 1: Create the CropCanvas component**

Create `apps/web/src/components/tools/crop-canvas.tsx` with the following code:

```tsx
import { useRef, useCallback, useEffect } from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

export interface CropCanvasProps {
  imageSrc: string;
  crop: Crop;
  aspect: number | undefined;
  showGrid: boolean;
  imgDimensions: { width: number; height: number } | null;
  onCropChange: (crop: Crop) => void;
  onImageLoad: (dims: { width: number; height: number }) => void;
}

export function CropCanvas({
  imageSrc,
  crop,
  aspect,
  showGrid,
  imgDimensions,
  onCropChange,
  onImageLoad,
}: CropCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      onImageLoad({ width: img.naturalWidth, height: img.naturalHeight });
    },
    [onImageLoad],
  );

  // Keyboard nudging
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const step = e.shiftKey ? 10 : 1;
      const { naturalWidth, naturalHeight } = imgRef.current ?? {
        naturalWidth: 0,
        naturalHeight: 0,
      };
      if (!naturalWidth || !naturalHeight) return;

      // Convert step from pixels to percentage
      const stepX = (step / naturalWidth) * 100;
      const stepY = (step / naturalHeight) * 100;

      let dx = 0;
      let dy = 0;
      if (e.key === "ArrowLeft") dx = -stepX;
      else if (e.key === "ArrowRight") dx = stepX;
      else if (e.key === "ArrowUp") dy = -stepY;
      else if (e.key === "ArrowDown") dy = stepY;
      else if (e.key === "Escape") {
        // Reset to full image
        onCropChange({
          unit: "%",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        });
        e.preventDefault();
        return;
      } else if (e.key === "Enter") {
        // Submit the crop form (find and submit closest form)
        const form = document.querySelector<HTMLFormElement>(
          'form[data-crop-form]',
        );
        if (form) form.requestSubmit();
        e.preventDefault();
        return;
      } else return;

      e.preventDefault();
      onCropChange({
        ...crop,
        x: Math.max(0, Math.min(100 - crop.width, crop.x + dx)),
        y: Math.max(0, Math.min(100 - crop.height, crop.y + dy)),
      });
    };

    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [crop, onCropChange]);

  // Auto-focus the container on mount
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Calculate pixel dimensions for the badge
  const pixelWidth =
    imgDimensions ? Math.round((crop.width / 100) * imgDimensions.width) : 0;
  const pixelHeight =
    imgDimensions ? Math.round((crop.height / 100) * imgDimensions.height) : 0;

  return (
    <div
      ref={containerRef}
      className="flex flex-col w-full h-full max-w-4xl mx-auto outline-none"
      tabIndex={0}
    >
      {/* Crop area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden bg-muted/20 p-4">
        <ReactCrop
          crop={crop}
          onChange={onCropChange}
          aspect={aspect}
          className="max-h-full"
          ruleOfThirds={showGrid}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Crop preview"
            onLoad={handleImageLoad}
            className="max-w-full max-h-[calc(100vh-12rem)] select-none"
            draggable={false}
          />
        </ReactCrop>
      </div>

      {/* Info bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border text-xs text-muted-foreground shrink-0">
        <span>
          Crop region: {pixelWidth} x {pixelHeight}
        </span>
        {imgDimensions && (
          <span>
            Original: {imgDimensions.width} x {imgDimensions.height}
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/sidd/Desktop/Personal/Projects/Stirling-Image && pnpm --filter @stirling-image/web typecheck
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/tools/crop-canvas.tsx && git commit -m "feat(crop): add CropCanvas component with visual overlay, grid, and keyboard controls"
```

---

### Task 3: Redesign CropSettings component

**Files:**
- Rewrite: `apps/web/src/components/tools/crop-settings.tsx`

This redesigns the settings panel with aspect ratio presets (Free, 1:1, 4:3, 3:2, 16:9, 2:3, 4:5, 9:16), bidirectional pixel inputs (X, Y, Width, Height), a rule-of-thirds grid toggle, and the process/download buttons.

- [ ] **Step 1: Rewrite CropSettings**

Rewrite `apps/web/src/components/tools/crop-settings.tsx` with the following code:

```tsx
import { useCallback } from "react";
import { useFileStore } from "@/stores/file-store";
import { useToolProcessor } from "@/hooks/use-tool-processor";
import { Download, ArrowLeftRight, Grid3x3 } from "lucide-react";
import { ProgressCard } from "@/components/common/progress-card";
import type { Crop } from "react-image-crop";

const ASPECT_PRESETS = [
  { label: "Free", value: undefined as number | undefined },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:2", value: 3 / 2 },
  { label: "16:9", value: 16 / 9 },
  { label: "2:3", value: 2 / 3 },
  { label: "4:5", value: 4 / 5 },
  { label: "9:16", value: 9 / 16 },
];

export interface CropSettingsProps {
  cropState: {
    crop: Crop;
    aspect: number | undefined;
    showGrid: boolean;
    imgDimensions: { width: number; height: number } | null;
  };
  onCropChange: (crop: Crop) => void;
  onAspectChange: (aspect: number | undefined) => void;
  onGridToggle: (show: boolean) => void;
}

export function CropSettings({
  cropState,
  onCropChange,
  onAspectChange,
  onGridToggle,
}: CropSettingsProps) {
  const { files } = useFileStore();
  const {
    processFiles,
    processAllFiles,
    processing,
    error,
    downloadUrl,
    progress,
  } = useToolProcessor("crop");

  const { crop, aspect, showGrid, imgDimensions } = cropState;

  // Convert percentage crop to pixel values
  const toPixels = useCallback(
    (c: Crop) => {
      if (!imgDimensions) return { left: 0, top: 0, width: 0, height: 0 };
      return {
        left: Math.round((c.x / 100) * imgDimensions.width),
        top: Math.round((c.y / 100) * imgDimensions.height),
        width: Math.round((c.width / 100) * imgDimensions.width),
        height: Math.round((c.height / 100) * imgDimensions.height),
      };
    },
    [imgDimensions],
  );

  // Convert pixel value change back to percentage crop
  const handlePixelChange = useCallback(
    (field: "left" | "top" | "width" | "height", value: number) => {
      if (!imgDimensions) return;
      const newCrop = { ...crop };
      if (field === "left") {
        newCrop.x = Math.max(
          0,
          Math.min((value / imgDimensions.width) * 100, 100 - newCrop.width),
        );
      } else if (field === "top") {
        newCrop.y = Math.max(
          0,
          Math.min((value / imgDimensions.height) * 100, 100 - newCrop.height),
        );
      } else if (field === "width") {
        const pct = Math.max(0, Math.min((value / imgDimensions.width) * 100, 100 - newCrop.x));
        newCrop.width = pct;
        if (aspect) {
          newCrop.height = Math.min(
            (pct / 100) * imgDimensions.width * (1 / aspect) * (100 / imgDimensions.height),
            100 - newCrop.y,
          );
          newCrop.y = Math.max(0, Math.min(newCrop.y, 100 - newCrop.height));
        }
      } else if (field === "height") {
        const pct = Math.max(0, Math.min((value / imgDimensions.height) * 100, 100 - newCrop.y));
        newCrop.height = pct;
        if (aspect) {
          newCrop.width = Math.min(
            (pct / 100) * imgDimensions.height * aspect * (100 / imgDimensions.width),
            100 - newCrop.x,
          );
          newCrop.x = Math.max(0, Math.min(newCrop.x, 100 - newCrop.width));
        }
      }
      onCropChange(newCrop);
    },
    [crop, imgDimensions, aspect, onCropChange],
  );

  const handleAspectSelect = useCallback(
    (value: number | undefined) => {
      onAspectChange(value);
      // When selecting an aspect ratio, adjust the current crop to match
      if (value && imgDimensions) {
        const imgAspect = imgDimensions.width / imgDimensions.height;
        let newWidth: number;
        let newHeight: number;
        if (value > imgAspect) {
          // Wider than image — constrain by width
          newWidth = 100;
          newHeight = (imgDimensions.width / value / imgDimensions.height) * 100;
        } else {
          // Taller than image — constrain by height
          newHeight = 100;
          newWidth = (imgDimensions.height * value / imgDimensions.width) * 100;
        }
        onCropChange({
          unit: "%",
          x: (100 - newWidth) / 2,
          y: (100 - newHeight) / 2,
          width: newWidth,
          height: newHeight,
        });
      }
    },
    [onAspectChange, onCropChange, imgDimensions],
  );

  const handleSwapAspect = useCallback(() => {
    if (aspect) {
      handleAspectSelect(1 / aspect);
    }
  }, [aspect, handleAspectSelect]);

  const pixels = toPixels(crop);

  const handleProcess = () => {
    const settings = {
      left: pixels.left,
      top: pixels.top,
      width: Math.max(1, pixels.width),
      height: Math.max(1, pixels.height),
    };
    if (files.length > 1) {
      processAllFiles(files, settings);
    } else {
      processFiles(files, settings);
    }
  };

  const hasFile = files.length > 0;
  const hasSize = pixels.width > 0 && pixels.height > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasFile && hasSize && !processing) handleProcess();
  };

  // Find which preset label matches the current aspect
  const activePresetLabel = ASPECT_PRESETS.find((p) => {
    if (p.value === undefined && aspect === undefined) return true;
    if (p.value !== undefined && aspect !== undefined) {
      return Math.abs(p.value - aspect) < 0.01;
    }
    return false;
  })?.label;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-crop-form>
      {/* Aspect Ratio */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-muted-foreground">Aspect Ratio</label>
          {aspect !== undefined && (
            <button
              type="button"
              onClick={handleSwapAspect}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Swap width/height"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {ASPECT_PRESETS.map(({ label, value }) => (
            <button
              type="button"
              key={label}
              onClick={() => handleAspectSelect(value)}
              className={`px-2 py-1.5 rounded text-xs transition-colors ${
                activePresetLabel === label
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-primary/20 hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Position & Size */}
      <div>
        <label className="text-xs text-muted-foreground">Position & Size</label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div>
            <label className="text-[10px] text-muted-foreground">
              X{imgDimensions ? ` (of ${imgDimensions.width})` : ""}
            </label>
            <input
              type="number"
              value={pixels.left}
              onChange={(e) =>
                handlePixelChange("left", Number(e.target.value))
              }
              min={0}
              max={imgDimensions ? imgDimensions.width - 1 : undefined}
              className="w-full mt-0.5 px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground tabular-nums"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">
              Y{imgDimensions ? ` (of ${imgDimensions.height})` : ""}
            </label>
            <input
              type="number"
              value={pixels.top}
              onChange={(e) =>
                handlePixelChange("top", Number(e.target.value))
              }
              min={0}
              max={imgDimensions ? imgDimensions.height - 1 : undefined}
              className="w-full mt-0.5 px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground tabular-nums"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">
              Width{imgDimensions ? ` (of ${imgDimensions.width})` : ""}
            </label>
            <input
              type="number"
              value={pixels.width}
              onChange={(e) =>
                handlePixelChange("width", Number(e.target.value))
              }
              min={1}
              max={imgDimensions ? imgDimensions.width : undefined}
              className="w-full mt-0.5 px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground tabular-nums"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">
              Height{imgDimensions ? ` (of ${imgDimensions.height})` : ""}
            </label>
            <input
              type="number"
              value={pixels.height}
              onChange={(e) =>
                handlePixelChange("height", Number(e.target.value))
              }
              min={1}
              max={imgDimensions ? imgDimensions.height : undefined}
              className="w-full mt-0.5 px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground tabular-nums"
            />
          </div>
        </div>
      </div>

      {/* Grid overlay toggle */}
      <button
        type="button"
        onClick={() => onGridToggle(!showGrid)}
        className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs transition-colors ${
          showGrid
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground hover:text-foreground"
        }`}
      >
        <Grid3x3 className="h-3.5 w-3.5" />
        Rule of Thirds
      </button>

      {/* Error */}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Process */}
      {processing ? (
        <ProgressCard
          active={processing}
          phase={progress.phase === "idle" ? "uploading" : progress.phase}
          label="Cropping"
          stage={progress.stage}
          percent={progress.percent}
          elapsed={progress.elapsed}
        />
      ) : (
        <button
          type="submit"
          disabled={!hasFile || !hasSize || processing}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {files.length > 1 ? `Crop (${files.length} files)` : "Crop"}
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

```bash
cd /Users/sidd/Desktop/Personal/Projects/Stirling-Image && pnpm --filter @stirling-image/web typecheck
```

Expected: No type errors. (May have errors from `tool-page.tsx` not yet passing props — that's expected and fixed in Task 4.)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/tools/crop-settings.tsx && git commit -m "feat(crop): redesign CropSettings with aspect presets, pixel inputs, and grid toggle"
```

---

### Task 4: Update tool-page.tsx to wire everything together

**Files:**
- Modify: `apps/web/src/pages/tool-page.tsx`

This task lifts crop state to `tool-page.tsx`, adds the `INTERACTIVE_CROP_TOOLS` rendering path, and passes props to both `CropCanvas` and `CropSettings`.

- [ ] **Step 1: Add imports**

At the top of `apps/web/src/pages/tool-page.tsx`, add after the existing `CropSettings` import:

```tsx
import { CropCanvas } from "@/components/tools/crop-canvas";
```

Also add `type Crop` import near the top:

```tsx
import type { Crop } from "react-image-crop";
```

- [ ] **Step 2: Add INTERACTIVE_CROP_TOOLS set**

After the `LIVE_PREVIEW_TOOLS` line (line 68 currently), add:

```tsx
const INTERACTIVE_CROP_TOOLS = new Set(["crop"]);
```

- [ ] **Step 3: Add crop state to ToolPage component**

Inside the `ToolPage` function, after the `previewTransform` state declaration (currently line 185), add:

```tsx
const [cropCrop, setCropCrop] = useState<Crop>({
  unit: "%",
  x: 0,
  y: 0,
  width: 100,
  height: 100,
});
const [cropAspect, setCropAspect] = useState<number | undefined>(undefined);
const [cropShowGrid, setCropShowGrid] = useState(true);
const [cropImgDimensions, setCropImgDimensions] = useState<{
  width: number;
  height: number;
} | null>(null);

const cropState = useMemo(
  () => ({
    crop: cropCrop,
    aspect: cropAspect,
    showGrid: cropShowGrid,
    imgDimensions: cropImgDimensions,
  }),
  [cropCrop, cropAspect, cropShowGrid, cropImgDimensions],
);

// Reset crop state when the image changes
useEffect(() => {
  setCropCrop({ unit: "%", x: 0, y: 0, width: 100, height: 100 });
  setCropImgDimensions(null);
}, [originalBlobUrl]);
```

- [ ] **Step 4: Update ToolSettingsPanel to pass crop props**

Modify the `ToolSettingsPanel` component signature and the crop routing. The component needs access to crop state, so we'll pass it through.

Change the `ToolSettingsPanel` function signature from:

```tsx
function ToolSettingsPanel({
  toolId,
  onPreviewTransform,
}: {
  toolId: string;
  onPreviewTransform?: (t: PreviewTransform) => void;
}) {
```

to:

```tsx
function ToolSettingsPanel({
  toolId,
  onPreviewTransform,
  cropProps,
}: {
  toolId: string;
  onPreviewTransform?: (t: PreviewTransform) => void;
  cropProps?: {
    cropState: {
      crop: Crop;
      aspect: number | undefined;
      showGrid: boolean;
      imgDimensions: { width: number; height: number } | null;
    };
    onCropChange: (crop: Crop) => void;
    onAspectChange: (aspect: number | undefined) => void;
    onGridToggle: (show: boolean) => void;
  };
}) {
```

Then change the crop routing line from:

```tsx
if (toolId === "crop") return <CropSettings />;
```

to:

```tsx
if (toolId === "crop" && cropProps) return <CropSettings {...cropProps} />;
```

- [ ] **Step 5: Pass cropProps to ToolSettingsPanel in both layouts**

In both the desktop and mobile layouts, update the `<ToolSettingsPanel>` call to include `cropProps`.

Find every `<ToolSettingsPanel` usage (there should be 2 — one in mobile layout, one in desktop layout) and add the `cropProps` prop:

```tsx
<ToolSettingsPanel
  toolId={tool.id}
  onPreviewTransform={LIVE_PREVIEW_TOOLS.has(tool.id) ? setPreviewTransform : undefined}
  cropProps={INTERACTIVE_CROP_TOOLS.has(tool.id) ? {
    cropState,
    onCropChange: setCropCrop,
    onAspectChange: setCropAspect,
    onGridToggle: setCropShowGrid,
  } : undefined}
/>
```

- [ ] **Step 6: Add CropCanvas rendering path in desktop layout**

In the desktop layout's main area (the `{/* Main area */}` section), add the `CropCanvas` branch. This must come **before** the `SIDE_BY_SIDE_TOOLS` check. Find the line:

```tsx
) : hasProcessed && originalBlobUrl && SIDE_BY_SIDE_TOOLS.has(tool.id) ? (
```

And add this branch **before** it (after the `files.length > 1` MultiImageViewer check):

```tsx
) : INTERACTIVE_CROP_TOOLS.has(tool.id) && hasFile && !hasProcessed && originalBlobUrl ? (
  <CropCanvas
    imageSrc={originalBlobUrl}
    crop={cropCrop}
    aspect={cropAspect}
    showGrid={cropShowGrid}
    imgDimensions={cropImgDimensions}
    onCropChange={setCropCrop}
    onImageLoad={setCropImgDimensions}
  />
```

- [ ] **Step 7: Add CropCanvas rendering path in mobile layout**

Do the exact same insertion in the mobile layout's main area — add the `CropCanvas` branch before the `SIDE_BY_SIDE_TOOLS` check, after the `files.length > 1` check:

```tsx
) : INTERACTIVE_CROP_TOOLS.has(tool.id) && hasFile && !hasProcessed && originalBlobUrl ? (
  <CropCanvas
    imageSrc={originalBlobUrl}
    crop={cropCrop}
    aspect={cropAspect}
    showGrid={cropShowGrid}
    imgDimensions={cropImgDimensions}
    onCropChange={setCropCrop}
    onImageLoad={setCropImgDimensions}
  />
```

- [ ] **Step 8: Verify everything compiles**

```bash
cd /Users/sidd/Desktop/Personal/Projects/Stirling-Image && pnpm --filter @stirling-image/web typecheck
```

Expected: No type errors.

- [ ] **Step 9: Build the frontend**

```bash
cd /Users/sidd/Desktop/Personal/Projects/Stirling-Image && pnpm --filter @stirling-image/web build
```

Expected: Build succeeds with no errors.

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/pages/tool-page.tsx && git commit -m "feat(crop): wire CropCanvas and CropSettings into tool-page with bidirectional state"
```

---

### Task 5: Docker rebuild and verification

**Files:** None (Docker rebuild only)

- [ ] **Step 1: Rebuild the Docker container**

```bash
cd /Users/sidd/Desktop/Personal/Projects/Stirling-Image && docker-compose -f docker/docker-compose.yml up --build -d
```

Expected: Container builds and starts on port 1349.

- [ ] **Step 2: Manual verification checklist**

Open `http://localhost:1349` in a browser and test:

1. Navigate to the Crop tool
2. Drop an image — verify the crop canvas appears with the rectangle covering the full image
3. Drag a corner handle — verify the rectangle resizes and the pixel inputs update
4. Type a width value in the pixel input — verify the rectangle updates
5. Select "1:1" aspect ratio — verify the rectangle snaps to square
6. Select "16:9" — verify landscape ratio
7. Click the swap button — verify it flips to 9:16
8. Select "Free" — verify unconstrained dragging works
9. Toggle Rule of Thirds — verify grid lines appear/disappear
10. Use arrow keys to nudge — verify the rectangle moves
11. Use Shift+Arrow — verify 10px nudge
12. Press Escape — verify rectangle resets to full image
13. Click "Crop" — verify processing works and side-by-side comparison appears
14. Click Download — verify the cropped image downloads
15. Click Undo (in review panel) — verify it returns to the crop canvas
