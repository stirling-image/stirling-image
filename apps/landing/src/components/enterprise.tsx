import { Cloud, Settings, Shield } from "lucide-react";

import { FadeIn } from "@/components/fade-in";

const features = [
  {
    title: "Data Sovereignty",
    description:
      "Your images never leave your network. No external API calls, no cloud dependencies. GDPR, HIPAA, and CCPA compliant by architecture.",
    icon: Shield,
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-500",
  },
  {
    title: "Enterprise Controls",
    description:
      "Multi-user authentication, team permissions, API key management, and audit logging for regulated environments.",
    icon: Settings,
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-500",
  },
  {
    title: "Deploy Anywhere",
    description:
      "Docker, Kubernetes, bare metal. ARM and x86. Air-gapped networks. One container, any infrastructure.",
    icon: Cloud,
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-500",
  },
];

export function Enterprise() {
  return (
    <section id="enterprise" className="bg-[#0a0908] px-6 py-24 md:py-36">
      <div className="mx-auto max-w-6xl">
        <FadeIn>
          <p className="text-center text-sm font-medium tracking-wide uppercase text-accent">
            Enterprise ready
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-center text-3xl font-bold tracking-tight md:text-4xl">
            Your data never leaves your network.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-muted">
            Deploy on your infrastructure, behind your firewall, on your terms.
          </p>
        </FadeIn>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {features.map((feat, i) => (
            <FadeIn key={feat.title} delay={i * 0.12}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:border-[#44403c] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${feat.iconBg}`}
                >
                  <feat.icon size={28} className={feat.iconColor} />
                </div>
                <h3 className="mt-6 font-[family-name:var(--font-display)] text-xl font-bold">
                  {feat.title}
                </h3>
                <p className="mt-3 leading-relaxed text-muted">{feat.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
