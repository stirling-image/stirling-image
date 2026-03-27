<p align="center">
  <img src="apps/web/public/logo-192.png" width="80" alt="Stirling Image logo">
</p>

<h1 align="center">Stirling Image - The Open-Source Image Processing Platform</h1>

Stirling Image is a powerful, open-source image processing platform. Self-host it in a single Docker container with a private API. Resize, compress, convert, remove backgrounds, upscale, run OCR, and more — without sending images to external services.

<p align="center">
  <a href="https://github.com/siddharthksah/Stirling-Image/pkgs/container/stirling-image"><img src="https://img.shields.io/badge/Docker-ghcr.io-blue?logo=docker" alt="Docker"></a>
  <a href="https://github.com/siddharthksah/Stirling-Image/actions"><img src="https://img.shields.io/github/actions/workflow/status/siddharthksah/Stirling-Image/ci.yml?label=CI" alt="CI"></a>
  <a href="https://github.com/siddharthksah/Stirling-Image/blob/main/LICENSE"><img src="https://img.shields.io/github/license/siddharthksah/Stirling-Image" alt="License"></a>
  <a href="https://github.com/siddharthksah/Stirling-Image/stargazers"><img src="https://img.shields.io/github/stars/siddharthksah/Stirling-Image?style=social" alt="Stars"></a>
</p>

![Stirling Image - Dashboard](images/dashboard.png)

## Key Capabilities

- **33+ image tools** — Resize, crop, compress, convert, watermark, OCR, and more.
- **AI-powered** — Background removal, upscaling, object erasing, face blurring — all running locally.
- **Automation & workflows** — Chain tools into reusable pipelines. Batch process up to 200 images at once.
- **Developer platform** — REST API for every tool. Swagger docs included.
- **Your data stays yours** — No telemetry, no tracking, no cloud. Single Docker container on any architecture.

For a full feature list, see the docs: **https://siddharthksah.github.io/Stirling-Image/**

## Quick Start

```bash
docker run -d -p 1349:1349 -v stirling-data:/data ghcr.io/siddharthksah/stirling-image:latest
```

Then open: http://localhost:1349. Default login: `admin` / `admin`.

For full installation options, see the [Getting Started Guide](https://siddharthksah.github.io/Stirling-Image/guide/getting-started).

## Resources

- [**Documentation**](https://siddharthksah.github.io/Stirling-Image/)
- [**API Docs**](https://siddharthksah.github.io/Stirling-Image/api/rest)
- [**Configuration**](https://siddharthksah.github.io/Stirling-Image/guide/configuration)

## Support

- **Bug Reports**: [GitHub Issues](https://github.com/siddharthksah/Stirling-Image/issues)

<p align="center">
  <a href="https://github.com/sponsors/siddharthksah"><img src="https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?logo=github-sponsors" alt="GitHub Sponsors"></a>
  <a href="https://ko-fi.com/siddharthksah"><img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Ko--fi-FF5E5B?logo=ko-fi" alt="Ko-fi"></a>
</p>

## Contributing

Contributions welcome. Open an issue first so we can talk about what you have in mind.

## License

[MIT](LICENSE)
