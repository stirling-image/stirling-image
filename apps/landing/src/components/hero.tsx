import { Github } from "lucide-react";
import { FadeIn } from "./fade-in";
import { TypingCursor } from "./typing-cursor";

const wordCloud = [
  { text: "Resize", x: 5, y: 8, size: 16, opacity: 0.15 },
  { text: "Crop", x: 28, y: 4, size: 14, opacity: 0.12 },
  { text: "Optimize", x: 48, y: 6, size: 13, opacity: 0.1 },
  { text: "Flip", x: 62, y: 3, size: 12, opacity: 0.08 },
  { text: "Rotate", x: 75, y: 8, size: 15, opacity: 0.14 },
  { text: "Sharpen", x: 88, y: 5, size: 13, opacity: 0.11 },
  { text: "Compress", x: 8, y: 18, size: 15, opacity: 0.13 },
  { text: "OCR", x: 25, y: 15, size: 18, opacity: 0.16 },
  { text: "Convert", x: 42, y: 13, size: 13, opacity: 0.1 },
  { text: "Enhance", x: 82, y: 14, size: 14, opacity: 0.12 },
  { text: "Upscale", x: 68, y: 17, size: 16, opacity: 0.15 },
  { text: "Watermark", x: 85, y: 22, size: 14, opacity: 0.11 },
  { text: "Remove BG", x: 3, y: 28, size: 14, opacity: 0.12 },
  { text: "Denoise", x: 18, y: 25, size: 12, opacity: 0.08 },
  { text: "Passport", x: 8, y: 38, size: 13, opacity: 0.1 },
  { text: "Face Blur", x: 2, y: 48, size: 13, opacity: 0.1 },
  { text: "Colorize", x: 85, y: 32, size: 14, opacity: 0.12 },
  { text: "Red Eye", x: 78, y: 28, size: 12, opacity: 0.08 },
  { text: "Restore", x: 90, y: 42, size: 14, opacity: 0.13 },
  { text: "Smart Crop", x: 82, y: 50, size: 13, opacity: 0.1 },
  { text: "Collage", x: 3, y: 58, size: 14, opacity: 0.12 },
  { text: "QR Code", x: 85, y: 58, size: 14, opacity: 0.11 },
  { text: "Stitch", x: 88, y: 68, size: 13, opacity: 0.1 },
  { text: "Border", x: 5, y: 68, size: 13, opacity: 0.1 },
  { text: "SVG", x: 3, y: 78, size: 16, opacity: 0.14 },
  { text: "Compare", x: 15, y: 73, size: 12, opacity: 0.08 },
  { text: "Palette", x: 78, y: 75, size: 13, opacity: 0.1 },
  { text: "GIF", x: 90, y: 78, size: 17, opacity: 0.15 },
  { text: "Batch", x: 6, y: 88, size: 14, opacity: 0.12 },
  { text: "Pipeline", x: 20, y: 90, size: 13, opacity: 0.09 },
  { text: "Favicon", x: 35, y: 92, size: 12, opacity: 0.08 },
  { text: "PDF", x: 22, y: 82, size: 16, opacity: 0.14 },
  { text: "Info", x: 45, y: 88, size: 12, opacity: 0.07 },
  { text: "Base64", x: 82, y: 88, size: 13, opacity: 0.09 },
  { text: "Barcode", x: 72, y: 85, size: 12, opacity: 0.08 },
  { text: "Metadata", x: 10, y: 95, size: 12, opacity: 0.07 },
  { text: "Open Source", x: 48, y: 95, size: 13, opacity: 0.1 },
  { text: "Duplicates", x: 88, y: 95, size: 12, opacity: 0.07 },
  { text: "Vectorize", x: 65, y: 92, size: 12, opacity: 0.08 },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-32 pb-24 md:pt-44 md:pb-36">
      {/* Gradient mesh background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-[40%] -left-[20%] h-[80%] w-[60%] rounded-full bg-amber-400/20 blur-[120px]" />
        <div className="absolute -top-[20%] -right-[10%] h-[70%] w-[50%] rounded-full bg-orange-300/15 blur-[100px]" />
        <div className="absolute top-[20%] left-[30%] h-[60%] w-[40%] rounded-full bg-yellow-200/10 blur-[140px]" />
        <div className="absolute -bottom-[30%] -right-[20%] h-[60%] w-[50%] rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Word cloud background */}
      <div className="pointer-events-none absolute inset-0 -z-10 hidden md:block">
        {wordCloud.map((word) => (
          <span
            key={word.text}
            className="absolute font-semibold text-foreground select-none"
            style={{
              left: `${word.x}%`,
              top: `${word.y}%`,
              fontSize: `${word.size}px`,
              opacity: word.opacity,
            }}
          >
            {word.text}
          </span>
        ))}
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        <FadeIn>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Your images. Stay yours.
          </h1>
        </FadeIn>

        <FadeIn delay={0.1}>
          <p className="mt-4 text-lg text-muted md:text-xl">
            The open-source, self-hosted image processing platform.
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <p className="mt-4 text-xl font-medium md:text-2xl">
            <TypingCursor />
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="https://demo.snapotter.com"
              className="rounded-xl bg-accent px-8 py-3.5 text-base font-semibold text-accent-foreground shadow-lg shadow-accent/20 transition-colors hover:bg-accent-hover"
            >
              Try the Demo &rarr;
            </a>
            <a
              href="https://github.com/ashim-hq/ashim"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-border px-8 py-3.5 text-base font-semibold transition-colors hover:bg-background-alt"
            >
              <Github size={18} />
              View on GitHub
            </a>
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="mt-8 text-sm text-muted">
            AGPL-3.0 &middot; Docker one-liner &middot; Free forever
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
