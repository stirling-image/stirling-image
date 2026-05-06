"use client";

import { Check, Copy, Globe, Terminal, Zap } from "lucide-react";
import { useState } from "react";

import { FadeIn } from "./fade-in";

const command =
  "docker run -d --name SnapOtter -p 1349:1349 -v SnapOtter-data:/data snapotter/snapotter:latest";

const steps = [
  {
    icon: Terminal,
    title: "Copy command",
    description: "Paste the Docker command into your terminal.",
    color: "#10B981",
  },
  {
    icon: Globe,
    title: "Open browser",
    description: "Navigate to localhost:1349 in any browser.",
    color: "#3B82F6",
  },
  {
    icon: Zap,
    title: "Start processing",
    description: "Drop images and start editing instantly.",
    color: "#F59E0B",
  },
];

const platforms = ["Docker", "Linux", "macOS", "Windows", "ARM", "x86"];

export function HowItWorks() {
  const [copied, setCopied] = useState(false);

  function copyCommand() {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section id="how-it-works" className="px-6 py-24 md:py-36">
      <div className="mx-auto max-w-4xl">
        <FadeIn>
          <p className="text-center text-sm font-medium text-accent">Get started in seconds</p>
          <h2 className="mt-2 text-center font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight md:text-4xl">
            One command. That&apos;s it.
          </h2>
        </FadeIn>

        {/* 3-step horizontal flow */}
        <FadeIn delay={0.1}>
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="flex flex-col items-center text-center">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${step.color}20`, color: step.color }}
                >
                  <step.icon size={22} />
                </div>
                <div className="mt-1 font-[family-name:var(--font-mono)] text-xs text-muted">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-base font-bold">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Terminal block */}
        <FadeIn delay={0.15}>
          <div className="relative mx-auto mt-12 max-w-2xl">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-amber-500/20 blur-lg" />
            <div className="relative overflow-hidden rounded-xl border border-border bg-card">
              {/* Title bar */}
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <Terminal size={13} />
                  <span className="text-xs">Quick Start</span>
                </div>
                <button
                  type="button"
                  onClick={copyCommand}
                  className="flex cursor-pointer items-center gap-1.5 transition-colors"
                >
                  {copied ? (
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <Check size={13} />
                      <span className="text-xs font-medium">Copied!</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-muted hover:text-foreground">
                      <Copy size={13} />
                      <span className="text-xs">Copy</span>
                    </span>
                  )}
                </button>
              </div>

              {/* Command */}
              <div className="overflow-x-auto px-6 py-5">
                <p className="whitespace-nowrap font-[family-name:var(--font-mono)] text-[13px]">
                  <span className="text-emerald-400">$</span>{" "}
                  <span className="text-foreground/90">{command}</span>
                </p>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Docker Hub link */}
        <FadeIn delay={0.2}>
          <p className="mt-6 text-center text-sm">
            <a
              href="https://hub.docker.com/r/snapotter/snapotter"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent hover:underline"
            >
              View on Docker Hub
            </a>
          </p>
        </FadeIn>

        {/* Platform badges */}
        <FadeIn delay={0.25}>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {platforms.map((p) => (
              <span
                key={p}
                className="rounded-full border border-border bg-card/80 px-3 py-1 text-xs text-muted"
              >
                {p}
              </span>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
