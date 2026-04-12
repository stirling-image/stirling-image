import type { Sharp, SharpenOptions } from "../types.js";

export async function sharpen(image: Sharp, options: SharpenOptions): Promise<Sharp> {
  const { value } = options;

  if (value <= 0) return image;
  if (value > 100) {
    throw new Error("Sharpness value must be between 0 and 100");
  }

  // Map 0-100 to sigma 0.5-10
  const sigma = 0.5 + (value / 100) * 9.5;

  return image.sharpen({ sigma });
}
