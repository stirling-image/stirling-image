"use client";

import { domAnimation, LazyMotion } from "framer-motion";
import { BentoGrid } from "@/components/bento-grid";
import { Enterprise } from "@/components/enterprise";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Navbar } from "@/components/navbar";
import { OpenSource } from "@/components/open-source";
import { Pricing } from "@/components/pricing";
import { WhyChoose } from "@/components/why-choose";

export default function Home() {
  return (
    <LazyMotion features={domAnimation}>
      <Navbar />
      <main id="main-content">
        <Hero />
        <HowItWorks />
        <WhyChoose />
        <BentoGrid />
        <Enterprise />
        <Pricing />
        <OpenSource />
      </main>
      <Footer />
    </LazyMotion>
  );
}
