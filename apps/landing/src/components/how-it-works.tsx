import { FadeIn } from "./fade-in";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-background-alt px-6 py-24 md:py-36">
      <div className="mx-auto max-w-3xl">
        <FadeIn>
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
            Get started in seconds.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-muted">
            One command. Everything included.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-[#1e1e1e] shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <div className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="ml-2 text-xs text-white/40">Terminal</span>
            </div>
            <div className="p-6 font-mono text-sm leading-loose">
              <p className="text-white/50"># Pull the image</p>
              <p className="text-white">
                <span className="text-green-400">$</span> docker pull snapotter/snapotter
              </p>
              <p className="mt-4 text-white/50"># Run it</p>
              <p className="text-white">
                <span className="text-green-400">$</span> docker run -p 8080:8080
                snapotter/snapotter
              </p>
              <p className="mt-4 text-white/50"># That's it. Open your browser.</p>
              <p className="text-amber-400">SnapOtter is running at http://localhost:8080</p>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="mt-8 text-center text-sm text-muted">
            Works on Linux, macOS, and Windows. ARM and x86 supported.
            <br />
            <a
              href="https://docs.snapotter.com"
              className="mt-1 inline-block font-medium text-accent hover:underline"
            >
              Read the full installation guide
            </a>
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
