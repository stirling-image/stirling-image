const MAX_SVG_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Sanitize an SVG buffer to prevent XXE, SSRF, and script injection.
 * Throws if the SVG exceeds the maximum allowed size.
 */
export function sanitizeSvg(buffer: Buffer): Buffer {
  if (buffer.length > MAX_SVG_SIZE) {
    throw new Error(`SVG exceeds maximum size of ${MAX_SVG_SIZE / 1024 / 1024}MB`);
  }
  let svg = buffer.toString("utf-8");
  // Remove DOCTYPE (XXE prevention, including internal subsets)
  svg = svg.replace(/<!DOCTYPE[^>[]*(?:\[[^\]]*\])?>/gi, "");
  // Remove XML processing instructions except <?xml version...?>
  svg = svg.replace(/<\?(?!xml\s)[^?]*\?>/gi, "");
  // Remove XInclude elements and namespace declarations
  svg = svg.replace(/<[^>]*xi:include[^>]*\/?>/gi, "");
  svg = svg.replace(/xmlns:xi\s*=\s*["'][^"']*["']/gi, "");
  // Remove script tags
  svg = svg.replace(/<script[\s\S]*?<\/script>/gi, "");
  // Remove foreignObject elements (can embed arbitrary HTML)
  svg = svg.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "");
  svg = svg.replace(/<foreignObject[^>]*\/>/gi, "");
  // Remove event handlers (onload, onclick, onerror, etc.)
  svg = svg.replace(/\bon\w+\s*=/gi, "data-removed=");
  // Block dangerous URI schemes in href attributes
  svg = svg.replace(/xlink:href\s*=\s*["']https?:\/\//gi, 'xlink:href="data:,');
  svg = svg.replace(/href\s*=\s*["']https?:\/\//gi, 'href="data:,');
  svg = svg.replace(/href\s*=\s*["']javascript:/gi, 'href="data:,');
  svg = svg.replace(/href\s*=\s*["']data:text\/html/gi, 'href="data:,');
  svg = svg.replace(/href\s*=\s*["']file:/gi, 'href="data:,');
  // Block use elements referencing external resources
  svg = svg.replace(/url\s*\(\s*["']?https?:\/\//gi, 'url("data:,');
  svg = svg.replace(/url\s*\(\s*["']?file:/gi, 'url("data:,');
  return Buffer.from(svg, "utf-8");
}

/**
 * Check whether a buffer looks like SVG content.
 * Examines the first 4KB for an <svg tag.
 */
export function isSvgBuffer(buffer: Buffer): boolean {
  const head = buffer.subarray(0, 4096).toString("utf-8").trim();
  return head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"));
}
