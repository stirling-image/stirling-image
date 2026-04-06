import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveOutputFormat } from "../../../apps/api/src/lib/output-format.js";

const FIXTURES = join(__dirname, "..", "..", "fixtures");
const JPG = readFileSync(join(FIXTURES, "test-100x100.jpg"));
const PNG = readFileSync(join(FIXTURES, "test-200x150.png"));
const WEBP = readFileSync(join(FIXTURES, "test-50x50.webp"));

describe("resolveOutputFormat", () => {
  it("detects JPEG input and returns jpeg config", async () => {
    const result = await resolveOutputFormat(JPG, "photo.jpg");
    expect(result.format).toBe("jpeg");
    expect(result.extension).toBe("jpg");
    expect(result.contentType).toBe("image/jpeg");
    expect(result.quality).toBe(95);
  });

  it("detects PNG input and returns png config", async () => {
    const result = await resolveOutputFormat(PNG, "image.png");
    expect(result.format).toBe("png");
    expect(result.extension).toBe("png");
    expect(result.contentType).toBe("image/png");
    expect(result.quality).toBe(95);
  });

  it("detects WebP input and returns webp config", async () => {
    const result = await resolveOutputFormat(WEBP, "image.webp");
    expect(result.format).toBe("webp");
    expect(result.extension).toBe("webp");
    expect(result.contentType).toBe("image/webp");
    expect(result.quality).toBe(95);
  });

  it("falls back to PNG for unknown format", async () => {
    const garbage = Buffer.from("not an image at all");
    const result = await resolveOutputFormat(garbage, "mystery.bin");
    expect(result.format).toBe("png");
    expect(result.extension).toBe("png");
    expect(result.contentType).toBe("image/png");
  });

  it("respects quality override for lossy formats", async () => {
    const result = await resolveOutputFormat(JPG, "photo.jpg", 50);
    expect(result.quality).toBe(50);
  });

  it("accepts quality override for PNG without error", async () => {
    const result = await resolveOutputFormat(PNG, "image.png", 50);
    expect(result.format).toBe("png");
    expect(result.quality).toBe(50);
  });
});
