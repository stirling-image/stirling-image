# Remotion Promotional Videos -- Design Spec

## Overview

Three standalone promotional videos for SnapOtter built with Remotion. Each video serves a different purpose and platform, with a shared design system for brand consistency.

| # | Video | Purpose | Theme | Resolution | Duration |
|---|-------|---------|-------|------------|----------|
| 1 | X Launch Video | Twitter/X announcement | Dark | 1080x1080 | ~35s |
| 2 | Product Demo | Website/sales walkthrough | Light | 1920x1080 | ~75s |
| 3 | Promo Teaser | Social media awareness | Dark | 1080x1080 + 1080x1920 | ~20s |

All videos use music + text captions (no voiceover). Music is placeholder-ready (Remotion audio infrastructure wired up, user swaps in a real track later).

---

## Technical Architecture

### Workspace Setup

New monorepo workspace: `apps/videos/`

```
apps/videos/
  package.json            (@snapotter/videos)
  tsconfig.json
  remotion.config.ts
  tailwind.config.js      (v3 format for Remotion Webpack compat)
  src/
    index.ts              (entry point)
    Root.tsx               (Composition registry -- all 3 + aspect ratio variants)
    design-system/
      colors.ts            (dark + light palettes from SnapOtter brand)
      fonts.ts             (Inter, Nunito, JetBrains Mono registration)
      animations.ts        (spring presets, easing curves, timing constants)
    components/
      AppWindow.tsx         (macOS-style window chrome with traffic lights)
      Terminal.tsx          (terminal with typing animation + syntax highlighting)
      AnimatedText.tsx      (word-by-word / character reveal with clip-mask)
      ToolGrid.tsx          (animated grid of tool cards by category)
      BeforeAfter.tsx       (split comparison with scan-line wipe)
      LogoReveal.tsx        (SnapOtter logo with particle convergence)
      GitHubCTA.tsx         (star on GitHub end card)
      RotatingTaglines.tsx  (cycling phrases from landing page)
      FeaturePill.tsx       (animated feature badge)
      NumberPunch.tsx       (large number with impact animation)
      GrainOverlay.tsx      (animated Perlin noise film grain)
      ProgressBar.tsx       (animated processing progress)
      GradientMesh.tsx      (ambient amber/orange blob background)
    compositions/
      x-launch/
        XLaunchVideo.tsx
        scenes/
          HookScene.tsx
          TerminalInstallScene.tsx
          ToolGridRevealScene.tsx
          AiShowcaseScene.tsx
          PrivacyBeatScene.tsx
          FeatureBurstScene.tsx
          GitHubCTAScene.tsx
      product-demo/
        ProductDemo.tsx
        scenes/
          DashboardScene.tsx
          SingleToolScene.tsx
          BatchProcessingScene.tsx
          PipelineBuilderScene.tsx
          AiToolsScene.tsx
          ImageEditorScene.tsx
          ApiDocsScene.tsx
          EndCardScene.tsx
      promo-teaser/
        PromoTeaser.tsx
        PromoTeaserVertical.tsx  (1080x1920 variant)
        scenes/
          AmbientOpenScene.tsx
          NumberPunchScene.tsx
          TaglineCascadeScene.tsx
          LogoRevealScene.tsx
          CTAScene.tsx
    lib/
      tools.ts              (all 49 tool names + categories, mirrored from shared)
      audio.ts              (audio placeholder config with fade-in/fade-out)
  public/
    otter-logo.svg
    audio/
      placeholder.mp3       (silent placeholder, same duration as longest video)
  scripts/
    render-all.mjs          (batch render all compositions to MP4)
```

### Dependencies

```json
{
  "dependencies": {
    "remotion": "^4.0.0",
    "@remotion/cli": "^4.0.0",
    "@remotion/renderer": "^4.0.0",
    "@remotion/bundler": "^4.0.0",
    "@remotion/tailwind": "^4.0.0",
    "@remotion/noise": "^4.0.0",
    "@remotion/motion-blur": "^4.0.0",
    "@remotion/paths": "^4.0.0",
    "@remotion/google-fonts": "^4.0.0",
    "@remotion/shapes": "^4.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  }
}
```

Note: Remotion v4 requires React 18, not React 19. This workspace pins React 18 independently (pnpm handles this with workspace overrides). `@remotion/tailwind` uses Webpack and requires Tailwind CSS v3 config format.

### Config

**`remotion.config.ts`:**
```ts
import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.overrideWebpackConfig((config) => enableTailwind(config));
```

**`tailwind.config.js`** (v3 format):
```js
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Nunito", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        accent: "#f59e0b",
        safe: "#22c55e",
        danger: "#ef4444",
      },
    },
  },
};
```

### Root Composition Registry

```tsx
// Root.tsx
import { Composition } from "remotion";
import { XLaunchVideo } from "./compositions/x-launch/XLaunchVideo";
import { ProductDemo } from "./compositions/product-demo/ProductDemo";
import { PromoTeaser } from "./compositions/promo-teaser/PromoTeaser";
import { PromoTeaserVertical } from "./compositions/promo-teaser/PromoTeaserVertical";

export const RemotionRoot = () => (
  <>
    <Composition id="XLaunchVideo" component={XLaunchVideo}
      durationInFrames={1050} fps={30} width={1080} height={1080} />
    <Composition id="ProductDemo" component={ProductDemo}
      durationInFrames={2250} fps={30} width={1920} height={1080} />
    <Composition id="PromoTeaser" component={PromoTeaser}
      durationInFrames={600} fps={30} width={1080} height={1080} />
    <Composition id="PromoTeaserVertical" component={PromoTeaserVertical}
      durationInFrames={600} fps={30} width={1080} height={1920} />
  </>
);
```

### Audio Setup

All videos use a placeholder audio track. The infrastructure is wired so the user drops in a real track later.

```ts
// lib/audio.ts
import { Audio, interpolate, useCurrentFrame } from "remotion";
import { staticFile } from "remotion";

export const BackgroundMusic: React.FC<{
  src?: string;
  volume?: number;
  fadeInFrames?: number;
  fadeOutFrames?: number;
  totalFrames: number;
}> = ({
  src = staticFile("audio/placeholder.mp3"),
  volume = 0.4,
  fadeInFrames = 30,
  fadeOutFrames = 60,
  totalFrames,
}) => {
  const frame = useCurrentFrame();
  const vol = interpolate(
    frame,
    [0, fadeInFrames, totalFrames - fadeOutFrames, totalFrames],
    [0, volume, volume, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return <Audio src={src} volume={vol} />;
};
```

---

## Shared Design System

### Color Palettes

```ts
// design-system/colors.ts
export const DARK = {
  bg: "#0c0a09",
  surface: "#1c1917",
  border: "#292524",
  text: "#fafaf9",
  textMuted: "#a8a29e",
  textDim: "#78716c",
  accent: "#f59e0b",
  accentHover: "#d97706",
};

export const LIGHT = {
  bg: "#ffffff",
  surface: "#fafaf9",
  border: "#e7e5e4",
  text: "#0a0a0a",
  textMuted: "#737373",
  accent: "#f59e0b",
  accentHover: "#d97706",
  primary: "#3b82f6",
};

export const CATEGORY = {
  essentials: "#3B82F6",
  optimization: "#10B981",
  adjustments: "#8B5CF6",
  ai: "#F59E0B",
  watermark: "#EF4444",
  utilities: "#6366F1",
  layout: "#EC4899",
  format: "#14B8A6",
};
```

### Typography

```ts
// design-system/fonts.ts
import { loadFont as loadNunito } from "@remotion/google-fonts/Nunito";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: nunito } = loadNunito();
const { fontFamily: inter } = loadInter();
const { fontFamily: mono } = loadJetBrainsMono();

export const FONT = { heading: nunito, body: inter, mono };

export const TEXT = {
  heroHeadline: { fontFamily: nunito, fontWeight: 800, fontSize: 72, letterSpacing: "-0.02em", lineHeight: 1.1 },
  heroSub: { fontFamily: inter, fontWeight: 500, fontSize: 28, lineHeight: 1.4 },
  sectionTitle: { fontFamily: nunito, fontWeight: 700, fontSize: 48, letterSpacing: "-0.01em" },
  label: { fontFamily: inter, fontWeight: 600, fontSize: 18, letterSpacing: "0.04em", textTransform: "uppercase" as const },
  body: { fontFamily: inter, fontWeight: 400, fontSize: 20, lineHeight: 1.5 },
  mono: { fontFamily: mono, fontWeight: 400, fontSize: 16, lineHeight: 1.6 },
  counter: { fontFamily: nunito, fontWeight: 800, fontSize: 96, letterSpacing: "-0.03em" },
  toolPill: { fontFamily: inter, fontWeight: 600, fontSize: 14 },
};
```

### Animation Presets

```ts
// design-system/animations.ts
import { Easing } from "remotion";

export const EASE = {
  enter: Easing.bezier(0.16, 1, 0.3, 1),
  exit: Easing.bezier(0.55, 0, 1, 0.45),
  emphasis: Easing.bezier(0.34, 1.56, 0.64, 1),
  smooth: Easing.bezier(0.37, 0, 0.63, 1),
  snap: Easing.bezier(0.22, 1, 0.36, 1),
};

export const SPRING = {
  snappy: { damping: 200, stiffness: 100, mass: 0.5 },
  natural: { damping: 15, stiffness: 80, mass: 1 },
  popIn: { damping: 12, stiffness: 200, mass: 0.6 },
  heavy: { damping: 20, stiffness: 60, mass: 2 },
  settle: { damping: 18, stiffness: 150, mass: 0.8 },
};

export const TIMING = {
  fps: 30,
  staggerFrames: 2,
  holdShort: 30,    // 1s
  holdMedium: 60,   // 2s
  holdLong: 90,     // 3s
  fadeIn: 12,        // 400ms
  fadeOut: 8,        // 267ms
  wipe: 18,          // 600ms
  sectionGap: 12,    // 400ms
};
```

### Grain Overlay

Every composition gets subtle animated film grain via SVG feTurbulence with per-frame seed:

```tsx
export const GrainOverlay: React.FC<{ opacity?: number }> = ({ opacity = 0.03 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id={`grain-${frame}`}>
          <feTurbulence type="fractalNoise" baseFrequency={0.65} numOctaves={3} seed={frame} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${frame})`} />
      </svg>
    </AbsoluteFill>
  );
};
```

---

## Video 1: X Launch Video

**ID:** `XLaunchVideo`
**Resolution:** 1080x1080 (square, optimal for X feed)
**Duration:** 1050 frames (35s @ 30fps)
**Theme:** Dark (`#0c0a09` background, `#f59e0b` amber accents)
**Audio:** Background music at 40% volume, 1s fade-in, 2s fade-out

### Scene 1 -- Hook (frame 0-120, 4s)

Full screen animated text. "Your images." appears first via clip-mask reveal (word rises up from behind invisible mask, 15 frames per word). Spring animation with slight overshoot. Then "Stay yours." appears 20 frames later, same treatment. Both in Nunito 800 weight, 72px, white on dark.

Behind the text: subtle amber gradient glow pulses. Radial gradient centered on text, amber at 8% opacity, breathing via `Math.sin(frame * 0.08) * 0.03 + 0.08`.

### Scene 2 -- Terminal Install (frame 120-270, 5s)

macOS terminal window slides up from bottom with `SPRING.snappy`. Terminal specs:
- 800x450px, centered, border-radius 12px
- Top bar: `#1e1e2e`, three traffic light dots (red/yellow/green, 12px)
- Body: `#0d1117`, JetBrains Mono font

Character-by-character typing (2 frames/char) of:
```
docker run -p 3000:3000 snapotter/snapotter
```

Syntax highlighting: `docker` in `#ff7b72`, flags in `#79c0ff`, image name in `#7ee787`.

After typing completes, output lines appear with staggered fade-in (3-frame stagger):
- `v2.x.x` (version banner, amber)
- `49 tools loaded` (green)
- `15 AI models ready` (green)
- `Server running on :3000` (bright green with checkmark)

### Scene 3 -- Tool Grid Reveal (frame 270-450, 6s)

Terminal shrinks (scale to 0.6) and slides to top-left corner (opacity 40%). Tool cards cascade in from the right with staggered spring animations (`SPRING.settle`, 2-frame stagger between cards).

Cards grouped by category with their accent colors. Each card: rounded rectangle, category color at 15% opacity background, white text, category color left border (3px). 8 columns, one per category.

Animated counter in bottom-right: 0 to 49, Nunito 800 weight, 64px, amber. Easing: fast start, slow finish.

### Scene 4 -- AI Showcase (frame 450-630, 6s)

Split screen before/after with scan-line wipe. Three quick transitions (60 frames each):

1. **Background removal** (frame 450-510): Left shows a photo placeholder (warm gradient with geometric background pattern). Amber scan line sweeps left to right. Behind the line, background becomes checkerboard transparency. Subject "floats forward" after completion.

2. **Upscale 4x** (frame 510-570): Small blocky image (pixel grid) on left. Scan line sweeps. Right side shows smooth, 4x larger version. Size labels: "200px" morphs to "800px".

3. **Object erase** (frame 570-630): Photo with a highlighted region (amber dashed outline). Scan line sweeps. Region fills in seamlessly. Checkmark pops in.

Text overlay throughout: "15 AI models. Your hardware. No cloud." in Inter 600, 24px, white at 80% opacity, bottom of frame.

### Scene 5 -- Privacy Beat (frame 630-750, 4s)

Rotating taglines from the landing page, one per 30 frames (1 second each), centered:
- "No uploads to the cloud. Ever."
- "100% local processing."
- "Works fully offline."
- "Air-gapped ready."

Each fades in via clip-mask reveal in amber (`#f59e0b`), holds briefly, then fades out before the next. Inter 500, 36px. Subtle pulse glow behind each line.

### Scene 6 -- Feature Burst (frame 750-900, 5s)

Feature pills fly in from screen edges. Each pill: rounded rectangle, amber background at 15%, white text, Inter 600, 16px. Features:

"Batch Processing", "Pipeline Automation", "REST API", "55+ Input Formats", "Image Editor", "One Container", "Multi-arch", "15 AI Models"

Pills enter with `SPRING.popIn` wrapped in motion blur Trail (4 layers). Staggered by 8 frames. They arrange into a 2x4 centered grid, each snapping into place with `SPRING.settle`.

After all placed: brief hold, then pills scale down to 60% and shift upward.

### Scene 7 -- GitHub CTA (frame 900-1050, 5s)

"100% OPEN SOURCE" label in amber, Inter 600, 18px, uppercase, letter-spacing 0.04em. Appears via clip-mask reveal.

SnapOtter logo scales up from center with a soft amber glow burst (radial gradient expanding from 0 to 200px radius, amber at 15% opacity, over 15 frames).

"Free forever." in Nunito 700, 48px, white. Below: GitHub icon (SVG) with "Star us on GitHub" in Inter 400, 20px. Repo URL `github.com/snapotter-hq/SnapOtter` in JetBrains Mono 400, 16px, amber.

Pulsing amber border around the entire frame (2px, opacity oscillates 0.3 to 0.6 via sin wave).

---

## Video 2: Product Demo

**ID:** `ProductDemo`
**Resolution:** 1920x1080 (landscape, website/presentation quality)
**Duration:** 2250 frames (75s @ 30fps)
**Theme:** Light (`#ffffff` background, `#3b82f6` blue UI accents, `#f59e0b` amber brand)
**Audio:** Background music at 30% volume (lower than launch video -- demo feel), 1s fade-in, 2s fade-out

This video replicates the actual SnapOtter UI in React components. Every scene shows a recognizable version of the real app interface.

### Scene 1 -- Dashboard Overview (frame 0-240, 8s)

AppWindow component fades in (spring animation from scale 0.95 to 1.0, opacity 0 to 1). Renders a simplified SnapOtter dashboard:
- Top bar: SnapOtter logo + wordmark (Nunito bold), search bar (rounded input with magnifying glass icon), user avatar circle
- Below: horizontal category pill filters (Essentials, AI, Optimization, etc.) in their category colors
- Main area: 4x3 grid of tool cards, each with icon, name, and category color dot

A cursor (custom CSS cursor, slight glow) moves to the search bar. Types "resize" character by character (2 frames/char). Cards filter in real-time -- non-matching cards fade out (opacity to 0.2, scale to 0.95), matching cards stay. Shows 3 results: "Resize", "Content-Aware Resize", "Smart Crop".

### Scene 2 -- Single Tool Flow (frame 240-600, 12s)

Cursor clicks "Resize" card. Dashboard slides left (exit animation), Resize tool page slides in from right.

Tool page layout:
- Left (60%): Large dropzone area with dashed border, upload icon, "Drop an image here" text
- Right (40%): Settings panel with controls

An image file icon drops onto the dropzone (animated fall from above with `SPRING.natural`, slight bounce). Dropzone border turns solid blue, image preview appears.

Settings panel animates:
- Width field: cursor clicks, types "1920"
- Height field: shows "auto" (grayed, aspect ratio locked)
- Toggle: "Maintain aspect ratio" is ON (blue)
- Format selector: "WebP" selected

"Process" button clicks (button depresses slightly, color intensifies). Progress bar fills left to right (blue, 2 seconds). Result appears: side-by-side comparison with file size badge. Original: "2.4 MB" (gray). Processed: "340 KB" (green). Reduction percentage: "-86%" in amber.

### Scene 3 -- Batch Processing (frame 600-960, 12s)

Navigate back to dashboard (slide transition). Cursor clicks "Compress" tool.

Compress tool page appears. 8 file icons cascade onto the dropzone (staggered by 4 frames, `SPRING.popIn`). Each file shows a tiny thumbnail and filename.

Settings: Quality slider moves to 80. Format: "WebP".

"Process All" button clicks. A progress card appears for each file, arranged in a 2x4 grid. Each card shows:
- Filename
- Progress bar filling
- Checkmark appearing when done

Cards complete in staggered order (not all at once -- simulates real parallel processing). As each finishes, file size updates: "1.8 MB -> 95 KB", "3.2 MB -> 210 KB", etc.

All complete. "Download ZIP" button pulses with amber glow.

Text overlay fades in at bottom: "Unlimited batch. No caps." in Nunito 700, 32px.

### Scene 4 -- Pipeline Builder (frame 960-1350, 13s)

Navigate to pipeline page (URL bar shows `/automate`). Empty canvas with a sidebar of available tools.

Three tool blocks drag from sidebar to canvas (animated drag with cursor):
1. "Resize" block (blue) drops at position 1
2. "Compress" block (green) drops at position 2
3. "Text Watermark" block (red) drops at position 3

Connection lines animate between blocks (SVG path with `evolvePath()`, dotted line becoming solid on connection). Each block briefly flashes its settings panel (expanding, showing 2-3 key settings, then collapsing).

"Run Pipeline" button clicks. A stream of 5 image thumbnails flows through the pipeline left to right. Each thumbnail pauses at each station (brief glow on the station), then continues. Stage indicator shows which step is active.

Output: 5 processed images appear in a results tray at bottom.

### Scene 5 -- AI Tools (frame 1350-1710, 12s)

Navigate to "Remove Background" tool. Upload a photo placeholder (portrait-style gradient).

Processing state: spinner with "Running rembg model locally..." text in Inter 400, blue. Progress bar advances.

Result: clean cutout on transparent checkerboard background. Before/after slider appears, user drags it.

Quick cuts (90 frames each) to three more AI tools:
1. **Upscale**: Side-by-side zoom comparison. "4x" badge in amber.
2. **OCR**: Document image with text regions highlighting in blue, extracted text appearing in a panel on the right.
3. **Face Blur**: Group photo with faces getting pixelated in real-time (one by one, quick).

Text overlay: "All on your hardware." in Nunito 700, 32px, centered at bottom.

### Scene 6 -- Image Editor (frame 1710-2010, 10s)

Navigate to `/editor`. Editor canvas opens with an image loaded.

Quick demo sequence:
- Brush tool selected from left toolbar (highlight animation). Draws a stroke on the canvas.
- Text tool: types "SnapOtter" as a caption overlay, positioned at bottom.
- Crop handles appear, drag inward to adjust framing.
- Filter dropdown opens, "Warm" filter applies (subtle color shift on the image).

Toolbar visible on left (30 tool icons stacked), layers panel on right (3 layers shown). Canvas zoom controls at bottom.

Shows this is a real editor, not just a batch processor.

### Scene 7 -- API Docs (frame 2010-2160, 5s)

AppWindow shows the Scalar API docs interface (simplified). Endpoint list on left, detail on right.

A curl command types out in a terminal overlay:
```
curl -X POST localhost:1349/api/v1/tools/resize \
  -F "file=@photo.jpg" \
  -F "settings={\"width\":800}"
```

JSON response fades in below:
```json
{
  "downloadUrl": "/api/v1/download/abc123",
  "originalSize": 2400000,
  "processedSize": 340000
}
```

Text: "Every tool via REST API." in Nunito 700, 28px.

### Scene 8 -- End Card (frame 2160-2250, 3s)

Clean white background. SnapOtter logo centered (80x80px), fades in with `SPRING.natural`.

"Self-hosted image processing." in Nunito 700, 36px, dark text.

Below: `snapotter.com` in Inter 400, amber. GitHub icon + URL below that.

Fade to white.

---

## Video 3: Promo Teaser

**ID:** `PromoTeaser` (1080x1080) + `PromoTeaserVertical` (1080x1920)
**Duration:** 600 frames (20s @ 30fps)
**Theme:** Dark (`#0c0a09` background, amber gradient energy)
**Audio:** Background music at 50% volume (higher energy), 0.5s fade-in, 1.5s fade-out

Apple keynote energy. Minimal text, dramatic timing, ambient motion. The vertical variant rearranges elements for portrait orientation but uses the same scenes.

### Scene 1 -- Ambient Open (frame 0-90, 3s)

Black screen. Soft amber gradient blobs (`GradientMesh` component) fade in with slow drift. Three blobs:
- Amber (`#f59e0b`), 200px radius, center-left
- Orange (`#f97316`), 150px radius, top-right
- Deep amber (`#d97706`), 180px radius, bottom-center

Each blob: radial gradient, blur 80px, opacity 0.4, `mix-blend-mode: screen`. Lissajous motion paths (very slow, ~0.5 cycle over the full 20s).

Builds anticipation with pure visual atmosphere.

### Scene 2 -- Number Punch (frame 90-240, 5s)

Large numbers slam in one at a time with impact animations. Each number-descriptor pair gets 37 frames (~1.25s):

1. **"49"** (frame 90-127): Number scales from 150% to 100% with `SPRING.settle` (overshoot then snap). Nunito 800, 120px (square) / 96px (vertical), white. Brief hold, then "tools" appears to the right in Inter 500, 36px, amber. Subtle screen shake (translateX/Y oscillates 2px for 3 frames on impact).

2. **"15"** (frame 127-164): Same treatment. "AI models" descriptor.

3. **"55+"** (frame 164-201): Same treatment. "formats" descriptor.

4. **"1"** (frame 201-240): Same treatment. "container" descriptor. This one gets extra emphasis -- the "1" is larger (144px), and the impact shake is stronger (3px, 4 frames).

Between each: quick cut (2-frame black flash for rhythm).

### Scene 3 -- Tagline Cascade (frame 240-390, 5s)

The rotating taglines from the landing page flow vertically through the screen like a waterfall. Each line appears at center, holds briefly, then slides up and fades as the next appears below.

Lines (25 frames each):
1. "No signups."
2. "No uploads."
3. "No limits."
4. "Free forever."
5. "Open source."
6. "Fully offline."

Each line: Inter 500, 40px, white. Appears via clip-mask reveal from below. Exits by sliding up with opacity fade. Lines slightly overlap during transitions (outgoing at 30% opacity while incoming at 100%).

The amber glow from Scene 1 intensifies throughout this scene (blob opacity increases from 0.4 to 0.6).

### Scene 4 -- Logo Reveal (frame 390-510, 4s)

All ambient motion converges to center. Blobs drift inward (positions interpolate toward center of frame over 30 frames).

Amber particles (20-30 tiny circles, 2-4px, amber at varying opacities) swirl inward from edges in a spiral pattern. Uses polar coordinates with decreasing radius:
```
angle = baseAngle + frame * rotationSpeed
radius = maxRadius * (1 - progress)
```

At convergence point (frame 420): soft burst -- particles scatter outward briefly (10 frames), then SnapOtter logo materializes at center. Logo scales from 0 to 1.0 with `SPRING.popIn`.

"SnapOtter" in Nunito 800, 48px, white, appears below via clip-mask reveal at frame 440.

"Your images. Stay yours." in Inter 500, 24px, amber, appears at frame 460.

### Scene 5 -- CTA (frame 510-600, 3s)

"Get it free" in an amber pill button style (matching the landing page CTA). Rounded rectangle, amber gradient background (`#f59e0b` to `#d97706`), white text, Nunito 700, 20px. Appears with `SPRING.popIn`. Subtle pulsing glow (box-shadow oscillates).

`snapotter.com` in JetBrains Mono 400, 16px, white at 70%, below the pill.

GitHub star icon (small, 16px) with star count placeholder next to it.

Clean fade to black over final 30 frames.

### Vertical Variant (1080x1920)

Same 5 scenes, same timing. Layout adjustments:
- Number Punch: numbers stack vertically with more spacing
- Tagline Cascade: lines have more vertical travel distance
- Logo Reveal: logo and text spaced with more vertical padding
- CTA: button and URL stacked with generous spacing
- Gradient blobs: repositioned for portrait aspect ratio

---

## Rendering Pipeline

### `scripts/render-all.mjs`

```ts
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind";
import path from "node:path";
import fs from "node:fs";

const COMPOSITIONS = [
  { id: "XLaunchVideo", slug: "x-launch" },
  { id: "ProductDemo", slug: "product-demo" },
  { id: "PromoTeaser", slug: "promo-teaser-square" },
  { id: "PromoTeaserVertical", slug: "promo-teaser-vertical" },
];

const OUTPUT_DIR = path.resolve("./out");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const bundleLocation = await bundle({
  entryPoint: "./src/index.ts",
  webpackOverride: (config) => enableTailwind(config),
});

for (const comp of COMPOSITIONS) {
  console.log(`Rendering ${comp.id}...`);
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: comp.id,
  });

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    crf: 20,
    pixelFormat: "yuv420p",
    imageFormat: "jpeg",
    concurrency: 4,
    outputLocation: path.join(OUTPUT_DIR, `${comp.slug}.mp4`),
    onProgress: ({ progress }) => {
      if (Math.round(progress * 100) % 25 === 0) {
        process.stdout.write(`  ${Math.round(progress * 100)}%`);
      }
    },
  });

  console.log(` Done.`);
}

console.log(`\nAll ${COMPOSITIONS.length} videos rendered to ${OUTPUT_DIR}`);
```

### Rendering Settings

| Setting | Value |
|---------|-------|
| Codec | H.264 |
| CRF | 20 (higher quality than landing page videos since these are standalone promotional content) |
| Pixel format | yuv420p |
| Image format | jpeg |
| Concurrency | 4 threads |
| FPS | 30 |

### Expected Output Sizes

| Video | Duration | Resolution | Est. Size |
|-------|----------|------------|-----------|
| X Launch | 35s | 1080x1080 | 3-5MB |
| Product Demo | 75s | 1920x1080 | 8-12MB |
| Promo Teaser (square) | 20s | 1080x1080 | 2-3MB |
| Promo Teaser (vertical) | 20s | 1080x1920 | 2-4MB |

### Dev Workflow

```bash
cd apps/videos
npx remotion studio       # Real-time preview with timeline, composition picker
npx remotion render XLaunchVideo out/x-launch.mp4  # Render single video
node scripts/render-all.mjs  # Render all videos
```

---

## Component Reuse Between Landing Page Videos and Promo Videos

The existing `2026-05-08-remotion-landing-videos-design.md` spec defines 10 landing page videos in the same `apps/videos/` workspace. Both specs share the same design system (`colors.ts`, `fonts.ts`, `animations.ts`) and reusable components (`GrainOverlay`, `Terminal`, `AppWindow`, etc.).

The promo videos add these new components not needed by the landing page videos:
- `BeforeAfter.tsx` (scan-line wipe comparison)
- `NumberPunch.tsx` (large impact number animation)
- `RotatingTaglines.tsx` (cycling phrase animation)
- `GitHubCTA.tsx` (star on GitHub end card)
- `FeaturePill.tsx` (feature badge animation)
- `ProgressBar.tsx` (processing progress animation)

All compositions (10 landing + 4 promo) coexist in `Root.tsx` and can be previewed/rendered independently via Remotion Studio.
