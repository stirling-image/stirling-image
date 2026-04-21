import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { type ProgressCallback, parseStdoutJson, runPythonWithProgress } from "./bridge.js";

export async function inpaint(
  inputBuffer: Buffer,
  maskBuffer: Buffer,
  outputDir: string,
  onProgress?: ProgressCallback,
): Promise<Buffer> {
  const inputPath = join(outputDir, "input_inpaint.png");
  const maskPath = join(outputDir, "mask_inpaint.png");
  const outputPath = join(outputDir, "output_inpaint.png");

  const pngInput = await sharp(inputBuffer).png().toBuffer();
  const pngMask = await sharp(maskBuffer).png().toBuffer();
  await writeFile(inputPath, pngInput);
  await writeFile(maskPath, pngMask);

  const { stdout } = await runPythonWithProgress("inpaint.py", [inputPath, maskPath, outputPath], {
    onProgress,
  });

  const result = parseStdoutJson(stdout);
  if (!result.success) {
    throw new Error(result.error || "Inpainting failed");
  }

  return readFile(outputPath);
}
