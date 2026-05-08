/**
 * Generates device frame PNG assets + meta.json files from SVG templates.
 *
 * Run: cd apps/api && npx tsx scripts/generate-frames.ts
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRAMES_DIR = join(__dirname, "../src/assets/frames");

interface FrameDef {
  id: string;
  svg: string;
  meta: { screenX: number; screenY: number; screenW: number; screenH: number };
}

// ---------------------------------------------------------------------------
// iPhone frames
// ---------------------------------------------------------------------------
function iphoneSvg(variant: "light" | "dark"): string {
  const body = variant === "light" ? "#c0c0c0" : "#2a2a2a";
  const border = variant === "light" ? "#333333" : "#111111";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="430" height="880">
  <!-- Body -->
  <rect x="0" y="0" width="430" height="880" rx="50" ry="50" fill="${body}"/>
  <!-- Screen border -->
  <rect x="15" y="75" width="400" height="730" rx="5" ry="5" fill="${border}"/>
  <!-- Screen (transparent) -->
  <rect x="20" y="80" width="390" height="720" rx="3" ry="3" fill="transparent"/>
  <!-- Notch -->
  <rect x="165" y="10" width="100" height="30" rx="15" ry="15" fill="${border}"/>
</svg>`;
}

const IPHONE_META = { screenX: 20, screenY: 80, screenW: 390, screenH: 720 };

// ---------------------------------------------------------------------------
// MacBook frames
// ---------------------------------------------------------------------------
function macbookSvg(variant: "light" | "dark"): string {
  const bezel = variant === "light" ? "#d4d4d8" : "#3f3f46";
  const base = variant === "light" ? "#e4e4e7" : "#27272a";
  const cameraDot = variant === "light" ? "#a1a1aa" : "#52525b";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="780">
  <!-- Screen bezel -->
  <rect x="50" y="0" width="1100" height="690" rx="12" ry="12" fill="${bezel}"/>
  <!-- Screen (transparent) -->
  <rect x="100" y="30" width="1000" height="625" rx="4" ry="4" fill="transparent"/>
  <!-- Camera dot -->
  <circle cx="600" cy="15" r="4" fill="${cameraDot}"/>
  <!-- Base / hinge -->
  <rect x="0" y="690" width="1200" height="20" rx="4" ry="4" fill="${bezel}"/>
  <!-- Laptop base -->
  <path d="M80,710 L1120,710 L1200,780 L0,780 Z" fill="${base}"/>
</svg>`;
}

const MACBOOK_META = { screenX: 100, screenY: 30, screenW: 1000, screenH: 625 };

// ---------------------------------------------------------------------------
// iPad frames
// ---------------------------------------------------------------------------
function ipadSvg(variant: "light" | "dark"): string {
  const body = variant === "light" ? "#d4d4d8" : "#3f3f46";
  const cameraDot = variant === "light" ? "#a1a1aa" : "#52525b";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="540" height="720">
  <!-- Body -->
  <rect x="0" y="0" width="540" height="720" rx="20" ry="20" fill="${body}"/>
  <!-- Screen (transparent) -->
  <rect x="25" y="25" width="490" height="670" rx="4" ry="4" fill="transparent"/>
  <!-- Camera dot (top center) -->
  <circle cx="270" cy="12" r="4" fill="${cameraDot}"/>
</svg>`;
}

const IPAD_META = { screenX: 25, screenY: 25, screenW: 490, screenH: 670 };

// ---------------------------------------------------------------------------
// Generate all frames
// ---------------------------------------------------------------------------
const frames: FrameDef[] = [
  { id: "iphone", svg: iphoneSvg("light"), meta: IPHONE_META },
  { id: "iphone-dark", svg: iphoneSvg("dark"), meta: IPHONE_META },
  { id: "macbook", svg: macbookSvg("light"), meta: MACBOOK_META },
  { id: "macbook-dark", svg: macbookSvg("dark"), meta: MACBOOK_META },
  { id: "ipad", svg: ipadSvg("light"), meta: IPAD_META },
  { id: "ipad-dark", svg: ipadSvg("dark"), meta: IPAD_META },
];

async function main() {
  if (!existsSync(FRAMES_DIR)) {
    mkdirSync(FRAMES_DIR, { recursive: true });
  }

  for (const frame of frames) {
    const pngPath = join(FRAMES_DIR, `${frame.id}.png`);
    const metaPath = join(FRAMES_DIR, `${frame.id}.meta.json`);

    const pngBuf = await sharp(Buffer.from(frame.svg)).png().toBuffer();
    writeFileSync(pngPath, pngBuf);
    writeFileSync(metaPath, JSON.stringify(frame.meta, null, 2) + "\n");

    console.log(`Generated ${frame.id}.png + ${frame.id}.meta.json`);
  }

  console.log(`\nAll frames written to ${FRAMES_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
