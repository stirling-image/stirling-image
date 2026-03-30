/**
 * Piscina worker that executes image tool processing in a worker thread.
 *
 * On first call, it imports all tool registration modules using a mock
 * Fastify instance (only the registry-populating side effects are needed,
 * not the HTTP route registrations). Subsequent calls reuse the populated
 * registry for O(1) lookup.
 */
import { autoOrient } from "./auto-orient.js";

export interface WorkerInput {
  toolId: string;
  inputBuffer: Buffer;
  settings: unknown;
  filename: string;
  inputFormat?: string;
}

export interface WorkerOutput {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

let registryReady = false;

async function ensureRegistry(): Promise<void> {
  if (registryReady) return;

  // Create a minimal mock that satisfies the register functions.
  // createToolRoute calls app.post() (no-op here) and toolRegistry.set() (the part we want).
  // AI tools also call app.post() and registerToolProcessFn() (also populates the registry).
  const mockApp = {
    post: () => {},
    get: () => {},
    log: { info: () => {}, warn: () => {}, error: () => {} },
  };

  const { registerToolRoutes } = await import("../routes/tools/index.js");
  await registerToolRoutes(mockApp as never);
  registryReady = true;
}

export default async function processInWorker(input: WorkerInput): Promise<WorkerOutput> {
  await ensureRegistry();

  const { getToolConfig } = await import("../routes/tool-factory.js");
  const config = getToolConfig(input.toolId);

  if (!config) {
    throw new Error(`Tool "${input.toolId}" not found in worker registry`);
  }

  const buf = Buffer.from(input.inputBuffer);
  const oriented = input.inputFormat === "svg" ? buf : await autoOrient(buf);
  const result = await config.process(oriented, input.settings, input.filename);

  return {
    buffer: result.buffer,
    filename: result.filename,
    contentType: result.contentType,
  };
}
