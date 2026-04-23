import { BentoGrid } from "@/components/bento-grid";
import { Enterprise } from "@/components/enterprise";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Navbar } from "@/components/navbar";
import { OpenSource } from "@/components/open-source";
import { WhyChoose } from "@/components/why-choose";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <WhyChoose />
        <BentoGrid />
        <Enterprise />
        <HowItWorks />
        <OpenSource />
      </main>
      <Footer />
    </>
  );
}
