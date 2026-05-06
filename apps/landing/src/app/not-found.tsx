import Link from "next/link";

import { FadeIn } from "@/components/fade-in";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-[80vh] items-center justify-center px-6 pt-16">
        <FadeIn>
          <div className="text-center">
            <p className="font-[family-name:var(--font-display)] text-8xl font-bold text-accent">
              404
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight md:text-4xl">
              Page not found
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted font-[family-name:var(--font-body)]">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <Link
              href="/"
              className="mt-8 inline-block rounded-lg bg-accent px-6 py-3 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover"
            >
              Back to home
            </Link>
          </div>
        </FadeIn>
      </main>
      <Footer />
    </>
  );
}
