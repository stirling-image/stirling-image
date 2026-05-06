"use client";

import { AnimatePresence, m } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { FadeIn } from "@/components/fade-in";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

const faqs = [
  {
    question: "Are my files safe and private?",
    answer:
      "All processing happens on your own server. Your images are never sent to any external service. SnapOtter runs entirely on your infrastructure.",
  },
  {
    question: "Is SnapOtter really free?",
    answer:
      "Yes. SnapOtter is open source under AGPL-3.0 with no hidden fees, no subscription plans, no usage limits, and no premium-only features. A commercial license is available for organizations that need proprietary use.",
  },
  {
    question: "Do I need an internet connection?",
    answer:
      "No. SnapOtter runs fully offline once deployed. No external API calls are made. It works in completely air-gapped environments.",
  },
  {
    question: "Are there any file size or usage limitations?",
    answer:
      "No artificial limits. You can process as many images as you want, at any size. The only constraint is your server's hardware resources.",
  },
  {
    question: "What AI features are included?",
    answer:
      "SnapOtter includes 15 local AI models for background removal, upscaling, OCR, face detection, colorization, noise removal, photo restoration, and more. All models run on your hardware.",
  },
  {
    question: "Does SnapOtter collect any analytics?",
    answer:
      "Analytics is completely optional and disabled by default. If you choose to enable it, SnapOtter collects anonymous usage data and error logs to help improve the software. No personal data or image content is ever collected. You have full control over this in the settings and can disable it at any time.",
  },
  {
    question: "Can I use SnapOtter in my company?",
    answer:
      "Yes. Under AGPL-3.0, you can use it freely as long as you comply with the license terms. For proprietary or closed-source use, a commercial license is available.",
  },
  {
    question: "How do I update SnapOtter?",
    answer:
      "Pull the latest Docker image and restart the container. Your data persists in the mounted volume.",
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
        aria-expanded={open}
      >
        <span className="font-[family-name:var(--font-display)] text-base font-medium">
          {question}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            role="region"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-muted font-[family-name:var(--font-body)]">
              {answer}
            </p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FaqPage() {
  return (
    <>
      <Navbar />
      <main className="bg-background pt-16 text-foreground">
        <section className="px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl">
            <FadeIn>
              <div className="text-center">
                <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight md:text-5xl">
                  Frequently Asked Questions
                </h1>
                <p className="mt-6 text-lg text-muted font-[family-name:var(--font-body)]">
                  Everything you need to know about SnapOtter.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="mt-16 border-t border-border">
                {faqs.map((faq) => (
                  <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </FadeIn>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
