import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type ProgressCallback, runPythonWithProgress } from "./bridge.js";

export interface FaceLandmarkPoint {
  x: number;
  y: number;
}

export interface FaceLandmarks {
  leftEye: FaceLandmarkPoint;
  rightEye: FaceLandmarkPoint;
  eyeCenter: FaceLandmarkPoint;
  chin: FaceLandmarkPoint;
  forehead: FaceLandmarkPoint;
  crown: FaceLandmarkPoint;
  nose: FaceLandmarkPoint;
  faceCenterX: number;
}

export interface FaceLandmarksResult {
  faceDetected: boolean;
  landmarks: FaceLandmarks | null;
  imageWidth: number;
  imageHeight: number;
}

export async function detectFaceLandmarks(
  inputBuffer: Buffer,
  onProgress?: ProgressCallback,
): Promise<FaceLandmarksResult> {
  const inputPath = join(tmpdir(), `face_landmarks_${Date.now()}.png`);

  try {
    await writeFile(inputPath, inputBuffer);
    const { stdout } = await runPythonWithProgress(
      "face_landmarks.py",
      [inputPath, "unused", "{}"],
      { onProgress },
    );

    const result = JSON.parse(stdout);
    if (!result.success) {
      throw new Error(result.error || "Face landmark detection failed");
    }

    return {
      faceDetected: result.faceDetected,
      landmarks: result.landmarks ?? null,
      imageWidth: result.imageWidth ?? 0,
      imageHeight: result.imageHeight ?? 0,
    };
  } finally {
    await unlink(inputPath).catch(() => {});
  }
}
