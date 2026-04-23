# Ashim QA Release Report

**Date:** 2026-04-23
**Version:** 1.15.9
**Commit:** 136a4dd (main) + local fixes (uncommitted)
**Nodes Tested:** 3 (Mac orchestrator, WSL GPU RTX 4070, Ubuntu CPU)
**Total Execution Time:** ~4 hours (including AI bundle installations)

## Executive Summary
- Total tests executed: **~280**
- Passed: **~270**
- Failed: **7** (3 known platform limitations, 1 caire bug, 3 CPU-only AI limitations)
- Fixed during testing: **2 bugs**
- Cross-platform parity: **Confirmed** (identical non-AI results on both nodes)

## Bugs Found & Fixed

| # | Severity | Category | Description | Status |
|---|----------|----------|-------------|--------|
| 1 | **Critical** | Auth | `MAX_USERS=0` blocks all user registration. The guard `if (MAX_USERS > 0)` was missing, so `userCount >= 0` (1 >= 0) was always true. | **Fixed** in `auth.ts:513` |
| 2 | **Medium** | Auth | Auth request bodies used unsafe `as` casts instead of Zod validation for login, register, change-password, update-user, reset-password | **Fixed** - added Zod schemas |
| 3 | **Low** | Formats | BMP files (Windows 98/2000 V4/V5 headers) fail Sharp metadata read | Known - needs BMP in CLI_DECODED_FORMATS |
| 4 | **Low** | Formats | EXR format fails - ImageMagick in Docker lacks EXR decode delegate | Known - needs `libopenexr-dev` in Dockerfile |
| 5 | **Low** | AI | caire binary crashes on large images (6.7MB stress-large.jpg) for content-aware-resize | Known - caire limitation on both GPU+CPU |
| 6 | **Info** | AI | PaddleOCR Japanese fails on CPU (MKLDNN PIR attribute error) | Expected - CPU PaddlePaddle build limitation |
| 7 | **Info** | AI | Upscale (Real-ESRGAN) times out on CPU (>300s for 100x100 image) | Expected - model too heavy for CPU inference |

## Test Matrix

### API Contract Tests - Essential + Watermark Tools (35 tests)

| Tool | WSL GPU | CPU | Notes |
|------|---------|-----|-------|
| resize (3 tests) | PASS | PASS | cover, percentage, withoutEnlargement |
| crop (2) | PASS | PASS | px, percent |
| rotate (2) | PASS | PASS | 90deg, flip |
| convert (5) | PASS | PASS | png, webp, avif, tiff, gif |
| compress (2) | PASS | PASS | quality, targetSize |
| strip-metadata (2) | PASS | PASS | strip, inspect |
| edit-metadata (2) | PASS | PASS | edit, inspect |
| adjust-colors (5) | PASS | PASS | sliders, grayscale, sepia, invert, channels |
| sharpening (4) | PASS | PASS | adaptive, unsharp-mask, high-pass, denoise |
| watermark-text (2) | PASS | PASS | center, tiled |
| watermark-image (1) | PASS | PASS | field: `watermark`, scale: 1-100 |
| text-overlay (1) | PASS | PASS | |
| compose (4) | PASS | PASS | overlay, multiply, screen, difference |

**Result: 35/35 PASS on both nodes**

### API Contract Tests - Utility + Layout + Format (44 tests)

| Tool | WSL GPU | CPU | Notes |
|------|---------|-----|-------|
| info (2) | PASS | PASS | PNG, HEIC |
| compare (2) | PASS | PASS | identical, different |
| find-duplicates (1) | PASS | PASS | |
| color-palette (1) | PASS | PASS | |
| qr-generate (1) | PASS | PASS | |
| barcode-read (2) | PASS | PASS | barcode, QR |
| image-to-base64 (1) | PASS | PASS | |
| collage (2) | PASS | PASS | templateId: `2-h-equal`, `4-grid` |
| stitch (3) | PASS | PASS | horizontal, vertical, grid |
| split (2) | PASS | PASS | grid, tile |
| border (1) | PASS | PASS | |
| svg-to-raster (2) | PASS | PASS | PNG, JPG |
| vectorize (2) | PASS | PASS | B&W, color |
| gif-tools (8) | PASS | PASS | resize, optimize, speed, reverse, extract all/single, rotate, info |
| pdf-to-image (5) | PASS | PASS | all pages, single, grayscale, info, preview |
| optimize-for-web (2) | PASS | PASS | |
| bulk-rename (1) | PASS | PASS | |
| favicon (1) | PASS | PASS | |
| image-to-pdf (1) | PASS | PASS | |
| replace-color (2) | PASS | PASS | solid, transparent |

**Result: 44/44 PASS on both nodes**

### Input Format Support (18 formats per node)

| Format | GPU (WSL) | CPU (Ubuntu) | Notes |
|--------|-----------|-------------|-------|
| JPEG | PASS | PASS | |
| PNG | PASS | PASS | |
| WebP | PASS | PASS | |
| GIF | PASS | PASS | |
| BMP | **FAIL** | **FAIL** | Sharp can't read V4/V5 BMP metadata |
| TIFF | PASS | PASS | |
| Multi-page TIFF | PASS | PASS | |
| AVIF | PASS | PASS | |
| SVG | PASS | PASS | Sanitized before processing |
| HEIC | PASS | PASS | Decoded via heif-dec |
| HEIF | PASS | PASS | Decoded via heif-dec |
| DNG (RAW) | PASS | PASS | Decoded via dcraw |
| PSD | PASS | PASS | Decoded via ImageMagick |
| TGA | PASS | PASS | Decoded via ImageMagick |
| EXR | **FAIL** | **FAIL** | Missing ImageMagick EXR delegate |
| HDR | PASS | PASS | |
| ICO | PASS | PASS | |
| PDF | PASS | PASS | Via pdf-to-image tool |

**Result: 16/18 per node. Identical results = perfect parity.**

### Batch + Pipeline Tests (20 tests - CPU node)

| Test | Result | Notes |
|------|--------|-------|
| Batch resize (5 images) | PASS | |
| Batch convert (5 JPGs -> WebP) | PASS | |
| Batch compress (3 images) | PASS | |
| Batch watermark-text (3 images) | PASS | |
| First-Image-Only Bug Hunt | PASS | All 5 files in ZIP |
| Mixed format batch (JPG+PNG+WebP+HEIC) | PASS | HEIC auto-decoded |
| Large batch (11 images) | PASS | |
| Batch SSE progress | PASS | totalFiles/completedFiles correct |
| Simple pipeline [resize] | PASS | |
| 2-step [resize, convert] | PASS | |
| 3-step [crop, rotate, compress] | PASS | |
| 5-step pipeline | PASS | |
| Pipeline with AI tool | PASS | remove-bg works in pipeline |
| Pipeline batch (3 images) | PASS | |
| Save/List/Delete pipeline | PASS | |
| Available tools | PASS | 32 tools registered |
| Max steps limit (21) | PASS | 400 error |
| Invalid tool error | PASS | Clear error message |

**Result: 20/20 PASS. Also verified batch+pipeline on GPU node.**

### AI Tools - GPU (WSL RTX 4070)

| Tool | Status | Time | Notes |
|------|--------|------|-------|
| remove-bg transparent | PASS | 9.7s | |
| remove-bg color | PASS | 5.2s | Blue background applied |
| remove-bg blur | PASS | (verified earlier) | |
| upscale 2x | PASS | 6.3s | |
| upscale face-enhance | PASS | 8.3s | |
| ocr fast (en) | PASS | 1.1s | |
| ocr best (en) | PASS | 69.8s | |
| ocr japanese | PASS | 27.4s | |
| ocr auto | PASS | 9.4s | |
| blur-faces multi | PASS | 0.27s | |
| blur-faces single | PASS | 0.19s | |
| smart-crop face | PASS | 0.11s | |
| red-eye-removal | PASS | 0.28s | |
| colorize full | PASS | 10.1s | |
| colorize partial | PASS | 9.2s | |
| enhance-faces gfpgan | PASS | 2.3s | |
| enhance-faces codeformer | PASS | 3.0s | |
| enhance-faces multi | PASS | 2.6s | |
| noise-removal quick | PASS | 0.017s | |
| noise-removal quality | PASS | 18.2s | |
| restore-photo auto | PASS | 31.4s | |
| restore-photo light | PASS | 5.1s | |
| content-aware-resize (large) | **FAIL** | 100.5s | caire crash on 6.7MB image |
| content-aware-resize (face) | PASS | 16.2s | |
| image-enhancement auto | PASS | 0.25s | |
| image-enhancement analyze | PASS | 0.019s | |
| passport-photo analyze | PASS | 17.9s | Includes HEIC decode |

**Result: 26/27 PASS (1 caire bug on large image)**

### AI Tools - CPU Fallback (Ubuntu)

| Tool | CPU Status | CPU Time | GPU Time | Notes |
|------|-----------|----------|----------|-------|
| remove-bg transparent | PASS | 27.7s | 9.7s | 2.9x slower |
| remove-bg color | PASS | 21.4s | 5.2s | 4.1x slower |
| ocr fast (en) | PASS | 2.0s | 1.1s | 1.8x slower |
| ocr best (en) | PASS | 242.5s | 69.8s | 3.5x slower |
| ocr japanese | **FAIL** | 45.0s | 27.4s | PaddlePaddle MKLDNN bug |
| blur-faces multi | PASS | 27.1s | 0.27s | 100x slower |
| blur-faces single | PASS | 0.27s | 0.19s | Similar |
| smart-crop face | PASS | 0.14s | 0.11s | Similar |
| colorize | PASS | 12.9s | 10.1s | 1.3x slower |
| enhance-faces gfpgan | PASS | 27.7s | 2.3s | 12x slower |
| noise-removal quick | PASS | 228.0s | 0.017s | 13,400x slower! |
| red-eye | PASS | 0.46s | 0.28s | Similar |
| restore-photo auto | PASS | 89.6s | 31.4s | 2.9x slower |
| content-aware-resize | **FAIL** | 121.5s | 100.5s | caire crash (both) |
| image-enhancement auto | PASS | 0.09s | 0.25s | CPU faster (Sharp-only) |
| image-enhancement analyze | PASS | 0.04s | 0.019s | Similar |
| upscale 2x | **FAIL** | >300s | 6.3s | Timeout (too slow for CPU) |

**Result: 14/17 PASS, 3 expected CPU limitations**

### Auth + RBAC + Admin Tests

| Test | WSL | CPU |
|------|-----|-----|
| Login success | PASS | PASS |
| Login wrong password (401) | PASS | PASS |
| Login nonexistent user (401) | PASS | PASS |
| Login empty body (400) | PASS | PASS |
| Session validation (200) | PASS | PASS |
| Session invalid token (401) | PASS | PASS |
| Logout (200) | PASS | PASS |
| Post-logout session (401) | PASS | PASS |
| Register user | PASS | PASS |
| Register duplicate (409) | PASS | PASS |
| RBAC enforcement (403) | PASS | PASS |
| Admin escalation prevention (403) | PASS | PASS |
| Delete self prevention (400) | PASS | PASS |
| Last admin protection (400) | PASS | PASS |
| API key create (si_ prefix) | PASS | PASS |
| API key auth for tools (200) | PASS | PASS |
| Scoped key tools work | PASS | PASS |
| Scoped key admin blocked (403) | PASS | PASS |
| Deleted key rejected (401) | PASS | PASS |
| Roles endpoint | PASS | PASS |
| Teams endpoint | PASS | PASS |
| Audit log endpoint | PASS | PASS |
| Settings endpoint | PASS | PASS |
| Features endpoint | PASS | PASS |
| Health check | PASS | PASS |
| llms.txt / llms-full.txt | PASS | PASS |
| OpenAPI spec | PASS | PASS |

**Result: All PASS on both nodes**

### Security Tests (WSL)

| Test | Result | Details |
|------|--------|---------|
| Path traversal (download) | PASS | 404 |
| Path traversal (files) | PASS | SPA fallback, not real traversal |
| SVG XXE | PASS | 400 - sanitized |
| SVG SSRF | PASS | 400 - blocked |
| SVG script injection | PASS | Script stripped, image processed |
| SQL injection (login) | PASS | Normal 401 rejection |
| Rate limiting | PASS | 429 at request 9 |
| Token reuse after logout | PASS | 401 |
| Unauthenticated tool access | PASS | 401 |
| Malicious file (.exe as .jpg) | PASS | 400 - magic bytes rejected |
| Header injection | PASS | No impact |

**Result: 11/11 PASS**

### Stress / Performance

| Test | Result | Details |
|------|--------|---------|
| Large file (6.7MB) resize | PASS | 0.4s |
| 10 concurrent requests | PASS | All 200 |
| 20-image batch | PASS | All complete (Agent 10) |
| 10-step pipeline, 5 images | PASS | No corruption |

**Result: 4/4 PASS**

### Cross-Platform Parity

| Check | Match? | Notes |
|-------|--------|-------|
| Non-AI tools (79 tests) | YES | Identical results |
| 18 input formats | YES | Same 16/18 pass, same 2 fail |
| Batch processing | YES | Identical behavior |
| Pipeline execution | YES | Identical behavior |
| Auth/RBAC | YES | Identical behavior |
| AI tools on CPU | Partial | 14/17 work; 3 expected GPU-only limitations |

## GPU vs CPU Performance Summary

| Operation | GPU | CPU | Speedup |
|-----------|-----|-----|---------|
| noise-removal (quick) | 17ms | 228s | **13,400x** |
| blur-faces (multi) | 0.27s | 27.1s | **100x** |
| upscale 2x | 6.3s | >300s (timeout) | **>47x** |
| enhance-faces (gfpgan) | 2.3s | 27.7s | **12x** |
| remove-bg | 5.2-9.7s | 21-28s | **3-4x** |
| ocr (best) | 69.8s | 242.5s | **3.5x** |
| restore-photo (auto) | 31.4s | 89.6s | **2.9x** |
| colorize | 10.1s | 12.9s | **1.3x** |
| image-enhancement | 0.25s | 0.09s | CPU faster (Sharp-only) |

## API Parameter Format Reference

```bash
# Single-file tool
curl -X POST -F "file=@image.jpg" -F 'settings={"width":100}' \
  -H "Authorization: Bearer TOKEN" http://host:1349/api/v1/tools/TOOL

# Multi-file (collage, stitch, compare, find-duplicates, bulk-rename, image-to-pdf)
curl -X POST -F "file=@img1.jpg" -F "file=@img2.jpg" -F 'settings={...}' ...

# Watermark-image: field name is "watermark"
curl -X POST -F "file=@main.jpg" -F "watermark=@logo.png" -F 'settings={...}' ...

# Compose: field name is "overlay"  
curl -X POST -F "file=@base.jpg" -F "overlay=@top.jpg" -F 'settings={...}' ...

# Pipeline: field name is "pipeline"
curl -X POST -F "file=@img.jpg" \
  -F 'pipeline={"steps":[{"toolId":"resize","settings":{"width":100}}]}' ...

# Notes: crop uses left/top (not x/y), scale in watermark-image is 1-100
```
