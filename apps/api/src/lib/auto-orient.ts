import sharp from "sharp";

/**
 * Auto-orient an image buffer based on EXIF orientation metadata.
 *
 * Camera photos embed an EXIF Orientation tag (values 2-8) that viewers
 * respect when displaying. Sharp strips this tag during processing but
 * does NOT auto-rotate the pixels, so the output appears rotated.
 *
 * This function physically rotates the pixels to match the EXIF orientation,
 * then strips the tag so downstream processing produces correct results.
 *
 * Returns the original buffer unchanged if no rotation is needed.
 */
export async function autoOrient(buffer: Buffer): Promise<Buffer> {
  try {
    const meta = await sharp(buffer).metadata();
    if (meta.orientation && meta.orientation > 1) {
      return await sharp(buffer).rotate().toBuffer();
    }
  } catch {
    // If metadata reading fails, return the original buffer
  }
  return buffer;
}
