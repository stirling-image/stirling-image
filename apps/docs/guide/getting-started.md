# Getting started

## Run with Docker

The fastest way to get Stirling Image running:

```bash
docker run -d \
  --name stirling-image \
  -p 1349:1349 \
  -v stirling-data:/data \
  siddharth123sk/stirling-image:latest
```

Open `http://localhost:1349` in your browser. Log in with `admin` / `admin`.

## Run with Docker Compose

Create a `docker-compose.yml`:

```yaml
services:
  stirling-image:
    image: siddharth123sk/stirling-image:latest
    container_name: stirling-image
    ports:
      - "1349:1349"
    volumes:
      - stirling-data:/data
      - stirling-workspace:/tmp/workspace
    environment:
      - AUTH_ENABLED=true
      - DEFAULT_USERNAME=admin
      - DEFAULT_PASSWORD=admin
    restart: unless-stopped

volumes:
  stirling-data:
  stirling-workspace:
```

```bash
docker compose up -d
```

See [Configuration](./configuration) for the full list of environment variables.

## Build from source

Requirements: Node.js 20+, pnpm 9+, Python 3.10+

```bash
git clone https://github.com/siddharthksah/Stirling-Image.git
cd Stirling-Image
pnpm install
```

Start the dev server:

```bash
pnpm dev
```

This starts both the API server and the React frontend. The app opens at `http://localhost:5173` by default during development.

## What you can do

Once logged in, the sidebar lists every available tool. Pick one, upload an image, adjust the settings, and download the result.

A few things to try first:

- **Resize** an image to specific dimensions or a percentage
- **Remove a background** using the AI-powered background removal tool
- **Compress** a photo to reduce file size before uploading it somewhere
- **Convert** between formats (JPEG, PNG, WebP, AVIF, TIFF)
- **Batch process** a folder of images through any tool

Every tool in the UI is also available through the [REST API](../api/rest), so you can script your workflows or integrate Stirling Image into other systems.
