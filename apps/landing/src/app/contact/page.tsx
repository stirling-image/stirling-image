"use client";

import { FileText, Monitor, Shield } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

import { FadeIn } from "@/components/fade-in";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

const benefits = [
  {
    icon: Monitor,
    title: "Live Demo",
    description: "See SnapOtter in action with a personalized walkthrough of all features.",
  },
  {
    icon: Shield,
    title: "Deployment Support",
    description: "Get expert help setting up SnapOtter on your infrastructure.",
  },
  {
    icon: FileText,
    title: "Enterprise Licensing",
    description: "Custom agreements for proprietary use, OEM, and commercial distribution.",
  },
];

const subjects = ["Book a Demo", "Enterprise Licensing", "Deployment Help", "General Inquiry"];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [subject, setSubject] = useState(subjects[0]);
  const [message, setMessage] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const lines = [
      `Name: ${name}`,
      company ? `Company: ${company}` : "",
      `Email: ${email}`,
      "",
      message,
    ]
      .filter(Boolean)
      .join("\n");

    const mailto = `mailto:contact@snapotter.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines)}`;
    window.location.href = mailto;
  }

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <section className="px-6 py-24 md:py-32">
          <div className="mx-auto grid max-w-5xl gap-16 md:grid-cols-2">
            {/* Left column */}
            <FadeIn>
              <div>
                <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Get in touch</h1>
                <p className="mt-6 text-lg leading-relaxed text-muted">
                  Whether you need a demo, have questions about deployment, or want to discuss
                  enterprise licensing, we are here to help.
                </p>

                <div className="mt-12 space-y-6">
                  {benefits.map((item) => (
                    <div
                      key={item.title}
                      className="flex gap-4 rounded-xl border border-border p-5"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                        <item.icon size={20} className="text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-10 text-sm text-muted">
                  Open source under AGPL-3.0. Commercial licenses available.
                </p>
              </div>
            </FadeIn>

            {/* Right column */}
            <FadeIn delay={0.1}>
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-border bg-background-alt p-8"
              >
                <div className="space-y-5">
                  <div>
                    <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                      Name <span className="text-accent">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                      Email <span className="text-accent">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="mb-1.5 block text-sm font-medium">
                      Company
                    </label>
                    <input
                      id="company"
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="mb-1.5 block text-sm font-medium">
                      Subject
                    </label>
                    <select
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                    >
                      {subjects.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="mb-1.5 block text-sm font-medium">
                      Message <span className="text-accent">*</span>
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-accent py-3 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover"
                  >
                    Send Message
                  </button>
                </div>

                <p className="mt-5 text-center text-sm text-muted">
                  Or email us directly at{" "}
                  <a
                    href="mailto:contact@snapotter.com"
                    className="text-accent underline underline-offset-4 hover:text-accent-hover"
                  >
                    contact@snapotter.com
                  </a>
                </p>
              </form>
            </FadeIn>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
