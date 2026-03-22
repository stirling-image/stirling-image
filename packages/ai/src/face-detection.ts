import { runPythonWithProgress, type ProgressCallback } from "./bridge.js";
import { writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";

export interface BlurFacesOptions {
  blurRadius?: number;
  sensitivity?: number;
}

export interface FaceRegion {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BlurFacesResult {
  buffer: Buffer;
  facesDetected: number;
  faces: FaceRegion[];
}

export async function blurFaces(
  inputBuffer: Buffer,
  outputDir: string,
  options: BlurFacesOptions = {},
  onProgress?: ProgressCallback,
): Promise<BlurFacesResult> {
  const inputPath = join(outputDir, "input_faces.png");
  const outputPath = join(outputDir, "output_faces.png");

  await writeFile(inputPath, inputBuffer);
  const { stdout } = await runPythonWithProgress("detect_faces.py", [
    inputPath,
    outputPath,
    JSON.stringify(options),
  ], { onProgress });

  const result = JSON.parse(stdout);
  if (!result.success) {
    throw new Error(result.error || "Face detection failed");
  }

  const buffer = await readFile(outputPath);
  return {
    buffer,
    facesDetected: result.facesDetected,
    faces: result.faces ?? [],
  };
}
