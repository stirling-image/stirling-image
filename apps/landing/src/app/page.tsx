import { ApiCallout } from "@/components/api-callout";
import { BentoGrid } from "@/components/bento-grid";
import { Enterprise } from "@/components/enterprise";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Navbar } from "@/components/navbar";
import { OpenSource } from "@/components/open-source";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <BentoGrid />
        <Enterprise />
        <HowItWorks />
        <ApiCallout />
        <OpenSource />
      </main>
      <Footer />
    </>
  );
}
