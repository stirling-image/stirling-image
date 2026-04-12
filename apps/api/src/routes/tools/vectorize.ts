import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import type { FastifyInstance } from "fastify";
import potrace from "potrace";
import sharp from "sharp";
import { z } from "zod";
import { autoOrient } from "../../lib/auto-orient.js";
import { ensureSharpCompat } from "../../lib/heic-converter.js";
import { createWorkspace } from "../../lib/workspace.js";

const settingsSchema = z.object({
  colorMode: z.enum(["bw", "color"]).default("bw"),
  threshold: z.number().min(0).max(255).default(128),
  detail: z.enum(["low", "medium", "high"]).default("medium"),
});

function traceImage(
  buffer: Buffer,
  options: { threshold: number; turdSize: number; color?: string },
): Promise<string> {
  return new Promise((resolve, reject) => {
    potrace.trace(buffer, options, (err: Error | null, svg: string) => {
      if (err) reject(err);
      else resolve(svg);
    });
  });
}

function posterize(buffer: Buffer, options: { steps: number; threshold: number }): Promise<string> {
  return new Promise((resolve, reject) => {
    potrace.posterize(buffer, options, (err: Error | null, svg: string) => {
      if (err) reject(err);
      else resolve(svg);
    });
  });
}

export function registerVectorize(app: FastifyInstance) {
  app.post("/api/v1/tools/vectorize", async (request, reply) => {
    let fileBuffer: Buffer | null = null;
    let filename = "output";
    let settingsRaw: string | null = null;

    try {
      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === "file") {
          const chunks: Buffer[] = [];
          for await (const chunk of part.file) {
            chunks.push(chunk);
          }
          fileBuffer = Buffer.concat(chunks);
          filename = basename(part.filename ?? "output").replace(/\.[^.]+$/, "");
        } else if (part.fieldname === "settings") {
          settingsRaw = part.value as string;
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

    let settings: z.infer<typeof settingsSchema>;
    try {
      const parsed = settingsRaw ? JSON.parse(settingsRaw) : {};
      const result = settingsSchema.safeParse(parsed);
      if (!result.success) {
        return reply.status(400).send({ error: "Invalid settings", details: result.error.issues });
      }
      settings = result.data;
    } catch {
      return reply.status(400).send({ error: "Settings must be valid JSON" });
    }

    try {
      // Decode HEIC/HEIF if needed, then normalize EXIF orientation
      fileBuffer = await autoOrient(await ensureSharpCompat(fileBuffer));

      // Convert to BMP-compatible format for potrace (PNG)
      const pngBuffer = await sharp(fileBuffer).grayscale().png().toBuffer();

      const turdSize = settings.detail === "low" ? 10 : settings.detail === "high" ? 1 : 4;

      let svg: string;

      if (settings.colorMode === "color") {
        // Color mode: posterize
        svg = await posterize(pngBuffer, {
          steps: settings.detail === "low" ? 3 : settings.detail === "high" ? 8 : 5,
          threshold: settings.threshold,
        });
      } else {
        // B&W mode: simple trace
        svg = await traceImage(pngBuffer, {
          threshold: settings.threshold,
          turdSize,
        });
      }

      const svgBuffer = Buffer.from(svg, "utf-8");
      const outFilename = `${filename}.svg`;
      const jobId = randomUUID();
      const workspacePath = await createWorkspace(jobId);
      const outputPath = join(workspacePath, "output", outFilename);
      await writeFile(outputPath, svgBuffer);

      return reply.send({
        jobId,
        downloadUrl: `/api/v1/download/${jobId}/${encodeURIComponent(outFilename)}`,
        originalSize: fileBuffer.length,
        processedSize: svgBuffer.length,
        svgPreview: svg.length < 50000 ? svg : undefined,
      });
    } catch (err) {
      return reply.status(422).send({
        error: "Vectorization failed",
        details: err instanceof Error ? err.message : "Unknown error",
      });
    }
  });
}
