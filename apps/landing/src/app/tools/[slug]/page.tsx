import { CATEGORIES, TOOLS } from "@snapotter/shared";
import { ArrowRight, CheckCircle2, Container, Github, Server, Zap } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FadeIn } from "@/components/fade-in";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { Navbar } from "@/components/navbar";
import { ToolIcon } from "@/components/tool-icon";
import { TOOL_SEO } from "@/data/tool-seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const categoryMap = new Map(CATEGORIES.map((c) => [c.id, c]));

function getTool(slug: string) {
  const tool = TOOLS.find((t) => t.id === slug);
  if (!tool) return null;
  const category = categoryMap.get(tool.category);
  const seo = TOOL_SEO[tool.id];
  return { tool, category, seo };
}

function getRelatedTools(toolId: string, categoryId: string) {
  return TOOLS.filter((t) => t.category === categoryId && t.id !== toolId).slice(0, 4);
}

export function generateStaticParams() {
  return TOOLS.map((tool) => ({ slug: tool.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = getTool(slug);
  if (!data) return {};

  const { tool, seo } = data;
  const title = seo ? `${seo.searchTitle} | SnapOtter` : `${tool.name} | SnapOtter`;
  const description = seo?.longDescription ?? tool.description;

  return {
    title,
    description,
    alternates: { canonical: `https://snapotter.com/tools/${tool.id}` },
    openGraph: {
      title,
      description,
      url: `https://snapotter.com/tools/${tool.id}`,
      siteName: "SnapOtter",
      type: "website",
      locale: "en_US",
      images: [
        {
          url: "/og-image.png",
          width: 1280,
          height: 640,
          alt: `${tool.name} - SnapOtter`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;
  const data = getTool(slug);
  if (!data) notFound();

  const { tool, category, seo } = data;
  const related = getRelatedTools(tool.id, tool.category);
  const catColor = category?.color ?? "#737373";
  const isAiTool = tool.category === "ai";

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://snapotter.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Tools",
        item: "https://snapotter.com/#features",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: tool.name,
        item: `https://snapotter.com/tools/${tool.id}`,
      },
    ],
  };

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `SnapOtter ${tool.name}`,
    description: seo?.longDescription ?? tool.description,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Linux, macOS, Windows (via Docker)",
    browserRequirements: "Requires JavaScript",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    license: "https://www.gnu.org/licenses/agpl-3.0.en.html",
    url: `https://snapotter.com/tools/${tool.id}`,
    ...(seo?.features && { featureList: seo.features }),
    isPartOf: {
      "@type": "SoftwareApplication",
      name: "SnapOtter",
      url: "https://snapotter.com",
    },
  };

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to use ${tool.name} in SnapOtter`,
    description: seo?.longDescription ?? tool.description,
    totalTime: "PT1M",
    tool: { "@type": "HowToTool", name: "SnapOtter" },
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Deploy SnapOtter",
        text: "Run SnapOtter with a single Docker command: docker run -p 1349:1349 snapotter/snapotter",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: `Open ${tool.name}`,
        text: `Navigate to the ${tool.name} tool in SnapOtter's interface.`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Upload your image",
        text: "Drag and drop your image file or click to browse. Supports JPEG, PNG, WebP, AVIF, TIFF, HEIC, and RAW formats.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Adjust settings and process",
        text: `Configure ${tool.name} settings to your needs, then click process. Download your result or continue with another tool.`,
      },
    ],
  };

  const faqJsonLd =
    seo?.faqs && seo.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: seo.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.a,
            },
          })),
        }
      : null;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={softwareJsonLd} />
      <JsonLd data={howToJsonLd} />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      <Navbar />
      <main className="pt-16">
        {/* Breadcrumb */}
        <nav className="mx-auto max-w-4xl px-6 pt-8" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-muted">
            <li>
              <a href="/" className="transition-colors hover:text-foreground">
                Home
              </a>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <a href="/#features" className="transition-colors hover:text-foreground">
                Tools
              </a>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-foreground font-medium">{tool.name}</li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 pt-12 pb-16">
          <FadeIn>
            <div className="flex items-center gap-3 mb-6">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${catColor}14` }}
              >
                <ToolIcon name={tool.icon} color={catColor} size={28} />
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: `${catColor}14`, color: catColor }}
              >
                {category?.name}
              </span>
              {isAiTool && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  AI-Powered
                </span>
              )}
            </div>

            <h1 className="font-[family-name:var(--font-nunito)] text-4xl font-bold tracking-tight md:text-5xl">
              {tool.name}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted md:text-xl">
              {seo?.longDescription ?? tool.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="https://docs.snapotter.com/guide/getting-started"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
              >
                <Container size={18} />
                Deploy with Docker
              </a>
              <a
                href="https://github.com/snapotter-hq/snapotter"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-background-alt"
              >
                <Github size={18} />
                View Source
              </a>
            </div>
          </FadeIn>
        </section>

        {/* Features */}
        {seo?.features && seo.features.length > 0 && (
          <section className="border-t border-border bg-background-alt py-16">
            <div className="mx-auto max-w-4xl px-6">
              <FadeIn>
                <div className="flex items-center gap-2 mb-6">
                  <Zap size={20} style={{ color: catColor }} />
                  <h2 className="font-[family-name:var(--font-nunito)] text-2xl font-bold tracking-tight md:text-3xl">
                    Features
                  </h2>
                </div>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {seo.features.map((feature) => (
                    <li key={feature} className="flex gap-3">
                      <CheckCircle2
                        size={18}
                        className="mt-0.5 shrink-0"
                        style={{ color: catColor }}
                      />
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>
            </div>
          </section>
        )}

        {/* Use Cases */}
        {seo?.useCases && seo.useCases.length > 0 && (
          <section className="py-16">
            <div className="mx-auto max-w-4xl px-6">
              <FadeIn>
                <h2 className="font-[family-name:var(--font-nunito)] text-2xl font-bold tracking-tight md:text-3xl">
                  What you can do
                </h2>
                <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                  {seo.useCases.map((useCase) => (
                    <li key={useCase} className="flex gap-3">
                      <ArrowRight size={16} className="mt-1 shrink-0 text-muted" />
                      <span className="text-sm leading-relaxed text-muted">{useCase}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>
            </div>
          </section>
        )}

        {/* Self-Hosted Callout - varied by tool type */}
        <section className="border-t border-border bg-background-alt py-16">
          <div className="mx-auto max-w-4xl px-6">
            <FadeIn>
              <div className="flex items-start gap-4">
                <Server size={24} className="mt-1 shrink-0 text-accent" />
                <div>
                  <h2 className="font-[family-name:var(--font-nunito)] text-xl font-bold">
                    {isAiTool
                      ? "AI that runs on your hardware. No cloud APIs, no usage limits."
                      : "Self-hosted. Your images never leave your network."}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {isAiTool
                      ? `Unlike cloud AI services, SnapOtter's ${tool.name} runs the ML model directly on your server. Your images are processed locally with no data sent to external APIs. No per-image fees, no rate limits, no privacy concerns. Deploy once with Docker and use it as much as you need.`
                      : `SnapOtter runs entirely on your own infrastructure. Images processed with ${tool.name} are never uploaded to third-party servers. Deploy a single Docker container and process images with full privacy, no watermarks, and no usage limits. Open source under AGPL-3.0.`}
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* FAQs */}
        {seo?.faqs && seo.faqs.length > 0 && (
          <section className="py-16">
            <div className="mx-auto max-w-4xl px-6">
              <FadeIn>
                <h2 className="font-[family-name:var(--font-nunito)] text-2xl font-bold tracking-tight md:text-3xl">
                  Frequently asked questions
                </h2>
                <dl className="mt-8 space-y-6">
                  {seo.faqs.map((faq) => (
                    <div key={faq.q} className="rounded-xl border border-border p-6">
                      <dt className="text-sm font-semibold">{faq.q}</dt>
                      <dd className="mt-3 text-sm leading-relaxed text-muted">{faq.a}</dd>
                    </div>
                  ))}
                </dl>
              </FadeIn>
            </div>
          </section>
        )}

        {/* Related Tools */}
        {related.length > 0 && (
          <section className="border-t border-border bg-background-alt py-16">
            <div className="mx-auto max-w-4xl px-6">
              <FadeIn>
                <h2 className="font-[family-name:var(--font-nunito)] text-2xl font-bold tracking-tight">
                  More {category?.name} tools
                </h2>
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {related.map((t) => {
                    const relCat = categoryMap.get(t.category);
                    return (
                      <a
                        key={t.id}
                        href={`/tools/${t.id}`}
                        className="group flex flex-col rounded-xl border border-border bg-background p-5 transition-all hover:border-accent hover:shadow-md"
                      >
                        <ToolIcon name={t.icon} color={relCat?.color ?? "#737373"} size={24} />
                        <span className="mt-3 text-sm font-bold">{t.name}</span>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted">{t.description}</p>
                        <span className="mt-auto pt-4 inline-flex items-center gap-1 text-xs font-medium text-accent group-hover:gap-2 transition-all">
                          Learn more <ArrowRight size={12} />
                        </span>
                      </a>
                    );
                  })}
                </div>
              </FadeIn>
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <FadeIn>
              <h2 className="font-[family-name:var(--font-nunito)] text-3xl font-bold tracking-tight">
                Ready to try {tool.name}?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-muted">
                Deploy SnapOtter in under a minute. All 52 tools included. Open source and free
                forever.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <a
                  href="https://docs.snapotter.com/guide/getting-started"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
                >
                  Get Started
                  <ArrowRight size={16} />
                </a>
                <a
                  href="/#pricing"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-background-alt"
                >
                  View Pricing
                </a>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
