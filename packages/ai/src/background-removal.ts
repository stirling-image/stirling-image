import { randomUUID } from "node:crypto";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { type ProgressCallback, parseStdoutJson, runPythonWithProgress } from "./bridge.js";

export interface RemoveBackgroundOptions {
  model?: string;
  backgroundColor?: string;
}

export async function removeBackground(
  inputBuffer: Buffer,
  outputDir: string,
  options: RemoveBackgroundOptions = {},
  onProgress?: ProgressCallback,
): Promise<Buffer> {
  const id = randomUUID();
  const inputPath = join(tmpdir(), `rembg_in_${id}.png`);
  const outputPath = join(outputDir, `rembg_out_${id}.png`);

  const pngBuffer = await sharp(inputBuffer).png().toBuffer();
  await writeFile(inputPath, pngBuffer);
  try {
    const meta = await sharp(inputBuffer).metadata();
    const megapixels = ((meta.width ?? 0) * (meta.height ?? 0)) / 1_000_000;
    const baseTimeout = options.model?.startsWith("birefnet") ? 600000 : 300000;
    const timeout = Math.max(baseTimeout, megapixels * 30 * 1000);
    const { stdout } = await runPythonWithProgress(
      "remove_bg.py",
      [inputPath, outputPath, JSON.stringify(options)],
      { onProgress, timeout },
    );

    const result = parseStdoutJson(stdout);
    if (!result.success) {
      throw new Error(result.error || "Background removal failed");
    }

    const outputBuffer = await readFile(outputPath);
    return outputBuffer;
  } finally {
    // Clean up temp files
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}
