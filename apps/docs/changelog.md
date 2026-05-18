---
description: Release notes and version history for SnapOtter. See what's new, improved, and fixed in each release.
---

# Changelog

## v1.17.0

Five new tools, a full image editor, SSO login, 20 languages. Probably should have been three separate releases, but here we are.

### New features

- **Image editor** -- Layers, brushes, shapes, adjustments, filters, curves, keyboard shortcuts. Runs in your browser, processes on your hardware.
- **OIDC / SSO authentication** -- Login with Google, GitHub, Okta, or any OpenID Connect provider. Set a few env vars and your team uses their existing accounts.
- **Meme generator** -- 100 built-in templates with text rendering via opentype.js. Or upload your own image.
- **Beautify** -- Drop a screenshot in, get a polished image out. Device frames (macOS, Windows, browser), shadows, gradients, social media presets.
- **Color blindness simulation** -- Preview how images look with protanopia, deuteranopia, tritanopia, and other color vision deficiencies.
- **PNG transparency fixer** -- Detects fake-transparent PNGs and fixes them with BiRefNet HR-matting. Optional watermark removal via LaMa inpainting.
- **AI canvas expand** -- Extend image boundaries with AI fill. Three quality tiers (fast, balanced, quality) depending on how much GPU time you want to trade.
- **20 languages** -- Arabic, Chinese (Simplified/Traditional), Czech, Dutch, French, German, Hindi, Indonesian, Italian, Japanese, Korean, Polish, Portuguese, Russian, Spanish, Thai, Turkish, Ukrainian, Vietnamese. RTL works for Arabic.
- **URL import** -- Paste URLs into the dropzone or bulk-import from a list. Server-side fetch with SSRF protection.
- **Multi-file eraser** -- Draw erase masks across multiple images, process them all with one click. Strokes persist per-image.
- **Pipeline import/export** -- Save tool chains as JSON, share them with others.
- **17 new camera RAW formats** via exiftool, plus QOI, JP2, EPS, DDS, CUR, DPX, FITS, PPM/PGM/PBM, SVGZ, and APNG input. New output codecs for BMP, ICO, JP2, QOI. AVIF, TIFF, GIF, JXL, and PSD export recovered from a previously lost branch.

### Improvements

- **Image enhancement** -- Replaced the old pipeline with CLAHE + normalise + gamma. New Deep Enhance toggle uses the AI model for more aggressive results.
- **Restore photo** -- Scratch detection rewritten with 8-angle Otsu filtering. LaMa inpainting now runs at native resolution.
- **Exotic formats everywhere** -- OCR, image-to-PDF, favicon generator, composition, stitch, and vectorize all decode HEIC, RAW, PSD now.
- **Compress** -- Target-size tolerance tightened from 5% to 1%. Target size is the default mode. Added stepper buttons and KB/MB unit selector.
- **Sentry cleanup** -- 644 non-actionable events filtered. Real errors now handled properly.
- **GPU detection** -- Better diagnostics for containers where CUDA is present but nvidia-smi is not.
- **Auth-disabled mode** -- Anonymous user is seeded in the DB with admin role. API keys, pipelines, and user files no longer break on FK constraints.
- **2,705+ new tests** across unit, integration, and E2E.

### Bug fixes

- Upscale on CPU no longer times out on NAS boxes and low-power hardware.
- QR code logo no longer makes the preview vanish permanently.
- Crop overflow fixed for tall portrait images.
- TIFF alpha files correctly force PNG output instead of producing corruption.
- HDR/EXR decode converts to 8-bit before CLAHE, fixing decode failures.
- Face landmarks input buffers converted to PNG before the Python sidecar, fixing crashes.
- Find duplicates handles mixed-format batches and network errors.
- Beautify preview updates in real time.
- Progress bars for stitch and vectorize.
- SVGZ handled by SVG-to-raster.
- Non-ASCII filenames fixed via percent-encoded X-File-Results header.

### Upgrade

```bash
docker pull snapotter/snapotter:1.17.0
```

Or with Docker Compose:

```bash
docker compose pull && docker compose up -d
```

[Full diff on GitHub](https://github.com/snapotter-hq/SnapOtter/compare/v1.16.0...v1.17.0)

---

## v1.14.0

Unified Docker image with GPU auto-detection. One image handles both CPU and GPU workloads. Simplified compose to a single file with log rotation. Model pre-downloads now include verification and a smoke test.

---

## v1.13.0

Role-based access control (RBAC). 14 granular permissions, three built-in roles (admin, editor, user), custom role support. Permission checks on all API routes. Frontend tabs filtered by user permissions.

---

## v1.12.0

PDF to Image tool. Convert PDF pages to PNG, JPEG, WebP, or TIFF at custom DPI. Unified Docker image with GPU auto-detection.

---

## v1.11.0

Auto-generated llms.txt via vitepress-plugin-llms for AI-friendly documentation.

---

## v1.10.0

Content-aware resize (seam carving) with face protection. Resize images while preserving important content.

---

## v1.9.0

Stitch / Combine tool. Join images side by side, stacked vertically, or in a custom grid.

---

## v1.8.0

Edit Metadata tool. View and edit EXIF, IPTC, and XMP metadata with a granular strip/keep interface.

---

## Older releases

For the full commit-level changelog including patch releases, see [GitHub Releases](https://github.com/snapotter-hq/snapotter/releases).
