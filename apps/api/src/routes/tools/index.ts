import type { FastifyInstance } from "fastify";
import { registerResize } from "./resize.js";
import { registerCrop } from "./crop.js";
import { registerRotate } from "./rotate.js";
import { registerConvert } from "./convert.js";
import { registerCompress } from "./compress.js";
import { registerStripMetadata } from "./strip-metadata.js";
import { registerColorAdjustments } from "./color-adjustments.js";
// Phase 3: Watermark & Overlay
import { registerWatermarkText } from "./watermark-text.js";
import { registerWatermarkImage } from "./watermark-image.js";
import { registerTextOverlay } from "./text-overlay.js";
import { registerCompose } from "./compose.js";
// Phase 3: Utilities
import { registerInfo } from "./info.js";
import { registerCompare } from "./compare.js";
import { registerFindDuplicates } from "./find-duplicates.js";
import { registerColorPalette } from "./color-palette.js";
import { registerQrGenerate } from "./qr-generate.js";
import { registerBarcodeRead } from "./barcode-read.js";
// Phase 3: Layout & Composition
import { registerCollage } from "./collage.js";
import { registerSplit } from "./split.js";
import { registerBorder } from "./border.js";
// Phase 3: Format & Conversion
import { registerSvgToRaster } from "./svg-to-raster.js";
import { registerVectorize } from "./vectorize.js";
import { registerGifTools } from "./gif-tools.js";
// Phase 3: Optimization extras
import { registerBulkRename } from "./bulk-rename.js";
import { registerFavicon } from "./favicon.js";
import { registerImageToPdf } from "./image-to-pdf.js";
// Phase 3: Adjustments extra
import { registerReplaceColor } from "./replace-color.js";

/**
 * Registry that imports and registers all tool routes.
 * Each tool uses the createToolRoute factory from tool-factory.ts.
 */
export async function registerToolRoutes(app: FastifyInstance): Promise<void> {
  // Phase 2: Core tools
  registerResize(app);
  registerCrop(app);
  registerRotate(app);
  registerConvert(app);
  registerCompress(app);
  registerStripMetadata(app);
  registerColorAdjustments(app);

  // Phase 3: Watermark & Overlay
  registerWatermarkText(app);
  registerWatermarkImage(app);
  registerTextOverlay(app);
  registerCompose(app);

  // Phase 3: Utilities
  registerInfo(app);
  registerCompare(app);
  registerFindDuplicates(app);
  registerColorPalette(app);
  registerQrGenerate(app);
  registerBarcodeRead(app);

  // Phase 3: Layout & Composition
  registerCollage(app);
  registerSplit(app);
  registerBorder(app);

  // Phase 3: Format & Conversion
  registerSvgToRaster(app);
  registerVectorize(app);
  registerGifTools(app);

  // Phase 3: Optimization extras
  registerBulkRename(app);
  registerFavicon(app);
  registerImageToPdf(app);

  // Phase 3: Adjustments extra
  registerReplaceColor(app);

  app.log.info("Tool routes registered (26 tools, 29 endpoints)");
}
