import { Github, MessageCircle } from "lucide-react";

import { FadeIn } from "@/components/fade-in";

const platforms = [
  "Docker",
  "Linux",
  "macOS",
  "Windows",
  "ARM",
  "x86",
  "Sharp",
  "Python",
  "React",
  "SQLite",
];

export function OpenSource() {
  return (
    <section id="open-source" className="px-6 py-24 md:py-36">
      <div className="mx-auto max-w-3xl text-center">
        <FadeIn>
          <h2 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight md:text-5xl">
            Built in the open
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
            SnapOtter is open source and community-driven. Join us on GitHub or Discord.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://github.com/snapotter-hq/snapotter"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#f59e0b,#f97316)] px-6 py-3 text-base font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              <Github size={20} />
              Star on GitHub
            </a>
            <a
              href="https://discord.gg/hr3s7HPUsr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-base font-semibold transition-colors hover:border-[#44403c] hover:bg-card"
            >
              <MessageCircle size={20} />
              Join Discord
            </a>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
            {platforms.map((platform) => (
              <span
                key={platform}
                className="rounded-full border border-border bg-card/80 px-3 py-1 text-xs text-muted"
              >
                {platform}
              </span>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
