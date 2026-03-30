/**
 * Comprehensive format conversion tests.
 *
 * Verifies that every supported input format can be converted to every
 * supported output format via the /api/v1/tools/convert endpoint.
 * Also tests SVG-to-raster via the dedicated endpoint.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildTestApp, createMultipartPayload, loginAsAdmin, type TestApp } from "./test-server.js";

const FIXTURES = join(__dirname, "..", "fixtures");

// Output formats accepted by the convert tool
const OUTPUT_FORMATS = ["jpg", "png", "webp", "avif", "tiff", "gif"] as const;

// ---------------------------------------------------------------------------
// Shared state
// ---------------------------------------------------------------------------
let testApp: TestApp;
let app: TestApp["app"];
let adminToken: string;

// Input buffers generated from the PNG fixture (created in beforeAll)
const inputs: Record<string, { buffer: Buffer; filename: string; contentType: string }> = {};

beforeAll(async () => {
  testApp = await buildTestApp();
  app = testApp.app;
  adminToken = await loginAsAdmin(app);

  // Base fixture
  const png = readFileSync(join(FIXTURES, "test-200x150.png"));

  // Generate all raster input formats from the PNG fixture
  inputs.png = { buffer: png, filename: "test.png", contentType: "image/png" };
  inputs.jpg = {
    buffer: await sharp(png).jpeg().toBuffer(),
    filename: "test.jpg",
    contentType: "image/jpeg",
  };
  inputs.webp = {
    buffer: await sharp(png).webp().toBuffer(),
    filename: "test.webp",
    contentType: "image/webp",
  };
  inputs.avif = {
    buffer: await sharp(png).avif().toBuffer(),
    filename: "test.avif",
    contentType: "image/avif",
  };
  inputs.tiff = {
    buffer: await sharp(png).tiff().toBuffer(),
    filename: "test.tiff",
    contentType: "image/tiff",
  };
  inputs.gif = {
    buffer: await sharp(png).gif().toBuffer(),
    filename: "test.gif",
    contentType: "image/gif",
  };
  inputs.svg = {
    buffer: readFileSync(join(FIXTURES, "test-100x100.svg")),
    filename: "test.svg",
    contentType: "image/svg+xml",
  };
}, 30_000);

afterAll(async () => {
  await testApp.cleanup();
}, 10_000);

// ---------------------------------------------------------------------------
// Raster-to-raster conversions via /api/v1/tools/convert
// ---------------------------------------------------------------------------
describe("Format conversion matrix", () => {
  const rasterInputs = ["png", "jpg", "webp", "avif", "tiff", "gif"];

  for (const inputFmt of rasterInputs) {
    for (const outputFmt of OUTPUT_FORMATS) {
      it(`converts ${inputFmt} -> ${outputFmt}`, async () => {
        const input = inputs[inputFmt];
        const { body: payload, contentType } = createMultipartPayload([
          {
            name: "file",
            filename: input.filename,
            contentType: input.contentType,
            content: input.buffer,
          },
          { name: "settings", content: JSON.stringify({ format: outputFmt }) },
        ]);

        const res = await app.inject({
          method: "POST",
          url: "/api/v1/tools/convert",
          headers: {
            authorization: `Bearer ${adminToken}`,
            "content-type": contentType,
          },
          body: payload,
        });

        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(body.downloadUrl).toContain(`.${outputFmt}`);
        expect(body.processedSize).toBeGreaterThan(0);
      });
    }
  }
});

// ---------------------------------------------------------------------------
// SVG-to-raster conversions via /api/v1/tools/convert
// ---------------------------------------------------------------------------
describe("SVG via convert tool", () => {
  for (const outputFmt of OUTPUT_FORMATS) {
    it(`converts svg -> ${outputFmt}`, async () => {
      const input = inputs.svg;
      const { body: payload, contentType } = createMultipartPayload([
        {
          name: "file",
          filename: input.filename,
          contentType: input.contentType,
          content: input.buffer,
        },
        { name: "settings", content: JSON.stringify({ format: outputFmt }) },
      ]);

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/tools/convert",
        headers: {
          authorization: `Bearer ${adminToken}`,
          "content-type": contentType,
        },
        body: payload,
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.downloadUrl).toContain(`.${outputFmt}`);
      expect(body.processedSize).toBeGreaterThan(0);
    });
  }
});

// ---------------------------------------------------------------------------
// SVG-to-raster via dedicated endpoint
// ---------------------------------------------------------------------------
describe("SVG via dedicated svg-to-raster endpoint", () => {
  for (const outputFmt of ["png", "jpg", "webp"] as const) {
    it(`converts svg -> ${outputFmt} via svg-to-raster`, async () => {
      const input = inputs.svg;
      const { body: payload, contentType } = createMultipartPayload([
        {
          name: "file",
          filename: input.filename,
          contentType: input.contentType,
          content: input.buffer,
        },
        { name: "settings", content: JSON.stringify({ outputFormat: outputFmt, width: 200 }) },
      ]);

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/tools/svg-to-raster",
        headers: {
          authorization: `Bearer ${adminToken}`,
          "content-type": contentType,
        },
        body: payload,
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.downloadUrl).toContain(`.${outputFmt}`);
      expect(body.processedSize).toBeGreaterThan(0);
    });
  }
});
