import { CATEGORIES, TOOLS } from "@snapotter/shared";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

import { FadeIn } from "@/components/fade-in";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { Navbar } from "@/components/navbar";
import { ToolIcon } from "@/components/tool-icon";

export const metadata: Metadata = {
  title: "All 52 Image Processing Tools | SnapOtter",
  description:
    "Browse all 52 self-hosted image tools: resize, compress, convert, remove backgrounds, upscale with AI, add watermarks, generate QR codes, and more. Free, open source, runs on your hardware.",
  alternates: { canonical: "https://snapotter.com/tools" },
  openGraph: {
    title: "All 52 Image Processing Tools | SnapOtter",
    description: "Browse all 52 self-hosted image tools. Free, open source, runs on your hardware.",
    url: "https://snapotter.com/tools",
    siteName: "SnapOtter",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1280,
        height: 640,
        alt: "SnapOtter - 52 Image Processing Tools",
      },
    ],
  },
};

const categoryMap = new Map(CATEGORIES.map((c) => [c.id, c]));

function getToolsByCategory() {
  return CATEGORIES.map((cat) => ({
    category: cat,
    tools: TOOLS.filter((t) => t.category === cat.id),
  })).filter((group) => group.tools.length > 0);
}

export default function ToolsIndexPage() {
  const groups = getToolsByCategory();

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
        item: "https://snapotter.com/tools",
      },
    ],
  };

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "SnapOtter Image Processing Tools",
    description:
      "52 self-hosted image processing tools with local AI. Resize, compress, convert, remove backgrounds, upscale, OCR, and more.",
    url: "https://snapotter.com/tools",
    isPartOf: {
      "@type": "WebSite",
      name: "SnapOtter",
      url: "https://snapotter.com",
    },
    numberOfItems: TOOLS.length,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: TOOLS.length,
      itemListElement: TOOLS.map((tool, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: tool.name,
        url: `https://snapotter.com/tools/${tool.id}`,
      })),
    },
  };

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={collectionJsonLd} />
      <Navbar />
      <main className="pt-16">
        {/* Breadcrumb */}
        <nav className="mx-auto max-w-5xl px-6 pt-8" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-muted">
            <li>
              <a href="/" className="transition-colors hover:text-foreground">
                Home
              </a>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-foreground font-medium">Tools</li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="mx-auto max-w-5xl px-6 pt-12 pb-16">
          <FadeIn>
            <h1 className="font-[family-name:var(--font-nunito)] text-4xl font-bold tracking-tight md:text-5xl">
              All {TOOLS.length} tools
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted md:text-xl max-w-2xl">
              Every tool runs 100% on your hardware. No cloud uploads, no usage limits, no
              watermarks. Deploy once with Docker and use them all.
            </p>
          </FadeIn>
        </section>

        {/* Tool categories */}
        {groups.map((group) => (
          <section
            key={group.category.id}
            className="border-t border-border py-12 even:bg-background-alt"
          >
            <div className="mx-auto max-w-5xl px-6">
              <FadeIn>
                <div className="flex items-center gap-3 mb-8">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${group.category.color}14` }}
                  >
                    <ToolIcon name={group.category.icon} color={group.category.color} size={20} />
                  </div>
                  <h2 className="font-[family-name:var(--font-nunito)] text-2xl font-bold">
                    {group.category.name}
                  </h2>
                  <span className="text-sm text-muted">
                    {group.tools.length} {group.tools.length === 1 ? "tool" : "tools"}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.tools.map((tool) => (
                    <a
                      key={tool.id}
                      href={`/tools/${tool.id}`}
                      className="group flex items-start gap-4 rounded-xl border border-border bg-background p-5 transition-all hover:border-accent hover:shadow-md"
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${group.category.color}14` }}
                      >
                        <ToolIcon name={tool.icon} color={group.category.color} size={18} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-bold">{tool.name}</span>
                        <p className="mt-1 text-xs leading-relaxed text-muted line-clamp-2">
                          {tool.description}
                        </p>
                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent group-hover:gap-2 transition-all">
                          Learn more <ArrowRight size={12} />
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </FadeIn>
            </div>
          </section>
        ))}

        {/* Bottom CTA */}
        <section className="border-t border-border py-20">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <FadeIn>
              <h2 className="font-[family-name:var(--font-nunito)] text-3xl font-bold tracking-tight">
                Deploy all {TOOLS.length} tools with one command
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-muted">
                A single Docker container. No external services. Open source and free forever.
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
