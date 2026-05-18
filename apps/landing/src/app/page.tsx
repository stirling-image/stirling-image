import type { Metadata } from "next";

import { BentoGrid } from "@/components/bento-grid";
import { Enterprise } from "@/components/enterprise";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { JsonLd } from "@/components/json-ld";
import { Navbar } from "@/components/navbar";
import { OpenSource } from "@/components/open-source";
import { Pricing } from "@/components/pricing";
import { WhyChoose } from "@/components/why-choose";

export const metadata: Metadata = {
  alternates: { canonical: "https://snapotter.com" },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SnapOtter",
  url: "https://snapotter.com",
  description:
    "52 image processing tools with local AI. Runs 100% offline. No data leaves your network.",
  publisher: {
    "@type": "Organization",
    name: "SnapOtter",
    url: "https://snapotter.com",
    logo: {
      "@type": "ImageObject",
      url: "https://snapotter.com/logo.png",
    },
    sameAs: [
      "https://github.com/snapotter-hq/snapotter",
      "https://x.com/SnapOtterHQ",
      "https://discord.gg/hr3s7HPUsr",
      "https://hub.docker.com/r/snapotter/snapotter",
    ],
  },
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SnapOtter",
  description:
    "52 image processing tools with local AI. Runs 100% offline. No data leaves your network. Open source and free forever.",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Linux, macOS, Windows (via Docker)",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  license: "https://www.gnu.org/licenses/agpl-3.0.en.html",
  url: "https://snapotter.com",
  downloadUrl: "https://hub.docker.com/r/snapotter/snapotter",
  screenshot: "https://snapotter.com/og-image.png",
  image: "https://snapotter.com/og-image.png",
  featureList:
    "Image Resize, Image Crop, Image Compression, Format Conversion, Watermarking, Background Removal, Image Upscaling, OCR, Face Detection, Photo Restoration, Batch Processing, REST API, Pipeline Automation",
};

const navigationJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "SnapOtter Site Navigation",
  itemListElement: [
    {
      "@type": "SiteNavigationElement",
      position: 1,
      name: "Documentation",
      description: "Installation guides, API reference, and configuration docs",
      url: "https://docs.snapotter.com",
    },
    {
      "@type": "SiteNavigationElement",
      position: 2,
      name: "FAQ",
      description: "Frequently asked questions about SnapOtter",
      url: "https://snapotter.com/faq",
    },
    {
      "@type": "SiteNavigationElement",
      position: 3,
      name: "GitHub",
      description: "Source code, issues, and discussions",
      url: "https://github.com/snapotter-hq/snapotter",
    },
    {
      "@type": "SiteNavigationElement",
      position: 4,
      name: "Contact",
      description: "Book a demo or discuss enterprise licensing",
      url: "https://snapotter.com/contact",
    },
    {
      "@type": "SiteNavigationElement",
      position: 5,
      name: "Discord",
      description: "Community chat and support",
      url: "https://discord.gg/hr3s7HPUsr",
    },
  ],
};

export default function Home() {
  return (
    <>
      <JsonLd data={websiteJsonLd} />
      <JsonLd data={softwareJsonLd} />
      <JsonLd data={navigationJsonLd} />
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <WhyChoose />
        <BentoGrid />
        <Enterprise />
        <Pricing />
        <OpenSource />
      </main>
      <Footer />
    </>
  );
}
