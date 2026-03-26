# Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the faceted gem logo as the default brand mark across the web app, docs site, and all meta assets (favicon, PWA icons, social preview).

**Architecture:** Create SVG logo assets in `apps/web/public/`, wire them into `index.html` as favicon/meta, display the gem icon in the app header/sidebar as the default (before any custom logo is uploaded), and add logo + favicon config to the VitePress docs site.

**Tech Stack:** SVG (hand-authored), Vite static assets, HTML meta tags, VitePress config

---

### Task 1: Create the SVG logo assets

**Files:**
- Create: `apps/web/public/logo-icon.svg`
- Create: `apps/web/public/favicon.svg`
- Create: `apps/web/public/logo.svg`

- [ ] **Step 1: Create `apps/web/public/` directory**

```bash
mkdir -p apps/web/public
```

- [ ] **Step 2: Create `apps/web/public/logo-icon.svg` — full-detail gem icon**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140" fill="none">
  <polygon points="70,16 100,48 70,60 40,48" fill="#3b82f6" opacity="1"/>
  <polygon points="40,48 70,60 70,124 22,60" fill="#3b82f6" opacity="0.7"/>
  <polygon points="100,48 70,60 70,124 118,60" fill="#3b82f6" opacity="0.5"/>
  <polygon points="70,16 40,48 22,60" fill="#3b82f6" opacity="0.85"/>
  <polygon points="70,16 100,48 118,60" fill="#3b82f6" opacity="0.65"/>
  <polygon points="70,16 118,60 70,124 22,60" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linejoin="round"/>
  <line x1="40" y1="48" x2="100" y2="48" stroke="#3b82f6" stroke-width="1.5" opacity="0.4"/>
</svg>
```

- [ ] **Step 3: Create `apps/web/public/favicon.svg` — simplified gem for small sizes (no outline, no girdle)**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 140 140" fill="none">
  <polygon points="70,16 100,48 70,60 40,48" fill="#3b82f6"/>
  <polygon points="40,48 70,60 70,124 22,60" fill="#3b82f6" opacity="0.7"/>
  <polygon points="100,48 70,60 70,124 118,60" fill="#3b82f6" opacity="0.5"/>
  <polygon points="70,16 40,48 22,60" fill="#3b82f6" opacity="0.85"/>
  <polygon points="70,16 100,48 118,60" fill="#3b82f6" opacity="0.65"/>
</svg>
```

- [ ] **Step 4: Create `apps/web/public/logo.svg` — full combination mark (icon + wordmark)**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="280" height="44" viewBox="0 0 280 44" fill="none">
  <!-- Gem icon scaled to 44px tall -->
  <g transform="translate(0,0) scale(0.314)">
    <polygon points="70,16 100,48 70,60 40,48" fill="#3b82f6" opacity="1"/>
    <polygon points="40,48 70,60 70,124 22,60" fill="#3b82f6" opacity="0.7"/>
    <polygon points="100,48 70,60 70,124 118,60" fill="#3b82f6" opacity="0.5"/>
    <polygon points="70,16 40,48 22,60" fill="#3b82f6" opacity="0.85"/>
    <polygon points="70,16 100,48 118,60" fill="#3b82f6" opacity="0.65"/>
    <polygon points="70,16 118,60 70,124 22,60" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linejoin="round"/>
    <line x1="40" y1="48" x2="100" y2="48" stroke="#3b82f6" stroke-width="1.5" opacity="0.4"/>
  </g>
  <!-- Wordmark -->
  <text x="56" y="30" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-weight="700" font-size="24" letter-spacing="-0.5" fill="#0f172a">Stirling </text>
  <text x="160" y="30" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-weight="700" font-size="24" letter-spacing="-0.5" fill="#3b82f6">Image</text>
</svg>
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/public/logo-icon.svg apps/web/public/favicon.svg apps/web/public/logo.svg
git commit -m "feat(branding): add faceted gem SVG logo assets"
```

---

### Task 2: Wire favicon and meta tags into index.html

**Files:**
- Modify: `apps/web/index.html`

- [ ] **Step 1: Add favicon and Open Graph meta tags to `apps/web/index.html`**

Replace the current `<head>` content with:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Stirling Image</title>
    <meta name="description" content="Open-source, self-hosted image processing platform" />
    <meta name="theme-color" content="#3b82f6" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta property="og:title" content="Stirling Image" />
    <meta property="og:description" content="Open-source, self-hosted image processing platform" />
    <meta property="og:type" content="website" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Verify favicon loads in dev**

```bash
pnpm dev
```

Open http://localhost:1349 in a browser. The browser tab should show the blue gem favicon.

- [ ] **Step 3: Commit**

```bash
git add apps/web/index.html
git commit -m "feat(branding): add favicon and meta tags to index.html"
```

---

### Task 3: Display gem icon as default logo in app header

**Files:**
- Modify: `apps/web/src/components/layout/app-layout.tsx`

The current code shows the text "Stirling Image" when no custom logo is uploaded. Replace it with the gem SVG icon + text.

- [ ] **Step 1: Create an inline GemLogo component at the top of `app-layout.tsx`**

Add this after the existing imports (before the `AppLayoutProps` interface):

```tsx
function GemLogo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon points="70,16 100,48 70,60 40,48" fill="currentColor" opacity="1" />
      <polygon points="40,48 70,60 70,124 22,60" fill="currentColor" opacity="0.7" />
      <polygon points="100,48 70,60 70,124 118,60" fill="currentColor" opacity="0.5" />
      <polygon points="70,16 40,48 22,60" fill="currentColor" opacity="0.85" />
      <polygon points="70,16 100,48 118,60" fill="currentColor" opacity="0.65" />
      <polygon
        points="70,16 118,60 70,124 22,60"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <line x1="40" y1="48" x2="100" y2="48" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    </svg>
  );
}
```

Note: Uses `currentColor` so it inherits the text-primary blue color from Tailwind.

- [ ] **Step 2: Replace the text-only fallback in the mobile sidebar header (around line 59-62)**

Replace:
```tsx
<span className="text-sm font-bold text-foreground">
  Stirling <span className="text-primary">Image</span>
</span>
```

With:
```tsx
<div className="flex items-center gap-2">
  <GemLogo className="h-5 w-5 text-primary" />
  <span className="text-sm font-bold text-foreground">
    Stirling <span className="text-primary">Image</span>
  </span>
</div>
```

- [ ] **Step 3: Replace the text-only fallback in the mobile top bar (around line 104-107)**

Replace the same text-only span with the same icon + text pattern:

```tsx
<div className="flex items-center gap-2">
  <GemLogo className="h-5 w-5 text-primary" />
  <span className="text-sm font-bold text-foreground">
    Stirling <span className="text-primary">Image</span>
  </span>
</div>
```

- [ ] **Step 4: Verify in dev**

```bash
pnpm dev
```

Open http://localhost:1349. The gem icon should appear next to "Stirling Image" in both mobile and desktop views. Test both light and dark mode — the icon should inherit the blue primary color.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/layout/app-layout.tsx
git commit -m "feat(branding): show gem icon in app header as default logo"
```

---

### Task 4: Add logo and favicon to VitePress docs site

**Files:**
- Create: `apps/docs/public/favicon.svg`
- Modify: `apps/docs/.vitepress/config.mts`

- [ ] **Step 1: Create `apps/docs/public/` directory and copy the favicon**

```bash
mkdir -p apps/docs/public
cp apps/web/public/favicon.svg apps/docs/public/favicon.svg
```

- [ ] **Step 2: Add favicon `head` entry and logo to `apps/docs/.vitepress/config.mts`**

Replace the existing `head` array:

```ts
head: [
  ["meta", { name: "theme-color", content: "#3b82f6" }],
  ["link", { rel: "icon", type: "image/svg+xml", href: "/Stirling-Image/favicon.svg" }],
],
```

Note: The `href` includes the base path `/Stirling-Image/` because VitePress is deployed to GitHub Pages with that base.

- [ ] **Step 3: Verify docs site in dev**

```bash
cd apps/docs && npx vitepress dev
```

Open the docs site in a browser. The tab should show the gem favicon.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/public/favicon.svg apps/docs/.vitepress/config.mts
git commit -m "feat(docs): add gem favicon to VitePress site"
```

---

### Task 5: Generate PNG assets for PWA and social preview

**Files:**
- Create: `apps/web/public/logo-192.png`
- Create: `apps/web/public/logo-512.png`
- Modify: `apps/web/index.html` (add PWA manifest link)
- Create: `apps/web/public/manifest.json`

- [ ] **Step 1: Generate PNG icons from the SVG using Sharp**

Create a one-off script and run it:

```bash
cd /Users/sidd/Desktop/Personal/Projects/Stirling-Image
node -e "
const sharp = require('sharp');
const fs = require('fs');
const svg = fs.readFileSync('apps/web/public/logo-icon.svg');

Promise.all([
  sharp(svg).resize(192, 192).png().toFile('apps/web/public/logo-192.png'),
  sharp(svg).resize(512, 512).png().toFile('apps/web/public/logo-512.png'),
]).then(() => console.log('PNGs generated'));
"
```

If `require` doesn't work (ESM), use:

```bash
node --input-type=module -e "
import sharp from 'sharp';
import { readFileSync } from 'fs';
const svg = readFileSync('apps/web/public/logo-icon.svg');
await sharp(svg).resize(192, 192).png().toFile('apps/web/public/logo-192.png');
await sharp(svg).resize(512, 512).png().toFile('apps/web/public/logo-512.png');
console.log('PNGs generated');
"
```

- [ ] **Step 2: Create `apps/web/public/manifest.json`**

```json
{
  "name": "Stirling Image",
  "short_name": "Stirling Image",
  "icons": [
    { "src": "/logo-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/logo-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#3b82f6",
  "background_color": "#ffffff",
  "display": "standalone"
}
```

- [ ] **Step 3: Add manifest link to `apps/web/index.html`**

Add after the favicon link in `<head>`:

```html
<link rel="manifest" href="/manifest.json" />
```

- [ ] **Step 4: Verify PNGs were generated correctly**

```bash
file apps/web/public/logo-192.png apps/web/public/logo-512.png
```

Expected: both should report as PNG image data with correct dimensions.

- [ ] **Step 5: Commit**

```bash
git add apps/web/public/logo-192.png apps/web/public/logo-512.png apps/web/public/manifest.json apps/web/index.html
git commit -m "feat(branding): add PWA manifest and PNG logo assets"
```
