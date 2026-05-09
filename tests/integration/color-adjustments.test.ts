/**
 * Integration tests for the color-adjustments tool.
 *
 * Covers brightness, contrast, exposure, saturation, hue, temperature, tint,
 * sharpness, channel adjustments, and effects (grayscale, sepia, invert).
 * Also tests legacy alias routes (brightness-contrast, saturation, etc.).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildTestApp, createMultipartPayload, loginAsAdmin, type TestApp } from "./test-server.js";

const FIXTURES = join(__dirname, "..", "fixtures");
const PNG = readFileSync(join(FIXTURES, "test-200x150.png"));
const JPG = readFileSync(join(FIXTURES, "test-100x100.jpg"));
const WEBP = readFileSync(join(FIXTURES, "test-50x50.webp"));

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

function makePayload(
  settings: Record<string, unknown>,
  buffer: Buffer = PNG,
  filename = "test.png",
  contentType = "image/png",
) {
  return createMultipartPayload([
    { name: "file", filename, contentType, content: buffer },
    { name: "settings", content: JSON.stringify(settings) },
  ]);
}

async function postTool(
  toolId: string,
  settings: Record<string, unknown>,
  buffer?: Buffer,
  filename?: string,
  ct?: string,
) {
  const { body: payload, contentType } = makePayload(settings, buffer, filename, ct);
  return app.inject({
    method: "POST",
    url: `/api/v1/tools/${toolId}`,
    payload,
    headers: {
      "content-type": contentType,
      authorization: `Bearer ${adminToken}`,
    },
  });
}

// ── Brightness ────────────────────────────────────────────────────
describe("Brightness", () => {
  it("increases brightness", async () => {
    const res = await postTool("adjust-colors", { brightness: 50 });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
    expect(result.processedSize).toBeGreaterThan(0);
  });

  it("decreases brightness", async () => {
    const res = await postTool("adjust-colors", { brightness: -50 });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });
});

// ── Contrast ──────────────────────────────────────────────────────
describe("Contrast", () => {
  it("increases contrast", async () => {
    const res = await postTool("adjust-colors", { contrast: 75 });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });

  it("decreases contrast", async () => {
    const res = await postTool("adjust-colors", { contrast: -40 });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });
});

// ── Multiple adjustments at once ──────────────────────────────────
describe("Multiple adjustments", () => {
  it("applies brightness + contrast + saturation together", async () => {
    const res = await postTool("adjust-colors", {
      brightness: 20,
      contrast: -10,
      saturation: 30,
    });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
    expect(result.processedSize).toBeGreaterThan(0);
  });

  it("applies exposure + temperature + tint", async () => {
    const res = await postTool("adjust-colors", {
      exposure: 25,
      temperature: 40,
      tint: -20,
    });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });

  it("applies hue shift + sharpness + channel adjustments", async () => {
    const res = await postTool("adjust-colors", {
      hue: 90,
      sharpness: 50,
      red: 120,
      green: 80,
      blue: 150,
    });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });
});

// ── Extreme values ────────────────────────────────────────────────
describe("Extreme values", () => {
  it("handles max brightness (+100)", async () => {
    const res = await postTool("adjust-colors", { brightness: 100 });
    expect(res.statusCode).toBe(200);
  });

  it("handles min brightness (-100)", async () => {
    const res = await postTool("adjust-colors", { brightness: -100 });
    expect(res.statusCode).toBe(200);
  });

  it("handles max contrast (+100)", async () => {
    const res = await postTool("adjust-colors", { contrast: 100 });
    expect(res.statusCode).toBe(200);
  });

  it("handles all zeroes (no-op)", async () => {
    const res = await postTool("adjust-colors", {});
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.processedSize).toBeGreaterThan(0);
  });

  it("handles extreme hue rotation (+180)", async () => {
    const res = await postTool("adjust-colors", { hue: 180 });
    expect(res.statusCode).toBe(200);
  });

  it("handles extreme hue rotation (-180)", async () => {
    const res = await postTool("adjust-colors", { hue: -180 });
    expect(res.statusCode).toBe(200);
  });

  it("handles max channel values (red=200, green=200, blue=200)", async () => {
    const res = await postTool("adjust-colors", { red: 200, green: 200, blue: 200 });
    expect(res.statusCode).toBe(200);
  });

  it("handles min channel values (red=0, green=0, blue=0)", async () => {
    const res = await postTool("adjust-colors", { red: 0, green: 0, blue: 0 });
    expect(res.statusCode).toBe(200);
  });
});

// ── Effects ───────────────────────────────────────────────────────
describe("Effects", () => {
  it("applies grayscale effect", async () => {
    const res = await postTool("adjust-colors", { effect: "grayscale" });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });

  it("applies sepia effect", async () => {
    const res = await postTool("adjust-colors", { effect: "sepia" });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });

  it("applies invert effect", async () => {
    const res = await postTool("adjust-colors", { effect: "invert" });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });
});

// ── Format support ────────────────────────────────────────────────
describe("Multiple input formats", () => {
  it("processes JPEG input", async () => {
    const res = await postTool("adjust-colors", { brightness: 30 }, JPG, "test.jpg", "image/jpeg");
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });

  it("processes WebP input", async () => {
    const res = await postTool(
      "adjust-colors",
      { saturation: 50 },
      WEBP,
      "test.webp",
      "image/webp",
    );
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });
});

// ── Legacy alias routes ───────────────────────────────────────────
describe("Legacy alias routes", () => {
  it("brightness-contrast alias works", async () => {
    const res = await postTool("brightness-contrast", { brightness: 25, contrast: -10 });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });

  it("saturation alias works", async () => {
    const res = await postTool("saturation", { saturation: 50 });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });

  it("color-channels alias works", async () => {
    const res = await postTool("color-channels", { red: 150, green: 50, blue: 100 });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });

  it("color-effects alias works", async () => {
    const res = await postTool("color-effects", { effect: "sepia" });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });
});

// ── Error handling ────────────────────────────────────────────────
describe("Error handling", () => {
  it("returns 400 when no file is provided", async () => {
    const { body: payload, contentType } = createMultipartPayload([
      { name: "settings", content: JSON.stringify({ brightness: 50 }) },
    ]);
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/tools/adjust-colors",
      payload,
      headers: {
        "content-type": contentType,
        authorization: `Bearer ${adminToken}`,
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for invalid settings (brightness out of range)", async () => {
    const res = await postTool("adjust-colors", { brightness: 500 });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for invalid effect value", async () => {
    const res = await postTool("adjust-colors", { effect: "neon" });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for invalid channel value (negative)", async () => {
    const res = await postTool("adjust-colors", { red: -10 });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for hue out of range", async () => {
    const res = await postTool("adjust-colors", { hue: 360 });
    expect(res.statusCode).toBe(400);
  });
});

// ── Download verification ─────────────────────────────────────────
describe("Download verification", () => {
  it("can download the adjusted image and it has valid dimensions", async () => {
    const res = await postTool("adjust-colors", { brightness: 30, effect: "sepia" });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);

    const dlRes = await app.inject({
      method: "GET",
      url: result.downloadUrl,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(dlRes.statusCode).toBe(200);

    const meta = await sharp(dlRes.rawPayload).metadata();
    expect(meta.width).toBe(200);
    expect(meta.height).toBe(150);
  });
});

// ── Branch coverage: lines 87-88 (negative exposure path) ────────
describe("Exposure adjustments", () => {
  it("applies positive exposure (brightens midtones)", async () => {
    const res = await postTool("adjust-colors", { exposure: 50 });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });

  it("applies negative exposure (darkens midtones)", async () => {
    const res = await postTool("adjust-colors", { exposure: -50 });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });

  it("handles max positive exposure (+100)", async () => {
    const res = await postTool("adjust-colors", { exposure: 100 });
    expect(res.statusCode).toBe(200);
  });

  it("handles max negative exposure (-100)", async () => {
    const res = await postTool("adjust-colors", { exposure: -100 });
    expect(res.statusCode).toBe(200);
  });

  it("handles zero exposure (no-op)", async () => {
    const res = await postTool("adjust-colors", { exposure: 0 });
    expect(res.statusCode).toBe(200);
  });
});

// ── HEIC input ──────────────────────────────────────────────────
describe("HEIC input", () => {
  it("processes HEIC input with brightness adjustment", { timeout: 120_000 }, async () => {
    const HEIC = readFileSync(join(FIXTURES, "test-200x150.heic"));
    const res = await postTool(
      "adjust-colors",
      { brightness: 30 },
      HEIC,
      "photo.heic",
      "image/heic",
    );
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });
});

// ── Combined adjustments with exposure ──────────────────────────
describe("Combined exposure adjustments", () => {
  it("applies exposure + brightness + contrast together", async () => {
    const res = await postTool("adjust-colors", {
      exposure: -30,
      brightness: 20,
      contrast: 10,
    });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });

  it("applies all adjustments simultaneously", async () => {
    const res = await postTool("adjust-colors", {
      brightness: 10,
      contrast: 15,
      exposure: 20,
      saturation: 30,
      temperature: 10,
      tint: -5,
      hue: 45,
      sharpness: 25,
      red: 110,
      green: 90,
      blue: 105,
      effect: "none",
    });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });
});

// ── Tiny and stress inputs ──────────────────────────────────────
describe("Edge size inputs", () => {
  it("processes 1x1 pixel image", async () => {
    const TINY = readFileSync(join(FIXTURES, "test-1x1.png"));
    const res = await postTool("adjust-colors", { brightness: 50 }, TINY, "tiny.png", "image/png");
    expect(res.statusCode).toBe(200);
  });

  it("processes stress-large.jpg", async () => {
    const LARGE = readFileSync(join(FIXTURES, "content", "stress-large.jpg"));
    const res = await postTool("adjust-colors", { contrast: 30 }, LARGE, "large.jpg", "image/jpeg");
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.processedSize).toBeGreaterThan(0);
  });
});

// ── Temperature + tint branch coverage ──────────────────────────
describe("Temperature and tint isolation", () => {
  it("applies only temperature (no tint)", async () => {
    const res = await postTool("adjust-colors", { temperature: 80 });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });

  it("applies only tint (no temperature)", async () => {
    const res = await postTool("adjust-colors", { tint: 60 });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });

  it("applies negative temperature (cool)", async () => {
    const res = await postTool("adjust-colors", { temperature: -80 });
    expect(res.statusCode).toBe(200);
  });

  it("applies negative tint", async () => {
    const res = await postTool("adjust-colors", { tint: -80 });
    expect(res.statusCode).toBe(200);
  });

  it("applies max temperature + max tint", async () => {
    const res = await postTool("adjust-colors", { temperature: 100, tint: 100 });
    expect(res.statusCode).toBe(200);
  });
});

// ── Saturation + hue isolation ──────────────────────────────────
describe("Saturation and hue isolation", () => {
  it("applies only saturation (no hue)", async () => {
    const res = await postTool("adjust-colors", { saturation: -50 });
    expect(res.statusCode).toBe(200);
  });

  it("applies only hue (no saturation)", async () => {
    const res = await postTool("adjust-colors", { hue: 120 });
    expect(res.statusCode).toBe(200);
  });
});

// ── Channel isolation ───────────────────────────────────────────
describe("Channel isolation", () => {
  it("adjusts only red channel", async () => {
    const res = await postTool("adjust-colors", { red: 150 });
    expect(res.statusCode).toBe(200);
  });

  it("adjusts only green channel", async () => {
    const res = await postTool("adjust-colors", { green: 50 });
    expect(res.statusCode).toBe(200);
  });

  it("adjusts only blue channel", async () => {
    const res = await postTool("adjust-colors", { blue: 180 });
    expect(res.statusCode).toBe(200);
  });
});

// ── Sharpness isolation ─────────────────────────────────────────
describe("Sharpness isolation", () => {
  it("applies max sharpness (100)", async () => {
    const res = await postTool("adjust-colors", { sharpness: 100 });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });

  it("applies zero sharpness (no-op)", async () => {
    const res = await postTool("adjust-colors", { sharpness: 0 });
    expect(res.statusCode).toBe(200);
  });
});

// ── Rejects invalid temperature/tint ────────────────────────────
describe("Temperature/tint validation", () => {
  it("rejects temperature out of range (>100)", async () => {
    const res = await postTool("adjust-colors", { temperature: 150 });
    expect(res.statusCode).toBe(400);
  });

  it("rejects tint out of range (>100)", async () => {
    const res = await postTool("adjust-colors", { tint: 150 });
    expect(res.statusCode).toBe(400);
  });

  it("rejects sharpness out of range (>100)", async () => {
    const res = await postTool("adjust-colors", { sharpness: 150 });
    expect(res.statusCode).toBe(400);
  });
});

// ── Unauthenticated ─────────────────────────────────────────────
describe("Authentication", () => {
  it("rejects unauthenticated request", async () => {
    const { body: payload, contentType } = makePayload({ brightness: 30 });
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/tools/adjust-colors",
      payload,
      headers: { "content-type": contentType },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── Effect: none (no-op effect) ─────────────────────────────────
describe("No-op effect", () => {
  it("applies 'none' effect (no color effect applied)", async () => {
    const res = await postTool("adjust-colors", { effect: "none" });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });
});

// ── HEIF input ──────────────────────────────────────────────────
describe("HEIF input", () => {
  it(
    "processes HEIF input (motorcycle.heif)",
    { timeout: 120_000 },
    async () => {
      const HEIF = readFileSync(join(FIXTURES, "content", "motorcycle.heif"));
      const res = await postTool(
        "adjust-colors",
        { brightness: 20 },
        HEIF,
        "photo.heif",
        "image/heif",
      );
      expect(res.statusCode).toBe(200);
      const result = JSON.parse(res.body);
      expect(result.downloadUrl).toBeDefined();
    },
    60_000,
  );
});

// ── Animated GIF input ──────────────────────────────────────────
describe("Animated GIF input", () => {
  it("processes animated GIF", async () => {
    const GIF = readFileSync(join(FIXTURES, "animated.gif"));
    const res = await postTool("adjust-colors", { saturation: 30 }, GIF, "anim.gif", "image/gif");
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });
});

// ── SVG input ───────────────────────────────────────────────────
describe("SVG input", () => {
  it("processes SVG input", async () => {
    const SVG = readFileSync(join(FIXTURES, "test-100x100.svg"));
    const res = await postTool("adjust-colors", { contrast: 20 }, SVG, "icon.svg", "image/svg+xml");
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });
});

// ── TIFF input ─────────────────────────────────────────────────
describe("TIFF input", () => {
  it("processes TIFF input with saturation adjustment", async () => {
    const TIFF = readFileSync(join(FIXTURES, "formats", "sample.tiff"));
    const res = await postTool(
      "adjust-colors",
      { saturation: 40 },
      TIFF,
      "test.tiff",
      "image/tiff",
    );
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });
});

// ── Exposure out of range ──────────────────────────────────────
describe("Exposure validation", () => {
  it("rejects exposure out of range (>100)", async () => {
    const res = await postTool("adjust-colors", { exposure: 101 });
    expect(res.statusCode).toBe(400);
  });

  it("rejects exposure out of range (<-100)", async () => {
    const res = await postTool("adjust-colors", { exposure: -101 });
    expect(res.statusCode).toBe(400);
  });
});

// ── Channel value validation ───────────────────────────────────
describe("Channel value validation", () => {
  it("rejects channel value exceeding max (>200)", async () => {
    const res = await postTool("adjust-colors", { red: 201 });
    expect(res.statusCode).toBe(400);
  });

  it("rejects green channel exceeding max", async () => {
    const res = await postTool("adjust-colors", { green: 201 });
    expect(res.statusCode).toBe(400);
  });

  it("rejects blue channel exceeding max", async () => {
    const res = await postTool("adjust-colors", { blue: 201 });
    expect(res.statusCode).toBe(400);
  });
});

// ── Contrast out of range ──────────────────────────────────────
describe("Contrast validation", () => {
  it("rejects contrast out of range (>100)", async () => {
    const res = await postTool("adjust-colors", { contrast: 101 });
    expect(res.statusCode).toBe(400);
  });

  it("rejects contrast out of range (<-100)", async () => {
    const res = await postTool("adjust-colors", { contrast: -101 });
    expect(res.statusCode).toBe(400);
  });
});

// ── Saturation out of range ────────────────────────────────────
describe("Saturation validation", () => {
  it("rejects saturation out of range (>100)", async () => {
    const res = await postTool("adjust-colors", { saturation: 101 });
    expect(res.statusCode).toBe(400);
  });

  it("rejects saturation out of range (<-100)", async () => {
    const res = await postTool("adjust-colors", { saturation: -101 });
    expect(res.statusCode).toBe(400);
  });
});

// ── Combined color adjustments with format verification ────────
describe("Output format verification", () => {
  it("preserves JPEG format with adjustments", async () => {
    const res = await postTool(
      "adjust-colors",
      { brightness: 20, contrast: 10, saturation: -15 },
      JPG,
      "test.jpg",
      "image/jpeg",
    );
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    const dlRes = await app.inject({
      method: "GET",
      url: result.downloadUrl,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const meta = await sharp(dlRes.rawPayload).metadata();
    expect(meta.format).toBe("jpeg");
    expect(meta.width).toBe(100);
    expect(meta.height).toBe(100);
  });

  it("preserves WebP format with adjustments", async () => {
    const res = await postTool(
      "adjust-colors",
      { hue: 60, temperature: 30 },
      WEBP,
      "test.webp",
      "image/webp",
    );
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    const dlRes = await app.inject({
      method: "GET",
      url: result.downloadUrl,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const meta = await sharp(dlRes.rawPayload).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(50);
    expect(meta.height).toBe(50);
  });
});

// ── Effect combined with adjustments ───────────────────────────
describe("Effect combined with adjustments", () => {
  it("applies grayscale effect with brightness and contrast", async () => {
    const res = await postTool("adjust-colors", {
      effect: "grayscale",
      brightness: 15,
      contrast: 20,
    });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });

  it("applies invert effect with channel adjustments", async () => {
    const res = await postTool("adjust-colors", {
      effect: "invert",
      red: 120,
      green: 80,
      blue: 100,
    });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
  });
});

// ── Reset to defaults (all zeroes) verifies no change ─────────
describe("Reset to defaults", () => {
  it("all-zero settings produce output matching dimensions", async () => {
    const res = await postTool("adjust-colors", {
      brightness: 0,
      contrast: 0,
      exposure: 0,
      saturation: 0,
      temperature: 0,
      tint: 0,
      hue: 0,
      sharpness: 0,
      red: 100,
      green: 100,
      blue: 100,
      effect: "none",
    });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    const dlRes = await app.inject({
      method: "GET",
      url: result.downloadUrl,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const meta = await sharp(dlRes.rawPayload).metadata();
    expect(meta.width).toBe(200);
    expect(meta.height).toBe(150);
  });
});

// ── Invalid settings JSON ────────────────────────────────────
describe("Invalid settings JSON", () => {
  it("rejects malformed settings JSON string", async () => {
    const { body: payload, contentType } = makePayload({ brightness: 50 });
    // Override the settings field to invalid JSON
    const { body: badPayload, contentType: badCt } = createMultipartPayload([
      { name: "file", filename: "test.png", contentType: "image/png", content: PNG },
      { name: "settings", content: "not-json" },
    ]);
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/tools/adjust-colors",
      payload: badPayload,
      headers: {
        "content-type": badCt,
        authorization: `Bearer ${adminToken}`,
      },
    });
    expect(res.statusCode).toBe(400);
  });
});

// ── Sepia effect with extreme values ──────────────────────────
describe("Sepia with extreme values", () => {
  it("applies sepia with max brightness and min contrast", async () => {
    const res = await postTool("adjust-colors", {
      effect: "sepia",
      brightness: 100,
      contrast: -100,
    });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    expect(result.downloadUrl).toBeDefined();
    expect(result.processedSize).toBeGreaterThan(0);
  });
});

// ── Grayscale preserves dimensions ────────────────────────────
describe("Grayscale dimension preservation", () => {
  it("grayscale output preserves original dimensions", async () => {
    const res = await postTool("adjust-colors", { effect: "grayscale" });
    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    const dlRes = await app.inject({
      method: "GET",
      url: result.downloadUrl,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const meta = await sharp(dlRes.rawPayload).metadata();
    expect(meta.width).toBe(200);
    expect(meta.height).toBe(150);
  });
});
