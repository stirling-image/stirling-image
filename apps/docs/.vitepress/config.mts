import { defineConfig } from "vitepress";
import llmstxt from "vitepress-plugin-llms";

export default defineConfig({
  title: "SnapOtter",
  description:
    "Documentation for SnapOtter - A Self Hosted Image Manipulator. 48 tools, local AI, pipelines, REST API.",
  base: "/",
  appearance: "dark",
  srcDir: ".",
  outDir: "./.vitepress/dist",
  ignoreDeadLinks: [/localhost/],

  head: [
    ["meta", { name: "theme-color", content: "#f59e0b" }],
    ["link", { rel: "icon", type: "image/png", href: "/favicon.png" }],
    ["link", { rel: "llms-txt", href: "/llms.txt" }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap' }],
  ],

  vite: {
    plugins: [
      llmstxt({
        domain: "https://docs.snapotter.com",
        customLLMsTxtTemplate: `# {title}

{description}

{details}

## Docs

{toc}

## API Quick Reference

- Base URL: \`http://localhost:1349\`
- Auth: Session token via \`POST /api/auth/login\` or API key (\`Authorization: Bearer si_...\`)
- Tools: \`POST /api/v1/tools/{toolId}\` (multipart: file + settings JSON)
- Batch: \`POST /api/v1/tools/{toolId}/batch\` (multiple files, returns ZIP)
- Pipelines: \`POST /api/v1/pipeline/execute\` (chain tools sequentially)
- Interactive API docs on running instance: \`/api/docs\`
- OpenAPI spec on running instance: \`/api/v1/openapi.yaml\`

## Source

- [GitHub](https://github.com/snapotter-hq/snapotter)
- License: AGPLv3 (commercial license also available)
`,
        customTemplateVariables: {
          description:
            "SnapOtter is a self-hosted, open-source image processing platform with 48 tools including AI/ML. Runs in a single Docker container with GPU auto-detection.",
          details:
            "Resize, compress, convert, remove backgrounds, upscale, run OCR, and more - without sending images to external services.",
        },
      }),
    ],
  },

  themeConfig: {
    logo: "/logo.png",

    nav: [
      { text: "Home", link: "/" },
      { text: "Guide", link: "/guide/getting-started" },
      { text: "API Reference", link: "/api/rest" },
    ],

    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting started", link: "/guide/getting-started" },
          { text: "Architecture", link: "/guide/architecture" },
          { text: "Configuration", link: "/guide/configuration" },
          { text: "Database", link: "/guide/database" },
          { text: "Deployment", link: "/guide/deployment" },
          { text: "Hardware requirements", link: "/guide/deployment#hardware-requirements" },
          { text: "Docker tags", link: "/guide/docker-tags" },
          { text: "Developer guide", link: "/guide/developer" },
          { text: "Translation guide", link: "/guide/translations" },
          { text: "Contributing", link: "/guide/contributing" },
        ],
      },
      {
        text: "API reference",
        items: [
          { text: "REST API", link: "/api/rest" },
          { text: "Image engine", link: "/api/image-engine" },
          { text: "AI engine", link: "/api/ai" },
        ],
      },
    ],

    search: {
      provider: "local",
    },

    footer: {
      message:
        'Released under the <a href="https://github.com/snapotter-hq/snapotter/blob/main/LICENSE">AGPLv3 License</a>.',
      copyright:
        'AI-friendly docs available at <a href="/llms.txt">/llms.txt</a> · <a href="/llms-full.txt">/llms-full.txt</a>',
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/snapotter-hq/snapotter" },
      { icon: "discord", link: "https://discord.gg/hr3s7HPUsr" },
    ],

    editLink: {
      pattern: "https://github.com/snapotter-hq/snapotter/edit/main/apps/docs/:path",
      text: "Edit this page on GitHub",
    },
  },
});
