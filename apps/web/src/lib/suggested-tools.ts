const TOOL_SUGGESTIONS: Record<string, string[]> = {
  resize: ["compress", "convert", "watermark-text", "strip-metadata"],
  crop: ["resize", "compress", "convert"],
  rotate: ["crop", "resize", "compress"],
  convert: ["compress", "strip-metadata", "watermark-text"],
  compress: ["convert", "strip-metadata", "watermark-text"],
  "strip-metadata": ["compress", "convert"],
  "adjust-colors": ["compress", "convert", "resize"],
  "replace-color": ["compress", "convert"],
  "remove-background": ["resize", "compress", "convert"],
  upscale: ["compress", "convert"],
  "smart-crop": ["resize", "compress"],
  "image-enhancement": ["adjust-colors", "upscale", "compress"],
  "watermark-text": ["compress", "convert"],
  "watermark-image": ["compress", "convert"],
  "text-overlay": ["compress", "convert"],
  colorize: ["adjust-colors", "image-enhancement", "upscale", "compress"],
  "restore-photo": ["colorize", "upscale", "image-enhancement", "adjust-colors"],
  sharpening: ["adjust-colors", "compress", "convert", "resize"],
  border: ["compress", "convert", "resize"],
};

export function getSuggestedTools(currentToolId: string): string[] {
  return TOOL_SUGGESTIONS[currentToolId] || ["resize", "compress", "convert"];
}
