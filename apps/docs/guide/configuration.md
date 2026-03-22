# Configuration

All configuration is done through environment variables. Every variable has a sensible default, so Stirling Image works out of the box without setting any of them.

## Environment variables

### Server

| Variable | Default | Description |
|---|---|---|
| `PORT` | `1350` | Port the server listens on. The Docker image overrides this to `1349`. |
| `RATE_LIMIT_PER_MIN` | `100` | Maximum requests per minute per IP. |

### Authentication

| Variable | Default | Description |
|---|---|---|
| `AUTH_ENABLED` | `false` | Set to `true` to require login. The Docker image defaults to `true`. |
| `DEFAULT_USERNAME` | `admin` | Username for the initial admin account. Only used on first run. |
| `DEFAULT_PASSWORD` | `admin` | Password for the initial admin account. Change this after first login. |

### Storage

| Variable | Default | Description |
|---|---|---|
| `STORAGE_MODE` | `local` | `local` or `s3`. Only local storage is currently implemented. |
| `DB_PATH` | `./data/stirling.db` | Path to the SQLite database file. |
| `WORKSPACE_PATH` | `./tmp/workspace` | Directory for temporary files during processing. Cleaned up automatically. |

### Processing limits

| Variable | Default | Description |
|---|---|---|
| `MAX_UPLOAD_SIZE_MB` | `100` | Maximum file size per upload in megabytes. |
| `MAX_BATCH_SIZE` | `200` | Maximum number of files in a single batch request. |
| `CONCURRENT_JOBS` | `3` | Number of batch jobs that run in parallel. Higher values use more memory. |
| `MAX_MEGAPIXELS` | `100` | Maximum image resolution allowed. Rejects images larger than this. |

### Cleanup

| Variable | Default | Description |
|---|---|---|
| `FILE_MAX_AGE_HOURS` | `24` | How long temporary files are kept before automatic deletion. |
| `CLEANUP_INTERVAL_MINUTES` | `30` | How often the cleanup job runs. |

### Appearance

| Variable | Default | Description |
|---|---|---|
| `APP_NAME` | `Stirling Image` | Display name shown in the UI. |
| `DEFAULT_THEME` | `light` | Default theme for new sessions. `light` or `dark`. |
| `DEFAULT_LOCALE` | `en` | Default interface language. |

## Docker example

```yaml
services:
  stirling-image:
    image: siddharth123sk/stirling-image:latest
    ports:
      - "1349:1349"
    volumes:
      - stirling-data:/data
      - stirling-workspace:/tmp/workspace
    environment:
      - AUTH_ENABLED=true
      - DEFAULT_USERNAME=admin
      - DEFAULT_PASSWORD=changeme
      - MAX_UPLOAD_SIZE_MB=200
      - CONCURRENT_JOBS=4
      - FILE_MAX_AGE_HOURS=12
    restart: unless-stopped
```

## Volumes

The Docker container uses two volumes:

- `/data` -- Persistent storage for the SQLite database. Mount this to keep users, API keys, and saved pipelines across container restarts.
- `/tmp/workspace` -- Temporary storage for images being processed. This can be ephemeral, but mounting it avoids filling up the container's writable layer.
