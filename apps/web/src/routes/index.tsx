import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { OverviewHero } from "@/components/overview/hero";
import { LivePreview } from "@/components/overview/live-preview";
import { StatsBand } from "@/components/overview/stats-band";
import { OverviewCapabilities } from "@/components/overview/capabilities";
import { OverviewFeaturesGrid } from "@/components/overview/features-grid";

const OverviewArchitecture = lazy(() =>
  import("@/components/overview/architecture").then((m) => ({ default: m.OverviewArchitecture })),
);
const OverviewPipeline = lazy(() =>
  import("@/components/overview/pipeline").then((m) => ({ default: m.OverviewPipeline })),
);
const OverviewProcessing = lazy(() =>
  import("@/components/overview/processing").then((m) => ({ default: m.OverviewProcessing })),
);
const OverviewLiveLogs = lazy(() =>
  import("@/components/overview/live-logs").then((m) => ({ default: m.OverviewLiveLogs })),
);
const OverviewNetwork = lazy(() =>
  import("@/components/overview/network").then((m) => ({ default: m.OverviewNetwork })),
);
const OverviewPrivacy = lazy(() =>
  import("@/components/overview/privacy").then((m) => ({ default: m.OverviewPrivacy })),
);
const UseCasesSection = lazy(() =>
  import("@/components/overview/use-cases").then((m) => ({ default: m.UseCasesSection })),
);
const TestimonialsSection = lazy(() =>
  import("@/components/overview/testimonials").then((m) => ({ default: m.TestimonialsSection })),
);
const TeamSection = lazy(() =>
  import("@/components/overview/team-section").then((m) => ({ default: m.TeamSection })),
);
// const OverviewCommunity = lazy(() =>
//   import("@/components/overview/community").then((m) => ({ default: m.OverviewCommunity })),
// );
const OverviewFooter = lazy(() =>
  import("@/components/overview/footer").then((m) => ({ default: m.OverviewFooter })),
);

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
        <Suspense fallback={<div className="h-40" />}>
          <UseCasesSection />
          <OverviewArchitecture />
          <OverviewPipeline />
          <OverviewProcessing />
          <OverviewLiveLogs />
          <OverviewNetwork />
          <OverviewPrivacy />
          <TestimonialsSection />
          <TeamSection />
          <div className="h-px bg-border mx-auto max-w-7xl" />
          <OverviewFooter />
        </Suspense>
      </div>
      <FloatingAvatarWidget />
    </LandingAvatarProvider>
  );
}
