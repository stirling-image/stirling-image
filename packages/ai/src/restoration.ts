import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type ProgressCallback, runPythonWithProgress } from "./bridge.js";

export interface RestorePhotoOptions {
  mode?: string;
  scratchRemoval?: boolean;
  faceEnhancement?: boolean;
  fidelity?: number;
  denoise?: boolean;
  denoiseStrength?: number;
  colorize?: boolean;
}

export interface RestorePhotoResult {
  buffer: Buffer;
  width: number;
  height: number;
  steps: string[];
  scratchCoverage: number;
  facesEnhanced: number;
  isGrayscale: boolean;
  colorized: boolean;
}

export async function restorePhoto(
  inputBuffer: Buffer,
  outputDir: string,
  options: RestorePhotoOptions = {},
  onProgress?: ProgressCallback,
): Promise<RestorePhotoResult> {
  const inputPath = join(outputDir, "input_restore.png");
  const outputPath = join(outputDir, "output_restore.png");

  await writeFile(inputPath, inputBuffer);
  const { stdout } = await runPythonWithProgress(
    "restore.py",
    [inputPath, outputPath, JSON.stringify(options)],
    { onProgress },
  );

  const result = JSON.parse(stdout);
  if (!result.success) {
    throw new Error(result.error || "Photo restoration failed");
  }

  const actualOutputPath = result.output_path || outputPath;
  const buffer = await readFile(actualOutputPath);
  return {
    buffer,
    width: result.width,
    height: result.height,
    steps: result.steps ?? [],
    scratchCoverage: result.scratchCoverage ?? 0,
    facesEnhanced: result.facesEnhanced ?? 0,
    isGrayscale: result.isGrayscale ?? false,
    colorized: result.colorized ?? false,
  };
}
