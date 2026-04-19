import { randomUUID } from "node:crypto";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

  await writeFile(inputPath, inputBuffer);
  try {
    // BiRefNet models need longer timeout (up to 10 min for first load)
    const timeout = options.model?.startsWith("birefnet") ? 600000 : 300000;
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
