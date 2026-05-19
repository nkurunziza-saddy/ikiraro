import { Link } from "@tanstack/react-router";
import { Button } from "@ikiraro/components";

export function OverviewHero() {
  return (
    <section className="mx-auto max-w-7xl px-6 md:px-10 py-24 md:py-40">
      <div className="max-w-2xl">
        <h1 className="text-[32px] md:text-[40px] leading-[1.1] mb-6 font-bold tracking-tight text-foreground">
          The interface for silent communication.
        </h1>

        <p className="text-muted-foreground text-[15px] md:text-[16px] leading-relaxed mb-10">
          Sensa is a refined browser SDK that converts speech, text, and ASL into synchronized 3D
          sign animation. Designed for privacy, speed, and effortless integration.
        </p>

        <div className="flex items-center gap-4 mb-16">
          <Button
            render={<Link to="/demo" />}
            className="bg-foreground text-background rounded-md h-10 px-6 text-[13px] font-bold transition-all hover:opacity-90"
          >
            Get Started
          </Button>
          <Button
            render={<Link to="/sdk" />}
            variant="outline"
            className="text-foreground border-border hover:bg-secondary rounded-md h-10 px-6 text-[13px] font-semibold transition-all"
          >
            Documentation
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-16 border-t border-border pt-12">
          {[
            { title: "Privacy", desc: "No data ever leaves the browser." },
            { title: "Speed", desc: "High-performance sign rendering." },
            { title: "Sync", desc: "Perfectly synchronized output." },
          ].map((item) => (
            <div key={item.title}>
              <div className="text-[13px] font-bold text-foreground uppercase tracking-wider mb-2">
                {item.title}
              </div>
              <div className="text-[14px] text-muted-foreground leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
