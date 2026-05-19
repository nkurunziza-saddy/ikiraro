import { createFileRoute } from "@tanstack/react-router";

import { PromoBanner } from "@/components/overview/promo-banner";
import { OverviewHero } from "@/components/overview/hero";
import { LivePreview } from "@/components/overview/live-preview";
import { StatsBand } from "@/components/overview/stats-band";
import { StatsDeepDive } from "@/components/overview/stats-deep-dive";
import { TickerMarquee } from "@/components/overview/ticker-marquee";
import { OverviewCapabilities } from "@/components/overview/capabilities";
import { OverviewPipeline } from "@/components/overview/pipeline";
import { StepGuide } from "@/components/overview/step-guide";
import { DeveloperCTA } from "@/components/overview/developer-cta";
import { OverviewFAQ } from "@/components/overview/faq";
import { FinalCTA } from "@/components/overview/final-cta";
import { OverviewFooter } from "@/components/overview/footer";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="bg-[var(--paper)]">
      <PromoBanner />
      <OverviewHero />
      <LivePreview />
      <StatsBand />
      <StatsDeepDive />
      <TickerMarquee />
      <OverviewCapabilities />
      <OverviewPipeline />
      <StepGuide />
      <DeveloperCTA />
      <OverviewFAQ />
      <FinalCTA />
      <div className="h-2 bg-gradient-to-r from-[var(--primary)] via-[var(--sunshine-500)] to-[var(--paper-soft)]" />
      <OverviewFooter />
    </div>
  );
}
