import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";

const execFileAsync = promisify(execFile);

export interface SeamCarveOptions {
  width?: number;
  height?: number;
  protectFaces?: boolean;
  blurRadius?: number;
  sobelThreshold?: number;
  square?: boolean;
}

export interface SeamCarveResult {
  buffer: Buffer;
  width: number;
  height: number;
}

/**
 * Discover the caire binary. Checks PATH (Docker installs to /usr/local/bin)
 * and the CAIRE_PATH env var for local development.
 */
let cachedCairePath: string | null = null;

async function findCaire(): Promise<string> {
  if (cachedCairePath) return cachedCairePath;

  const candidates = process.env.CAIRE_PATH ? [process.env.CAIRE_PATH, "caire"] : ["caire"];

  for (const cmd of candidates) {
    try {
      await execFileAsync(cmd, ["-help"], { timeout: 5_000 });
      cachedCairePath = cmd;
      return cmd;
    } catch {
      // try next
    }
  }
  throw new Error(
    "caire binary not found. Install via: go install github.com/esimov/caire/cmd/caire@v1.5.0",
  );
}

/** Max pixels on the longest edge before downscaling for caire. */
const MAX_CAIRE_DIMENSION = 1200;

/**
 * Content-aware resize using caire (Go seam carving engine).
 * Supports both shrinking and enlarging via seam removal/insertion.
 *
 * Large images (>1200px longest edge) are downscaled first because
 * seam carving is O(width * height * seams) and becomes impractical
 * on high-resolution inputs. JPEG intermediate is used because Go's
 * JPEG decoder is significantly faster than PNG for large images.
 */
export async function seamCarve(
  inputBuffer: Buffer,
  outputDir: string,
  options: SeamCarveOptions = {},
): Promise<SeamCarveResult> {
  const cairePath = await findCaire();
  const id = randomUUID();
  // Use JPEG for input (fast decode in Go) and PNG for output (lossless)
  const inputPath = join(outputDir, `caire-in-${id}.jpg`);
  const outputPath = join(outputDir, `caire-out-${id}.png`);

  try {
    // Downscale large images and convert to JPEG for fast caire processing
    const meta = await sharp(inputBuffer).metadata();
    const origWidth = meta.width ?? 0;
    const origHeight = meta.height ?? 0;
    const longest = Math.max(origWidth, origHeight);

    let width = origWidth;
    let height = origHeight;

    if (longest > MAX_CAIRE_DIMENSION) {
      const scale = MAX_CAIRE_DIMENSION / longest;
      width = Math.round(origWidth * scale);
      height = Math.round(origHeight * scale);
    }

    // Always output JPEG for caire input (Go decodes JPEG 3-5x faster than PNG)
    const processBuffer = await sharp(inputBuffer)
      .resize(width, height, { fit: "fill" })
      .jpeg({ quality: 95 })
      .toBuffer();

    await writeFile(inputPath, processBuffer);

    // Build caire arguments
    const args = ["-in", inputPath, "-out", outputPath, "-preview=false"];

    if (options.square) {
      const shortest = Math.min(width, height);
      args.push("-square", "-width", String(shortest), "-height", String(shortest));
    } else {
      if (options.width) {
        // Scale user-specified dimensions proportionally if image was downscaled
        const targetW =
          longest > MAX_CAIRE_DIMENSION
            ? Math.round(options.width * (MAX_CAIRE_DIMENSION / longest))
            : options.width;
        args.push("-width", String(targetW));
      }
      if (options.height) {
        const targetH =
          longest > MAX_CAIRE_DIMENSION
            ? Math.round(options.height * (MAX_CAIRE_DIMENSION / longest))
            : options.height;
        args.push("-height", String(targetH));
      }
    }

    if (options.protectFaces) args.push("-face");
    if (options.blurRadius !== undefined) args.push("-blur", String(options.blurRadius));
    if (options.sobelThreshold !== undefined) args.push("-sobel", String(options.sobelThreshold));

    await execFileAsync(cairePath, args, { timeout: 120_000 });

    const buffer = await readFile(outputPath);
    const outMeta = await sharp(buffer).metadata();

    return {
      buffer,
      width: outMeta.width ?? 0,
      height: outMeta.height ?? 0,
    };
  } finally {
    await rm(inputPath, { force: true }).catch(() => {});
    await rm(outputPath, { force: true }).catch(() => {});
  }
}
