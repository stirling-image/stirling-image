"use client";

import { m } from "framer-motion";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const slideRightVariants = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut", delay: 0.3 },
  },
};

const sidebarIconVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, delay: 0.6 + i * 0.05, ease: "easeOut" },
  }),
};

const toolbarVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, delay: 0.85, ease: "easeOut" },
  },
};

const canvasPlaceholderVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: 0.95, ease: "easeOut" },
  },
};

const processButtonVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, delay: 0.85, ease: "easeOut" },
  },
};

const sidebarIcons = [
  { letter: "R", active: true },
  { letter: "C", active: false },
  { letter: "W", active: false },
  { letter: "O", active: false },
  { letter: "A", active: false },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-32 pb-24 md:pt-44 md:pb-36">
      {/* Background: ambient gradient orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute top-[-10%] left-[-5%] h-[60%] w-[50%]"
          style={{
            background: "radial-gradient(circle, #f59e0b12, transparent 60%)",
          }}
        />
        <div
          className="absolute top-[10%] right-[-10%] h-[50%] w-[45%]"
          style={{
            background: "radial-gradient(circle, #3b82f612, transparent 60%)",
          }}
        />
      </div>

      {/* Background: dot grid */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle, #fafaf920 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <m.div
        className="relative mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Left: headline + CTAs (~45%) */}
        <div className="flex flex-col items-center text-center lg:w-[45%] lg:items-start lg:text-left">
          {/* Step 1: Headline */}
          <m.h1
            variants={fadeUpVariants}
            className="font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-6xl"
          >
            <span className="text-foreground">Your images.</span>
            <br />
            <span className="bg-gradient-to-br from-[#f59e0b] to-[#f97316] bg-clip-text text-transparent">
              Stay yours.
            </span>
          </m.h1>

          {/* Step 2: Subheadline */}
          <m.p
            variants={fadeUpVariants}
            className="mt-5 max-w-lg text-lg text-muted font-[family-name:var(--font-body)]"
          >
            The open-source, self-hosted image processing platform with 48 tools and 15 local AI
            models.
          </m.p>

          {/* Step 3: CTAs */}
          <m.div variants={fadeUpVariants} className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="https://github.com/snapotter-hq/snapotter"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#f59e0b] to-[#f97316] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_-4px] shadow-amber-500/30 transition-shadow hover:shadow-[0_0_32px_-2px] hover:shadow-amber-500/50"
            >
              Get Started Free
            </a>
            <a
              href="https://docs.snapotter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-card"
            >
              View Docs
            </a>
          </m.div>
        </div>

        {/* Right: CSS Mock UI (~55%) */}
        <m.div variants={slideRightVariants} className="w-full lg:w-[55%]">
          <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-2xl shadow-black/20">
            {/* macOS title bar */}
            <div className="flex items-center border-b border-border/50 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: "#ff5f57" }} />
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: "#febc2e" }} />
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: "#28c840" }} />
              </div>
              <span className="flex-1 text-center text-xs text-muted font-[family-name:var(--font-body)]">
                SnapOtter - Resize Image
              </span>
              <div className="w-[52px]" />
            </div>

            <div className="flex">
              {/* Left sidebar */}
              <div className="flex w-12 flex-col items-center gap-2 border-r border-border/50 bg-background/50 py-3">
                {sidebarIcons.map((icon, i) => (
                  <m.div
                    key={icon.letter}
                    custom={i}
                    variants={sidebarIconVariants}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold ${
                      icon.active
                        ? "bg-gradient-to-r from-[#f59e0b] to-[#f97316] text-white"
                        : "text-muted hover:bg-border/30"
                    }`}
                  >
                    {icon.letter}
                  </m.div>
                ))}
              </div>

              {/* Main area */}
              <div className="flex flex-1 flex-col">
                {/* Toolbar */}
                <m.div
                  variants={toolbarVariants}
                  className="flex items-center gap-1.5 border-b border-border/50 px-3 py-2"
                >
                  <span className="rounded-md bg-accent/20 px-2.5 py-1 text-[11px] font-medium text-accent">
                    Resize
                  </span>
                  <span className="rounded-md px-2.5 py-1 text-[11px] text-muted">Crop</span>
                  <span className="rounded-md px-2.5 py-1 text-[11px] text-muted">Rotate</span>
                  <div className="flex-1" />
                  <m.span
                    variants={processButtonVariants}
                    className="rounded-md bg-gradient-to-r from-[#f59e0b] to-[#f97316] px-3 py-1 text-[11px] font-medium text-white shadow-[0_0_12px_-2px] shadow-amber-500/40"
                    style={{
                      animation: "pulse-glow 2s ease-in-out 1.5s infinite",
                    }}
                  >
                    Process
                  </m.span>
                </m.div>

                {/* Canvas area */}
                <div
                  className="relative flex min-h-[220px] items-center justify-center sm:min-h-[260px]"
                  style={{
                    background:
                      "repeating-conic-gradient(#292524 0% 25%, #1c1917 0% 50%) 0 0 / 16px 16px",
                  }}
                >
                  <m.div
                    variants={canvasPlaceholderVariants}
                    className="flex h-28 w-40 flex-col items-center justify-center rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm sm:h-32 sm:w-48"
                  >
                    <svg
                      className="mb-2 h-8 w-8 text-muted/50"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                      />
                    </svg>
                    <span className="text-[11px] text-muted/60">Drop image here</span>
                  </m.div>
                </div>
              </div>
            </div>
          </div>
        </m.div>
      </m.div>

      {/* Process button glow pulse keyframe */}
      <style>
        {`
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 12px -2px rgba(245, 158, 11, 0.4); }
            50% { box-shadow: 0 0 20px -2px rgba(245, 158, 11, 0.6); }
          }
        `}
      </style>
    </section>
  );
}
