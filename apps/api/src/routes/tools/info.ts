import { basename } from "node:path";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import sharp from "sharp";
import { ensureSharpCompat } from "../../lib/heic-converter.js";

/**
 * Image info route - read-only, returns JSON metadata.
 * Does NOT use createToolRoute since it doesn't produce a processed file.
 */
export function registerInfo(app: FastifyInstance) {
  app.post("/api/v1/tools/info", async (request: FastifyRequest, reply: FastifyReply) => {
    let fileBuffer: Buffer | null = null;
    let filename = "image";

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

    try {
      // Read metadata from original buffer (Sharp can read HEIF container metadata)
      const metadata = await sharp(fileBuffer).metadata();

      // stats() requires pixel decoding, so decode HEIC/HEIF first
      const decodedBuffer = await ensureSharpCompat(fileBuffer);
      const stats = await sharp(decodedBuffer).stats();

      // Build histogram data from stats
      const histogram = stats.channels.map((ch, i) => ({
        channel: ["red", "green", "blue", "alpha"][i] ?? `channel-${i}`,
        min: ch.min,
        max: ch.max,
        mean: Math.round(ch.mean * 100) / 100,
        stdev: Math.round(ch.stdev * 100) / 100,
      }));

      return reply.send({
        filename,
        fileSize: fileBuffer.length,
        width: metadata.width ?? 0,
        height: metadata.height ?? 0,
        format: metadata.format ?? "unknown",
        channels: metadata.channels ?? 0,
        hasAlpha: metadata.hasAlpha ?? false,
        colorSpace: metadata.space ?? "unknown",
        density: metadata.density ?? null,
        isProgressive: metadata.isProgressive ?? false,
        orientation: metadata.orientation ?? null,
        hasProfile: metadata.hasProfile ?? false,
        hasExif: !!metadata.exif,
        hasIcc: !!metadata.icc,
        hasXmp: !!metadata.xmp,
        bitDepth: metadata.depth ?? null,
        pages: metadata.pages ?? 1,
        histogram,
      });
    } catch (err) {
      return reply.status(422).send({
        error: "Failed to read image metadata",
        details: err instanceof Error ? err.message : "Unknown error",
      });
    }
  });
}
