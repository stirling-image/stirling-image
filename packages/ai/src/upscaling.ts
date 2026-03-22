import { runPythonWithProgress, type ProgressCallback } from "./bridge.js";
import { writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";

export interface UpscaleOptions {
  scale?: number;
}

export interface UpscaleResult {
  buffer: Buffer;
  width: number;
  height: number;
  method: string;
}

export async function upscale(
  inputBuffer: Buffer,
  outputDir: string,
  options: UpscaleOptions = {},
  onProgress?: ProgressCallback,
): Promise<UpscaleResult> {
  const inputPath = join(outputDir, "input_upscale.png");
  const outputPath = join(outputDir, "output_upscale.png");

  await writeFile(inputPath, inputBuffer);
  const { stdout } = await runPythonWithProgress("upscale.py", [
    inputPath,
    outputPath,
    JSON.stringify(options),
  ], { onProgress });

  const result = JSON.parse(stdout);
  if (!result.success) {
    throw new Error(result.error || "Upscaling failed");
  }

  const buffer = await readFile(outputPath);
  return {
    buffer,
    width: result.width,
    height: result.height,
    method: result.method ?? "unknown",
  };
}
