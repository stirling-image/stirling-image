import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import type { FastifyInstance } from "fastify";
import sharp from "sharp";
import { z } from "zod";
import { sanitizeSvg } from "../../lib/svg-sanitize.js";
import { createWorkspace } from "../../lib/workspace.js";

const settingsSchema = z.object({
  width: z.number().min(1).max(8192).default(1024),
  height: z.number().min(1).max(8192).optional(),
  backgroundColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6,8}$/)
    .default("#00000000"),
  outputFormat: z.enum(["png", "jpg", "webp"]).default("png"),
});

/**
 * SVG to raster conversion.
 * Custom route since input is SVG (not validated as image by magic bytes).
 */
export function registerSvgToRaster(app: FastifyInstance) {
  app.post("/api/v1/tools/svg-to-raster", async (request, reply) => {
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
          filename = basename(part.filename ?? "output").replace(/\.svg$/i, "");
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
      return reply.status(400).send({ error: "No SVG file provided" });
    }

    // Sanitize SVG to prevent XXE, SSRF, and script injection
    try {
      fileBuffer = sanitizeSvg(fileBuffer);
    } catch (err) {
      return reply.status(400).send({
        error: err instanceof Error ? err.message : "Invalid SVG",
      });
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
      let image = sharp(fileBuffer, { density: 300 }).resize(
        settings.width,
        settings.height ?? undefined,
        { fit: "inside" },
      );

      // Apply background if not transparent
      if (settings.backgroundColor !== "#00000000") {
        const bgR = parseInt(settings.backgroundColor.slice(1, 3), 16);
        const bgG = parseInt(settings.backgroundColor.slice(3, 5), 16);
        const bgB = parseInt(settings.backgroundColor.slice(5, 7), 16);
        image = image.flatten({ background: { r: bgR, g: bgG, b: bgB } });
      }

      let buffer: Buffer;
      let ext: string;
      let _contentType: string;

      switch (settings.outputFormat) {
        case "jpg":
          buffer = await image.jpeg({ quality: 90 }).toBuffer();
          ext = "jpg";
          _contentType = "image/jpeg";
          break;
        case "webp":
          buffer = await image.webp({ quality: 90 }).toBuffer();
          ext = "webp";
          _contentType = "image/webp";
          break;
        default:
          buffer = await image.png().toBuffer();
          ext = "png";
          _contentType = "image/png";
          break;
      }

      const outFilename = `${filename}.${ext}`;
      const jobId = randomUUID();
      const workspacePath = await createWorkspace(jobId);
      const outputPath = join(workspacePath, "output", outFilename);
      await writeFile(outputPath, buffer);

      return reply.send({
        jobId,
        downloadUrl: `/api/v1/download/${jobId}/${encodeURIComponent(outFilename)}`,
        originalSize: fileBuffer.length,
        processedSize: buffer.length,
      });
    } catch (err) {
      return reply.status(422).send({
        error: "SVG conversion failed",
        details: err instanceof Error ? err.message : "Unknown error",
      });
    }
  });
}
