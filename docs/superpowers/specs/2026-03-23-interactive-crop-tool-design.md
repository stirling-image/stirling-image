# Interactive Crop Tool Design

## Overview

Replace the current numbers-only crop UI with a visual, interactive crop tool featuring a draggable rectangle overlay on the image (Photoshop-style), aspect ratio presets, bidirectional pixel inputs, rule-of-thirds grid, and keyboard controls.

## Approach

**`react-image-crop`** (~5KB, zero deps) provides the core overlay with 8 drag handles, aspect ratio locking, and dimmed excluded area. Custom enhancements: rule-of-thirds grid (SVG), bidirectional pixel inputs, aspect ratio preset buttons, keyboard nudging. Actual cropping remains server-side via Sharp.

## Interaction Model

### Pre-crop (image loaded, not yet processed)

- Right panel shows `CropCanvas` component instead of `ImageViewer`
- Image fills available space (maintaining aspect ratio)
- Crop rectangle overlays the image via `react-image-crop`
- Rectangle starts covering the full image; user drags inward
- Area outside rectangle dimmed at ~50% opacity
- 8 drag handles: 4 corners + 4 edge midpoints

### Post-crop (after clicking "Crop")

- Switches to existing `SideBySideComparison` view showing before/after
- Download button appears in settings panel

### Flow

1. Drop image -> crop canvas appears with full-image crop selection
2. Adjust crop rectangle (drag handles, move, keyboard, or type pixel values)
3. Click "Crop" -> processes via Sharp backend -> shows before/after comparison
4. Download or undo to re-crop

## Settings Panel (Left Side)

### Aspect Ratio

- "Free" button (default, selected state) -- unconstrained dragging
- Preset buttons in a wrapped grid: `1:1`, `4:3`, `3:2`, `16:9`, `2:3`, `4:5`, `9:16`
- Swap button next to active preset to flip landscape/portrait (e.g. 16:9 -> 9:16)
- When a preset is selected, crop rectangle snaps to that ratio and drag handles maintain it

### Position & Size (pixel inputs)

- 2x2 grid: X (left), Y (top), Width, Height
- Bidirectionally synced with visual crop overlay -- dragging updates numbers, typing updates rectangle
- Shows original image dimensions as reference (e.g. "of 1920" hint text)
- Values clamped to valid ranges

### Grid Overlay

- Toggle: "Rule of Thirds" (on by default)
- Renders 3x3 grid inside crop area as thin semi-transparent lines

### Process Section

- "Crop" button (or "Crop (N files)" for batch)
- Progress card during processing
- Download button after completion

## CropCanvas Component

New file: `apps/web/src/components/tools/crop-canvas.tsx`

- Wraps uploaded image with `ReactCrop` from `react-image-crop`
- Uses percentage-based crop coordinates internally (overlay works at any display size)
- Converts to absolute pixels when syncing with settings inputs and submitting to API
- Image rendered with `object-fit: contain` to fill available space

### Dimension Badge

- Small floating label near bottom-right of crop area
- Shows resulting dimensions in real-time (e.g. "640 x 480")

### Rule of Thirds Grid

- SVG overlay inside crop area
- 4 lines (2 horizontal, 2 vertical) at 1/3 and 2/3 positions
- Thin white lines at ~40% opacity

### Keyboard Controls

- Arrow keys: nudge crop box by 1px
- Shift+Arrow: nudge by 10px
- Enter: apply crop (submit form)
- Escape: reset crop to full image

### Touch Support

- Handled by `react-image-crop` out of the box

## State Management

Crop state is owned by `tool-page.tsx` and passed **bidirectionally** to both `CropSettings` and `CropCanvas`. This differs from the rotate tool's one-way `onPreviewTransform` callback — crop requires both components to read and write the same state.

State shape:
```typescript
interface CropState {
  crop: Crop;              // react-image-crop's Crop type (percentage-based)
  aspect: number | undefined; // locked aspect ratio or undefined for free
  showGrid: boolean;       // rule of thirds toggle
  imgDimensions: { width: number; height: number } | null; // natural image dimensions
}
```

`tool-page.tsx` holds `[cropState, setCropState] = useState<CropState>(...)` and passes:
- To `CropCanvas`: `cropState`, `onCropChange`, `imageSrc` (from `originalBlobUrl`), `onImageLoad` (to capture natural dimensions)
- To `CropSettings`: `cropState`, `onCropChange`, `onAspectChange`, `onGridToggle`

### CropSettings Prop Interface

```typescript
interface CropSettingsProps {
  cropState: CropState;
  onCropChange: (crop: Crop) => void;
  onAspectChange: (aspect: number | undefined) => void;
  onGridToggle: (show: boolean) => void;
}
```

`CropSettings` continues to use `useToolProcessor("crop")` internally for submission. The pixel input fields convert between percentage-based `Crop` and absolute pixels using `cropState.imgDimensions`.

### CropCanvas Prop Interface

```typescript
interface CropCanvasProps {
  imageSrc: string;
  cropState: CropState;
  onCropChange: (crop: Crop) => void;
  onImageLoad: (dims: { width: number; height: number }) => void;
}
```

`CropCanvas` reads `imageSrc` as a prop (sourced from `originalBlobUrl` in the file store). It reports natural image dimensions via `onImageLoad` when the `<img>` fires its load event.

### Keyboard Focus

`CropCanvas` container has `tabIndex={0}` and captures focus on mount. Arrow key handlers call `e.preventDefault()` to suppress page scrolling. The component uses a `keydown` event listener on its container div.

## Rendering Path in tool-page.tsx

Add a new set: `const INTERACTIVE_CROP_TOOLS = new Set(["crop"])`.

The main area rendering logic adds a new branch **before** the existing `SIDE_BY_SIDE_TOOLS` check:

```
if (INTERACTIVE_CROP_TOOLS.has(toolId) && hasFile && !hasProcessed) {
  return <CropCanvas ... />;
}
```

- **Pre-crop**: `CropCanvas` renders (interactive overlay on image)
- **Post-crop**: Falls through to `SIDE_BY_SIDE_TOOLS` which already includes `"crop"` -> shows `SideBySideComparison`
- **Undo**: `undoProcessing()` clears `processedUrl`, which causes `hasProcessed` to become false, routing back to `CropCanvas` (not `ImageViewer`)

The `ToolSettingsPanel` routing passes crop props to `CropSettings`:
```
if (toolId === "crop") return <CropSettings cropState={...} onCropChange={...} ... />;
```

## Batch / Multi-Image Behavior

When multiple files are loaded (`files.length > 1`), the interactive crop canvas is **not shown** — the existing `MultiImageViewer` renders instead (this check comes first in the rendering logic). The crop settings fall back to the pixel-input-only mode (no visual overlay) for batch, since different images may have different dimensions.

Single-image interactive cropping is the primary use case. Batch cropping with identical pixel coordinates is an advanced/power-user flow that works via the numeric inputs alone.

## Data Flow

1. User adjusts crop rectangle -> `react-image-crop` emits percentage-based `Crop` object
2. `CropCanvas` calls `onCropChange(crop)` -> `tool-page.tsx` updates `cropState`
3. `CropSettings` reads `cropState` and converts percentages to absolute pixels using `imgDimensions`
4. User types in pixel inputs -> `CropSettings` converts back to percentages and calls `onCropChange`
5. On submit, `CropSettings` converts final `cropState.crop` to `{ left, top, width, height }` (pixels) and sends to `useToolProcessor("crop")`
6. Backend processes via Sharp `.extract()`, returns `downloadUrl`
7. `tool-page.tsx` rendering falls through to `SideBySideComparison`

## Backend

No changes needed. Existing crop API endpoint accepts `{ left, top, width, height }` in pixels. Note: the backend currently hardcodes output as `image/png` regardless of input format — this is a pre-existing limitation not addressed in this spec.

## Files to Modify

- `apps/web/src/components/tools/crop-settings.tsx` -- redesign with aspect ratio presets, synced pixel inputs
- `apps/web/src/pages/tool-page.tsx` -- add crop canvas rendering path, lift crop state, add `INTERACTIVE_CROP_TOOLS` set
- **New:** `apps/web/src/components/tools/crop-canvas.tsx` -- visual cropper component
- `apps/web/package.json` -- add `react-image-crop` dependency

## Files NOT Modified

- Backend API routes
- Image engine operations
- Shared constants/types
- Docker (just rebuild)

## Dependencies

- `react-image-crop` (~5KB gzipped, zero transitive dependencies)
