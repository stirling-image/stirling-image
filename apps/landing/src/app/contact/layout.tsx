import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | SnapOtter",
  description:
    "Book a demo, get deployment help, or discuss enterprise licensing for SnapOtter self-hosted image processing.",
  alternates: { canonical: "https://snapotter.com/contact" },
  openGraph: {
    title: "Contact | SnapOtter",
    description:
      "Book a demo, get deployment help, or discuss enterprise licensing for SnapOtter self-hosted image processing.",
    url: "https://snapotter.com/contact",
  },
  twitter: {
    title: "Contact | SnapOtter",
    description:
      "Book a demo, get deployment help, or discuss enterprise licensing for SnapOtter self-hosted image processing.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
