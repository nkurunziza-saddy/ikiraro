import type { RefObject } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@ikiraro/components";
import { HeroAvatarPane } from "./landing-avatar";

interface OverviewHeroProps {
  avatarRef?: RefObject<HTMLDivElement | null>;
}

export function OverviewHero({ avatarRef }: OverviewHeroProps) {
  return (
    <section className="mx-auto max-w-7xl px-6 md:px-10 py-20 md:py-28">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left: copy */}
        <div>
          <h1 className="text-[32px] md:text-[44px] leading-[1.05] mb-6 font-bold tracking-tight text-foreground">
            The interface for silent communication.
          </h1>

          <p className="text-muted-foreground text-[15px] md:text-[16px] leading-relaxed mb-10">
            Sensa is a refined browser SDK that converts speech, text, and ASL into synchronized 3D
            sign animation. Designed for privacy, speed, and effortless integration.
          </p>

          <div className="flex items-center gap-4 mb-14">
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

          <div className="grid grid-cols-3 gap-8 border-t border-border pt-10">
            {[
              { title: "Privacy", desc: "No data ever leaves the browser." },
              { title: "Speed", desc: "High-performance sign rendering." },
              { title: "Sync", desc: "Perfectly synchronized output." },
            ].map((item) => (
              <div key={item.title}>
                <div className="text-[12px] font-bold text-foreground uppercase tracking-wider mb-1.5">
                  {item.title}
                </div>
                <div className="text-[13px] text-muted-foreground leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: avatar */}
        <div ref={avatarRef} className="w-full max-w-[380px] mx-auto lg:ml-auto lg:mr-0">
          <HeroAvatarPane />
        </div>
      </div>
    </section>
  );
}
