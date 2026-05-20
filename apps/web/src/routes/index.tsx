import { useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { OverviewHero } from "@/components/overview/hero";
import { LivePreview } from "@/components/overview/live-preview";
import { StatsBand } from "@/components/overview/stats-band";
import { OverviewCapabilities } from "@/components/overview/capabilities";
import { OverviewPipeline } from "@/components/overview/pipeline";
import { OverviewFooter } from "@/components/overview/footer";
import { LandingAvatarProvider, FloatingAvatarWidget } from "@/components/overview/landing-avatar";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <LandingAvatarProvider>
      <div className="bg-background">
        <OverviewHero avatarRef={heroRef} />
        <LivePreview />
        <StatsBand />
        <OverviewCapabilities />
        <OverviewPipeline />
        <div className="h-px bg-border mx-auto max-w-7xl" />
        <OverviewFooter />
      </div>
      <FloatingAvatarWidget heroRef={heroRef} />
    </LandingAvatarProvider>
  );
}
