import { createFileRoute } from "@tanstack/react-router";

import { OverviewHero } from "@/components/overview/hero";
import { LivePreview } from "@/components/overview/live-preview";
import { StatsBand } from "@/components/overview/stats-band";
import { OverviewCapabilities } from "@/components/overview/capabilities";
import { OverviewPipeline } from "@/components/overview/pipeline";
import { OverviewFooter } from "@/components/overview/footer";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="bg-background">
      <OverviewHero />
      <LivePreview />
      <StatsBand />
      <OverviewCapabilities />
      <OverviewPipeline />
      <div className="h-px bg-border mx-auto max-w-7xl" />
      <OverviewFooter />
    </div>
  );
}
