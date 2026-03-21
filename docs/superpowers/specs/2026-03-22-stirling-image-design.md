# Stirling-Image: Product Requirements Document

**Version:** 1.0
**Status:** Finalized
**Date:** 2026-03-22

---

## 1. Executive Summary

Stirling-Image is an open-source, self-hostable image manipulation suite. Inspired by the philosophy and UX of Stirling-PDF, it provides a comprehensive "Swiss Army Knife" for image processing that is 100% private, simple for non-coders, and powerful for power users.

It eliminates the need for ad-heavy, privacy-invasive online image converters (TinyPNG, Remove.bg, Canva) by providing a professional-grade, self-hostable alternative deployable with a single Docker command.

**The one-liner (works on Intel, AMD, and Apple Silicon):**
```bash
docker run -d -p 1349:1349 -v ./data:/data stirlingtools/stirling-image:latest
```

---

## 2. Vision & Philosophy

- **Privacy First:** 100% data sovereignty. All processing happens on the host server. No telemetry, no external API calls. The FBI has warned about malicious online converters - we are the safe alternative.
- **"It Just Works":** Single Docker container. No Redis, no PostgreSQL, no Python runtime required. One command to deploy.
- **Zero Learning Curve:** A non-technical user should complete any task in under 3 clicks. The UI follows the proven Stirling-PDF pattern.
- **"Stirling-PDF but for Images":** This is an unspoken gap in the self-hosted community. Multiple tools have tried (imgcompress, ConvertX, OmniTools) but none has achieved Stirling-PDF's level of polish. We fill that gap.
- **Full Product, Not MVP:** Every feature is built to production quality from day one.

---

## 3. Target Audience

| Audience | Need |
|----------|------|
| **Privacy-Conscious Individuals** | Don't want to upload personal photos to "free" online converters |
| **Content Creators / Social Media Managers** | Batch-resize, watermark, compress 20+ images for multiple platforms |
| **Self-Hosters / Homelabbers** | Want a "Stirling-PDF equivalent" for their media library |
| **Developers** | Need a quick API or UI for web optimization (WebP/AVIF conversion, favicon generation) |
| **Photographers** | Batch processing, EXIF stripping, format conversion, duplicate detection |
| **Small Businesses** | Watermarking, branding, social media asset preparation |

---

## 4. Technology Stack

### 4.1 Finalized Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Vite + React 19 + TypeScript | No SSR needed; faster builds; no Docker memory leaks (Next.js issue #88603) |
| **UI Components** | shadcn/ui + Tailwind CSS 4 | AI models generate excellent code; composable; accessible (Radix primitives) |
| **Backend** | Fastify | 30-40% faster than Express; built-in JSON validation; 30-50MB memory baseline |
| **Image Engine** | Sharp (libvips) + ImageMagick | Sharp: 4-8x faster than ImageMagick, handles 95% of operations. IM: fallback for edge cases |
| **AI/ML** | Python (embedded in same container) | State-of-the-art Python ML ecosystem for maximum reliability. rembg (U2Net/ISNet) for BG removal, Real-ESRGAN for upscaling, LaMa for inpainting, PaddleOCR for text extraction, MediaPipe/RetinaFace for face detection. Node.js calls Python scripts via child_process. Single container — no sidecar needed |
| **Database** | SQLite + Drizzle ORM | Zero config for self-hosters; Drizzle: 7.4KB runtime, faster than Prisma with SQLite |
| **Job Queue** | Worker threads + p-queue | In-process concurrency. No Redis container needed. Configurable concurrency limit |
| **Authentication** | Better-Auth | TypeScript-native; built-in 2FA, rate limiting, password policies; works with SQLite + Drizzle |
| **Monorepo** | Turborepo + pnpm | Efficient builds, shared packages, cache |
| **Deployment** | Docker (single container, multi-arch) | Multi-stage Debian build. Multi-architecture: `linux/amd64` + `linux/arm64` (Intel, AMD, Apple Silicon, ARM servers). No size limits — reliability over size. Includes Node.js, Python, Sharp, ImageMagick, Tesseract, libraw, all AI models |
| **Storage** | Adapter pattern | `STORAGE_MODE=local` (default) or `STORAGE_MODE=s3` (future SaaS) |

### 4.2 Monorepo Structure

```
stirling-image/
├── apps/
│   ├── web/                    # Vite + React SPA
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ui/         # shadcn/ui base components
│   │   │   │   ├── layout/     # Sidebar, Navbar, Dropzone, Footer
│   │   │   │   ├── tools/      # Tool-specific UI (CropSettings, CompressSettings, etc.)
│   │   │   │   └── common/     # BeforeAfterSlider, ImagePreview, FileUpload
│   │   │   ├── pages/          # Route pages (Login, Home, Tool pages, Settings)
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── stores/         # Zustand stores (files, settings, theme)
│   │   │   ├── lib/            # API client, utils, i18n setup
│   │   │   └── styles/         # Tailwind config, global styles
│   │   ├── public/             # Static assets, icons
│   │   └── index.html
│   │
│   └── api/                    # Fastify backend
│       ├── src/
│       │   ├── routes/         # API route handlers (one per tool)
│       │   ├── services/       # Business logic (compress, resize, crop, etc.)
│       │   ├── workers/        # Worker thread scripts for heavy processing
│       │   ├── plugins/        # Fastify plugins (auth, cors, upload, swagger)
│       │   ├── middleware/     # Rate limiting, file validation
│       │   ├── db/             # Drizzle schema, migrations
│       │   └── lib/            # Storage adapter, cleanup cron, utils
│       └── models/             # AI model cache directory (gitignored)
│
├── packages/
│   ├── shared/                 # Shared TypeScript types, constants, i18n keys
│   ├── image-engine/           # Sharp + ImageMagick wrapper library
│   │   ├── src/
│   │   │   ├── operations/     # resize.ts, crop.ts, compress.ts, convert.ts, etc.
│   │   │   ├── formats/        # Format-specific handlers (heic, svg, gif, etc.)
│   │   │   └── utils/          # Metadata, hashing, color extraction
│   │   └── index.ts
│   └── ai/                     # Python ML bridge — TS wrappers calling Python scripts
│       ├── src/
│       │   ├── bridge.ts              # Generic Python child_process executor
│       │   ├── background-removal.ts  # Calls rembg (U2Net/ISNet)
│       │   ├── upscaling.ts           # Calls Real-ESRGAN
│       │   ├── inpainting.ts          # Calls LaMa via lama-cleaner
│       │   ├── ocr.ts                 # Calls PaddleOCR + Tesseract
│       │   ├── face-detection.ts      # Calls MediaPipe / RetinaFace
│       │   └── smart-crop.ts          # Calls MediaPipe saliency
│       ├── python/                    # Python scripts (run in venv inside Docker)
│       │   ├── remove_bg.py
│       │   ├── upscale.py
│       │   ├── inpaint.py
│       │   ├── ocr.py
│       │   ├── detect_faces.py
│       │   └── requirements.txt       # All Python ML dependencies
│       └── index.ts
│
├── docker/
│   ├── Dockerfile              # Multi-stage production build
│   └── docker-compose.yml      # For development
│
├── turbo.json                  # Turborepo config
├── pnpm-workspace.yaml
├── package.json
├── LICENSE                     # MIT (open-core model)
├── README.md
├── CHANGELOG.md
└── PRD.md                      # This document
```

### 4.3 Docker Architecture

**Single container deployment** (like Stirling-PDF):

```yaml
# docker-compose.yml (for users who prefer compose)
services:
  stirling-image:
    image: stirlingtools/stirling-image:latest
    container_name: stirling-image
    ports:
      - "1349:1349"
    environment:
      - AUTH_ENABLED=true
      - DEFAULT_USERNAME=admin
      - DEFAULT_PASSWORD=admin
      - STORAGE_MODE=local
      - FILE_MAX_AGE_HOURS=24
      - CLEANUP_INTERVAL_MINUTES=30
      - MAX_UPLOAD_SIZE_MB=100
      - MAX_BATCH_SIZE=200
      - CONCURRENT_JOBS=3
      # S3 Config (ignored if STORAGE_MODE=local)
      - S3_BUCKET=
      - S3_REGION=
      - S3_ACCESS_KEY=
      - S3_SECRET_KEY=
    volumes:
      - ./data:/data          # SQLite DB + settings
      - ./workspace:/tmp/workspace  # Temporary file processing
    restart: unless-stopped
```

**Dockerfile strategy:**
- Multi-stage build (builder → production)
- Base: `node:22-bookworm` (full Debian, NOT slim/Alpine — maximum compatibility and native lib support)
- Multi-architecture: `docker buildx` with `--platform linux/amd64,linux/arm64` (works on Intel Mac, Apple Silicon, AMD, ARM servers, Raspberry Pi 4+)
- Install ALL dependencies for maximum reliability:
  - **Node.js 22** + pnpm
  - **Python 3.12** + pip + venv (for AI/ML)
  - **Sharp** (compile libvips from source with libheif/libde265/x265 for full HEIC support)
  - **ImageMagick 7** (for edge case format handling)
  - **Tesseract 5** + language packs (for OCR)
  - **libraw** (for camera RAW format support)
  - **libjxl** (for JPEG XL support)
  - **potrace** + **vtracer** (for image vectorization)
- Python ML packages (installed in venv):
  - `rembg[gpu,cpu]` — background removal (U2Net, ISNet models)
  - `realesrgan` — image upscaling (Real-ESRGAN models)
  - `lama-cleaner` — object erasing / inpainting (LaMa model)
  - `paddleocr` — OCR (more accurate than Tesseract alone)
  - `mediapipe` — face detection, landmark detection
  - `onnxruntime` — ONNX model inference backend
- AI models baked into the image for instant availability (no first-use download delay). Reliability over size.
- Production: Fastify serves both API routes and the Vite-built SPA as static files
- **No Docker size limits** — expect 3-5GB image. Reliability and cross-platform support are the priority.

### 4.4 SQLite Configuration

Critical settings applied on every connection:
```sql
PRAGMA journal_mode = WAL;        -- Concurrent reads during writes
PRAGMA busy_timeout = 5000;       -- Retry on contention instead of failing
PRAGMA synchronous = NORMAL;      -- Balance between safety and speed
PRAGMA foreign_keys = ON;         -- Enforce referential integrity
```

Database file stored at `/data/stirling.db` (Docker volume mounted).

---

## 5. Complete Feature Set

### 5.1 Category: Essentials

| # | Tool | Description | Controls |
|---|------|-------------|----------|
| E-01 | **Resize** | Resize by exact pixels, percentage, or social media presets | Width/height inputs, aspect ratio lock, preset dropdown (Instagram, Twitter/X, Facebook, YouTube, LinkedIn, TikTok, WhatsApp), fit mode (contain/cover/fill) |
| E-02 | **Crop** | Freeform crop, aspect ratio presets, shape crop | Drag handle crop area, aspect ratio presets (1:1, 4:3, 16:9, 2:3, 4:5, 9:16), circular crop, rounded corners, custom shape masks |
| E-03 | **Rotate & Flip** | 90-degree rotations, horizontal/vertical flip, arbitrary angle | Rotate left/right buttons, flip H/V buttons, angle slider (0-360), rotation preview |
| E-04 | **Format Convert** | Convert between all supported formats | Source format auto-detected, target format dropdown, format-specific quality options |
| E-05 | **Compress** | Reduce file size by quality % or target file size | Compression method toggle (Quality / File Size), quality slider (1-100), target size input (KB/MB), before/after preview with file size comparison |

### 5.2 Category: Optimization

| # | Tool | Description | Controls |
|---|------|-------------|----------|
| O-01 | **Strip Metadata** | Remove EXIF, GPS, camera info, timestamps | Checkboxes: EXIF, GPS, Camera, ICC Profile, XMP, IPTC. Option to keep specific fields. Preview of metadata before/after |
| O-02 | **Bulk Rename** | Rename multiple files with patterns | Pattern input (e.g., `vacation-{{index}}`), preview of new names, date-based naming from EXIF |
| O-03 | **Image to PDF** | Combine multiple images into a single PDF | Drag to reorder, page size selection (A4, Letter, custom), orientation, margins, images per page |
| O-04 | **Favicon Generator** | Generate all favicon/icon sizes from one image | Auto-generates: favicon.ico (16/32/48), Apple Touch (180), Android Chrome (192/512), manifest.json. Download as zip |

### 5.3 Category: Adjustments

| # | Tool | Description | Controls |
|---|------|-------------|----------|
| A-01 | **Brightness & Contrast** | Adjust brightness, contrast levels | Sliders (-100 to +100), real-time preview, reset button |
| A-02 | **Saturation & Exposure** | Adjust color saturation and exposure | Sliders (-100 to +100), real-time preview |
| A-03 | **Color Channels** | Adjust individual R, G, B channels | Per-channel sliders (0-200%), percentage display |
| A-04 | **Color Effects** | Grayscale, Sepia, Invert, Tint | Effect buttons with intensity sliders where applicable |
| A-05 | **Replace & Invert Color** | Replace specific color with another, full invert | Color picker with eyedropper, tolerance slider, source → target color selection |

### 5.4 Category: AI Tools

All AI tools use **state-of-the-art Python ML models** called from Node.js via child_process. Models are baked into the Docker image for instant reliability — no download-on-first-use delays.

| # | Tool | Description | Model / Engine | Controls |
|---|------|-------------|---------------|----------|
| AI-01 | **Background Removal** | AI-powered subject isolation | **rembg** with U2Net (general) + ISNet (high detail) models. User can select model. | One-click process, output: transparent PNG. Option to replace background with solid color or image. Model selection (U2Net/ISNet). Batch support |
| AI-02 | **Image Upscaling** | AI super-resolution enhancement | **Real-ESRGAN** (x2, x4 models). RealESRGAN_x4plus for photos, RealESRGAN_x4plus_anime for illustrations. | Scale factor (2x, 4x), model type (photo/illustration), before/after slider preview |
| AI-03 | **Object Eraser** | Paint over unwanted elements, AI fills the gap | **LaMa** (Large Mask Inpainting) via lama-cleaner. Production-grade Python library. | Brush tool with adjustable size, paint-to-erase interface, inpainting preview |
| AI-04 | **OCR / Text Extraction** | Extract text from images | **PaddleOCR** (primary, 80+ languages, higher accuracy) + **Tesseract 5** (fallback). | Language selection, engine choice (PaddleOCR/Tesseract), output format (plain text / structured JSON), copy-to-clipboard, download as .txt/.json |
| AI-05 | **Face / PII Blur** | Auto-detect and blur faces, license plates, text | **MediaPipe Face Detection** (Google, real-time capable) + **RetinaFace** (higher accuracy option). | Detection sensitivity slider, blur intensity slider, model choice (fast/accurate), manual region selection for additional blurring |
| AI-06 | **Smart Crop** | AI detects subject and crops optimally | **MediaPipe** object/subject detection for saliency mapping. | Target aspect ratio, subject detection preview, manual adjustment |

### 5.5 Category: Watermark & Overlay

| # | Tool | Description | Controls |
|---|------|-------------|----------|
| W-01 | **Text Watermark** | Add text overlay (semi-transparent, tiled or positioned) | Text input, font selection, size, color picker with eyedropper, opacity slider, position (center/corners/tiled), rotation angle |
| W-02 | **Image Watermark** | Overlay a logo/image as watermark | Upload watermark image, position, opacity, scale, tiled repeat option |
| W-03 | **Text Overlay** | Add styled text directly to images (non-watermark) | Font selection, size, position (drag), color, shadow, outline, background box |
| W-04 | **Image Composition** | Layer one image on top of another | Position control (drag), opacity slider, blend mode, resize overlay |

### 5.6 Category: Utilities

| # | Tool | Description | Controls |
|---|------|-------------|----------|
| U-01 | **Image Info / Inspector** | Show all metadata and image properties | Display: dimensions, DPI, color space, file size, format, bit depth. EXIF data (camera, GPS, date). Color histogram |
| U-02 | **Image Compare** | Side-by-side comparison of two images | Upload two images, side-by-side view, overlay slider (before/after style), difference highlight |
| U-03 | **Find Duplicates** | Detect duplicate/near-duplicate images using **dHash** (difference hash) perceptual hashing for speed + accuracy balance | Batch upload, similarity threshold slider (80-100%), grouped results with side-by-side preview, keep best/keep all/manual select |
| U-04 | **Color Palette Extraction** | Extract dominant colors from image | Number of colors (3-10), display HEX/RGB/HSL values, export as CSS variables, JSON, or Tailwind config |
| U-05 | **QR Code Generator** | Generate QR code images from text/URL | Text/URL input, size, error correction level, foreground/background color, download as PNG/SVG |
| U-06 | **Barcode Reader** | Read QR codes and barcodes from images | Upload image with barcode, auto-detect and display decoded text, copy to clipboard |

### 5.7 Category: Layout & Composition

| # | Tool | Description | Controls |
|---|------|-------------|----------|
| L-01 | **Collage / Grid Maker** | Combine multiple images into a grid | Layout presets (2x2, 3x3, 1x3, 2x1, custom), gap/padding, background color, drag to reorder |
| L-02 | **Image Splitting** | Split one image into a grid of parts | Grid selector (2x2, 3x3, 1x3 for Instagram carousel), preview grid lines, download as zip |
| L-03 | **Border & Frame** | Add borders, rounded corners, shadows | Border width, color picker, corner radius, shadow (offset, blur, color), padding |

### 5.8 Category: Format & Conversion

| # | Tool | Description | Controls |
|---|------|-------------|----------|
| F-01 | **SVG to Raster** | Convert SVG to PNG/JPG at custom resolution | Output resolution (width/height or scale factor), background color (transparent for PNG), output format |
| F-02 | **Image to SVG** | Vectorize raster images using algorithmic tracing (potrace/vtracer, NOT AI/ONNX) | Color mode (B&W / Color), detail level slider, smoothing, preview, download SVG |
| F-03 | **GIF Tools** | Resize/crop/convert animated GIFs preserving animation | All standard operations with animation preservation, frame count display, optimize GIF file size |

### 5.9 Category: Automation

| # | Tool | Description | Controls |
|---|------|-------------|----------|
| P-01 | **Pipeline Builder** | Chain multiple tools into a workflow. **Validated before execution:** tools that output non-image data (OCR→text) cannot be followed by image-processing tools. Validation error shown inline. | Linear stack: Add Step dropdown → configure each step → reorder → process. Save as template |
| P-02 | **Saved Automations** | Save and reuse pipelines | Name, description, list of saved pipelines, suggested templates |
| P-03 | **Batch Processing** | Apply any tool to multiple images at once | Multi-file upload, progress bar per file, download all as zip, parallel processing |

### Suggested Pipeline Templates

| Template | Steps |
|----------|-------|
| **Social Media Ready** | Resize to 1080x1080 → Compress to 200KB → Strip Metadata → Convert to WebP |
| **Privacy Clean** | Strip Metadata → Face Blur → Remove GPS → Compress |
| **Web Optimization** | Resize longest edge to 1920px → Convert to WebP → Compress 80% quality |
| **Profile Picture** | Circular Crop → Resize to 400x400 → Compress |
| **Watermark Batch** | Add Logo Watermark → Strip Metadata → Compress → Convert to JPG |

---

## 6. Supported Formats

### 6.1 Input Formats

| Format | Extension(s) | Notes |
|--------|-------------|-------|
| JPEG | .jpg, .jpeg | Universal |
| PNG | .png | With alpha channel |
| WebP | .webp | Including animated WebP |
| AVIF | .avif | Next-gen format |
| TIFF | .tif, .tiff | Multi-page support |
| BMP | .bmp | Legacy |
| GIF | .gif | Animated GIF support (all frames processed) |
| SVG | .svg | Rasterized on input via Sharp |
| HEIC/HEIF | .heic, .heif | iPhone photos (requires libheif in Docker) |
| JPEG XL | .jxl | Emerging format. **Requires custom libvips build with libjxl** - may be deferred if build complexity is too high |
| ICO | .ico | Favicon input |
| RAW | .cr2, .nef, .arw, .dng, .orf, .rw2 | Camera RAW. **Requires libraw** as explicit Docker dependency. Pre-processing step converts RAW → TIFF before Sharp processing |

### 6.2 Output Formats

| Format | Extension | Default Quality | Notes |
|--------|----------|----------------|-------|
| JPEG | .jpg | 80% | Default output format |
| PNG | .png | Lossless | With optional compression level |
| WebP | .webp | 80% | Recommended for web |
| AVIF | .avif | 50 | Best compression ratio |
| TIFF | .tif | Lossless | Professional use |
| GIF | .gif | N/A | Animated output supported |
| JPEG XL | .jxl | 75 | Next-gen. Requires custom libvips build |
| SVG | .svg | N/A | Only via vectorization tool |
| ICO | .ico | N/A | Only via favicon generator |
| PDF | .pdf | N/A | Only via Image-to-PDF tool |

---

## 7. UI/UX Architecture

### 7.1 Design Philosophy

Replicate the Stirling-PDF UX pattern exactly:
- **Atomic tools:** Each tool does one job. One click = one task done.
- **3-click rule:** No more than 3 clicks from homepage to downloaded result.
- **Consistent layout:** Every tool page looks the same (upload → configure → process → download).
- **Visual feedback:** Before/after slider for relevant tools. Progress bars for batch operations.

### 7.2 Layout Components

**Reverse-engineered from Stirling-PDF V2:**

```
┌──────────────────────────────────────────────────────────────┐
│ [Icon]  Search tools...                    [Theme] [Lang] [↓]│
│ Tool                                                         │
│ Name   ┌─────────────────┬──────────────────────────────────┐│
│        │                 │                                  ││
│ [Grid] │  Files  ▼       │                                  ││
│ Tools  │  ⬆ Upload       │     ┌──────────────────────┐     ││
│        │                 │     │                      │     ││
│ [📖]   │  Settings ▼     │     │   Stirling Image     │     ││
│ Reader │                 │     │                      │     ││
│        │  [Tool-specific │     │  ⬆ Upload from       │     ││
│ [🔄]   │   controls:     │     │    computer          │     ││
│ Auto-  │   sliders,      │     │                      │     ││
│ mate   │   toggles,      │     │  Drop files here     │     ││
│        │   dropdowns]    │     │  or click upload     │     ││
│ [📁]   │                 │     │  or paste from       │     ││
│ Files  │                 │     │  clipboard           │     ││
│        │─────────────────│     │  or paste URL        │     ││
│        │                 │     └──────────────────────┘     ││
│        │  [Process]      │                                  ││
│ ────── │                 │                                  ││
│ [❓]   │                 │                                  ││
│ Help   │                 │  Survey · Privacy · Terms        ││
│ [⚙️]   └─────────────────┴──────────────────────────────────┘│
│Settings                                                      │
└──────────────────────────────────────────────────────────────┘
```

### 7.3 Page Types

**A. Login Page**
- Split layout: Login form (left) + marketing carousel (right)
- Username/password fields
- Default: admin / admin → forced password change on first login
- Clean, minimal design matching Stirling-PDF

**B. Home Page (Tool Grid)**
- Two view modes: **Sidebar** (default, recommended) and **Fullscreen grid**
- Sidebar mode: Categorized tool list (left panel) + dropzone (right)
- Fullscreen mode: Card grid with category headers and tool counts
- Global search bar ("Search tools...")
- Favourites per tool (star icon)
- "Show Details" toggle in fullscreen mode

**C. Tool Page (consistent pattern for ALL tools)**
1. Tool icon + name at top of sidebar
2. **Files section** (collapsible): Upload button + file list
3. **Settings section** (collapsible): Tool-specific controls
4. **Process button** at bottom (disabled until file uploaded)
5. Main area: Dropzone → Preview → Result with download

**D. Automate Page**
- Saved automations list
- "Create New Automation" button
- Suggested templates
- Linear pipeline builder

**E. Settings Page (Modal Dialog)**
- See Section 9 for full specification

### 7.4 Input Methods

Every tool supports all of these:
1. **Drag and Drop** - onto the dropzone area
2. **File picker** - "Upload from computer" button
3. **Clipboard paste** - Ctrl/Cmd+V a screenshot or copied image
4. **URL input** - paste an image URL to fetch (with SSRF protections: HTTPS only, blocked private/localhost IPs, 100MB max fetch size, 30s timeout)
5. **Multi-file upload** - for batch-capable tools

**Exceptions to standard tool page layout:**
- **QR Code Generator** (U-05) does not accept image upload - it generates images from text input. Uses a text input field instead of a dropzone.

### 7.5 Before/After Preview

For tools where visual comparison matters (compress, color adjustments, filters, upscaling):
- Split-screen slider that user can drag left/right
- Original on left, processed on right
- File size comparison displayed (e.g., "4.2MB → 890KB (79% reduction)")
- Real-time preview where performance allows

### 7.6 Responsive Design

- **Desktop (1024px+):** Full sidebar + tool panel + workspace (as designed)
- **Tablet (768-1023px):** Collapsible sidebar, tool panel stacks above workspace
- **Mobile (< 768px):** Bottom navigation bar, full-screen tool panel, swipe between upload/settings/result

### 7.7 Theme System

- **Light mode** (default): Clean whites, soft blues (matching Stirling-PDF light theme)
- **Dark mode:** Dark grays/navy, high contrast controls
- Theme toggle in bottom-right corner
- CSS variables for easy custom theming via admin settings
- Respects system preference on first visit

---

## 8. Social Media Resize Presets

| Platform | Preset Name | Dimensions |
|----------|------------|------------|
| **Instagram** | Post (Square) | 1080 x 1080 |
| **Instagram** | Story / Reel | 1080 x 1920 |
| **Instagram** | Profile Picture | 320 x 320 |
| **Instagram** | Landscape Post | 1080 x 566 |
| **Instagram** | Portrait Post | 1080 x 1350 |
| **Twitter/X** | Post Image | 1200 x 675 |
| **Twitter/X** | Header | 1500 x 500 |
| **Twitter/X** | Profile Picture | 400 x 400 |
| **Facebook** | Post Image | 1200 x 630 |
| **Facebook** | Cover Photo | 820 x 312 |
| **Facebook** | Profile Picture | 170 x 170 |
| **Facebook** | Event Cover | 1920 x 1005 |
| **YouTube** | Thumbnail | 1280 x 720 |
| **YouTube** | Channel Banner | 2560 x 1440 |
| **YouTube** | Profile Picture | 800 x 800 |
| **LinkedIn** | Post Image | 1200 x 627 |
| **LinkedIn** | Banner | 1584 x 396 |
| **LinkedIn** | Profile Picture | 400 x 400 |
| **TikTok** | Video Cover | 1080 x 1920 |
| **TikTok** | Profile Picture | 200 x 200 |
| **WhatsApp** | Profile Picture | 500 x 500 |
| **Pinterest** | Pin | 1000 x 1500 |
| **Threads** | Post Image | 1080 x 1080 |

---

## 9. Settings / Admin Panel

### 9.1 Settings Structure

Modeled after Stirling-PDF's 17-section settings dialog:

**PREFERENCES**

| Section | Settings |
|---------|----------|
| **General** | User info + logout, software update check (**opt-in only** — disabled by default to respect "no external API calls" philosophy; checks GitHub releases when enabled), default tool picker mode (sidebar/fullscreen), auto-unzip settings, hide unavailable tools toggle |
| **Keyboard Shortcuts** | Per-tool customizable keyboard shortcuts. Defaults: Cmd/Ctrl+Alt+1 through Cmd/Ctrl+Alt+8 for top tools. Search bar to find tools |

**WORKSPACE**

| Section | Settings |
|---------|----------|
| **People** | User management (admin panel). User count display. Add/edit/delete users. Role assignment (Admin/User) |

**DEVELOPER**

| Section | Settings |
|---------|----------|
| **API Keys** | Public API key display, copy, refresh. Documentation links |

**CONFIGURATION**

| Section | Settings |
|---------|----------|
| **System Settings** | App name (text input), logo upload (custom branding), available languages, default locale, file upload limit (default 100MB), custom HTML |
| **Features** | Feature flags: enable/disable specific tools or tool categories |
| **Endpoints** | Enable/disable specific API endpoints |
| **Advanced** | Feature flags (alpha features), max DPI, temp file management (base directory, max age hours, cleanup interval minutes, startup cleanup toggle), process concurrency limits |

**SECURITY & AUTHENTICATION**

| Section | Settings |
|---------|----------|
| **Security** | Enable login toggle, login attempt limit, login reset time, CSRF protection, JWT configuration (key persistence, rotation, cleanup, retention days, secure cookie) |

**LICENSING & ANALYTICS**

| Section | Settings |
|---------|----------|
| **Plan** | Current plan display, upgrade options (for future SaaS) |
| **Usage Analytics** | Endpoint usage tracking, visit counts, data type filter (API/UI/All), chart visualization |

**POLICIES & PRIVACY**

| Section | Settings |
|---------|----------|
| **Legal** | Terms and Conditions URL, Privacy Policy URL, Accessibility Statement URL |
| **Privacy** | Enable analytics toggle, enable metrics toggle, search engine visibility toggle |

---

## 10. Authentication & Security

### 10.1 Authentication Flow

1. **First Launch:** App starts with default credentials `admin` / `admin`
2. **Forced Password Change:** On first login, user must set a new password
3. **Login Page:** Split layout (form left, branding right) matching Stirling-PDF
4. **Session:** JWT-based with configurable expiry
5. **Auth Bypass:** `AUTH_ENABLED=false` env var for users behind reverse proxies (Authelia, Cloudflare Access, etc.)

### 10.2 Security Features

- Login attempt rate limiting (default: 5 attempts, 15-minute lockout)
- CSRF protection (enabled by default)
- JWT key rotation
- Secure cookie option
- Password strength requirements (configurable)
- No external auth dependencies (no SSO for V1 - purely local)

### 10.3 User Management

- Single admin model (V1)
- Admin can create additional users with User role
- Users can use tools but cannot access settings
- Future: Teams, roles, permissions (for commercial version)

---

## 11. API Specification

### 11.1 API Design

- RESTful API with Swagger/OpenAPI documentation
- Every tool has a corresponding API endpoint
- API key authentication (generated in Settings)
- All endpoints under `/api/v1/`
- Auto-generated Swagger UI at `/api/docs`
- Per-IP rate limiting applies regardless of auth state (default: 100 req/min per IP)
- Max image dimensions enforced: `MAX_MEGAPIXELS=100` (configurable, prevents OOM on decompression bombs)

### 11.2 API Error Response Schema

All errors return a consistent JSON envelope:

```json
{
  "error": "Human-readable error message",
  "code": "UNSUPPORTED_FORMAT",
  "details": { "format": "psd", "supported": ["jpg", "png", "webp"] }
}
```

| HTTP Status | Code | Meaning |
|-------------|------|---------|
| 400 | `INVALID_INPUT` | Bad request (missing file, invalid params) |
| 400 | `UNSUPPORTED_FORMAT` | File format not supported |
| 400 | `FILE_TOO_LARGE` | Exceeds MAX_UPLOAD_SIZE_MB |
| 400 | `IMAGE_TOO_LARGE` | Exceeds MAX_MEGAPIXELS |
| 400 | `INVALID_PIPELINE` | Pipeline validation failed (incompatible tool chain) |
| 401 | `UNAUTHORIZED` | Missing or invalid API key / session |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `PROCESSING_ERROR` | Image processing failed |
| 503 | `QUEUE_FULL` | Job queue at capacity, retry later |

### 11.3 API Patterns

**Single file processing:**
```
POST /api/v1/tools/compress
Content-Type: multipart/form-data

Body: file + settings (quality, targetSize, etc.)
Response: processed file download
```

**Batch processing:**
```
POST /api/v1/tools/compress/batch
Content-Type: multipart/form-data

Body: multiple files + settings
Response: zip file download
```

**Pipeline execution:**
```
POST /api/v1/pipeline/execute
Content-Type: multipart/form-data

Body: file + pipeline definition (JSON array of steps)
Response: processed file download
```

### 11.3 API Endpoints (complete list)

| Method | Endpoint | Tool |
|--------|----------|------|
| POST | `/api/v1/tools/resize` | Resize |
| POST | `/api/v1/tools/crop` | Crop |
| POST | `/api/v1/tools/rotate` | Rotate & Flip |
| POST | `/api/v1/tools/convert` | Format Convert |
| POST | `/api/v1/tools/compress` | Compress |
| POST | `/api/v1/tools/strip-metadata` | Strip Metadata |
| POST | `/api/v1/tools/rename` | Bulk Rename (accepts multiple files, returns zip with renamed files using pattern) |
| POST | `/api/v1/tools/image-to-pdf` | Image to PDF |
| POST | `/api/v1/tools/favicon` | Favicon Generator |
| POST | `/api/v1/tools/brightness-contrast` | Brightness & Contrast |
| POST | `/api/v1/tools/saturation` | Saturation & Exposure |
| POST | `/api/v1/tools/color-channels` | Color Channels |
| POST | `/api/v1/tools/color-effects` | Color Effects |
| POST | `/api/v1/tools/replace-color` | Replace & Invert Color |
| POST | `/api/v1/tools/remove-background` | Background Removal |
| POST | `/api/v1/tools/upscale` | Image Upscaling |
| POST | `/api/v1/tools/erase-object` | Object Eraser |
| POST | `/api/v1/tools/ocr` | OCR / Text Extraction |
| POST | `/api/v1/tools/blur-faces` | Face / PII Blur |
| POST | `/api/v1/tools/smart-crop` | Smart Crop |
| POST | `/api/v1/tools/watermark-text` | Text Watermark |
| POST | `/api/v1/tools/watermark-image` | Image Watermark |
| POST | `/api/v1/tools/text-overlay` | Text Overlay |
| POST | `/api/v1/tools/compose` | Image Composition |
| POST | `/api/v1/tools/info` | Image Info |
| POST | `/api/v1/tools/compare` | Image Compare (accepts 2 files, returns JSON: { similarity: number, diffImage: base64 }) |
| POST | `/api/v1/tools/find-duplicates` | Find Duplicates |
| POST | `/api/v1/tools/color-palette` | Color Palette |
| POST | `/api/v1/tools/qr-generate` | QR Code Generator |
| POST | `/api/v1/tools/barcode-read` | Barcode Reader |
| POST | `/api/v1/tools/collage` | Collage / Grid |
| POST | `/api/v1/tools/split` | Image Splitting |
| POST | `/api/v1/tools/border` | Border & Frame |
| POST | `/api/v1/tools/svg-to-raster` | SVG to Raster |
| POST | `/api/v1/tools/vectorize` | Image to SVG |
| POST | `/api/v1/tools/gif` | GIF Tools |
| POST | `/api/v1/pipeline/execute` | Pipeline Execution |
| POST | `/api/v1/pipeline/save` | Save Pipeline |
| GET | `/api/v1/pipeline/list` | List Pipelines |
| GET | `/api/v1/config/formats` | Supported Formats |
| GET | `/api/v1/config/presets` | Social Media Presets |
| GET | `/api/v1/health` | Health Check |

---

## 12. Internationalization (i18n)

### 12.1 Architecture

- All user-facing strings stored in JSON translation files
- Key-based system: `tools.compress.title`, `tools.compress.description`, etc.
- Language files in `packages/shared/src/i18n/locales/`
- Frontend uses a lightweight i18n library (e.g., i18next)
- Language selector in bottom-right corner (matching Stirling-PDF)
- Default: English (`en`)
- Locale stored in user preferences (cookie/localStorage)

### 12.2 Initial Language

- English only for initial release
- Architecture supports adding any language by dropping a JSON file
- Community contributions welcome for translations

---

## 13. File Management & Cleanup

### 13.1 Temporary File Lifecycle

1. User uploads image → stored in `/tmp/workspace/{sessionId}/`
2. Processing creates output in `/tmp/workspace/{sessionId}/output/`
3. User downloads result
4. Background cron cleans up files older than configured max age

### 13.2 Cleanup Configuration

| Setting | Default | Env Var |
|---------|---------|---------|
| Max file age | 24 hours | `FILE_MAX_AGE_HOURS` |
| Cleanup interval | 30 minutes | `CLEANUP_INTERVAL_MINUTES` |
| Startup cleanup | Enabled | `CLEANUP_ON_STARTUP` |
| Max upload size | 100 MB per file | `MAX_UPLOAD_SIZE_MB` |
| Max batch size | 200 files | `MAX_BATCH_SIZE` |
| Concurrent processing jobs | 3 | `CONCURRENT_JOBS` |

### 13.3 Storage Adapter

```typescript
interface StorageAdapter {
  upload(file: Readable, path: string): Promise<string>;    // Streams, NOT Buffer (prevents OOM on large files)
  download(path: string): Promise<Readable>;                 // Returns stream
  delete(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  listFiles(directory: string): Promise<string[]>;
}

// Implementations:
// - LocalStorageAdapter (default) - uses filesystem
// - S3StorageAdapter - uses AWS S3 / Cloudflare R2 (future)
```

**Why streams:** A 100MB upload with 200-file batch would require 20GB of memory with Buffer-based I/O. Streams keep memory usage constant regardless of file size.

---

## 14. Keyboard Shortcuts

### 14.1 Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Focus search bar |
| `Ctrl/Cmd + /` | Toggle sidebar |
| `Ctrl/Cmd + Shift + D` | Toggle dark/light mode |
| `Ctrl/Cmd + Shift + F` | Toggle fullscreen/sidebar tool view |
| `Escape` | Close modal / cancel current operation |

### 14.2 Tool Shortcuts

| Shortcut | Tool |
|----------|------|
| `Ctrl/Cmd + Alt + 1` | Resize |
| `Ctrl/Cmd + Alt + 2` | Crop |
| `Ctrl/Cmd + Alt + 3` | Compress |
| `Ctrl/Cmd + Alt + 4` | Convert |
| `Ctrl/Cmd + Alt + 5` | Remove Background |
| `Ctrl/Cmd + Alt + 6` | Watermark |
| `Ctrl/Cmd + Alt + 7` | Strip Metadata |
| `Ctrl/Cmd + Alt + 8` | Image Info |

### 14.3 Workspace Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + V` | Paste image from clipboard |
| `Ctrl/Cmd + Enter` | Process / Execute current tool |
| `Ctrl/Cmd + S` | Download result |
| `Ctrl/Cmd + Z` | Undo last operation (where applicable) |

All shortcuts customizable via Settings > Keyboard Shortcuts.

---

## 15. Concurrency & Processing

### 15.1 Job Processing Architecture

```
User Upload
    ↓
[Fastify Route Handler]
    ↓
[Validate file type/size]
    ↓
[Add to p-queue (concurrency limited)]
    ↓
[Worker Thread]
    ↓
[Sharp / ImageMagick / ONNX Runtime]
    ↓
[Store result in temp directory]
    ↓
[Return download URL to frontend]
```

### 15.2 Concurrency Controls

- `CONCURRENT_JOBS` env var (default: 3) - max simultaneous image processing jobs
- Additional jobs wait in queue (FIFO)
- Frontend shows queue position for waiting jobs
- Timeout: 5 minutes per job (configurable)

### 15.3 Progress Reporting (Server-Sent Events)

Uses **SSE** (not WebSocket) for simplicity - works with HTTP/1.1, no connection upgrade needed, simpler CORS.

```
GET /api/v1/jobs/{jobId}/progress
Accept: text/event-stream

Events:
data: { "jobId": "abc123", "status": "processing", "progress": 45, "currentFile": "photo_3.jpg", "totalFiles": 10 }
data: { "jobId": "abc123", "status": "completed", "progress": 100, "downloadUrl": "/api/v1/jobs/abc123/download" }
data: { "jobId": "abc123", "status": "failed", "error": "Unsupported format", "failedFile": "photo_7.psd" }
```

### 15.4 SQLite Write Concurrency

All database writes go through a **single shared connection** (not a pool) to avoid SQLite write contention:
- Worker threads communicate job status to the main thread via `parentPort.postMessage()`
- Main thread handles all DB writes sequentially
- Reads can use separate connections (WAL mode allows concurrent reads)
- Uses `better-sqlite3` (synchronous, faster than async alternatives for SQLite)

### 15.5 CORS & Static File Serving

**Production:** Fastify serves both the API (`/api/v1/*`) and the Vite-built SPA (static files from `apps/web/dist/`). No CORS needed — same origin.

**Development:** Vite dev server (port 5173) proxies API calls to Fastify (port 1349). Vite config includes proxy rule:
```typescript
// apps/web/vite.config.ts
server: {
  proxy: { '/api': 'http://localhost:1349' }
}
```

### 15.3 Batch Processing

- Files processed in parallel up to `CONCURRENT_JOBS` limit
- Per-file progress tracking
- Partial failure handling (continue on error, report failed files)
- Results collected and zipped server-side
- Download as single ZIP file

---

## 16. Deployment & Configuration

### 16.1 Environment Variables (complete)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `1349` | Application port |
| `AUTH_ENABLED` | `true` | Enable/disable authentication |
| `DEFAULT_USERNAME` | `admin` | Initial admin username |
| `DEFAULT_PASSWORD` | `admin` | Initial admin password |
| `STORAGE_MODE` | `local` | Storage backend (local / s3) |
| `FILE_MAX_AGE_HOURS` | `24` | Max age before cleanup |
| `CLEANUP_INTERVAL_MINUTES` | `30` | Cleanup cron interval |
| `CLEANUP_ON_STARTUP` | `true` | Clean temp files on boot |
| `MAX_UPLOAD_SIZE_MB` | `100` | Max single file upload |
| `MAX_BATCH_SIZE` | `200` | Max files per batch |
| `CONCURRENT_JOBS` | `3` | Parallel processing limit |
| `DB_PATH` | `/data/stirling.db` | SQLite database path |
| `PYTHON_VENV_PATH` | `/opt/venv` | Python virtual environment path |
| `WORKSPACE_PATH` | `/tmp/workspace` | Temp processing directory |
| `APP_NAME` | `Stirling Image` | Custom branding name |
| `APP_LOGO` | (default) | Custom logo path |
| `DEFAULT_THEME` | `light` | Default theme (light/dark) |
| `DEFAULT_LOCALE` | `en` | Default language |
| `S3_BUCKET` | - | S3 bucket name |
| `S3_REGION` | - | S3 region |
| `S3_ACCESS_KEY` | - | S3 access key |
| `S3_SECRET_KEY` | - | S3 secret key |
| `S3_ENDPOINT` | - | S3-compatible endpoint (for R2, MinIO) |
| `MAX_MEGAPIXELS` | `100` | Max image dimensions (prevents OOM) |
| `RATE_LIMIT_PER_MIN` | `100` | Per-IP rate limit (applies even with AUTH_ENABLED=false) |
| `LOGIN_LOCKOUT_MINUTES` | `15` | Lockout duration after failed login attempts |

### 16.2 Docker Volumes

| Volume | Container Path | Purpose |
|--------|---------------|---------|
| `data` | `/data` | SQLite database, settings, user data |
| `workspace` | `/tmp/workspace` | Temporary file processing (auto-cleaned) |

### 16.3 Health Check

```
GET /api/v1/health

Response:
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": "2d 5h 30m",
  "storage": { "mode": "local", "available": "45.2 GB" },
  "queue": { "active": 1, "pending": 3 },
  "ai": { "python": "available", "rembg": "ready", "realesrgan": "ready", "lama": "ready", "paddleocr": "ready", "mediapipe": "ready" }
}
```

---

## 17. Open-Source & Licensing Strategy

### 17.1 Licensing Model

Following Stirling-PDF's open-core approach:

- **Core (MIT License):** All image tools, UI, API, authentication, settings
- **Commercial/Proprietary (future):** Enterprise SSO, team management, usage analytics, custom metadata, priority support

### 17.2 Repository Standards

- Public GitHub repository
- Strict `.gitignore` (no secrets, no node_modules, no AI models)
- ESLint + Prettier for consistent code style
- GitHub Issue Templates (bug report, feature request)
- GitHub Actions CI/CD (lint, test, build, Docker publish)
- `CHANGELOG.md` with semantic versioning
- `CONTRIBUTING.md` for community contributors

### 17.3 README Strategy

The README must prove ease-of-use in 5 seconds:
1. **Hero section:** One-line description + badges (stars, Docker pulls, license)
2. **Quick Start:** Single `docker run` command
3. **Screenshot/GIF:** Tool grid in action
4. **Feature grid:** Visual icons for each tool category
5. **Configuration table:** Key env vars
6. **Comparison:** "Replaces 20+ online tools" with visual table

---

## 18. Development Roadmap

### Phase 1: Foundation (Weeks 1-3)
- Monorepo setup (Turborepo + pnpm)
- Fastify server with auth (Better-Auth + SQLite)
- React SPA with routing, layout, theme system
- Dropzone + file upload + file management
- Settings dialog (basic sections)
- Docker setup (multi-stage build)
- CI/CD pipeline

### Phase 2: Core Tools (Weeks 4-7)
- Image engine package (Sharp wrapper)
- Resize, Crop, Rotate & Flip
- Format Convert (all formats including HEIC)
- Compress (quality + target size)
- Strip Metadata
- Color adjustments (brightness, contrast, saturation, channels)
- Before/After preview slider
- Batch processing + ZIP download
- API + Swagger documentation

### Phase 3: Advanced Tools (Weeks 8-11)
- Watermark (text + image)
- Text Overlay
- Image Composition
- Border & Frame
- Collage / Grid Maker
- Image Splitting
- Bulk Rename
- Image to PDF
- SVG to Raster
- GIF Tools (animated support)
- Image Info / Inspector
- Color Palette Extraction
- QR Code Generator + Barcode Reader
- Favicon Generator
- Image-to-SVG Vectorization (algorithmic tracing, not AI)

### Phase 4: AI Tools (Weeks 12-15)
- ONNX Runtime integration
- Background Removal
- Image Upscaling (2x, 4x) - Real-ESRGAN Python
- OCR / Text Extraction
- Face / PII Blur
- Smart Crop
- Object Eraser (LaMa via lama-cleaner — production Python library)
- Find Duplicates (dHash perceptual hashing)
- Image Compare (side-by-side + slider)

### Phase 5: Automation & Polish (Weeks 16-18)
- Pipeline Builder
- Saved Automations + Templates
- Keyboard shortcuts (customizable)
- Full settings panel (all sections)
- Usage analytics
- i18n architecture
- Mobile responsive polish
- README + documentation
- Docker Hub / GHCR publishing
- Public launch

---

## 19. Success Metrics

| Metric | Target |
|--------|--------|
| Docker Run → First Tool Used | Under 60 seconds |
| Click-to-Result (any tool) | Under 3 clicks |
| Cross-Platform | Works on linux/amd64 + linux/arm64 (Intel, AMD, Apple Silicon) |
| Batch Processing (100 images resize) | Under 30 seconds |
| GitHub Stars (6 months) | 500+ |
| Zero external data transmission | 0 bytes to third parties |

---

## Appendix A: Stirling-PDF Feature Mapping

How Stirling-PDF's tool categories map to Stirling-Image:

| Stirling-PDF | Stirling-Image Equivalent |
|-------------|--------------------------|
| Merge | Collage / Grid Maker |
| Compare | Image Compare |
| Compress | Compress |
| Convert | Format Convert |
| OCR | OCR / Text Extraction |
| Redact | Face / PII Blur |
| Sign | Text Overlay / Watermark |
| Add Password | N/A (images don't have passwords) |
| Add Watermark | Text/Image Watermark |
| Crop PDF | Crop |
| Rotate | Rotate & Flip |
| Split | Image Splitting |
| Extract Images | N/A (we ARE the image tool) |
| Remove Pages | N/A |
| Change Metadata | Strip Metadata / Image Info |
| Adjust Colours | Brightness/Contrast/Saturation/Color Channels |
| Automate | Pipeline Builder |
| PDF Multi Tool | Batch Processing |

---

*Document generated 2026-03-22. This PRD serves as the definitive blueprint for building Stirling-Image.*
