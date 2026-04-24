# Hardware Benchmark and System Recommendations

## Role & System Directive

Initialize as a Principal Performance Engineer and Systems Architect for the Ashim monorepo. Your objective is to run a comprehensive hardware benchmark across all available test systems, measure every feature's resource consumption, identify minimum/recommended/full hardware requirements, and produce a self-hoster's hardware guide.

**Execution Engine:** Opus 4.7, Max Effort, 1M Token Context for EVERY agent and subagent. No model downgrading. No exceptions.

---

## TOP PRIORITY: MAXIMUM PARALLELIZATION

Each test system runs its benchmarks independently. Spawn parallel agents for EVERY system simultaneously. Never run sequentially what can run in parallel.

### Parallel Agent Architecture

```
Phase 0: System Inventory (Sequential)
  └─> Detect specs on all 4 nodes, deploy containers, verify health
       │
Phase 1: PARALLEL BENCHMARK BLAST ────────────────────────────────
  │                                                                │
  │  Agent 1: macOS Benchmark                                     │
  │    All 35 non-AI tools + batch + pipeline + format matrix      │
  │    Docker Desktop for Mac resource monitoring                  │
  │                                                                │
  │  Agent 2: WSL/GPU Benchmark                                   │
  │    All 47 tools (AI on GPU) + batch + pipeline                │
  │    GPU VRAM monitoring, CUDA utilization, GPU vs CPU timing    │
  │                                                                │
  │  Agent 3: WSL/GPU - CPU-Only AI Benchmark                    │
  │    All 12 AI tools with GPU DISABLED (force CPU fallback)     │
  │    Measure CPU-only AI inference times to find usable vs      │
  │    impractical tools without a GPU                             │
  │                                                                │
  │  Agent 4: Ubuntu CPU Benchmark                                │
  │    All 35 non-AI tools + AI CPU fallback + batch + pipeline   │
  │    Measure on actual CPU-only hardware (no GPU available)      │
  │                                                                │
  │  Agent 5: Windows Docker Desktop Benchmark                    │
  │    All 35 non-AI tools + batch + pipeline                     │
  │    Windows-specific Docker Desktop overhead measurement        │
  │                                                                │
  │  Agent 6: Resource Limit Sweep                                │
  │    Run key benchmarks at different Docker --memory and         │
  │    --cpus limits to find minimum viable allocations            │
  │                                                                │
Phase 2: Analysis + Report (after all agents done)                 │
  └─> Compile all data into hardware recommendation document       │
───────────────────────────────────────────────────────────────────
```

---

## CRITICAL DIRECTIVES

- **Production containers only.** All benchmarks run against Docker containers, never dev servers.
- **Fix everything.** If you find bugs, warnings, or performance issues during benchmarking, fix the code on the local Mac codebase, rsync to remotes, rebuild, and re-benchmark.
- **SOURCE OF TRUTH: LOCAL MAC CODEBASE.** All code changes go through the local Mac first, then rsync to remotes.
- **Always use `--repo ashim-hq/ashim`** for any `gh` CLI commands.
- **Never push** `docs/superpowers/` folder.

---

## Test Systems

| System | Connection | Shell | OS | Role |
|--------|-----------|-------|-----|------|
| **Mac** | Local | zsh | macOS | Development machine, Playwright host |
| **WSL (GPU)** | `ssh -p 2222 siddharth@192.168.0.247` | bash | Linux (WSL2) | GPU benchmarks (RTX 4070 12GB), CPU-only AI comparison |
| **Windows** | `ssh siddh@192.168.0.247` | PowerShell/CMD | Windows | Docker Desktop on Windows, Windows overhead measurement |
| **Ubuntu** | `ssh ubuntuserver@192.168.0.191` | bash | Ubuntu Linux | CPU-only server, no GPU |

---

## Phase 0: System Inventory and Provisioning

### 0.1 Detect Hardware Specs (parallel across all 4 systems)

On each system, collect and record:

**CPU:**
```bash
# Linux/WSL
lscpu | grep -E "Model name|CPU\(s\)|Thread|Core|MHz|cache"
cat /proc/cpuinfo | grep "model name" | head -1

# macOS
sysctl -n machdep.cpu.brand_string
sysctl -n hw.ncpu
sysctl -n hw.memsize

# Windows (PowerShell)
Get-CimInstance Win32_Processor | Select-Object Name, NumberOfCores, NumberOfLogicalProcessors, MaxClockSpeed
```

**RAM:**
```bash
# Linux/WSL
free -h

# macOS
sysctl -n hw.memsize | awk '{print $0/1073741824 " GB"}'

# Windows (PowerShell)
Get-CimInstance Win32_ComputerSystem | Select-Object TotalPhysicalMemory
```

**GPU (WSL only):**
```bash
nvidia-smi --query-gpu=name,memory.total,memory.free,driver_version,compute_cap --format=csv
```

**Disk:**
```bash
# Linux/WSL
df -h / | tail -1
lsblk -d -o NAME,SIZE,ROTA,TYPE | head -5  # SSD vs HDD

# macOS
diskutil info / | grep "Free Space"

# Windows (PowerShell)
Get-Volume | Where-Object {$_.DriveLetter -eq 'C'} | Select-Object Size, SizeRemaining
```

**Docker:**
```bash
docker info 2>/dev/null | grep -E "Total Memory|CPUs|Storage Driver|Server Version"
```

### 0.2 Deploy Containers

On each system:
```bash
SKIP_MUST_CHANGE_PASSWORD=true docker compose -f docker/docker-compose.yml up -d --build
until curl -sf http://localhost:1349/api/v1/health; do sleep 2; done
```

On WSL (GPU variant):
```bash
SKIP_MUST_CHANGE_PASSWORD=true docker compose -f docker/docker-compose-gpu.yml up -d --build
```

### 0.3 Obtain Auth Tokens
```bash
TOKEN=$(curl -s -X POST http://localhost:1349/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin"}' | jq -r '.token')
```

### 0.4 Install AI Bundles (WSL + Ubuntu)
```bash
for bundle in background-removal face-detection upscale-enhance object-eraser-colorize ocr photo-restoration; do
  curl -X POST "http://localhost:1349/api/v1/admin/features/$bundle/install" \
    -H "Authorization: Bearer $TOKEN"
  # Wait for each to complete before next (sequential - models are large)
done
```

---

## Phase 1: Benchmark Execution (Parallel Across All Systems)

Spawn agents 1-6 in a SINGLE message.

### Benchmark Methodology

For every benchmark, capture these metrics:

```bash
# Before each test
CONTAINER_ID=$(docker ps -q -f name=ashim)

# CPU + Memory during test (sample every 1s)
docker stats $CONTAINER_ID --no-stream --format "{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

# Timing
time curl -X POST http://localhost:1349/api/v1/tools/{tool} \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@{test-file}" \
  -F "settings={json}" \
  -o /dev/null -w "%{time_total}"
```

Record for each test:
- **Wall clock time** (seconds)
- **Peak container memory** (MB)
- **Peak CPU usage** (%)
- **Peak GPU VRAM** (MB, GPU node only)
- **Output file size** (bytes)
- **Pass/Fail**

### Benchmark Test Matrix

#### Tier 1: Core Tool Benchmarks (all systems)

Test each tool with a small file (fast) AND the stress file (realistic load):

| # | Tool | Small File | Large File | Settings |
|---|------|-----------|------------|----------|
| 1 | resize | test-200x150.png | stress-large.jpg | `width=800, fit=cover` |
| 2 | crop | test-200x150.png | stress-large.jpg | `left=10,top=10,width=100,height=100` |
| 3 | rotate | test-200x150.png | stress-large.jpg | `angle=90` |
| 4 | convert (jpg->webp) | test-100x100.jpg | stress-large.jpg | `format=webp, quality=80` |
| 5 | convert (jpg->avif) | test-100x100.jpg | stress-large.jpg | `format=avif, quality=50` |
| 6 | compress | test-200x150.png | stress-large.jpg | `mode=quality, quality=60` |
| 7 | compress (targetSize) | stress-large.jpg | stress-large.jpg | `mode=targetSize, targetSizeKb=500` |
| 8 | strip-metadata | test-with-exif.jpg | stress-large.jpg | `stripAll=true` |
| 9 | edit-metadata | test-with-exif.jpg | stress-large.jpg | `title=Bench, clearGps=true` |
| 10 | adjust-colors | test-200x150.png | stress-large.jpg | `brightness=20, contrast=10, effect=grayscale` |
| 11 | sharpening | test-200x150.png | stress-large.jpg | `method=adaptive, sigma=1.5` |
| 12 | watermark-text | test-200x150.png | stress-large.jpg | `text=BENCHMARK, position=tiled` |
| 13 | compose | test-200x150.png + test-100x100.jpg | stress-large.jpg + portrait-color.jpg | `blendMode=overlay` |
| 14 | collage (4 images) | 4 small fixtures | 4 content images | `templateId=4-grid` |
| 15 | stitch (3 horizontal) | 3 small fixtures | 3 content images | `direction=horizontal` |
| 16 | split (4 tiles) | test-200x150.png | stress-large.jpg | `columns=2, rows=2` |
| 17 | border | test-200x150.png | stress-large.jpg | `borderWidth=20, cornerRadius=10, shadow=true` |
| 18 | svg-to-raster | svg-logo.svg | svg-logo.svg | `width=2000, dpi=300` |
| 19 | vectorize | test-200x150.png | portrait-color.jpg | `colorMode=color` |
| 20 | gif-tools (optimize) | animated-simpsons.gif | animated-simpsons.gif | `mode=optimize, colors=64` |
| 21 | pdf-to-image | test-3page.pdf | test-3page.pdf | `format=png, dpi=300` |
| 22 | optimize-for-web | stress-large.jpg | stress-large.jpg | `format=webp, quality=80, maxWidth=1920` |
| 23 | favicon | test-200x150.png | portrait-color.jpg | (none) |
| 24 | image-to-pdf | 3 small fixtures | 3 content images | `pageSize=A4` |
| 25 | replace-color | test-200x150.png | stress-large.jpg | `sourceColor=#FFFFFF, targetColor=#FF0000` |
| 26 | info | test-200x150.png | stress-large.jpg | (none) |
| 27 | compare | test-200x150.png x2 | stress-large.jpg x2 | (none) |
| 28 | find-duplicates | 5 mixed fixtures | 5 mixed content | `threshold=5` |
| 29 | color-palette | portrait-color.jpg | stress-large.jpg | (none) |
| 30 | qr-generate | (JSON) | (JSON) | `text=https://ashim.app, size=2000` |
| 31 | barcode-read | barcode.avif | barcode.avif | `tryHarder=true` |
| 32 | image-to-base64 | test-200x150.png | stress-large.jpg | `outputFormat=webp` |
| 33 | bulk-rename | 5 small fixtures | 5 content images | `pattern=bench_{{padded}}` |
| 34 | content-aware-resize | test-200x150.png | stress-large.jpg | `width=100` |
| 35 | image-enhancement | test-200x150.png | stress-large.jpg | `mode=auto, intensity=50` |

#### Tier 2: AI Tool Benchmarks (WSL GPU + WSL CPU-only + Ubuntu CPU)

For GPU node, run each test twice: once with GPU enabled, once with GPU disabled (set `CUDA_VISIBLE_DEVICES=""` in container env).

| # | Tool | Test File | Settings | Bundle |
|---|------|-----------|----------|--------|
| 1 | remove-background | portrait-color.jpg | `backgroundType=transparent` | background-removal |
| 2 | remove-background | portrait-isolated.png | `backgroundType=color, backgroundColor=#0000FF` | background-removal |
| 3 | upscale (2x) | test-100x100.jpg | `scale=2` | upscale-enhance |
| 4 | upscale (2x, large) | portrait-color.jpg | `scale=2` | upscale-enhance |
| 5 | upscale (face enhance) | portrait-color.jpg | `scale=2, faceEnhance=true` | upscale-enhance |
| 6 | ocr (fast) | ocr-chat.jpeg | `quality=fast, language=en` | ocr |
| 7 | ocr (best) | ocr-chat.jpeg | `quality=best, language=en` | ocr |
| 8 | ocr (Japanese) | ocr-japanese.png | `quality=balanced, language=ja` | ocr |
| 9 | blur-faces | multi-face.webp | `blurRadius=30, sensitivity=0.5` | face-detection |
| 10 | smart-crop (face) | portrait-color.jpg | `mode=face, width=400, height=400` | face-detection |
| 11 | erase-object | portrait-color.jpg + mask | `format=png` | object-eraser-colorize |
| 12 | colorize | portrait-bw.jpeg | `intensity=1.0` | object-eraser-colorize |
| 13 | enhance-faces (gfpgan) | portrait-color.jpg | `model=gfpgan, strength=0.8` | upscale-enhance |
| 14 | enhance-faces (codeformer) | portrait-color.jpg | `model=codeformer, strength=0.7` | upscale-enhance |
| 15 | noise-removal (quick) | test-200x150.png | `tier=quick` | upscale-enhance |
| 16 | noise-removal (quality) | stress-large.jpg | `tier=quality` | upscale-enhance |
| 17 | red-eye-removal | red-eye.jpg | `sensitivity=50, strength=80` | face-detection |
| 18 | restore-photo (full) | portrait-bw.jpeg | `mode=auto, scratchRemoval=true, faceEnhancement=true, colorize=true` | photo-restoration |
| 19 | passport-photo | portrait-headshot.heic | Analyze + Generate US | background-removal |
| 20 | content-aware-resize (face) | portrait-color.jpg | `width=300, protectFaces=true` | (uses face-detection) |

#### Tier 3: Batch Processing Benchmarks (all systems)

| # | Test | Files | Tool | Measure |
|---|------|-------|------|---------|
| 1 | Batch 3 small | 3 fixtures | resize | Time, peak memory |
| 2 | Batch 5 small | 5 fixtures | resize | Time, peak memory |
| 3 | Batch 10 small | 10 fixtures | resize | Time, peak memory |
| 4 | Batch 3 large | 3 content images | resize | Time, peak memory |
| 5 | Batch 5 large | 5 content images | compress | Time, peak memory |
| 6 | Batch 5 mixed formats | jpg+png+webp+heic+avif | convert (webp) | Time, peak memory |
| 7 | Batch 3 AI (GPU) | 3 portraits | remove-background | Time, peak VRAM |
| 8 | Batch 5 AI (GPU) | 5 portraits | blur-faces | Time, peak VRAM |

#### Tier 4: Pipeline Benchmarks (all systems)

| # | Pipeline Steps | Files | Measure |
|---|---------------|-------|---------|
| 1 | resize(800) | 1 image | Time |
| 2 | resize(800) -> convert(webp) | 1 image | Time |
| 3 | resize -> grayscale -> sharpening -> compress | 1 image | Time |
| 4 | resize -> grayscale -> sharpening -> compress -> convert | 1 image | Time |
| 5 | 5-step pipeline | 3 images (batch) | Time, peak memory |
| 6 | resize -> remove-bg (AI) | 1 image (GPU) | Time, peak VRAM |
| 7 | 10-step pipeline | 1 image | Time, peak memory |

#### Tier 5: Format Decode Benchmarks (all systems)

Resize each format to 200px wide and measure decode+process time:

| Format | File | Expected Behavior |
|--------|------|-------------------|
| JPEG | sample.jpg | Fast, baseline |
| PNG | sample.png | Fast |
| WebP | sample.webp | Fast |
| AVIF | sample.avif | Moderate (AV1 decode) |
| GIF | sample.gif | Fast (single frame) |
| BMP | sample.bmp | Fast (uncompressed) |
| TIFF | sample.tiff | Fast |
| HEIC | sample.heic | Moderate (heif-dec external) |
| HEIF | sample.heif | Moderate (heif-dec external) |
| SVG | sample.svg | Fast (rasterize) |
| DNG (RAW) | sample.dng | Slow (dcraw external) |
| PSD | sample.psd | Moderate (ImageMagick) |
| TGA | sample.tga | Fast |
| EXR | sample.exr | Moderate (HDR tone map) |
| HDR | sample.hdr | Moderate (HDR tone map) |
| ICO | sample.ico | Fast |

#### Tier 6: Concurrent Load Benchmarks (all systems)

| # | Test | Description | Measure |
|---|------|-------------|---------|
| 1 | 1 concurrent request | Baseline single request | Response time |
| 2 | 3 concurrent requests | Light load | Avg/p95/max response time |
| 3 | 5 concurrent requests | Medium load | Avg/p95/max response time, peak memory |
| 4 | 10 concurrent requests | Heavy load | Avg/p95/max response time, peak memory, errors |
| 5 | 20 concurrent requests | Stress | Avg/p95/max response time, peak memory, errors, OOM? |

Use `resize` with `stress-large.jpg` for all concurrency tests. Run via:
```bash
for i in $(seq 1 N); do
  curl -s -X POST http://localhost:1349/api/v1/tools/resize \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@stress-large.jpg" \
    -F "settings={\"width\":800}" \
    -o /dev/null -w "%{time_total}\n" &
done
wait
```

#### Tier 7: Sustained Load + Memory Stability (all systems)

| # | Test | Description | Measure |
|---|------|-------------|---------|
| 1 | 50 sequential resizes | Process stress-large.jpg 50 times | Memory over time (leak check) |
| 2 | 20 sequential AI tools | Cycle through AI tools 20 times (GPU) | VRAM over time (leak check) |
| 3 | 1-hour idle | Container running with no requests for 60 min | Baseline memory |
| 4 | Container cold start | Time from `docker compose up` to health OK | Startup time |
| 5 | AI bundle install time | Time to install each of the 6 bundles | Download + setup time |

### Agent 6: Docker Resource Limit Sweep

Run the core benchmark subset (resize large, compress large, convert large, batch 5, collage 4) at constrained resource limits to find the minimum viable configuration:

| # | CPU Limit | Memory Limit | Test | Expected Outcome |
|---|-----------|-------------|------|------------------|
| 1 | 1 core | 512MB | resize large | Pass/fail, time |
| 2 | 1 core | 1GB | resize large | Pass/fail, time |
| 3 | 1 core | 2GB | resize large | Pass/fail, time |
| 4 | 2 cores | 1GB | resize large | Pass/fail, time |
| 5 | 2 cores | 2GB | resize large | Pass/fail, time |
| 6 | 2 cores | 4GB | resize large | Pass/fail, time |
| 7 | 4 cores | 2GB | resize large | Pass/fail, time |
| 8 | 4 cores | 4GB | resize large | Pass/fail, time |
| 9 | 1 core | 512MB | batch 5 resize | Pass/fail, time |
| 10 | 1 core | 1GB | batch 5 resize | Pass/fail, time |
| 11 | 2 cores | 2GB | batch 5 resize | Pass/fail, time |
| 12 | 4 cores | 4GB | batch 5 resize | Pass/fail, time |
| 13 | 1 core | 512MB | collage 4 | Pass/fail, time |
| 14 | 2 cores | 2GB | collage 4 | Pass/fail, time |
| 15 | 4 cores | 4GB | collage 4 | Pass/fail, time |
| 16 | 1 core | 2GB | convert avif | Pass/fail, time |
| 17 | 2 cores | 2GB | compress targetSize | Pass/fail, time |
| 18 | 2 cores | 4GB | AI remove-bg (CPU) | Pass/fail, time |
| 19 | 4 cores | 8GB | AI remove-bg (CPU) | Pass/fail, time |
| 20 | 4 cores | 8GB | AI upscale (CPU) | Pass/fail, time |
| 21 | 2 cores | 4GB | AI ocr (CPU) | Pass/fail, time |
| 22 | 4 cores | 8GB | AI restore-photo (CPU) | Pass/fail, time |

Run with:
```bash
docker run --rm -d --cpus=X --memory=Xm -p 1349:1349 \
  -e AUTH_ENABLED=false -e SKIP_MUST_CHANGE_PASSWORD=true \
  --name ashim-bench ashim:latest
```

---

## Phase 2: Analysis and Report Generation

**Agent 15 runs LAST** after all benchmark agents complete.

Generate `HARDWARE_RECOMMENDATIONS.md` at `/Users/sidd/Desktop/Personal/Projects/ashim/docs/HARDWARE_RECOMMENDATIONS.md`.

### Report Structure

```markdown
# Ashim Self-Hosting Hardware Recommendations

**Generated:** [date]
**Version:** [from package.json]
**Benchmark Systems:** [list all 4 with specs]

---

## Quick Reference

| Tier | Use Case | CPU | RAM | GPU | Storage | Docker Limits |
|------|----------|-----|-----|-----|---------|---------------|
| Minimum | Core tools only, single user | ? | ? | None | ? | `--cpus=? --memory=?` |
| Recommended | All tools + some AI (CPU), small batches | ? | ? | None | ? | `--cpus=? --memory=?` |
| Full | All tools + all AI (GPU), large batches, concurrent users | ? | ? | NVIDIA ?GB+ | ? | `--cpus=? --memory=?` |

---

## Tier Definitions

### Minimum Viable (No AI Features)

**What works:** All 35 non-AI tools with small to medium images (up to ~5MP).
Single-user, sequential processing. Batch up to 3 images.

**What doesn't work:** AI tools (remove-bg, upscale, OCR, face enhance, etc.),
large batches (10+), concurrent users, images larger than ~20MP.

**Hardware:**
- CPU: [minimum from benchmarks]
- RAM: [minimum from resource limit sweep]
- Storage: [minimum - app + workspace]
- GPU: Not required

**Docker Compose limits:**
```yaml
deploy:
  resources:
    limits:
      cpus: 'X'
      memory: XG
```

**Performance expectations:**
| Operation | Time (small image) | Time (large image) |
|-----------|-------------------|-------------------|
| Resize | Xs | Xs |
| Convert (WebP) | Xs | Xs |
| ... | | |

---

### Recommended (CPU AI, Moderate Load)

**What works:** All 35 non-AI tools at full speed. AI tools work on CPU
(slower but functional). Batch up to 10 images. 2-3 concurrent users.

**What doesn't work:** GPU-accelerated AI (uses CPU fallback instead).
Very large batches (20+) may be slow. Heavy concurrent load (10+ users).

**AI Tool Viability on CPU:**
| AI Tool | CPU Time | Usable? | Notes |
|---------|----------|---------|-------|
| remove-background | Xs | Yes/Marginal/No | |
| upscale (2x) | Xs | Yes/Marginal/No | |
| ocr (fast) | Xs | Yes/Marginal/No | |
| ocr (best) | Xs | Yes/Marginal/No | |
| blur-faces | Xs | Yes/Marginal/No | |
| enhance-faces | Xs | Yes/Marginal/No | |
| colorize | Xs | Yes/Marginal/No | |
| noise-removal | Xs | Yes/Marginal/No | |
| restore-photo | Xs | Yes/Marginal/No | |
| passport-photo | Xs | Yes/Marginal/No | |
| erase-object | Xs | Yes/Marginal/No | |
| red-eye-removal | Xs | Yes/Marginal/No | |

Viability thresholds:
- **Yes** = under 30 seconds for a typical image
- **Marginal** = 30-120 seconds (usable but user will wait)
- **No** = over 120 seconds or OOM (impractical without GPU)

**Hardware:**
- CPU: [from benchmarks]
- RAM: [from benchmarks]
- Storage: [app + AI models + workspace]
- GPU: Not required (CPU fallback)

**Docker Compose limits:**
```yaml
deploy:
  resources:
    limits:
      cpus: 'X'
      memory: XG
```

---

### Full System (GPU AI, Heavy Load)

**What works:** Everything. All 47 tools at maximum speed with GPU acceleration.
Batch 20+ images. 10+ concurrent users. Pipeline automation.

**Hardware:**
- CPU: [from benchmarks]
- RAM: [from benchmarks]
- GPU: NVIDIA with [minimum VRAM from benchmarks]
- Storage: [app + all AI models + workspace]

**GPU VRAM Requirements:**
| AI Bundle | Model Size on Disk | Peak VRAM During Inference |
|-----------|-------------------|---------------------------|
| background-removal | XGB | XGMB |
| upscale-enhance | XGB | XMB |
| face-detection | XMB | XMB |
| object-eraser-colorize | XGB | XMB |
| ocr | XGB | XMB |
| photo-restoration | XGB | XMB |
| **All bundles loaded** | **XGB** | **XMB peak** |

**GPU vs CPU Speed Comparison:**
| AI Tool | GPU Time | CPU Time | Speedup |
|---------|----------|----------|---------|
| remove-background | Xs | Xs | Xx |
| upscale (2x) | Xs | Xs | Xx |
| ... | | | |

**Docker Compose limits:**
```yaml
deploy:
  resources:
    limits:
      cpus: 'X'
      memory: XG
    reservations:
      devices:
        - driver: nvidia
          count: all
          capabilities: [gpu]
```

---

## Detailed Benchmark Results

### Core Tools Performance (per system)

| Tool | Mac (small) | Mac (large) | WSL (small) | WSL (large) | Ubuntu (small) | Ubuntu (large) | Windows (small) | Windows (large) |
|------|------------|------------|-------------|-------------|---------------|---------------|----------------|----------------|
| resize | Xs | Xs | Xs | Xs | Xs | Xs | Xs | Xs |
| ... | | | | | | | | |

### Batch Processing Scaling

| Batch Size | Mac | WSL | Ubuntu | Windows | Peak Memory |
|-----------|-----|-----|--------|---------|-------------|
| 3 images | Xs | Xs | Xs | Xs | XMB |
| 5 images | Xs | Xs | Xs | Xs | XMB |
| 10 images | Xs | Xs | Xs | Xs | XMB |

### Pipeline Overhead

| Steps | Single Image Time | 3-Image Batch Time | Memory |
|-------|-------------------|-------------------|--------|
| 1 | Xs | Xs | XMB |
| 2 | Xs | Xs | XMB |
| 4 | Xs | Xs | XMB |
| 10 | Xs | Xs | XMB |

### Format Decode Times (per system)

| Format | Mac | WSL | Ubuntu | Windows | Notes |
|--------|-----|-----|--------|---------|-------|
| JPEG | Xs | Xs | Xs | Xs | Baseline |
| HEIC | Xs | Xs | Xs | Xs | External decoder |
| DNG | Xs | Xs | Xs | Xs | dcraw |
| PSD | Xs | Xs | Xs | Xs | ImageMagick |
| ... | | | | | |

### Concurrent Load Results

| Concurrent Requests | Avg Response | p95 Response | Max Response | Errors | Peak Memory |
|---------------------|-------------|-------------|-------------|--------|-------------|
| 1 | Xs | Xs | Xs | 0 | XMB |
| 3 | Xs | Xs | Xs | 0 | XMB |
| 5 | Xs | Xs | Xs | 0 | XMB |
| 10 | Xs | Xs | Xs | ? | XMB |
| 20 | Xs | Xs | Xs | ? | XMB |

### Docker Resource Limit Results

| CPU | Memory | resize | batch-5 | collage | convert-avif | AI remove-bg |
|-----|--------|--------|---------|---------|-------------|-------------|
| 1 | 512MB | P/F Xs | P/F Xs | P/F Xs | P/F Xs | N/A |
| 1 | 1GB | P/F Xs | P/F Xs | P/F Xs | P/F Xs | N/A |
| 2 | 2GB | P/F Xs | P/F Xs | P/F Xs | P/F Xs | P/F Xs |
| 4 | 4GB | P/F Xs | P/F Xs | P/F Xs | P/F Xs | P/F Xs |
| 4 | 8GB | P/F Xs | P/F Xs | P/F Xs | P/F Xs | P/F Xs |

### Memory Stability

| Test | Start Memory | End Memory | Delta | Leak? |
|------|-------------|------------|-------|-------|
| 50 sequential resizes | XMB | XMB | +XMB | Yes/No |
| 20 AI tool cycles | XMB | XMB | +XMB | Yes/No |
| 1-hour idle | XMB | XMB | +XMB | Yes/No |

### Storage Requirements

| Component | Size |
|-----------|------|
| Docker image (no AI) | XGB |
| Docker image (with all AI bundles) | XGB |
| AI model: background-removal | XGB |
| AI model: upscale-enhance | XGB |
| AI model: face-detection | XMB |
| AI model: object-eraser-colorize | XGB |
| AI model: ocr | XGB |
| AI model: photo-restoration | XGB |
| Workspace (temp, per active job) | ~XMB |
| SQLite database (typical) | ~XMB |
| **Total (full system)** | **~XGB** |

---

## Platform-Specific Notes

### macOS
- Docker Desktop overhead: [measured]
- Apple Silicon performance vs x86 emulation: [if applicable]
- File system performance (virtiofs): [measured]

### Windows (Docker Desktop)
- Docker Desktop overhead vs native Linux: [measured]
- WSL2 backend performance: [measured]
- Path handling differences: [any issues found]

### Linux (Native Docker)
- Best raw performance: [confirmed/denied]
- Recommended distro notes: [any]
- cgroup v2 considerations: [any]

---

## Environment Variable Tuning

| Variable | Default | Minimum Tier | Recommended Tier | Full Tier | Description |
|----------|---------|-------------|-----------------|-----------|-------------|
| MAX_UPLOAD_SIZE_MB | 0 (unlimited) | 10 | 50 | 0 | Max single file size |
| MAX_BATCH_SIZE | 0 (unlimited) | 5 | 10 | 0 | Max files per batch |
| MAX_MEGAPIXELS | 0 (unlimited) | 25 | 100 | 0 | Max image dimensions |
| CONCURRENT_JOBS | 0 (auto) | 1 | 2 | 0 | Parallel processing |
| MAX_WORKER_THREADS | 0 (auto) | 2 | 4 | 0 | Sharp thread pool |
| PROCESSING_TIMEOUT_S | 0 (unlimited) | 60 | 300 | 0 | Per-job timeout |
| MAX_PIPELINE_STEPS | 0 (default 20) | 5 | 10 | 20 | Pipeline step limit |
| SESSION_DURATION_HOURS | 168 | 24 | 168 | 168 | Session TTL |
```

---

## Execution Rules

1. **MAXIMUM PARALLELISM.** Spawn agents 1-6 simultaneously. Each system benchmarks independently.
2. **Opus 4.7 Max Effort 1M context** for every agent. No exceptions.
3. **Fix everything.** If benchmarks reveal bugs, crashes, or memory leaks, fix the code immediately.
4. **SOURCE OF TRUTH: LOCAL MAC CODEBASE.** All fixes go through local Mac, rsync to remotes.
5. **Reproducibility.** Run each benchmark 3 times and report the median. Discard obvious outliers.
6. **Cold cache.** Restart the container before each benchmark tier to avoid warm-cache bias.
7. **Use test fixtures only** from `tests/fixtures/`, `tests/fixtures/content/`, and `tests/fixtures/formats/`.
8. **Always use `--repo ashim-hq/ashim`** for any `gh` CLI commands.
