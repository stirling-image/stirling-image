import sharp from "sharp";
import { parseHex } from "./constants.js";

interface ShadowOpts {
  blur: number;
  offsetX: number;
  offsetY: number;
  color: string;
  opacity: number;
}

interface ShadowResult {
  buffer: Buffer;
  imgX: number;
  imgY: number;
  padLeft: number;
  padTop: number;
}

export async function applyShadow(imageBuffer: Buffer, opts: ShadowOpts): Promise<ShadowResult> {
  const buf = await sharp(imageBuffer).ensureAlpha().png().toBuffer();
  const meta = await sharp(buf).metadata();
  const bW = meta.width ?? 100;
  const bH = meta.height ?? 100;

  const sc = parseHex(opts.color);
  const alpha = opts.opacity / 100;
  const blur = opts.blur;
  const spread = Math.ceil(blur * 2);
  const ox = opts.offsetX;
  const oy = opts.offsetY;

  const shadowSilhouette = await sharp({
    create: {
      width: bW,
      height: bH,
      channels: 4,
      background: { r: sc.r, g: sc.g, b: sc.b, alpha },
    },
  })
    .composite([{ input: buf, blend: "dest-in" }])
    .extend({
      top: spread,
      bottom: spread,
      left: spread,
      right: spread,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .blur(Math.max(blur, 0.3))
    .png()
    .toBuffer();

  const padL = Math.max(0, spread - ox);
  const padR = Math.max(0, spread + ox);
  const padT = Math.max(0, spread - oy);
  const padB = Math.max(0, spread + oy);

  const canvasW = bW + padL + padR;
  const canvasH = bH + padT + padB;

  const imgX = padL;
  const imgY = padT;
  const shadX = Math.max(0, imgX + ox - spread);
  const shadY = Math.max(0, imgY + oy - spread);

  const result = await sharp({
    create: {
      width: canvasW,
      height: canvasH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: shadowSilhouette, left: shadX, top: shadY },
      { input: buf, left: imgX, top: imgY },
    ])
    .png()
    .toBuffer();

  return { buffer: result, imgX, imgY, padLeft: padL, padTop: padT };
}
