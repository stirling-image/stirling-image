export interface ToolDef {
  name: string;
  category: string;
}

export const TOOLS: ToolDef[] = [
  // Essentials
  { name: "Resize", category: "essentials" },
  { name: "Crop", category: "essentials" },
  { name: "Rotate & Flip", category: "essentials" },
  { name: "Convert", category: "essentials" },
  { name: "Compress", category: "essentials" },
  // Optimization
  { name: "Optimize for Web", category: "optimization" },
  { name: "Remove Metadata", category: "optimization" },
  { name: "Edit Metadata", category: "optimization" },
  { name: "Bulk Rename", category: "optimization" },
  { name: "Image to PDF", category: "optimization" },
  { name: "Favicon Generator", category: "optimization" },
  // Adjustments
  { name: "Adjust Colors", category: "adjustments" },
  { name: "Sharpening", category: "adjustments" },
  { name: "Replace & Invert Color", category: "adjustments" },
  { name: "Color Blindness Simulation", category: "adjustments" },
  // AI Tools
  { name: "Remove Background", category: "ai" },
  { name: "Image Upscaling", category: "ai" },
  { name: "Object Eraser", category: "ai" },
  { name: "OCR / Text Extraction", category: "ai" },
  { name: "Face / PII Blur", category: "ai" },
  { name: "Smart Crop", category: "ai" },
  { name: "Image Enhancement", category: "ai" },
  { name: "Face Enhancement", category: "ai" },
  { name: "AI Colorization", category: "ai" },
  { name: "Noise Removal", category: "ai" },
  { name: "Red Eye Removal", category: "ai" },
  { name: "Photo Restoration", category: "ai" },
  { name: "Passport Photo", category: "ai" },
  { name: "Content-Aware Resize", category: "ai" },
  { name: "PNG Transparency Fixer", category: "ai" },
  // Watermark & Overlay
  { name: "Text Watermark", category: "watermark" },
  { name: "Image Watermark", category: "watermark" },
  { name: "Text Overlay", category: "watermark" },
  { name: "Image Composition", category: "watermark" },
  // Utilities
  { name: "Image Info", category: "utilities" },
  { name: "Image Compare", category: "utilities" },
  { name: "Find Duplicates", category: "utilities" },
  { name: "Color Palette", category: "utilities" },
  { name: "QR Code Generator", category: "utilities" },
  { name: "Barcode Reader", category: "utilities" },
  { name: "Image to Base64", category: "utilities" },
  // Layout & Composition
  { name: "Collage / Grid", category: "layout" },
  { name: "Stitch / Combine", category: "layout" },
  { name: "Image Splitting", category: "layout" },
  { name: "Border & Frame", category: "layout" },
  // Format & Conversion
  { name: "SVG to Raster", category: "format" },
  { name: "Image to SVG", category: "format" },
  { name: "GIF Tools", category: "format" },
  { name: "PDF to Image", category: "format" },
];

export function getToolsByCategory(category: string): ToolDef[] {
  return TOOLS.filter((t) => t.category === category);
}
