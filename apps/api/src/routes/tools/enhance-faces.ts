import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { enhanceFaces } from "@stirling-image/ai";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import sharp from "sharp";
import { z } from "zod";
import { autoOrient } from "../../lib/auto-orient.js";
import { validateImageBuffer } from "../../lib/file-validation.js";
import { decodeHeic } from "../../lib/heic-converter.js";
import { createWorkspace } from "../../lib/workspace.js";
import { updateSingleFileProgress } from "../progress.js";
import { registerToolProcessFn } from "../tool-factory.js";

/** Face enhancement route using GFPGAN/CodeFormer. */
export function registerEnhanceFaces(app: FastifyInstance) {
  app.post("/api/v1/tools/enhance-faces", async (request: FastifyRequest, reply: FastifyReply) => {
    let fileBuffer: Buffer | null = null;
    let filename = "image";
    let settingsRaw: string | null = null;
    let clientJobId: string | null = null;

    try {
      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === "file") {
          const chunks: Buffer[] = [];
          for await (const chunk of part.file) {
            chunks.push(chunk);
          }
          fileBuffer = Buffer.concat(chunks);
          filename = basename(part.filename ?? "image");
        } else if (part.fieldname === "settings") {
          settingsRaw = part.value as string;
        } else if (part.fieldname === "clientJobId") {
          clientJobId = part.value as string;
        }
      }
    } catch (err) {
      return reply.status(400).send({
        error: "Failed to parse multipart request",
        details: err instanceof Error ? err.message : String(err),
      });
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return reply.status(400).send({ error: "No image file provided" });
    }

    const validation = await validateImageBuffer(fileBuffer);
    if (!validation.valid) {
      return reply.status(400).send({ error: `Invalid image: ${validation.reason}` });
    }

    try {
      const settings = settingsRaw ? JSON.parse(settingsRaw) : {};
      const model = settings.model || "auto";
      const strength = Number(settings.strength) || 0.8;
      const onlyCenterFace = Boolean(settings.onlyCenterFace);
      const sensitivity = Number(settings.sensitivity) || 0.5;
      request.log.info(
        { toolId: "enhance-faces", imageSize: fileBuffer.length, model, strength },
        "Starting face enhancement",
      );

      // Decode HEIC/HEIF input via system decoder
      if (validation.format === "heif") {
        fileBuffer = await decodeHeic(fileBuffer);
      }

      // Auto-orient to fix EXIF rotation before face detection
      fileBuffer = await autoOrient(fileBuffer);

      const jobId = randomUUID();
      const workspacePath = await createWorkspace(jobId);

      // Save input
      const inputPath = join(workspacePath, "input", filename);
      await writeFile(inputPath, fileBuffer);

      // Process
      const jobIdForProgress = clientJobId;
      const onProgress = jobIdForProgress
        ? (percent: number, stage: string) => {
            updateSingleFileProgress({
              jobId: jobIdForProgress,
              phase: "processing",
              stage,
              percent,
            });
          }
        : undefined;

      const result = await enhanceFaces(
        fileBuffer,
        join(workspacePath, "output"),
        { model, strength, onlyCenterFace, sensitivity },
        onProgress,
      );

      // Save output
      const outputFilename = `${filename.replace(/\.[^.]+$/, "")}_enhanced.png`;
      const outputPath = join(workspacePath, "output", outputFilename);
      await writeFile(outputPath, result.buffer);

      // Generate webp preview for the frontend
      let previewUrl: string | undefined;
      try {
        const previewBuffer = await sharp(result.buffer).webp({ quality: 80 }).toBuffer();
        const previewPath = join(workspacePath, "output", "preview.webp");
        await writeFile(previewPath, previewBuffer);
        previewUrl = `/api/v1/download/${jobId}/preview.webp`;
      } catch {
        // Non-fatal - frontend will show fallback
      }

      if (clientJobId) {
        updateSingleFileProgress({
          jobId: clientJobId,
          phase: "complete",
          percent: 100,
        });
      }

      return reply.send({
        jobId,
        downloadUrl: `/api/v1/download/${jobId}/${encodeURIComponent(outputFilename)}`,
        previewUrl,
        originalSize: fileBuffer.length,
        processedSize: result.buffer.length,
        facesDetected: result.facesDetected,
        faces: result.faces,
        model: result.model,
      });
    } catch (err) {
      request.log.error({ err, toolId: "enhance-faces" }, "Face enhancement failed");
      return reply.status(422).send({
        error: "Face enhancement failed",
        details: err instanceof Error ? err.message : "Unknown error",
      });
    }
  });

  // Register in the pipeline/batch registry so this tool can be used
  // as a step in automation pipelines (without progress callbacks).
  registerToolProcessFn({
    toolId: "enhance-faces",
    settingsSchema: z.object({
      model: z.enum(["auto", "gfpgan", "codeformer"]).default("auto"),
      strength: z.number().min(0).max(1).default(0.8),
      onlyCenterFace: z.boolean().default(false),
      sensitivity: z.number().min(0).max(1).default(0.5),
    }),
    process: async (inputBuffer, settings, filename) => {
      const s = settings as {
        model?: "auto" | "gfpgan" | "codeformer";
        strength?: number;
        onlyCenterFace?: boolean;
        sensitivity?: number;
      };
      const orientedBuffer = await autoOrient(inputBuffer);
      const jobId = randomUUID();
      const workspacePath = await createWorkspace(jobId);
      const result = await enhanceFaces(orientedBuffer, join(workspacePath, "output"), {
        model: s.model ?? "auto",
        strength: s.strength ?? 0.8,
        onlyCenterFace: s.onlyCenterFace ?? false,
        sensitivity: s.sensitivity ?? 0.5,
      });
      const outputFilename = `${filename.replace(/\.[^.]+$/, "")}_enhanced.png`;
      return { buffer: result.buffer, filename: outputFilename, contentType: "image/png" };
    },
  });
}
