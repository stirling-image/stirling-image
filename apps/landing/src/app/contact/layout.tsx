import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact -- SnapOtter",
  description:
    "Get in touch with the SnapOtter team. Book a demo, get deployment support, or discuss enterprise licensing.",
  openGraph: {
    title: "Contact -- SnapOtter",
    description: "Get in touch with the SnapOtter team.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
