import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Formats that need external CLI tools (not decodable by Sharp). */
const CLI_DECODED_FORMATS = new Set(["raw", "ico", "tga", "psd", "exr", "hdr", "bmp", "jxl"]);

export function needsCliDecode(format: string): boolean {
  return CLI_DECODED_FORMATS.has(format);
}

/**
 * Main entry point - routes to the right decoder based on format.
 * Returns a PNG buffer that Sharp can process downstream.
 *
 * @param buffer - The raw file buffer
 * @param format - The detected format string (e.g. "raw", "psd", "ico")
 * @param ext    - Optional original file extension (e.g. "cr3", "nef").
 *                 Passed to decodeRaw so the temp file uses the correct
 *                 extension, which helps ExifTool and ImageMagick identify
 *                 the RAW variant.
 */
export async function decodeToSharpCompat(
  buffer: Buffer,
  format: string,
  ext?: string,
): Promise<Buffer> {
  switch (format) {
    case "raw":
      return decodeRaw(buffer, ext);
    case "ico":
      return decodeIco(buffer);
    case "psd":
      return decodePsd(buffer);
    case "tga":
      return decodeTga(buffer);
    case "exr":
      return decodeExr(buffer);
    case "hdr":
      return decodeHdr(buffer);
    case "bmp":
      return decodeBmp(buffer);
    case "jxl":
      return decodeJxl(buffer);
    default:
      return buffer;
  }
}

// ── ImageMagick helpers ────────────────────────────────────────

let cachedMagickCmd: string | null = null;

async function findMagickCmd(): Promise<string> {
  if (cachedMagickCmd) return cachedMagickCmd;
  for (const cmd of ["magick", "convert"]) {
    try {
      await execFileAsync(cmd, ["--version"], { timeout: 5_000 });
      cachedMagickCmd = cmd;
      return cmd;
    } catch {
      // try next
    }
  }
  throw new Error("No ImageMagick found. Install imagemagick (provides convert/magick).");
}

function magickArgs(cmd: string, args: string[]): string[] {
  return cmd === "magick" ? ["convert", ...args] : args;
}

// ── ICO decoder ────────────────────────────────────────────────

async function decodeIco(buffer: Buffer): Promise<Buffer> {
  const cmd = await findMagickCmd();
  const id = randomUUID();
  const inputPath = join(tmpdir(), `ico-in-${id}.ico`);
  const outputPath = join(tmpdir(), `ico-out-${id}.png`);

  try {
    await writeFile(inputPath, buffer);
    // ICO contains multiple sizes; extract the largest by sorting
    await execFileAsync(cmd, magickArgs(cmd, [`${inputPath}[-1]`, `png:${outputPath}`]), {
      timeout: 120_000,
    });
    return await readFile(outputPath);
  } finally {
    await rm(inputPath, { force: true }).catch(() => {});
    await rm(outputPath, { force: true }).catch(() => {});
  }
}

// ── RAW decoder (ExifTool-first, ImageMagick fallback) ──────────
//
// Strategy: Many camera RAW files (CR2, CR3, NEF, ARW, etc.) embed a
// full-size JPEG preview. ExifTool can extract it near-instantly with
// `-b -JpgFromRaw`. This is faster and more reliable than ImageMagick's
// LibRaw delegate, which may not support newer formats like CR3.
//
// If ExifTool extraction fails (no embedded JPEG, or exiftool not
// installed), we fall back to ImageMagick + LibRaw.

async function decodeRaw(buffer: Buffer, ext?: string): Promise<Buffer> {
  const id = randomUUID();
  // Use the original extension so ExifTool / ImageMagick can identify the RAW variant.
  const suffix = ext ? `.${ext.replace(/^\./, "")}` : ".dng";
  const inputPath = join(tmpdir(), `raw-in-${id}${suffix}`);
  const outputPath = join(tmpdir(), `raw-out-${id}.png`);

  try {
    await writeFile(inputPath, buffer);

    // Attempt 1: ExifTool embedded JPEG extraction (fast path)
    try {
      const { stdout } = await execFileAsync("exiftool", ["-b", "-JpgFromRaw", inputPath], {
        encoding: "buffer",
        maxBuffer: 50 * 1024 * 1024,
        timeout: 30_000,
      } as never);
      // stdout is a Buffer when encoding is "buffer"
      const jpegBuf = stdout as unknown as Buffer;
      if (jpegBuf && jpegBuf.length > 1000) {
        // Verify it starts with JPEG SOI marker
        if (jpegBuf[0] === 0xff && jpegBuf[1] === 0xd8) {
          return jpegBuf;
        }
      }
    } catch {
      // ExifTool not available or no embedded JPEG -- fall through
    }

    // Attempt 2: ImageMagick + LibRaw delegate (full decode)
    const cmd = await findMagickCmd();
    await execFileAsync(
      cmd,
      magickArgs(cmd, [inputPath, "-colorspace", "sRGB", "-auto-orient", `png:${outputPath}`]),
      { timeout: 120_000 },
    );
    return await readFile(outputPath);
  } finally {
    await rm(inputPath, { force: true }).catch(() => {});
    await rm(outputPath, { force: true }).catch(() => {});
  }
}

// ── ImageMagick decoders (PSD, TGA, EXR, HDR) ──────────────────

/**
 * Decode PSD to PNG. Uses [0] to read only the flattened composite layer.
 */
async function decodePsd(buffer: Buffer): Promise<Buffer> {
  const cmd = await findMagickCmd();
  const id = randomUUID();
  const inputPath = join(tmpdir(), `psd-in-${id}.psd`);
  const outputPath = join(tmpdir(), `psd-out-${id}.png`);

  try {
    await writeFile(inputPath, buffer);
    await execFileAsync(cmd, magickArgs(cmd, [`${inputPath}[0]`, `png:${outputPath}`]), {
      timeout: 120_000,
    });
    return await readFile(outputPath);
  } finally {
    await rm(inputPath, { force: true }).catch(() => {});
    await rm(outputPath, { force: true }).catch(() => {});
  }
}

/**
 * Decode TGA to PNG.
 */
async function decodeTga(buffer: Buffer): Promise<Buffer> {
  const cmd = await findMagickCmd();
  const id = randomUUID();
  const inputPath = join(tmpdir(), `tga-in-${id}.tga`);
  const outputPath = join(tmpdir(), `tga-out-${id}.png`);

  try {
    await writeFile(inputPath, buffer);
    await execFileAsync(cmd, magickArgs(cmd, [inputPath, `png:${outputPath}`]), {
      timeout: 120_000,
    });
    return await readFile(outputPath);
  } finally {
    await rm(inputPath, { force: true }).catch(() => {});
    await rm(outputPath, { force: true }).catch(() => {});
  }
}

/**
 * Decode EXR to PNG. Colorspace conversion from linear to sRGB is needed
 * because EXR files are typically stored in linear light.
 */
async function decodeExr(buffer: Buffer): Promise<Buffer> {
  const cmd = await findMagickCmd();
  const id = randomUUID();
  const inputPath = join(tmpdir(), `exr-in-${id}.exr`);
  const outputPath = join(tmpdir(), `exr-out-${id}.png`);

  try {
    await writeFile(inputPath, buffer);
    await execFileAsync(
      cmd,
      magickArgs(cmd, [inputPath, "-colorspace", "sRGB", `png:${outputPath}`]),
      { timeout: 120_000 },
    );
    return await readFile(outputPath);
  } finally {
    await rm(inputPath, { force: true }).catch(() => {});
    await rm(outputPath, { force: true }).catch(() => {});
  }
}

/**
 * Decode Radiance HDR to PNG. Same colorspace handling as EXR.
 */
async function decodeHdr(buffer: Buffer): Promise<Buffer> {
  const cmd = await findMagickCmd();
  const id = randomUUID();
  const inputPath = join(tmpdir(), `hdr-in-${id}.hdr`);
  const outputPath = join(tmpdir(), `hdr-out-${id}.png`);

  try {
    await writeFile(inputPath, buffer);
    await execFileAsync(
      cmd,
      magickArgs(cmd, [inputPath, "-colorspace", "sRGB", `png:${outputPath}`]),
      { timeout: 120_000 },
    );
    return await readFile(outputPath);
  } finally {
    await rm(inputPath, { force: true }).catch(() => {});
    await rm(outputPath, { force: true }).catch(() => {});
  }
}

async function decodeBmp(buffer: Buffer): Promise<Buffer> {
  const cmd = await findMagickCmd();
  const id = randomUUID();
  const inputPath = join(tmpdir(), `bmp-in-${id}.bmp`);
  const outputPath = join(tmpdir(), `bmp-out-${id}.png`);

  try {
    await writeFile(inputPath, buffer);
    await execFileAsync(cmd, magickArgs(cmd, [inputPath, `png:${outputPath}`]), {
      timeout: 120_000,
    });
    return await readFile(outputPath);
  } finally {
    await rm(inputPath, { force: true }).catch(() => {});
    await rm(outputPath, { force: true }).catch(() => {});
  }
}

async function decodeJxl(buffer: Buffer): Promise<Buffer> {
  const id = randomUUID();
  const inputPath = join(tmpdir(), `jxl-in-${id}.jxl`);
  const outputPath = join(tmpdir(), `jxl-out-${id}.png`);

  try {
    await writeFile(inputPath, buffer);

    // Try djxl first (from libjxl-tools) — works even when ImageMagick
    // lacks a JXL delegate (common on Ubuntu stock packages).
    try {
      await execFileAsync("djxl", [inputPath, outputPath], { timeout: 120_000 });
      return await readFile(outputPath);
    } catch {
      // djxl not available, fall back to ImageMagick
    }

    const cmd = await findMagickCmd();
    await execFileAsync(cmd, magickArgs(cmd, [inputPath, `png:${outputPath}`]), {
      timeout: 120_000,
    });
    return await readFile(outputPath);
  } finally {
    await rm(inputPath, { force: true }).catch(() => {});
    await rm(outputPath, { force: true }).catch(() => {});
  }
}
