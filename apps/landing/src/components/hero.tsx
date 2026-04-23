import { Github } from "lucide-react";
import { FadeIn } from "./fade-in";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-32 pb-24 md:pt-44 md:pb-36">
      {/* Stripe-style gradient mesh background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-[40%] -left-[20%] h-[80%] w-[60%] rounded-full bg-amber-400/20 blur-[120px]" />
        <div className="absolute -top-[20%] -right-[10%] h-[70%] w-[50%] rounded-full bg-orange-300/15 blur-[100px]" />
        <div className="absolute top-[20%] left-[30%] h-[60%] w-[40%] rounded-full bg-yellow-200/10 blur-[140px]" />
        <div className="absolute -bottom-[30%] -right-[20%] h-[60%] w-[50%] rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="mx-auto max-w-4xl text-center">
        <FadeIn>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Your images. Stay yours.
          </h1>
        </FadeIn>

        <FadeIn delay={0.1}>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted md:text-xl">
            50+ image processing tools with local AI. Self-hosted, air-gapped, and fully offline. No
            data ever leaves your network.
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
