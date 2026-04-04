import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Decode a HEIC/HEIF buffer to PNG using the system `heif-dec` CLI tool.
 * This is needed because Sharp's bundled libheif does not include the
 * HEVC decoder required for true HEIC files (iPhone photos).
 */
export async function decodeHeic(buffer: Buffer): Promise<Buffer> {
  const id = randomUUID();
  const inputPath = join(tmpdir(), `heic-in-${id}.heic`);
  const outputPath = join(tmpdir(), `heic-out-${id}.png`);

  try {
    await writeFile(inputPath, buffer);
    await execFileAsync("heif-dec", [inputPath, outputPath], { timeout: 30_000 });
    return await readFile(outputPath);
  } finally {
    await rm(inputPath, { force: true }).catch(() => {});
    await rm(outputPath, { force: true }).catch(() => {});
  }
}

/**
 * Encode a PNG/JPEG buffer to HEIC using the system `heif-enc` CLI tool.
 * Uses x265 (HEVC) compression for true HEIC output.
 */
export async function encodeHeic(buffer: Buffer, quality = 80): Promise<Buffer> {
  const id = randomUUID();
  const inputPath = join(tmpdir(), `heic-in-${id}.png`);
  const outputPath = join(tmpdir(), `heic-out-${id}.heic`);

  try {
    await writeFile(inputPath, buffer);
    await execFileAsync("heif-enc", ["-q", String(quality), "-o", outputPath, inputPath], {
      timeout: 30_000,
    });
    return await readFile(outputPath);
  } finally {
    await rm(inputPath, { force: true }).catch(() => {});
    await rm(outputPath, { force: true }).catch(() => {});
  }
}

/**
 * Check whether the heif-enc and heif-dec CLI tools are available.
 */
export async function isHeicToolAvailable(): Promise<boolean> {
  try {
    await execFileAsync("heif-enc", ["--version"], { timeout: 5_000 });
    await execFileAsync("heif-dec", ["--version"], { timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}
