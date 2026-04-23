import { Lock, Server, Users } from "lucide-react";

import { FadeIn } from "./fade-in";

const features = [
  {
    title: "Data Sovereignty",
    description:
      "Your images never leave your network. No external API calls, no cloud dependencies. Full GDPR, HIPAA, CCPA compliance by architecture.",
    icon: Lock,
  },
  {
    title: "Enterprise Controls",
    description:
      "Multi-user authentication, team permissions, API key management, and audit logging. Everything you need for regulated environments.",
    icon: Users,
  },
  {
    title: "Deploy Anywhere",
    description:
      "Docker, Kubernetes, bare metal. ARM and x86. Air-gapped networks. One container, any infrastructure.",
    icon: Server,
  },
];

export function Enterprise() {
  return (
    <section id="enterprise" className="bg-dark-bg px-6 py-24 text-dark-fg md:py-36">
      <div className="mx-auto max-w-6xl">
        <FadeIn>
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
            Built for organizations that take data seriously.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-dark-muted">
            Self-host on your own infrastructure. Your images never leave your network.
          </p>
        </FadeIn>

        <div className="mt-16 grid gap-12 md:grid-cols-3 md:gap-16">
          {features.map((feat, i) => (
            <FadeIn key={feat.title} delay={i * 0.1}>
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <feat.icon size={22} className="text-accent" />
                </div>
                <h3 className="mt-4 text-xl font-bold">{feat.title}</h3>
                <p className="mt-3 leading-relaxed text-dark-muted">{feat.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
