import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const body = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "SnapOtter -- Self-Hosted Image Processing Platform",
  description:
    "48 image processing tools with 15 local AI models. Runs 100% offline in a single Docker container. No data leaves your network. Open source and free forever.",
  metadataBase: new URL("https://snapotter.com"),
  openGraph: {
    title: "SnapOtter -- Self-Hosted Image Processing Platform",
    description:
      "48 image processing tools with 15 local AI models. Runs 100% offline in a single Docker container. No data leaves your network.",
    url: "https://snapotter.com",
    siteName: "SnapOtter",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SnapOtter -- Self-Hosted Image Processing Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SnapOtter -- Self-Hosted Image Processing Platform",
    description:
      "48 image processing tools with 15 local AI models. Runs 100% offline in a single Docker container. No data leaves your network.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${display.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: FOUC prevention - hardcoded theme check with no user input
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="light"){document.documentElement.classList.remove("dark")}else{document.documentElement.classList.add("dark")}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="bg-background text-foreground font-[family-name:var(--font-body)] antialiased">
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
