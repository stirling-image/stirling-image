"use client";

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
      "SnapOtter includes 14 local AI models for background removal, upscaling, OCR, face detection, colorization, noise removal, photo restoration, and more. All models run on your hardware.",
  },
  {
    question: "What technology does SnapOtter use?",
    answer:
      "The backend uses Node.js with Sharp for high-performance image processing. AI features use Python with models like RealESRGAN, rembg, and PaddleOCR. The frontend is React with a REST API.",
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
      >
        <span className="text-base font-medium">{question}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <p className="pb-5 text-sm leading-relaxed text-muted">{answer}</p>}
    </div>
  );
}

export default function FaqPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <section className="px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl">
            <FadeIn>
              <div className="text-center">
                <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                  Frequently Asked Questions
                </h1>
                <p className="mt-6 text-lg text-muted">
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
