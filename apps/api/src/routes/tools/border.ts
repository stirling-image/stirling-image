import { z } from "zod";
import { createToolRoute } from "../tool-factory.js";
import sharp from "sharp";
import type { FastifyInstance } from "fastify";

const settingsSchema = z.object({
  borderWidth: z.number().min(0).max(200).default(10),
  borderColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#000000"),
  cornerRadius: z.number().min(0).max(500).default(0),
  padding: z.number().min(0).max(200).default(0),
  shadowBlur: z.number().min(0).max(50).default(0),
  shadowColor: z.string().regex(/^#[0-9a-fA-F]{6,8}$/).default("#00000080"),
});

export function registerBorder(app: FastifyInstance) {
  createToolRoute(app, {
    toolId: "border",
    settingsSchema,
    process: async (inputBuffer, settings, filename) => {
      const image = sharp(inputBuffer);
      const meta = await image.metadata();
      const w = meta.width ?? 100;
      const h = meta.height ?? 100;

      // Parse border color
      const br = parseInt(settings.borderColor.slice(1, 3), 16);
      const bg = parseInt(settings.borderColor.slice(3, 5), 16);
      const bb = parseInt(settings.borderColor.slice(5, 7), 16);

      const totalBorder = settings.borderWidth + settings.padding;
      const shadowPad = settings.shadowBlur > 0 ? settings.shadowBlur * 2 : 0;

      // Extend image with border
      let result = sharp(inputBuffer).extend({
        top: totalBorder + shadowPad,
        bottom: totalBorder + shadowPad,
        left: totalBorder + shadowPad,
        right: totalBorder + shadowPad,
        background: { r: br, g: bg, b: bb, alpha: 1 },
      });

      // If inner padding, overlay a background-colored rectangle for padding area
      if (settings.padding > 0 && settings.borderWidth > 0) {
        const outerW = w + totalBorder * 2 + shadowPad * 2;
        const outerH = h + totalBorder * 2 + shadowPad * 2;

        // Create a white padding region behind the image
        const paddingRect = await sharp({
          create: {
            width: w + settings.padding * 2,
            height: h + settings.padding * 2,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          },
        })
          .png()
          .toBuffer();

        const currentBuf = await result.toBuffer();
        result = sharp(currentBuf).composite([
          {
            input: paddingRect,
            top: settings.borderWidth + shadowPad,
            left: settings.borderWidth + shadowPad,
          },
          {
            input: inputBuffer,
            top: totalBorder + shadowPad,
            left: totalBorder + shadowPad,
          },
        ]);
      }

      // Apply rounded corners via SVG mask
      if (settings.cornerRadius > 0) {
        const buf = await result.ensureAlpha().toBuffer();
        const bufMeta = await sharp(buf).metadata();
        const maskW = bufMeta.width ?? w;
        const maskH = bufMeta.height ?? h;
        const r = Math.min(settings.cornerRadius, maskW / 2, maskH / 2);

        const roundedMask = Buffer.from(
          `<svg width="${maskW}" height="${maskH}">
            <rect x="0" y="0" width="${maskW}" height="${maskH}" rx="${r}" ry="${r}" fill="white"/>
          </svg>`,
        );

        const maskBuffer = await sharp(roundedMask)
          .resize(maskW, maskH)
          .toBuffer();

        result = sharp(buf).composite([
          { input: maskBuffer, blend: "dest-in" },
        ]);
      }

      const buffer = await result.png().toBuffer();
      return { buffer, filename, contentType: "image/png" };
    },
  });
}
