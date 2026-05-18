import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: "SnapOtter | Self-Hosted Image Processing",
  description:
    "52 image processing tools with local AI. Runs 100% offline. No data leaves your network. Open source and free forever.",
  metadataBase: new URL("https://snapotter.com"),
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  other: {
    "color-scheme": "light only",
    "darkreader-lock": "true",
  },
  openGraph: {
    title: "SnapOtter | Self-Hosted Image Processing",
    description:
      "52 image processing tools with local AI. Runs 100% offline. No data leaves your network.",
    url: "https://snapotter.com",
    siteName: "SnapOtter",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1280,
        height: 640,
        alt: "SnapOtter - Self-Hosted Image Processing Suite",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@SnapOtterHQ",
    title: "SnapOtter | Self-Hosted Image Processing",
    description:
      "52 image processing tools with local AI. Runs 100% offline. No data leaves your network.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${nunito.variable}`} suppressHydrationWarning>
      <head>
        <link rel="llms-txt" href="/llms.txt" />
      </head>
      <body
        className="bg-background text-foreground font-[family-name:var(--font-inter)] antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
