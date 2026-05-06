---
layout: home

hero:
  name: "SnapOtter"
  text: "Self-Hosted Image Processing Platform"
  tagline: "48 tools. 15 AI models. 100% offline. Open source."
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /api/rest

features:
  - icon: "🔧"
    title: "48 Image Tools"
    details: "Resize, crop, compress, watermark, convert, and more. Everything you need for image processing in one place."
  - icon: "🤖"
    title: "15 Local AI Models"
    details: "Background removal, upscaling, face enhancement, colorization, OCR, and more. All running on your hardware."
  - icon: "🔗"
    title: "Pipeline Automation"
    details: "Chain tools into reusable workflows. Process thousands of images with a single click."
  - icon: "📡"
    title: "REST API"
    details: "Full REST API with OpenAPI documentation. Integrate image processing into your applications."
  - icon: "📁"
    title: "File Library"
    details: "Organized file management with versions, metadata, and batch operations."
  - icon: "👥"
    title: "Teams & Access Control"
    details: "Multi-user support with roles, permissions, API keys, and audit logging."
---

<div class="quick-start-banner">

```bash
docker run -d --name SnapOtter -p 1349:1349 -v SnapOtter-data:/data snapotter/snapotter:latest
```

</div>
