import { Hero } from "@/components/landing/hero";
import { WhyItMatters } from "@/components/landing/why-it-matters";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LiveOnTestnet } from "@/components/landing/live-on-testnet";
import { LandingCta } from "@/components/landing/cta";

export default function Home() {
  return (
    <>
      <Hero />
      <WhyItMatters />
      <HowItWorks />
      <LiveOnTestnet />
      <LandingCta />
    </>
  );
}
