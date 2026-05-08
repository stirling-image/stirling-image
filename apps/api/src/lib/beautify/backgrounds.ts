import sharp from "sharp";
import { parseHex } from "./constants.js";

interface SolidOpts {
  type: "solid";
  color: string;
  width: number;
  height: number;
}

interface GradientOpts {
  type: "linear-gradient" | "radial-gradient";
  stops: Array<{ color: string; position: number }>;
  angle?: number;
  width: number;
  height: number;
}

interface TransparentOpts {
  type: "transparent";
  width: number;
  height: number;
}

interface ImageOpts {
  type: "image";
  imageBuffer: Buffer;
  width: number;
  height: number;
}

export type BackgroundOpts = SolidOpts | GradientOpts | TransparentOpts | ImageOpts;

export async function generateBackground(opts: BackgroundOpts): Promise<Buffer> {
  const { width, height } = opts;

  if (opts.type === "solid") {
    const c = parseHex(opts.color);
    return sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: c.r, g: c.g, b: c.b, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
  }

  if (opts.type === "transparent") {
    return sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .png()
      .toBuffer();
  }

  if (opts.type === "image") {
    return sharp(opts.imageBuffer)
      .resize(width, height, { fit: "cover" })
      .ensureAlpha()
      .png()
      .toBuffer();
  }

  // Gradient (linear or radial)
  const stops = opts.stops
    .map((s) => `<stop offset="${s.position}%" stop-color="${s.color}"/>`)
    .join("\n      ");

  let gradientDef: string;
  if (opts.type === "linear-gradient") {
    const angle = opts.angle ?? 135;
    const rad = ((angle - 90) * Math.PI) / 180;
    const x1 = Math.round(50 - Math.cos(rad) * 50);
    const y1 = Math.round(50 - Math.sin(rad) * 50);
    const x2 = Math.round(50 + Math.cos(rad) * 50);
    const y2 = Math.round(50 + Math.sin(rad) * 50);
    gradientDef = `<linearGradient id="g" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
      ${stops}
    </linearGradient>`;
  } else {
    gradientDef = `<radialGradient id="g" cx="50%" cy="50%" r="70%">
      ${stops}
    </radialGradient>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>${gradientDef}</defs>
  <rect width="${width}" height="${height}" fill="url(#g)"/>
</svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

export function getDominantBackground(
  opts: Pick<BackgroundOpts, "type"> & {
    color?: string;
    stops?: Array<{ color: string; position: number }>;
  },
): { r: number; g: number; b: number; alpha: number } {
  if (opts.type === "solid" && opts.color) {
    const c = parseHex(opts.color);
    return { ...c, alpha: 1 };
  }
  if ((opts.type === "linear-gradient" || opts.type === "radial-gradient") && opts.stops?.length) {
    const last = opts.stops[opts.stops.length - 1];
    const c = parseHex(last.color);
    return { ...c, alpha: 1 };
  }
  return { r: 0, g: 0, b: 0, alpha: 0 };
}
