/**
 * Integration tests for the fetch-urls route.
 *
 * Spins up a local HTTP server to serve test fixtures, and mocks the SSRF
 * validation to allow localhost connections during tests.
 */

import { readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Mock the SSRF validation to allow localhost in tests.
// We keep the real safeFetch logic but skip the private-IP DNS check.
vi.mock("../../apps/api/src/lib/ssrf.js", async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return {
    ...original,
    // validateFetchUrl that allows localhost for tests
    validateFetchUrl: async (_url: string) => {
      // No-op: allow all URLs in tests (including localhost)
    },
    // safeFetch that skips SSRF validation but still does the real fetch
    safeFetch: async (url: string, signal?: AbortSignal) => {
      const MAX_REDIRECTS = 5;
      let currentUrl = url;
      for (let i = 0; i <= MAX_REDIRECTS; i++) {
        const res = await fetch(currentUrl, {
          signal,
          redirect: "manual",
          headers: { "User-Agent": "SnapOtter/1.0 (image-fetch)" },
        });
        if (res.status >= 300 && res.status < 400) {
          const location = res.headers.get("location");
          if (!location) throw new Error("Redirect without Location header");
          currentUrl = new URL(location, currentUrl).href;
          if (i === MAX_REDIRECTS) throw new Error("Too many redirects");
          continue;
        }
        return res;
      }
      throw new Error("Too many redirects");
    },
  };
});

import { buildTestApp, loginAsAdmin, type TestApp } from "./test-server.js";

const FIXTURES = join(__dirname, "..", "fixtures");
const JPG = readFileSync(join(FIXTURES, "test-100x100.jpg"));

let testApp: TestApp;
let app: TestApp["app"];
let adminToken: string;
let mockServer: Server;
let mockPort: number;

function startMockServer(): Promise<{ server: Server; port: number }> {
  return new Promise((resolve) => {
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const url = req.url ?? "";

      if (url === "/photo.jpg") {
        res.writeHead(200, { "Content-Type": "image/jpeg" });
        res.end(JPG);
        return;
      }

      if (url === "/not-image.txt") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("This is not an image");
        return;
      }

      if (url === "/redirect") {
        res.writeHead(302, { Location: "/photo.jpg" });
        res.end();
        return;
      }

      if (url === "/missing.jpg") {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }

      res.writeHead(404);
      res.end("Not Found");
    });

    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      resolve({ server, port });
    });
  });
}

beforeAll(async () => {
  const mock = await startMockServer();
  mockServer = mock.server;
  mockPort = mock.port;

  testApp = await buildTestApp();
  app = testApp.app;
  adminToken = await loginAsAdmin(app);
}, 30_000);

afterAll(async () => {
  await testApp.cleanup();
  await new Promise<void>((resolve) => mockServer.close(() => resolve()));
}, 10_000);

describe("POST /api/v1/fetch-urls", () => {
  it("fetches a valid image URL and returns metadata + download URL", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/fetch-urls",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        urls: [`http://127.0.0.1:${mockPort}/photo.jpg`],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results).toHaveLength(1);

    const result = body.results[0];
    expect(result.success).toBe(true);
    expect(result.url).toBe(`http://127.0.0.1:${mockPort}/photo.jpg`);
    expect(result.filename).toBe("photo.jpg");
    expect(result.contentType).toBe("image/jpeg");
    expect(result.size).toBeGreaterThan(0);
    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
    expect(result.downloadUrl).toMatch(/^\/api\/v1\/download\/.+\/photo\.jpg$/);
    expect(result.previewUrl).toBeNull(); // JPEG is browser-previewable
  });

  it("returns failure for a 404 URL", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/fetch-urls",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        urls: [`http://127.0.0.1:${mockPort}/missing.jpg`],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results).toHaveLength(1);

    const result = body.results[0];
    expect(result.success).toBe(false);
    expect(result.error).toContain("404");
  });

  it("returns failure for non-image content", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/fetch-urls",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        urls: [`http://127.0.0.1:${mockPort}/not-image.txt`],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results).toHaveLength(1);

    const result = body.results[0];
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("handles mixed batch with successes and failures", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/fetch-urls",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        urls: [
          `http://127.0.0.1:${mockPort}/photo.jpg`,
          `http://127.0.0.1:${mockPort}/missing.jpg`,
          `http://127.0.0.1:${mockPort}/not-image.txt`,
        ],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results).toHaveLength(3);

    // Results preserve order
    expect(body.results[0].success).toBe(true);
    expect(body.results[0].filename).toBe("photo.jpg");

    expect(body.results[1].success).toBe(false);
    expect(body.results[1].error).toContain("404");

    expect(body.results[2].success).toBe(false);
  });

  it("returns 400 for an empty URL array", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/fetch-urls",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        urls: [],
      },
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toBeTruthy();
  });

  it("returns 400 for more than 50 URLs", async () => {
    const urls = Array.from({ length: 51 }, (_, i) => `http://example.com/img${i}.jpg`);
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/fetch-urls",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: { urls },
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toBeTruthy();
  });

  it("follows redirects to fetch the final image", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/fetch-urls",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        urls: [`http://127.0.0.1:${mockPort}/redirect`],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results).toHaveLength(1);

    const result = body.results[0];
    expect(result.success).toBe(true);
    expect(result.contentType).toBe("image/jpeg");
    expect(result.size).toBe(JPG.length);
  });

  it("download URL serves the actual image", async () => {
    // First, fetch the URL to get a downloadUrl
    const fetchRes = await app.inject({
      method: "POST",
      url: "/api/v1/fetch-urls",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        urls: [`http://127.0.0.1:${mockPort}/photo.jpg`],
      },
    });

    const body = JSON.parse(fetchRes.body);
    const downloadUrl = body.results[0].downloadUrl;
    expect(downloadUrl).toBeTruthy();

    // Now download the file
    const downloadRes = await app.inject({
      method: "GET",
      url: downloadUrl,
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });

    expect(downloadRes.statusCode).toBe(200);
    expect(downloadRes.headers["content-type"]).toBe("image/jpeg");
    // The downloaded buffer should match the original fixture
    expect(downloadRes.rawPayload.length).toBe(JPG.length);
  });

  it("returns 400 for invalid URL format", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/fetch-urls",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        urls: ["not-a-valid-url"],
      },
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toBeTruthy();
  });
});
