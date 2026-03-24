import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { createWorkspace } from "../lib/workspace.js";
import { validateImageBuffer } from "../lib/file-validation.js";
import { sanitizeFilename } from "../lib/filename.js";
import { autoOrient } from "../lib/auto-orient.js";
import { db, schema } from "../db/index.js";

export interface ToolRouteConfig<T> {
  /** Unique tool identifier, used as the URL path segment. */
  toolId: string;
  /** Zod schema that validates the settings JSON from the request. */
  settingsSchema: z.ZodType<T, z.ZodTypeDef, unknown>;
  /** The processing function: takes input buffer + validated settings, returns output. */
  process: (
    inputBuffer: Buffer,
    settings: T,
    filename: string,
  ) => Promise<{ buffer: Buffer; filename: string; contentType: string }>;
}

/**
 * In-memory registry of all tool configs, keyed by toolId.
 * Populated by createToolRoute() calls; used by batch processing.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toolRegistry = new Map<string, ToolRouteConfig<any>>();

/**
 * Retrieve a registered tool config by its ID.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getToolConfig(toolId: string): ToolRouteConfig<any> | undefined {
  return toolRegistry.get(toolId);
}

/**
 * Factory that registers a POST /api/v1/tools/:toolId route.
 *
 * The route accepts multipart with:
 *   - A file part (the image to process)
 *   - A "settings" field containing a JSON string
 *
 * The factory handles:
 *   - Multipart parsing
 *   - File validation
 *   - Settings validation via Zod
 *   - Workspace management
 *   - Error handling
 *   - Response formatting
 */
export function createToolRoute<T>(
  app: FastifyInstance,
  config: ToolRouteConfig<T>,
): void {
  // Register in the tool registry for batch processing
  toolRegistry.set(config.toolId, config);

  app.post(
    `/api/v1/tools/${config.toolId}`,
    async (request: FastifyRequest, reply: FastifyReply) => {
      let fileBuffer: Buffer | null = null;
      let filename = "image";
      let settingsRaw: string | null = null;
      let fileId: string | null = null;

      // Parse multipart parts
      try {
        const parts = request.parts();

        for await (const part of parts) {
          if (part.type === "file") {
            // Consume the file stream into a buffer
            const chunks: Buffer[] = [];
            for await (const chunk of part.file) {
              chunks.push(chunk);
            }
            fileBuffer = Buffer.concat(chunks);
            filename = sanitizeFilename(part.filename ?? "image");
          } else {
            // Field part
            if (part.fieldname === "settings") {
              settingsRaw = part.value as string;
            }
            if (part.fieldname === "fileId") {
              fileId = part.value as string;
            }
          }
        }
      } catch (err) {
        return reply.status(400).send({
          error: "Failed to parse multipart request",
          details: err instanceof Error ? err.message : String(err),
        });
      }

      // Require a file
      if (!fileBuffer || fileBuffer.length === 0) {
        return reply
          .status(400)
          .send({ error: "No image file provided" });
      }

      // Validate the uploaded image
      const validation = await validateImageBuffer(fileBuffer);
      if (!validation.valid) {
        return reply
          .status(400)
          .send({ error: `Invalid image: ${validation.reason}` });
      }

      // Parse and validate settings
      let settings: T;
      try {
        const parsed = settingsRaw ? JSON.parse(settingsRaw) : {};
        const result = config.settingsSchema.safeParse(parsed);
        if (!result.success) {
          return reply.status(400).send({
            error: "Invalid settings",
            details: result.error.issues.map((i) => ({
              path: i.path.join("."),
              message: i.message,
            })),
          });
        }
        settings = result.data;
      } catch {
        return reply.status(400).send({ error: "Settings must be valid JSON" });
      }

      // Auto-orient based on EXIF metadata before processing.
      const processBuffer = await autoOrient(fileBuffer);

      // Process the image
      try {
        const result = await config.process(processBuffer, settings, filename);

        // Create workspace and save output
        const jobId = randomUUID();
        const workspacePath = await createWorkspace(jobId);
        const outputPath = join(workspacePath, "output", result.filename);
        await writeFile(outputPath, result.buffer);

        // Also save the original input for reference/download
        const inputPath = join(workspacePath, "input", filename);
        await writeFile(inputPath, fileBuffer);

        // Auto-save to persistent file store when a fileId is provided
        let savedFileId: string | undefined;
        if (fileId) {
          try {
            const { saveFile } = await import("../lib/file-storage.js");
            const parent = db
              .select()
              .from(schema.userFiles)
              .where(eq(schema.userFiles.id, fileId))
              .get();
            if (parent) {
              const newVersion = parent.version + 1;
              const parentChain: string[] = parent.toolChain
                ? JSON.parse(parent.toolChain)
                : [];
              const newToolChain = [...parentChain, config.toolId];
              const storedName = await saveFile(result.buffer, result.filename);
              // Get image dimensions from the processed output
              let width: number | null = null;
              let height: number | null = null;
              try {
                const meta = await sharp(result.buffer).metadata();
                width = meta.width ?? null;
                height = meta.height ?? null;
              } catch {
                // dimensions are non-critical
              }
              const newId = randomUUID();
              db.insert(schema.userFiles)
                .values({
                  id: newId,
                  userId: parent.userId,
                  originalName: result.filename,
                  storedName,
                  mimeType: result.contentType,
                  size: result.buffer.length,
                  width,
                  height,
                  version: newVersion,
                  parentId: fileId,
                  toolChain: JSON.stringify(newToolChain),
                })
                .run();
              savedFileId = newId;
            }
          } catch (saveErr) {
            // Non-fatal — tool processing already succeeded
            request.log.warn({ saveErr, fileId }, "Failed to auto-save processed file");
          }
        }

        return reply.send({
          jobId,
          downloadUrl: `/api/v1/download/${jobId}/${encodeURIComponent(result.filename)}`,
          originalSize: fileBuffer.length,
          processedSize: result.buffer.length,
          savedFileId,
        });
      } catch (err) {
        // Catch Sharp / processing errors and return a clean API error
        const message = err instanceof Error ? err.message : "Image processing failed";
        request.log.error({ err, toolId: config.toolId }, "Tool processing failed");
        return reply.status(422).send({
          error: "Processing failed",
          details: process.env.NODE_ENV === "production" ? undefined : message,
        });
      }
    },
  );
}
