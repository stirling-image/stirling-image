/**
 * Integration tests for the beautify tool (/api/v1/tools/beautify).
 *
 * Beautify adds polished backgrounds, shadows, device frames, watermarks,
 * and social media sizing to screenshots. Tests exercise all background types,
 * frame variants, shadow presets, social presets, watermarks, padding/radius
 * extremes, format forcing, and error handling through the HTTP layer.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildTestApp, createMultipartPayload, loginAsAdmin, type TestApp } from "./test-server.js";

const FIXTURES = join(__dirname, "..", "fixtures");
const PNG = readFileSync(join(FIXTURES, "test-200x150.png"));
const JPG = readFileSync(join(FIXTURES, "test-100x100.jpg"));

let testApp: TestApp;
let app: TestApp["app"];
let adminToken: string;

beforeAll(async () => {
  testApp = await buildTestApp();
  app = testApp.app;
  adminToken = await loginAsAdmin(app);
}, 30_000);

afterAll(async () => {
  await testApp.cleanup();
}, 10_000);

function post(url: string, payload: { body: Buffer; contentType: string }) {
  return app.inject({
    method: "POST",
    url,
    headers: {
      authorization: `Bearer ${adminToken}`,
      "content-type": payload.contentType,
    },
    body: payload.body,
  });
}

describe("Beautify", () => {
  // ── Background types ────────────────────────────────────────────────

  it("default settings produce valid PNG", async () => {
    const payload = createMultipartPayload([
      { name: "file", filename: "test.png", contentType: "image/png", content: PNG },
      { name: "settings", content: JSON.stringify({}) },
    ]);

    const res = await post("/api/v1/tools/beautify", payload);
    expect(res.statusCode).toBe(200);

    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
    expect(result.jobId).toBeDefined();
    expect(result.processedSize).toBeGreaterThan(0);
  });

  it("solid background", async () => {
    const payload = createMultipartPayload([
      { name: "file", filename: "test.png", contentType: "image/png", content: PNG },
      {
        name: "settings",
        content: JSON.stringify({
          backgroundType: "solid",
          backgroundColor: "#ff0000",
        }),
      },
    ]);

    const res = await post("/api/v1/tools/beautify", payload);
    expect(res.statusCode).toBe(200);

    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });

  it("linear gradient background", async () => {
    const payload = createMultipartPayload([
      { name: "file", filename: "test.png", contentType: "image/png", content: PNG },
      {
        name: "settings",
        content: JSON.stringify({
          backgroundType: "linear-gradient",
          gradientStops: [
            { color: "#ff0000", position: 0 },
            { color: "#0000ff", position: 100 },
          ],
          gradientAngle: 45,
        }),
      },
    ]);

    const res = await post("/api/v1/tools/beautify", payload);
    expect(res.statusCode).toBe(200);

    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });

  it("radial gradient background", async () => {
    const payload = createMultipartPayload([
      { name: "file", filename: "test.png", contentType: "image/png", content: PNG },
      {
        name: "settings",
        content: JSON.stringify({
          backgroundType: "radial-gradient",
          gradientStops: [
            { color: "#ffffff", position: 0 },
            { color: "#000000", position: 100 },
          ],
        }),
      },
    ]);

    const res = await post("/api/v1/tools/beautify", payload);
    expect(res.statusCode).toBe(200);

    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });

  it("transparent background", async () => {
    const payload = createMultipartPayload([
      { name: "file", filename: "test.png", contentType: "image/png", content: PNG },
      {
        name: "settings",
        content: JSON.stringify({ backgroundType: "transparent" }),
      },
    ]);

    const res = await post("/api/v1/tools/beautify", payload);
    expect(res.statusCode).toBe(200);

    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });

  // ── Image background ────────────────────────────────────────────────

  it("image background with second file", async () => {
    const bgImage = await sharp({
      create: {
        width: 400,
        height: 300,
        channels: 4,
        background: { r: 0, g: 0, b: 255, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const payload = createMultipartPayload([
      { name: "file", filename: "test.png", contentType: "image/png", content: PNG },
      { name: "backgroundImage", filename: "bg.png", contentType: "image/png", content: bgImage },
      {
        name: "settings",
        content: JSON.stringify({ backgroundType: "image" }),
      },
    ]);

    const res = await post("/api/v1/tools/beautify", payload);
    expect(res.statusCode).toBe(200);

    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
    expect(result.processedSize).toBeGreaterThan(0);
  });

  // ── Multi-stop gradient ─────────────────────────────────────────────

  it("three-stop gradient", async () => {
    const payload = createMultipartPayload([
      { name: "file", filename: "test.png", contentType: "image/png", content: PNG },
      {
        name: "settings",
        content: JSON.stringify({
          backgroundType: "linear-gradient",
          gradientStops: [
            { color: "#ff0000", position: 0 },
            { color: "#00ff00", position: 50 },
            { color: "#0000ff", position: 100 },
          ],
          gradientAngle: 90,
        }),
      },
    ]);

    const res = await post("/api/v1/tools/beautify", payload);
    expect(res.statusCode).toBe(200);

    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });

  // ── Frames ──────────────────────────────────────────────────────────

  const FRAME_TYPES = [
    "macos-light",
    "macos-dark",
    "windows-light",
    "windows-dark",
    "browser-light",
    "browser-dark",
    "iphone",
    "macbook",
    "ipad",
  ] as const;

  for (const frame of FRAME_TYPES) {
    it(`frame: ${frame}`, async () => {
      const payload = createMultipartPayload([
        { name: "file", filename: "test.png", contentType: "image/png", content: PNG },
        {
          name: "settings",
          content: JSON.stringify({ frame, shadowPreset: "none" }),
        },
      ]);

      const res = await post("/api/v1/tools/beautify", payload);
      expect(res.statusCode).toBe(200);

      const result = JSON.parse(res.body);
      expect(result.downloadUrl).toBeDefined();

      const dlRes = await app.inject({
        method: "GET",
        url: result.downloadUrl,
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(dlRes.statusCode).toBe(200);

      const meta = await sharp(dlRes.rawPayload).metadata();
      expect(meta.width).toBeGreaterThan(0);
      expect(meta.height).toBeGreaterThan(0);
    });
  }

  // ── Shadows ─────────────────────────────────────────────────────────

  const SHADOW_PRESETS = ["none", "subtle", "medium", "dramatic"] as const;

  for (const shadowPreset of SHADOW_PRESETS) {
    it(`shadow preset: ${shadowPreset}`, async () => {
      const payload = createMultipartPayload([
        { name: "file", filename: "test.png", contentType: "image/png", content: PNG },
        {
          name: "settings",
          content: JSON.stringify({ shadowPreset }),
        },
      ]);

      const res = await post("/api/v1/tools/beautify", payload);
      expect(res.statusCode).toBe(200);

      const result = JSON.parse(res.body);
      expect(result.downloadUrl).toBeDefined();
    });
  }

  it("custom shadow", async () => {
    const payload = createMultipartPayload([
      { name: "file", filename: "test.png", contentType: "image/png", content: PNG },
      {
        name: "settings",
        content: JSON.stringify({
          shadowPreset: "custom",
          shadowBlur: 50,
          shadowOffsetX: 10,
          shadowOffsetY: 15,
          shadowColor: "#ff0000",
          shadowOpacity: 60,
        }),
      },
    ]);

    const res = await post("/api/v1/tools/beautify", payload);
    expect(res.statusCode).toBe(200);

    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });

  // ── Social presets with dimension verification ──────────────────────

  const SOCIAL_PRESETS: Record<string, { w: number; h: number }> = {
    twitter: { w: 1600, h: 900 },
    linkedin: { w: 1200, h: 627 },
    "instagram-square": { w: 1080, h: 1080 },
    "instagram-story": { w: 1080, h: 1920 },
    facebook: { w: 1200, h: 630 },
    producthunt: { w: 1270, h: 760 },
  };

  for (const [preset, dims] of Object.entries(SOCIAL_PRESETS)) {
    it(`social preset: ${preset} (${dims.w}x${dims.h})`, async () => {
      const payload = createMultipartPayload([
        { name: "file", filename: "test.png", contentType: "image/png", content: PNG },
        {
          name: "settings",
          content: JSON.stringify({ socialPreset: preset, shadowPreset: "none" }),
        },
      ]);

      const res = await post("/api/v1/tools/beautify", payload);
      expect(res.statusCode).toBe(200);

      const result = JSON.parse(res.body);
      expect(result.downloadUrl).toBeDefined();

      const dlRes = await app.inject({
        method: "GET",
        url: result.downloadUrl,
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(dlRes.statusCode).toBe(200);

      const meta = await sharp(dlRes.rawPayload).metadata();
      expect(meta.width).toBe(dims.w);
      expect(meta.height).toBe(dims.h);
    });
  }

  // ── Watermark ───────────────────────────────────────────────────────

  it("watermark text bottom-right", async () => {
    const payload = createMultipartPayload([
      { name: "file", filename: "test.png", contentType: "image/png", content: PNG },
      {
        name: "settings",
        content: JSON.stringify({
          watermarkText: "SnapOtter",
          watermarkPosition: "bottom-right",
          watermarkOpacity: 80,
        }),
      },
    ]);

    const res = await post("/api/v1/tools/beautify", payload);
    expect(res.statusCode).toBe(200);

    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });

  // ── Padding extremes ────────────────────────────────────────────────

  it("padding 0 with no shadow", async () => {
    const payload = createMultipartPayload([
      { name: "file", filename: "test.png", contentType: "image/png", content: PNG },
      {
        name: "settings",
        content: JSON.stringify({ padding: 0, shadowPreset: "none" }),
      },
    ]);

    const res = await post("/api/v1/tools/beautify", payload);
    expect(res.statusCode).toBe(200);

    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });

  it("padding 256", async () => {
    const payload = createMultipartPayload([
      { name: "file", filename: "test.png", contentType: "image/png", content: PNG },
      {
        name: "settings",
        content: JSON.stringify({ padding: 256 }),
      },
    ]);

    const res = await post("/api/v1/tools/beautify", payload);
    expect(res.statusCode).toBe(200);

    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });

  // ── Border radius ───────────────────────────────────────────────────

  it("border radius 64", async () => {
    const payload = createMultipartPayload([
      { name: "file", filename: "test.png", contentType: "image/png", content: PNG },
      {
        name: "settings",
        content: JSON.stringify({ borderRadius: 64 }),
      },
    ]);

    const res = await post("/api/v1/tools/beautify", payload);
    expect(res.statusCode).toBe(200);

    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });

  // ── Error cases ─────────────────────────────────────────────────────

  it("missing file returns 400", async () => {
    const payload = createMultipartPayload([{ name: "settings", content: JSON.stringify({}) }]);

    const res = await post("/api/v1/tools/beautify", payload);
    expect(res.statusCode).toBe(400);

    const result = JSON.parse(res.body);
    expect(result.error).toMatch(/no image/i);
  });

  it("invalid parameters return 400", async () => {
    const payload = createMultipartPayload([
      { name: "file", filename: "test.png", contentType: "image/png", content: PNG },
      {
        name: "settings",
        content: JSON.stringify({ padding: -1 }),
      },
    ]);

    const res = await post("/api/v1/tools/beautify", payload);
    expect(res.statusCode).toBe(400);

    const result = JSON.parse(res.body);
    expect(result.error).toMatch(/invalid settings/i);
  });

  // ── Format forcing ──────────────────────────────────────────────────

  it("JPEG input + shadow produces PNG", async () => {
    const payload = createMultipartPayload([
      { name: "file", filename: "photo.jpg", contentType: "image/jpeg", content: JPG },
      {
        name: "settings",
        content: JSON.stringify({ shadowPreset: "medium" }),
      },
    ]);

    const res = await post("/api/v1/tools/beautify", payload);
    expect(res.statusCode).toBe(200);

    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toContain(".png");
  });

  it("JPEG input + opaque settings honors JPEG output", async () => {
    const payload = createMultipartPayload([
      { name: "file", filename: "photo.jpg", contentType: "image/jpeg", content: JPG },
      {
        name: "settings",
        content: JSON.stringify({
          backgroundType: "solid",
          shadowPreset: "none",
          borderRadius: 0,
          frame: "none",
          outputFormat: "jpeg",
        }),
      },
    ]);

    const res = await post("/api/v1/tools/beautify", payload);
    expect(res.statusCode).toBe(200);

    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toContain(".jpeg");
  });

  // ── Device frame + radius ───────────────────────────────────────────

  it("iPhone frame with borderRadius > 0 (radius silently ignored)", async () => {
    const payload = createMultipartPayload([
      { name: "file", filename: "test.png", contentType: "image/png", content: PNG },
      {
        name: "settings",
        content: JSON.stringify({
          frame: "iphone",
          borderRadius: 32,
          shadowPreset: "none",
        }),
      },
    ]);

    const res = await post("/api/v1/tools/beautify", payload);
    expect(res.statusCode).toBe(200);

    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });
});
