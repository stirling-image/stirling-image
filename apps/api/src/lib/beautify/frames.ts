import sharp from "sharp";
import { DEVICE_FRAMES, SVG_FRAMES } from "./constants.js";

const WINDOW_TITLE_BAR_HEIGHT = 36;
const BROWSER_TITLE_BAR_HEIGHT = 72;

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function macosFrame(width: number, variant: "light" | "dark", title?: string): string {
  const bg = variant === "light" ? "#e8e8e8" : "#3a3a3c";
  const h = WINDOW_TITLE_BAR_HEIGHT;
  const dotY = h / 2;
  const dotR = 6;
  const dotStart = 20;
  const dotGap = 20;

  const titleText = title
    ? `<text x="${width / 2}" y="${dotY + 1}" text-anchor="middle" font-family="sans-serif" font-size="13" fill="${variant === "light" ? "#4b4b4b" : "#d4d4d4"}">${escapeXml(title)}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${h}">
  <rect width="${width}" height="${h}" fill="${bg}"/>
  <circle cx="${dotStart}" cy="${dotY}" r="${dotR}" fill="#ff5f57"/>
  <circle cx="${dotStart + dotGap}" cy="${dotY}" r="${dotR}" fill="#febc2e"/>
  <circle cx="${dotStart + dotGap * 2}" cy="${dotY}" r="${dotR}" fill="#28c840"/>
  ${titleText}
</svg>`;
}

function windowsFrame(width: number, variant: "light" | "dark", title?: string): string {
  const bg = variant === "light" ? "#f0f0f0" : "#2b2b2b";
  const h = WINDOW_TITLE_BAR_HEIGHT;
  const iconColor = variant === "light" ? "#616161" : "#a0a0a0";
  const closeHoverBg = variant === "light" ? "#e81123" : "#e81123";
  const midY = h / 2;
  const btnW = 46;
  const btnH = h;

  const closeX = width - btnW;
  const maxX = closeX - btnW;
  const minX = maxX - btnW;

  const titleText = title
    ? `<text x="12" y="${midY + 1}" dominant-baseline="middle" font-family="sans-serif" font-size="12" fill="${variant === "light" ? "#1a1a1a" : "#d4d4d4"}">${escapeXml(title)}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${h}">
  <rect width="${width}" height="${h}" fill="${bg}"/>
  ${titleText}
  <g>
    <!-- Minimize -->
    <line x1="${minX + 18}" y1="${midY}" x2="${minX + 28}" y2="${midY}" stroke="${iconColor}" stroke-width="1"/>
    <!-- Maximize -->
    <rect x="${maxX + 18}" y="${midY - 5}" width="10" height="10" fill="none" stroke="${iconColor}" stroke-width="1"/>
    <!-- Close -->
    <rect x="${closeX}" y="0" width="${btnW}" height="${btnH}" fill="${closeHoverBg}" opacity="0"/>
    <line x1="${closeX + 18}" y1="${midY - 5}" x2="${closeX + 28}" y2="${midY + 5}" stroke="${iconColor}" stroke-width="1"/>
    <line x1="${closeX + 28}" y1="${midY - 5}" x2="${closeX + 18}" y2="${midY + 5}" stroke="${iconColor}" stroke-width="1"/>
  </g>
</svg>`;
}

function browserFrame(width: number, variant: "light" | "dark", title?: string): string {
  const bg = variant === "light" ? "#f1f5f9" : "#1e293b";
  const h = BROWSER_TITLE_BAR_HEIGHT;
  const topH = 36;
  const bottomH = h - topH;

  const dotY = topH / 2;
  const dotR = 6;
  const dotStart = 20;
  const dotGap = 20;

  const tabBg = variant === "light" ? "#ffffff" : "#334155";
  const tabTextColor = variant === "light" ? "#334155" : "#e2e8f0";
  const tabText = title ? escapeXml(title) : "New Tab";
  const tabWidth = Math.min(200, width - 120);
  const tabX = dotStart + dotGap * 3 + 16;

  const barBg = variant === "light" ? "#ffffff" : "#0f172a";
  const barTextColor = variant === "light" ? "#64748b" : "#94a3b8";
  const barPadX = 12;
  const barY = topH + 6;
  const barH = bottomH - 12;
  const barRx = Math.min(barH / 2, 10);
  const urlText = title ? escapeXml(title) : "";

  // Lock icon path (small padlock in the URL bar)
  const lockX = barPadX + 10;
  const lockY = barY + barH / 2;
  const lockColor = variant === "light" ? "#16a34a" : "#4ade80";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${h}">
  <!-- Top bar background -->
  <rect width="${width}" height="${topH}" fill="${bg}"/>
  <!-- Bottom bar background -->
  <rect y="${topH}" width="${width}" height="${bottomH}" fill="${bg}"/>

  <!-- Traffic lights -->
  <circle cx="${dotStart}" cy="${dotY}" r="${dotR}" fill="#ff5f57"/>
  <circle cx="${dotStart + dotGap}" cy="${dotY}" r="${dotR}" fill="#febc2e"/>
  <circle cx="${dotStart + dotGap * 2}" cy="${dotY}" r="${dotR}" fill="#28c840"/>

  <!-- Tab -->
  <rect x="${tabX}" y="8" width="${tabWidth}" height="${topH - 8}" rx="8" ry="8" fill="${tabBg}"/>
  <text x="${tabX + 12}" y="${dotY + 1}" dominant-baseline="middle" font-family="sans-serif" font-size="12" fill="${tabTextColor}">${tabText}</text>

  <!-- Address bar -->
  <rect x="${barPadX}" y="${barY}" width="${width - barPadX * 2}" height="${barH}" rx="${barRx}" ry="${barRx}" fill="${barBg}"/>

  <!-- Lock icon -->
  <g transform="translate(${lockX}, ${lockY})">
    <rect x="-4" y="-2" width="8" height="6" rx="1" fill="${lockColor}"/>
    <path d="M-3,-2 L-3,-4 A3,3 0 0,1 3,-4 L3,-2" fill="none" stroke="${lockColor}" stroke-width="1.5"/>
  </g>

  <!-- URL text -->
  <text x="${lockX + 10}" y="${lockY + 1}" dominant-baseline="middle" font-family="sans-serif" font-size="12" fill="${barTextColor}">${urlText}</text>

  <!-- Separator line -->
  <line x1="0" y1="${h}" x2="${width}" y2="${h}" stroke="${variant === "light" ? "#e2e8f0" : "#334155"}" stroke-width="1"/>
</svg>`;
}

function generateSvgFrame(
  width: number,
  frame: string,
  title?: string,
): { svg: string; height: number } {
  switch (frame) {
    case "macos-light":
      return { svg: macosFrame(width, "light", title), height: WINDOW_TITLE_BAR_HEIGHT };
    case "macos-dark":
      return { svg: macosFrame(width, "dark", title), height: WINDOW_TITLE_BAR_HEIGHT };
    case "windows-light":
      return { svg: windowsFrame(width, "light", title), height: WINDOW_TITLE_BAR_HEIGHT };
    case "windows-dark":
      return { svg: windowsFrame(width, "dark", title), height: WINDOW_TITLE_BAR_HEIGHT };
    case "browser-light":
      return { svg: browserFrame(width, "light", title), height: BROWSER_TITLE_BAR_HEIGHT };
    case "browser-dark":
      return { svg: browserFrame(width, "dark", title), height: BROWSER_TITLE_BAR_HEIGHT };
    default:
      throw new Error(`Unknown SVG frame type: ${frame}`);
  }
}

export async function renderFrame(
  imageBuffer: Buffer,
  frame: string,
  title?: string,
): Promise<Buffer> {
  if (frame === "none") {
    return imageBuffer;
  }

  if (DEVICE_FRAMES.has(frame)) {
    return imageBuffer;
  }

  if (!SVG_FRAMES.has(frame)) {
    return imageBuffer;
  }

  const meta = await sharp(imageBuffer).metadata();
  const imgW = meta.width ?? 100;
  const imgH = meta.height ?? 100;

  const { svg, height: titleBarH } = generateSvgFrame(imgW, frame, title);

  const titleBarBuf = await sharp(Buffer.from(svg)).resize(imgW, titleBarH).png().toBuffer();

  const result = await sharp({
    create: {
      width: imgW,
      height: titleBarH + imgH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: titleBarBuf, left: 0, top: 0 },
      { input: imageBuffer, left: 0, top: titleBarH },
    ])
    .png()
    .toBuffer();

  return result;
}
