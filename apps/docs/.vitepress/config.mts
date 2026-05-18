import { defineConfig } from "vitepress";
import llmstxt from "vitepress-plugin-llms";
import pkg from "../package.json";

export default defineConfig({
  title: "SnapOtter",
  description:
    "Documentation for SnapOtter - A Self Hosted Image Manipulator. 52 tools, local AI, pipelines, REST API.",
  base: "/",
  appearance: { initialValue: "light" },
  srcDir: ".",
  outDir: "./.vitepress/dist",
  ignoreDeadLinks: [/localhost/],

  sitemap: { hostname: "https://docs.snapotter.com" },

  head: [
    ["meta", { name: "theme-color", content: "#3b82f6" }],
    ["link", { rel: "icon", type: "image/png", sizes: "48x48", href: "/favicon.png" }],
    ["link", { rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    ["link", { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" }],
    ["link", { rel: "llms-txt", href: "/llms.txt" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: "SnapOtter Docs" }],
    ["meta", { property: "og:image", content: "https://docs.snapotter.com/og-image.png" }],
    ["meta", { property: "og:image:width", content: "1280" }],
    ["meta", { property: "og:image:height", content: "640" }],
    ["meta", { property: "og:image:alt", content: "SnapOtter - Self-Hosted Image Processing" }],
    ["meta", { property: "og:locale", content: "en_US" }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:site", content: "@SnapOtterHQ" }],
    ["meta", { name: "twitter:image", content: "https://docs.snapotter.com/og-image.png" }],
  ],

  transformHead({ pageData }) {
    const head: Array<[string, Record<string, string>]> = [];
    const canonicalUrl = `https://docs.snapotter.com/${pageData.relativePath.replace(/(^|\/)index\.md$/, "$1").replace(/\.md$/, "")}`;
    head.push(["meta", { property: "og:url", content: canonicalUrl }]);
    head.push(["meta", { property: "og:title", content: pageData.title }]);
    if (pageData.description) {
      head.push(["meta", { property: "og:description", content: pageData.description }]);
      head.push(["meta", { name: "twitter:description", content: pageData.description }]);
    }
    head.push(["meta", { name: "twitter:title", content: pageData.title }]);
    return head;
  },

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
            "SnapOtter is a self-hosted, open-source image processing platform with 52 tools including AI/ML. Runs in a single Docker container with GPU auto-detection.",
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
      { text: "Changelog", link: "/changelog" },
      {
        text: `v${pkg.version}`,
        link: "/changelog",
      },
    ],

    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting started", link: "/guide/getting-started" },
          { text: "Architecture", link: "/guide/architecture" },
          { text: "Configuration", link: "/guide/configuration" },
          { text: "OIDC / SSO", link: "/guide/oidc" },
          { text: "Database", link: "/guide/database" },
          { text: "Deployment", link: "/guide/deployment" },
          { text: "Supported Formats", link: "/guide/supported-formats" },
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
      {
        text: "Project",
        items: [{ text: "Changelog", link: "/changelog" }],
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
