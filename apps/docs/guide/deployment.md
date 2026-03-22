# Deployment

Stirling Image ships as a single Docker container. The frontend, API, and Python AI runtime all run inside one image.

## Docker Compose (recommended)

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

The app is then available at `http://localhost:1349`.

## What's inside the container

The Docker image uses a multi-stage build:

1. **Build stage** -- Installs Node.js dependencies and builds the React frontend with Vite.
2. **Production stage** -- Copies the built frontend and API source into a Node 22 image, installs system dependencies (Python 3, ImageMagick, Tesseract, potrace), sets up a Python virtual environment with all ML packages, and pre-downloads model weights.

Everything runs from a single process. The Fastify server handles API requests and serves the frontend SPA.

### System dependencies installed in the image

- Python 3 with pip
- ImageMagick
- Tesseract OCR
- libraw (RAW image support)
- potrace (bitmap to vector conversion)

### Python packages

- rembg with BiRefNet-Lite (background removal)
- RealESRGAN (upscaling)
- PaddleOCR (text recognition)
- MediaPipe (face detection)
- LaMa Cleaner (inpainting/object removal)
- onnxruntime, opencv-python, Pillow, numpy

Model weights are downloaded at build time, so the container works fully offline.

## Volumes

Mount these to persist data:

| Mount point | Purpose |
|---|---|
| `/data` | SQLite database (users, API keys, pipelines, settings) |
| `/tmp/workspace` | Temporary image processing files |

The `/data` volume is the important one. Without it, you lose all user accounts and saved pipelines on container restart. The workspace volume is optional but prevents the container's writable layer from growing.

## Health check

The container includes a health check that hits `GET /api/v1/health`. Docker uses this to report container status:

```bash
docker inspect --format='{{.State.Health.Status}}' stirling-image
```

## Reverse proxy

If you're running Stirling Image behind nginx or Caddy, point it at port 1349. Example nginx config:

```nginx
server {
    listen 80;
    server_name images.example.com;

    client_max_body_size 200M;

    location / {
        proxy_pass http://localhost:1349;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Set `client_max_body_size` to match your `MAX_UPLOAD_SIZE_MB` value.

## CI/CD

The GitHub repository has two workflows:

- **docker-publish.yml** -- Builds and pushes the Docker image to Docker Hub on every push to `main` and on version tags. The image is published as `siddharth123sk/stirling-image`.
- **deploy-docs.yml** -- Builds this documentation site and deploys it to GitHub Pages.

Both run automatically. No manual steps needed after merging to `main`.
