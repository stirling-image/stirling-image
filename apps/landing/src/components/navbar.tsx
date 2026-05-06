"use client";

import { AnimatePresence, m } from "framer-motion";
import { Github, Menu, Moon, Star, Sun, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/use-theme";

function formatStarCount(count: number): string {
  if (count >= 1000) {
    const k = count / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return count.toString();
}

interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

const links: NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "https://docs.snapotter.com", external: true },
  { label: "Discord", href: "https://discord.gg/hr3s7HPUsr", external: true },
  { label: "Contact", href: "/contact" },
];

const mobileMenuVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("https://api.github.com/repos/snapotter-hq/snapotter")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && typeof data.stargazers_count === "number") {
          setStars(formatStarCount(data.stargazers_count));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        hamburgerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Focus trap when mobile menu is open
  const handleTrapFocus = useCallback(
    (e: KeyboardEvent) => {
      if (!open || e.key !== "Tab") return;
      const menu = mobileMenuRef.current;
      if (!menu) return;

      const focusable = menu.querySelectorAll<HTMLElement>(
        'a[href], button, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [open],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleTrapFocus);
    return () => document.removeEventListener("keydown", handleTrapFocus);
  }, [open, handleTrapFocus]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/50">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          {/* biome-ignore lint/performance/noImgElement: static export has no next/image optimization */}
          <img src="/logo.png" alt="SnapOtter" width={32} height={32} className="h-8 w-8" />
          <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
            SnapOtter
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-6 lg:flex">
          {links.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ) : item.href.startsWith("#") ? (
              <a
                key={item.label}
                href={item.href}
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ),
          )}
        </div>

        {/* Desktop right section */}
        <div className="hidden items-center gap-3 lg:flex">
          {/* GitHub stars badge */}
          <a
            href="https://github.com/snapotter-hq/snapotter"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-card"
          >
            <Github size={16} />
            <Star size={12} className="text-accent" />
            {stars !== null && <span className="text-muted">{stars}</span>}
          </a>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:text-foreground hover:bg-card"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* CTA */}
          <a
            href="https://github.com/snapotter-hq/snapotter"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-gradient-to-r from-[#f59e0b] to-[#f97316] px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Get Started
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          ref={hamburgerRef}
          type="button"
          className="flex h-9 w-9 items-center justify-center text-muted lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <m.div
            ref={mobileMenuRef}
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="overflow-hidden border-t border-border/50 bg-background/95 backdrop-blur-xl lg:hidden"
            role="dialog"
            aria-label="Navigation menu"
          >
            <div className="px-6 py-4">
              {links.map((item) =>
                item.external ? (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block py-2 text-sm text-muted transition-colors hover:text-foreground"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </a>
                ) : item.href.startsWith("#") ? (
                  <a
                    key={item.label}
                    href={item.href}
                    className="block py-2 text-sm text-muted transition-colors hover:text-foreground"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="block py-2 text-sm text-muted transition-colors hover:text-foreground"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ),
              )}

              <div className="mt-3 flex flex-col gap-2">
                {/* GitHub stars */}
                <a
                  href="https://github.com/snapotter-hq/snapotter"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-card"
                >
                  <Github size={16} />
                  <Star size={12} className="text-accent" />
                  <span>Star on GitHub</span>
                  {stars !== null && <span className="text-muted">({stars})</span>}
                </a>

                {/* Theme toggle (mobile) */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground hover:bg-card"
                  aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                  <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
                </button>

                {/* CTA */}
                <a
                  href="https://github.com/snapotter-hq/snapotter"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg bg-gradient-to-r from-[#f59e0b] to-[#f97316] px-4 py-2 text-center text-sm font-medium text-white"
                >
                  Get Started
                </a>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
