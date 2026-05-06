import type { Metadata } from "next";

import { FadeIn } from "@/components/fade-in";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Terms & Conditions -- SnapOtter",
  description:
    "Terms governing your use of the SnapOtter website and self-hosted image processing software.",
  openGraph: {
    title: "Terms & Conditions -- SnapOtter",
    description:
      "Terms governing your use of the SnapOtter website and self-hosted image processing software.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="bg-background pt-16 text-foreground">
        <section className="px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl">
            <FadeIn>
              <div className="text-center">
                <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight md:text-5xl">
                  Terms and Conditions
                </h1>
                <p className="mt-6 text-lg text-muted font-[family-name:var(--font-body)]">
                  Last updated: April 24, 2026
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="mt-16 space-y-12 text-sm leading-relaxed text-muted font-[family-name:var(--font-body)]">
                <section>
                  <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
                    Overview
                  </h2>
                  <p className="mt-3">
                    These terms govern your use of the SnapOtter website and software.
                  </p>
                </section>

                <section>
                  <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
                    Software License
                  </h2>
                  <ul className="mt-3 list-disc space-y-2 pl-5">
                    <li>SnapOtter is licensed under AGPL-3.0.</li>
                    <li>
                      You may use, modify, and distribute the software under the terms of this
                      license.
                    </li>
                    <li>
                      For proprietary or commercial use without AGPL obligations, a commercial
                      license is available.
                    </li>
                    <li>
                      Contact us at{" "}
                      <a
                        href="mailto:contact@snapotter.com"
                        className="text-accent underline underline-offset-4 hover:text-accent-hover"
                      >
                        contact@snapotter.com
                      </a>{" "}
                      for commercial licensing terms.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
                    Website Use
                  </h2>
                  <ul className="mt-3 list-disc space-y-2 pl-5">
                    <li>The snapotter.com website is provided for informational purposes.</li>
                    <li>You may not use the website for any unlawful purpose.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
                    Self-Hosted Software
                  </h2>
                  <ul className="mt-3 list-disc space-y-2 pl-5">
                    <li>You are responsible for your own deployment, data, and security.</li>
                    <li>SnapOtter is provided &quot;as is&quot; without warranty of any kind.</li>
                    <li>
                      We are not liable for any damages arising from your use of the software.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
                    Intellectual Property
                  </h2>
                  <ul className="mt-3 list-disc space-y-2 pl-5">
                    <li>SnapOtter, the SnapOtter logo, and related marks are our property.</li>
                    <li>The software source code is available under AGPL-3.0.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
                    Limitation of Liability
                  </h2>
                  <p className="mt-3">
                    To the maximum extent permitted by law, we are not liable for any indirect,
                    incidental, or consequential damages.
                  </p>
                </section>

                <section>
                  <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
                    Changes
                  </h2>
                  <p className="mt-3">
                    We may update these terms. Continued use constitutes acceptance.
                  </p>
                </section>

                <section>
                  <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
                    Contact
                  </h2>
                  <p className="mt-3">
                    If you have questions about these terms, contact us at{" "}
                    <a
                      href="mailto:contact@snapotter.com"
                      className="text-accent underline underline-offset-4 hover:text-accent-hover"
                    >
                      contact@snapotter.com
                    </a>
                    .
                  </p>
                </section>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
