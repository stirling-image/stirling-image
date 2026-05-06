import { Github } from "lucide-react";
import Link from "next/link";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/#pricing" },
      {
        label: "API Docs",
        href: "https://docs.snapotter.com",
        external: true,
      },
      {
        label: "Docker Hub",
        href: "https://hub.docker.com/r/snapotter/snapotter",
        external: true,
      },
    ],
  },
  {
    title: "Resources",
    links: [
      {
        label: "Documentation",
        href: "https://docs.snapotter.com",
        external: true,
      },
      {
        label: "Getting Started",
        href: "https://docs.snapotter.com/guide/getting-started",
        external: true,
      },
      {
        label: "GitHub",
        href: "https://github.com/snapotter-hq/snapotter",
        external: true,
      },
    ],
  },
  {
    title: "Community",
    links: [
      {
        label: "Discord",
        href: "https://discord.gg/hr3s7HPUsr",
        external: true,
      },
      {
        label: "Contributing",
        href: "https://docs.snapotter.com/guide/contributing",
        external: true,
      },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card px-6 py-16">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-5">
        {/* Brand column */}
        <div>
          <div className="flex items-center gap-2">
            {/* biome-ignore lint/performance/noImgElement: static export has no next/image optimization */}
            <img src="/logo.png" alt="SnapOtter" width={32} height={32} className="h-8 w-8" />
            <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
              SnapOtter
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted font-[family-name:var(--font-body)]">
            Self-hosted image processing platform
          </p>
        </div>

        {/* Link columns */}
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="font-[family-name:var(--font-display)] text-sm font-semibold">
              {col.title}
            </h4>
            <ul className="mt-4 space-y-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  {"external" in link && link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="mx-auto mt-12 flex max-w-6xl items-center justify-between border-t border-border pt-8">
        <p className="text-sm text-muted">&copy; 2025 SnapOtter. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/snapotter-hq/snapotter"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted transition-colors hover:text-foreground"
            aria-label="GitHub"
          >
            <Github size={20} aria-hidden="true" />
          </a>
          {/* biome-ignore lint/a11y/useAnchorContent: aria-label provides accessible content */}
          <a
            href="https://discord.gg/hr3s7HPUsr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted transition-colors hover:text-foreground"
            aria-label="Discord"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
