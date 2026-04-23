import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { TrustBar } from "@/components/landing/TrustBar";
import { TestimonialsCarousel } from "@/components/landing/TestimonialsCarousel";
import { FacebookDisclaimer } from "@/components/landing/FacebookDisclaimer";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { StickyMobileCTA } from "@/components/landing/StickyMobileCTA";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <TestimonialsCarousel />
      </main>
      <FacebookDisclaimer />
      <LandingFooter />
      <StickyMobileCTA />
    </>
  );
}
