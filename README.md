<p align="center">
  <h1 align="center">Stirling Image</h1>
  <p align="center">The Open-Source Image Processing Platform</p>
</p>

<p align="center">
  <a href="https://github.com/siddharthksah/Stirling-Image/pkgs/container/stirling-image"><img src="https://img.shields.io/badge/Docker-ghcr.io-blue?logo=docker" alt="Docker"></a>
  <a href="https://github.com/siddharthksah/Stirling-Image/actions"><img src="https://img.shields.io/github/actions/workflow/status/siddharthksah/Stirling-Image/ci.yml?label=CI" alt="CI"></a>
  <a href="https://github.com/siddharthksah/Stirling-Image/blob/main/LICENSE"><img src="https://img.shields.io/github/license/siddharthksah/Stirling-Image" alt="License"></a>
  <a href="https://github.com/siddharthksah/Stirling-Image/stargazers"><img src="https://img.shields.io/github/stars/siddharthksah/Stirling-Image?style=social" alt="Stars"></a>
</p>

---

A self-hosted, privacy-first image processing suite with 37+ tools. Resize, compress, convert, watermark, remove backgrounds, and more — all from a single Docker container. No data ever leaves your server.

Inspired by [Stirling-PDF](https://github.com/Stirling-Tools/Stirling-PDF), built for images.

<!-- TODO: Add screenshot here -->
<!-- ![Dashboard](docs/screenshot-dashboard.png) -->

## Quick Start

```bash
docker run -d -p 1349:1349 -v ./data:/data ghcr.io/siddharthksah/stirling-image:latest
```

Then open [http://localhost:1349](http://localhost:1349).

## Key Capabilities

- **37+ image tools** — Resize, crop, rotate, compress, convert, watermark, color adjustments, and more in one place.

- **AI-powered processing** — Background removal (rembg), image upscaling (Real-ESRGAN), OCR text extraction, face/PII auto-blurring, and smart cropping — all running locally.

- **Privacy first** — Every operation runs on your hardware. No files are sent to external servers. No telemetry, no tracking, no cloud dependencies.

- **Batch processing** — Drop 200 images, apply any tool, download results as a ZIP. Concurrent processing with configurable limits.

- **Automation pipelines** — Chain tools into reusable workflows (e.g., Resize, Compress, Convert to WebP, Strip Metadata). Save and reuse pipelines.

- **Full API** — Every tool is available via REST API with Swagger documentation at `/api/docs`. Automate image processing from scripts, CI/CD, or other tools.

- **Self-hosted & portable** — Single Docker container. Works on Intel, AMD, and Apple Silicon (multi-arch: `linux/amd64` + `linux/arm64`).

## Tools

| Category | Tools |
|----------|-------|
| **Essentials** | Resize, Crop, Rotate & Flip, Convert, Compress |
| **Optimization** | Strip Metadata, Bulk Rename, Image to PDF, Favicon Generator |
| **Adjustments** | Brightness/Contrast, Saturation, Color Channels, Color Effects, Replace Color |
| **AI Tools** | Background Removal, Upscaling, Object Eraser, OCR, Face Blur, Smart Crop |
| **Watermark** | Text Watermark, Image Watermark, Text Overlay, Image Composition |
| **Utilities** | Image Info, Compare, Find Duplicates, Color Palette, QR Generator, Barcode Reader |
| **Layout** | Collage/Grid, Image Splitting, Border & Frame |
| **Format** | SVG to Raster, Image to SVG, GIF Tools |
| **Automation** | Pipeline Builder, Batch Processing |

## Supported Formats

**Input:** JPG, PNG, WebP, AVIF, TIFF, BMP, GIF (animated), SVG, HEIC/HEIF, JPEG XL, ICO, RAW (CR2, NEF, ARW, DNG)

**Output:** JPG, PNG, WebP, AVIF, TIFF, GIF, JPEG XL, SVG, ICO, PDF

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `1349` | Application port |
| `AUTH_ENABLED` | `true` | Enable login (default credentials: `admin` / `admin`) |
| `MAX_UPLOAD_SIZE_MB` | `100` | Maximum file upload size |
| `MAX_BATCH_SIZE` | `200` | Maximum files per batch |
| `CONCURRENT_JOBS` | `3` | Parallel processing limit |
| `FILE_MAX_AGE_HOURS` | `24` | Auto-cleanup temp files after this duration |
| `STORAGE_MODE` | `local` | Storage backend (`local` or `s3`) |

See [`.env.example`](.env.example) for the full list.

## Docker Compose

```yaml
services:
  stirling-image:
    image: ghcr.io/siddharthksah/stirling-image:latest
    container_name: stirling-image
    ports:
      - "1349:1349"
    volumes:
      - stirling-data:/data
    restart: unless-stopped

volumes:
  stirling-data:
```

## Development

```bash
git clone https://github.com/siddharthksah/Stirling-Image.git
cd Stirling-Image
pnpm install
pnpm dev
# UI: http://localhost:1349
```

Requires Node.js 22+ and pnpm 9+.

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS 4, shadcn/ui
- **Backend:** Fastify, Sharp (libvips), Drizzle ORM, SQLite
- **AI/ML:** Python (rembg, Real-ESRGAN, PaddleOCR, MediaPipe)
- **Infrastructure:** Turborepo monorepo, Docker multi-arch

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE)
