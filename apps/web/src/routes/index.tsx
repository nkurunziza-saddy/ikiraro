import { createFileRoute } from "@tanstack/react-router";
import { OverviewHero } from "@/components/overview/hero";
import { LivePreview } from "@/components/overview/live-preview";
import { StatsBand } from "@/components/overview/stats-band";
import { OverviewCapabilities } from "@/components/overview/capabilities";
import { OverviewFeaturesGrid } from "@/components/overview/features-grid";
import { OverviewArchitecture } from "@/components/overview/architecture";
import { OverviewPipeline } from "@/components/overview/pipeline";
import { OverviewProcessing } from "@/components/overview/processing";
import { OverviewLiveLogs } from "@/components/overview/live-logs";
import { OverviewNetwork } from "@/components/overview/network";
import { OverviewPrivacy } from "@/components/overview/privacy";
import { OverviewCommunity } from "@/components/overview/community";
import { OverviewFooter } from "@/components/overview/footer";
import { LandingAvatarProvider, FloatingAvatarWidget } from "@/components/overview/landing-avatar";
export const Route = createFileRoute("/")({
  component: HomeComponent,
});
function HomeComponent() {
  return (
    <LandingAvatarProvider>
      <div className="bg-background min-h-screen text-foreground selection:bg-primary/30">
        <OverviewHero />
        <LivePreview />
        <StatsBand />
        <OverviewCapabilities />
        <OverviewFeaturesGrid />
        <OverviewArchitecture />
        <OverviewPipeline />
        <OverviewProcessing />
        <OverviewLiveLogs />
        <OverviewNetwork />
        <OverviewPrivacy />
        <OverviewCommunity />
        <div className="h-px bg-border mx-auto max-w-7xl" />
        <OverviewFooter />
      </div>
      <FloatingAvatarWidget />
    </LandingAvatarProvider>
  );
}
