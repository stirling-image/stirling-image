"use client";

import { AnimatePresence, m } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  AppWindow,
  AudioLines,
  Code,
  Columns,
  Columns2,
  Copy,
  Crop,
  Droplets,
  Eraser,
  Eye,
  EyeOff,
  FileEdit,
  FileImage,
  FileOutput,
  FileText,
  Film,
  Focus,
  Frame,
  Globe,
  Grid3x3,
  ImagePlus,
  Info,
  Layers,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Palette,
  PenLine,
  PenTool,
  Pipette,
  QrCode,
  RotateCw,
  Scaling,
  Scan,
  ScanFace,
  ScanLine,
  ScanText,
  Search,
  ShieldOff,
  SlidersHorizontal,
  Sparkles,
  TextCursorInput,
  Type,
  Undo2,
  UserCheck,
  Wand2,
  ZoomIn,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { FadeIn } from "./fade-in";

const categories = [
  { id: "essentials", name: "Essentials", color: "#3B82F6" },
  { id: "optimization", name: "Optimization", color: "#10B981" },
  { id: "adjustments", name: "Adjustments", color: "#8B5CF6" },
  { id: "watermark", name: "Watermark & Overlay", color: "#EF4444" },
  { id: "utilities", name: "Utilities", color: "#6366F1" },
  { id: "layout", name: "Layout & Composition", color: "#EC4899" },
  { id: "format", name: "Format & Conversion", color: "#14B8A6" },
  { id: "ai", name: "AI Tools", color: "#F59E0B" },
];

const tools: { name: string; description: string; category: string; icon: LucideIcon }[] = [
  // Essentials
  {
    name: "Resize",
    description: "Resize by pixels, percentage, or social media presets",
    category: "essentials",
    icon: Maximize2,
  },
  {
    name: "Crop",
    description: "Freeform crop, aspect ratio presets, shape crop",
    category: "essentials",
    icon: Crop,
  },
  {
    name: "Rotate & Flip",
    description: "Rotate, flip, and straighten images",
    category: "essentials",
    icon: RotateCw,
  },
  {
    name: "Convert",
    description: "Convert between image formats",
    category: "essentials",
    icon: FileOutput,
  },
  {
    name: "Compress",
    description: "Reduce file size by quality or target size",
    category: "essentials",
    icon: Minimize2,
  },
  // Optimization
  {
    name: "Optimize for Web",
    description:
      "Optimize images for web with format conversion, quality control, and live preview",
    category: "optimization",
    icon: Globe,
  },
  {
    name: "Remove Metadata",
    description: "Remove EXIF, GPS, and camera info",
    category: "optimization",
    icon: ShieldOff,
  },
  {
    name: "Edit Metadata",
    description: "Edit EXIF, GPS, and camera info",
    category: "optimization",
    icon: PenLine,
  },
  {
    name: "Bulk Rename",
    description: "Rename multiple files with patterns",
    category: "optimization",
    icon: FileEdit,
  },
  {
    name: "Image to PDF",
    description: "Combine images into a PDF document",
    category: "optimization",
    icon: FileText,
  },
  {
    name: "Favicon Generator",
    description: "Generate all favicon and app icon sizes",
    category: "optimization",
    icon: AppWindow,
  },
  // Adjustments
  {
    name: "Adjust Colors",
    description: "Brightness, contrast, exposure, saturation, temperature, sharpness, and effects",
    category: "adjustments",
    icon: SlidersHorizontal,
  },
  {
    name: "Sharpening",
    description: "Adaptive, unsharp mask, and high-pass sharpening with presets",
    category: "adjustments",
    icon: Focus,
  },
  {
    name: "Replace & Invert Color",
    description: "Replace specific colors or invert",
    category: "adjustments",
    icon: Pipette,
  },
  // AI Tools
  {
    name: "Remove Background",
    description: "AI-powered background removal",
    category: "ai",
    icon: Eraser,
  },
  {
    name: "Image Upscaling",
    description: "AI super-resolution enhancement",
    category: "ai",
    icon: ZoomIn,
  },
  {
    name: "Object Eraser",
    description: "Remove unwanted objects with AI",
    category: "ai",
    icon: Wand2,
  },
  {
    name: "OCR / Text Extraction",
    description: "Extract text from images",
    category: "ai",
    icon: ScanText,
  },
  {
    name: "Face / PII Blur",
    description: "Auto-detect and blur faces and sensitive info",
    category: "ai",
    icon: EyeOff,
  },
  {
    name: "Smart Crop",
    description: "Smart subject, face, or trim-based cropping",
    category: "ai",
    icon: Scan,
  },
  {
    name: "Image Enhancement",
    description: "One-click auto-improve with smart analysis",
    category: "ai",
    icon: Sparkles,
  },
  {
    name: "Face Enhancement",
    description: "Restore and enhance faces with AI",
    category: "ai",
    icon: ScanFace,
  },
  {
    name: "AI Colorization",
    description: "Convert B&W photos to full color with AI",
    category: "ai",
    icon: Palette,
  },
  {
    name: "Noise Removal",
    description: "AI-powered noise and grain removal",
    category: "ai",
    icon: AudioLines,
  },
  {
    name: "Red Eye Removal",
    description: "AI-detect and fix red eye in flash photos",
    category: "ai",
    icon: Eye,
  },
  {
    name: "Photo Restoration",
    description: "Fix scratches, tears, and damage on old photos with AI",
    category: "ai",
    icon: Undo2,
  },
  {
    name: "Passport Photo",
    description: "AI-powered passport and ID photo generator",
    category: "ai",
    icon: UserCheck,
  },
  {
    name: "Content-Aware Resize",
    description: "Seam carving resize that preserves important content",
    category: "ai",
    icon: Scaling,
  },
  {
    name: "PNG Transparency Fixer",
    description: "Fix fake transparent PNGs with AI matting",
    category: "ai",
    icon: Droplets,
  },
  // Watermark & Overlay
  {
    name: "Text Watermark",
    description: "Add text watermark overlay",
    category: "watermark",
    icon: Type,
  },
  {
    name: "Image Watermark",
    description: "Overlay a logo as watermark",
    category: "watermark",
    icon: ImagePlus,
  },
  {
    name: "Text Overlay",
    description: "Add styled text to images",
    category: "watermark",
    icon: TextCursorInput,
  },
  {
    name: "Image Composition",
    description: "Layer images with position and opacity",
    category: "watermark",
    icon: Layers,
  },
  // Utilities
  {
    name: "Image Info",
    description: "View all metadata and image properties",
    category: "utilities",
    icon: Info,
  },
  {
    name: "Image Compare",
    description: "Side-by-side comparison of two images",
    category: "utilities",
    icon: Columns2,
  },
  {
    name: "Find Duplicates",
    description: "Detect duplicate and near-duplicate images",
    category: "utilities",
    icon: Copy,
  },
  {
    name: "Color Palette",
    description: "Extract dominant colors from image",
    category: "utilities",
    icon: Palette,
  },
  {
    name: "QR Code Generator",
    description: "Generate styled QR codes with custom colors, patterns, and logos",
    category: "utilities",
    icon: QrCode,
  },
  {
    name: "Barcode Reader",
    description: "Scan images for QR codes, barcodes, and 2D codes",
    category: "utilities",
    icon: ScanLine,
  },
  {
    name: "Image to Base64",
    description: "Convert images to base64 strings for embedding in HTML, CSS, and more",
    category: "utilities",
    icon: Code,
  },
  // Layout & Composition
  {
    name: "Collage / Grid",
    description: "Combine images into beautiful grid collages with 25+ templates",
    category: "layout",
    icon: LayoutGrid,
  },
  {
    name: "Stitch / Combine",
    description: "Join images side by side, stacked, or in a grid",
    category: "layout",
    icon: Columns,
  },
  {
    name: "Image Splitting",
    description: "Split images into grid tiles or by pixel size with live preview",
    category: "layout",
    icon: Grid3x3,
  },
  {
    name: "Border & Frame",
    description: "Add borders, rounded corners, shadows",
    category: "layout",
    icon: Frame,
  },
  // Format & Conversion
  {
    name: "SVG to Raster",
    description: "Convert SVG to PNG, JPEG, WebP, AVIF, TIFF, GIF, or HEIF at custom scale and DPI",
    category: "format",
    icon: FileImage,
  },
  {
    name: "Image to SVG",
    description: "Vectorize images using tracing",
    category: "format",
    icon: PenTool,
  },
  {
    name: "GIF Tools",
    description:
      "Resize, optimize, change speed, reverse, extract frames, and rotate animated GIFs",
    category: "format",
    icon: Film,
  },
  {
    name: "PDF to Image",
    description: "Convert PDF pages to images",
    category: "format",
    icon: FileOutput,
  },
];

const categoryMap = new Map(categories.map((c) => [c.id, c]));

const FEATURED_2x2 = ["Remove Background", "Image Upscaling"];
const FEATURED_2x1 = ["Compress", "Resize"];

/* ------------------------------------------------------------------ */
/*  BeforeAfter slider component                                       */
/* ------------------------------------------------------------------ */

function BeforeAfterRemoveBg() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);

  const handleDrag = useCallback((_: unknown, info: { point: { x: number } }) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = info.point.x - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="relative h-full min-h-[160px] w-full select-none overflow-hidden rounded-lg"
      role="slider"
      aria-label="Before and after comparison"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
    >
      {/* After side: checkerboard + shape */}
      <div
        className="absolute inset-0"
        style={{
          background: "repeating-conic-gradient(#292524 0% 25%, #1c1917 0% 50%) 0 0 / 16px 16px",
        }}
      >
        <div className="absolute top-1/2 left-1/2 h-16 w-12 -translate-x-1/2 -translate-y-1/2 rounded-md bg-stone-600" />
      </div>
      {/* Before side: solid bg + shape */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <div className="h-full w-full bg-stone-800">
          <div className="absolute top-1/2 left-1/2 h-16 w-12 -translate-x-1/2 -translate-y-1/2 rounded-md bg-stone-600" />
        </div>
      </div>
      {/* Labels */}
      <span className="absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
        Before
      </span>
      <span className="absolute top-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
        After
      </span>
      {/* Divider */}
      <m.div
        drag="x"
        dragConstraints={containerRef}
        dragElastic={0}
        dragMomentum={false}
        onDrag={handleDrag}
        className="absolute top-0 z-10 flex h-full w-6 -translate-x-1/2 cursor-ew-resize items-center justify-center"
        style={{ left: `${position}%` }}
      >
        <div className="h-full w-0.5 bg-white/80" />
        <div className="absolute top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/60">
          <span className="text-[10px] text-white">&#x2194;</span>
        </div>
      </m.div>
    </div>
  );
}

function BeforeAfterUpscale() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);

  const handleDrag = useCallback((_: unknown, info: { point: { x: number } }) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = info.point.x - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="relative h-full min-h-[160px] w-full select-none overflow-hidden rounded-lg"
      role="slider"
      aria-label="Before and after comparison"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
    >
      {/* After side: crisp gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-4 rounded-md bg-gradient-to-br from-amber-600/60 via-orange-500/40 to-rose-600/60" />
      </div>
      {/* Before side: blurry gradient */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <div className="h-full w-full" style={{ filter: "blur(6px)" }}>
          <div className="absolute inset-4 rounded-md bg-gradient-to-br from-amber-600/60 via-orange-500/40 to-rose-600/60" />
        </div>
      </div>
      {/* Labels */}
      <span className="absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
        Before
      </span>
      <span className="absolute top-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
        After
      </span>
      {/* Divider */}
      <m.div
        drag="x"
        dragConstraints={containerRef}
        dragElastic={0}
        dragMomentum={false}
        onDrag={handleDrag}
        className="absolute top-0 z-10 flex h-full w-6 -translate-x-1/2 cursor-ew-resize items-center justify-center"
        style={{ left: `${position}%` }}
      >
        <div className="h-full w-0.5 bg-white/80" />
        <div className="absolute top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/60">
          <span className="text-[10px] text-white">&#x2194;</span>
        </div>
      </m.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main BentoGrid component                                           */
/* ------------------------------------------------------------------ */

export function BentoGrid() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return tools.filter((tool) => {
      if (activeCategory !== "all" && tool.category !== activeCategory) {
        return false;
      }
      if (!q) return true;
      const cat = categoryMap.get(tool.category);
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        (cat?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [search, activeCategory]);

  const isFeatured2x2 = (name: string) => FEATURED_2x2.includes(name);
  const isFeatured2x1 = (name: string) => FEATURED_2x1.includes(name);

  return (
    <section id="features" className="px-6 py-24 md:py-36">
      <div className="mx-auto max-w-6xl">
        <FadeIn>
          <div className="flex items-center justify-center gap-3">
            <h2 className="text-center font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight md:text-4xl">
              48 tools. Zero cloud dependency.
            </h2>
            <span className="hidden shrink-0 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent md:inline-block">
              48 tools and counting
            </span>
          </div>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-muted">
            Search to find exactly what you need. Every tool runs 100% locally.
          </p>
        </FadeIn>

        {/* Search bar */}
        <FadeIn delay={0.05}>
          <div className="mx-auto mt-12 max-w-md">
            <div className="relative">
              <Search size={18} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search 48 tools..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-card py-3 pr-4 pl-11 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent"
              />
            </div>
          </div>
        </FadeIn>

        {/* Category pills */}
        <FadeIn delay={0.1}>
          <div className="mt-6 flex flex-nowrap gap-2 overflow-x-auto pb-2 md:flex-wrap md:justify-center md:overflow-visible">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === "all"
                  ? "bg-accent text-accent-foreground"
                  : "border border-border hover:border-border/80"
              }`}
            >
              All Tools
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === cat.id
                    ? "bg-accent text-accent-foreground"
                    : "border border-border hover:border-border/80"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </FadeIn>

        {/* Result count */}
        <p className="mt-6 text-center text-sm text-muted">
          Showing {filtered.length} of {tools.length} tools
        </p>

        {/* Tool grid */}
        {filtered.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((tool, i) => {
                const cat = categoryMap.get(tool.category);
                const Icon = tool.icon;
                const is2x2 = isFeatured2x2(tool.name);
                const is2x1 = isFeatured2x1(tool.name);

                if (is2x2) {
                  return (
                    <m.div
                      key={tool.name}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: i * 0.02 }}
                      className="tool-card col-span-2 row-span-2 flex flex-col rounded-xl border border-border bg-card/80 p-5 backdrop-blur-sm transition-[border-color] duration-300 max-md:col-span-2"
                      style={{ "--cat-color": cat?.color } as React.CSSProperties}
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-lg"
                          style={{
                            backgroundColor: `${cat?.color}33`,
                            color: cat?.color,
                          }}
                        >
                          <Icon size={18} />
                        </div>
                        <div>
                          <h3 className="font-[family-name:var(--font-display)] text-sm font-bold">
                            {tool.name}
                          </h3>
                          <p className="text-xs text-muted">{tool.description}</p>
                        </div>
                      </div>
                      <div className="flex-1">
                        {tool.name === "Remove Background" ? (
                          <BeforeAfterRemoveBg />
                        ) : (
                          <BeforeAfterUpscale />
                        )}
                      </div>
                    </m.div>
                  );
                }

                if (is2x1) {
                  return (
                    <m.div
                      key={tool.name}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: i * 0.02 }}
                      className="tool-card col-span-2 flex items-center gap-4 rounded-xl border border-border bg-card/80 p-5 backdrop-blur-sm transition-[border-color] duration-300 max-md:col-span-2"
                      style={{ "--cat-color": cat?.color } as React.CSSProperties}
                    >
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: `${cat?.color}33`,
                          color: cat?.color,
                        }}
                      >
                        <Icon size={22} />
                      </div>
                      <div>
                        <h3 className="font-[family-name:var(--font-display)] text-sm font-bold">
                          {tool.name}
                        </h3>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted">
                          {tool.description}
                        </p>
                      </div>
                    </m.div>
                  );
                }

                return (
                  <m.div
                    key={tool.name}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: i * 0.02 }}
                    className="tool-card flex flex-col rounded-xl border border-border bg-card/80 p-4 backdrop-blur-sm transition-[border-color] duration-300"
                    style={{ "--cat-color": cat?.color } as React.CSSProperties}
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${cat?.color}33`,
                        color: cat?.color,
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <h3 className="mt-3 font-[family-name:var(--font-display)] text-sm font-bold leading-tight">
                      {tool.name}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{tool.description}</p>
                  </m.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <p className="mt-16 text-center text-muted">No tools found. Try a different search.</p>
        )}
      </div>
    </section>
  );
}
