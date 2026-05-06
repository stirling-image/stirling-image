import {
  BadgeCheck,
  CircleDollarSign,
  Code,
  Layers,
  Plug,
  ShieldCheck,
  UserRoundX,
  Workflow,
  Zap,
} from "lucide-react";

import { FadeIn } from "./fade-in";

const benefits = [
  {
    title: "No Signup",
    description:
      "Start using every tool the moment you open the app. No accounts, no email verification, no friction. Just open your browser and go.",
    icon: UserRoundX,
    gradient: "from-rose-500/10 to-pink-500/5",
    span: false,
  },
  {
    title: "No Uploads",
    description:
      "Your files never leave your server. Every image is processed locally on your own hardware, so there is no third-party cloud involved and no data leaks to worry about.",
    icon: ShieldCheck,
    gradient: "from-blue-500/10 to-indigo-500/5",
    span: true,
  },
  {
    title: "Forever Free",
    description:
      "All 48 tools are included with no trials, no paywalls, and no premium tiers. Open source under AGPL-3.0 so you can verify every line of code yourself.",
    icon: CircleDollarSign,
    gradient: "from-emerald-500/10 to-teal-500/5",
    span: false,
  },
  {
    title: "No Limits",
    description:
      "Process as many images as your hardware can handle. There are no hidden caps, no daily quotas, and no throttling. Your server, your rules.",
    icon: BadgeCheck,
    gradient: "from-violet-500/10 to-purple-500/5",
    span: false,
  },
  {
    title: "Batch Processing",
    description:
      "Drop an entire folder of images and process them all at once. Results are zipped up and ready to download in seconds, saving hours of repetitive work.",
    icon: Layers,
    gradient: "from-amber-500/10 to-orange-500/5",
    span: false,
  },
  {
    title: "Lightning Fast",
    description:
      "Built on Sharp and libvips for native-speed image processing. Most operations complete in milliseconds, even on modest hardware.",
    icon: Zap,
    gradient: "from-yellow-500/10 to-amber-500/5",
    span: true,
  },
  {
    title: "Open Source",
    description:
      "AGPL-3.0 licensed with the full source code on GitHub. Inspect it, audit it, fork it, contribute to it. Transparency is not optional.",
    icon: Code,
    gradient: "from-cyan-500/10 to-sky-500/5",
    span: false,
  },
  {
    title: "REST API",
    description:
      "Every tool is accessible via a clean REST endpoint with full OpenAPI documentation. Integrate image processing into your own apps, scripts, or CI pipelines.",
    icon: Plug,
    gradient: "from-fuchsia-500/10 to-pink-500/5",
    span: false,
  },
  {
    title: "Pipeline Automation",
    description:
      "Chain multiple tools together into reusable pipelines. Resize, compress, watermark, and convert in a single automated workflow that you design once and run forever.",
    icon: Workflow,
    gradient: "from-orange-500/10 to-red-500/5",
    span: true,
  },
];

export function WhyChoose() {
  return (
    <section className="px-6 py-24 md:py-36">
      <div className="mx-auto max-w-6xl">
        <FadeIn>
          <p className="text-center text-sm font-medium text-accent">Why SnapOtter</p>
          <h2 className="mt-2 text-center font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight md:text-4xl">
            Built different. On purpose.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-muted">
            No compromises on privacy, speed, or freedom.
          </p>
        </FadeIn>

        <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
          {benefits.map((benefit, i) => (
            <FadeIn
              key={benefit.title}
              delay={i * 0.05}
              className={benefit.span ? "md:col-span-2" : ""}
            >
              <div
                className={`group h-full rounded-xl border border-border bg-card/80 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-[2px] hover:border-border/80 bg-gradient-to-br ${benefit.gradient}`}
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br ${benefit.gradient}`}
                >
                  <benefit.icon size={22} className="text-accent" />
                </div>
                <h3 className="mt-4 font-[family-name:var(--font-display)] text-base font-bold">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{benefit.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
