import { randomUUID } from "node:crypto";
import { basename, extname } from "node:path";
import archiver from "archiver";
import type { FastifyInstance } from "fastify";
import sharp from "sharp";
import { z } from "zod";
import { autoOrient } from "../../lib/auto-orient.js";
import { ensureSharpCompat } from "../../lib/heic-converter.js";

const settingsSchema = z.object({
  columns: z.number().min(1).max(10).default(2),
  rows: z.number().min(1).max(10).default(2),
});

/**
 * Split an image into grid parts and return as ZIP.
 */
export function registerSplit(app: FastifyInstance) {
  app.post("/api/v1/tools/split", async (request, reply) => {
    let fileBuffer: Buffer | null = null;
    let filename = "image";
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
          filename = basename(part.filename ?? "image");
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

      const metadata = await sharp(fileBuffer).metadata();
      const fullW = metadata.width ?? 0;
      const fullH = metadata.height ?? 0;
      const cellW = Math.floor(fullW / settings.columns);
      const cellH = Math.floor(fullH / settings.rows);
      const ext = extname(filename) || ".png";
      const baseName = filename.replace(ext, "");

      const jobId = randomUUID();

      // Set up response headers for ZIP
      reply.hijack();
      reply.raw.writeHead(200, {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="split-${jobId.slice(0, 8)}.zip"`,
        "Transfer-Encoding": "chunked",
      });

      const archive = archiver("zip", { zlib: { level: 5 } });
      archive.pipe(reply.raw);

      for (let row = 0; row < settings.rows; row++) {
        for (let col = 0; col < settings.columns; col++) {
          const left = col * cellW;
          const top = row * cellH;
          // Ensure we don't go out of bounds on the last row/col
          const w = col === settings.columns - 1 ? fullW - left : cellW;
          const h = row === settings.rows - 1 ? fullH - top : cellH;

          const partBuffer = await sharp(fileBuffer)
            .extract({ left, top, width: w, height: h })
            .toBuffer();

          archive.append(partBuffer, {
            name: `${baseName}_r${row + 1}_c${col + 1}${ext}`,
          });
        }
      }

      await archive.finalize();
    } catch (err) {
      if (!reply.raw.headersSent) {
        return reply.status(422).send({
          error: "Split failed",
          details: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }
  });
}
