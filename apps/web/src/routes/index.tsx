import { createFileRoute, Link } from "@tanstack/react-router";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sensa/components";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:py-14">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-border/70 bg-card/90 p-8 shadow-[0_36px_120px_-56px_rgba(0,0,0,0.7)] lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,159,72,0.22),transparent_30%),radial-gradient(circle_at_78%_24%,rgba(96,75,46,0.26),transparent_26%)]" />
        <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.32em] text-primary">
              Accessible Communication
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                A calmer interface for translating between spoken language and sign planning.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Sensa combines speech capture, typed input, live fingerspelling, playback, and
                translation history in one working surface built for clarity.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/dashboard">
                <Button size="lg" className="min-w-40">
                  Open Dashboard
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="min-w-40">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <Card className="rounded-[1.5rem] border border-border/70 bg-background/70">
              <CardHeader>
                <CardTitle>Speech to Plan</CardTitle>
                <CardDescription>
                  Capture audio, run transcription, and shape it into a signer-facing sequence.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="rounded-[1.5rem] border border-border/70 bg-background/70">
              <CardHeader>
                <CardTitle>Vision Loop</CardTitle>
                <CardDescription>
                  Live hand tracking with confidence checks, manual correction, and sentence commit.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="rounded-[1.5rem] border border-border/70 bg-background/70">
              <CardHeader>
                <CardTitle>Manual Control</CardTitle>
                <CardDescription>
                  Compose exact lexeme and fingerspelling sequences when you need deterministic
                  output.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-[1.75rem] border border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle>One Shared Timeline</CardTitle>
            <CardDescription>
              Every committed turn stays visible with raw input, normalized text, gloss, queue, and
              text-to-speech playback.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-7 text-muted-foreground">
              The dashboard keeps translation history close to the active pipeline so operators can
              compare intent, plan, and playback without context switching.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle>Deterministic by Default</CardTitle>
            <CardDescription>
              Manual sequences and current text planning stay predictable and easy to verify.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-7 text-muted-foreground">
              That makes the current interface a good fit for demos, QA, and focused workflow design
              while the broader planning stack evolves.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle>Operator-Friendly Controls</CardTitle>
            <CardDescription>
              Clear mode separation, better camera feedback, and fewer decorative distractions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-7 text-muted-foreground">
              The interface is tuned to feel like a tool, not a demo page, which keeps attention on
              accuracy and flow.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
