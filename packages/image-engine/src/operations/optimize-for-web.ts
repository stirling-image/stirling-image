import type { OptimizeForWebOptions, Sharp } from "../types.js";

export async function optimizeForWeb(image: Sharp, options: OptimizeForWebOptions): Promise<Sharp> {
  const {
    format,
    quality,
    maxWidth,
    maxHeight,
    progressive = true,
    stripMetadata = true,
  } = options;

  // Step 1: Resize if max dimensions are set
  if (maxWidth || maxHeight) {
    image = image.resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  // Step 2: Preserve metadata only if requested
  // Sharp strips metadata by default on output, so we only need to act
  // when the user wants to KEEP metadata.
  if (!stripMetadata) {
    image = image.withMetadata();
  }

  // Step 3: Convert to target format with optimized settings
  switch (format) {
    case "webp":
      return image.webp({ quality, effort: 4 });
    case "jpeg":
      return image.jpeg({ quality, progressive, mozjpeg: true });
    case "avif":
      return image.avif({ quality, effort: 4 });
    case "png":
      return image.png({ compressionLevel: 9, palette: true });
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}
