const useCases = [
  {
    title: "Classroom Inclusion",
    description:
      "Real-time translation of lectures into ASL on student tablets, enabling seamless inclusion without requiring a dedicated in-person interpreter.",
    image:
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1200&auto=format&fit=crop",
    tag: "Education",
    stats: "0.2s Avg Latency",
  },
  {
    title: "Telemedicine Support",
    description:
      "Integrated into health portals to provide immediate sign language support for patient intake, ensuring privacy and clarity.",
    image:
      "https://images.unsplash.com/photo-1584515933487-759f397f2751?q=80&w=1200&auto=format&fit=crop",
    tag: "Healthcare",
    stats: "Privacy First",
  },
];

export function UseCasesSection() {
  return (
    <section className="bento-container w-full py-24 md:py-32 border-t border-border">
      <div className="mb-16">
        <h2 className="text-title">Deploying intelligence where it matters.</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
        {useCases.map((uc, i) => (
          <div key={i} className="space-y-8 group">
            <div className="relative aspect-video overflow-hidden border border-border">
              <img
                src={uc.image}
                alt={uc.title}
                className="size-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-6 left-6 flex gap-3">
                <span className="px-3 py-1 border border-border bg-background/80 backdrop-blur-md text-[10px] font-mono uppercase tracking-widest">
                  {uc.tag}
                </span>
                <span className="px-3 py-1 border border-primary/20 bg-primary/10 text-primary backdrop-blur-md text-[10px] font-mono uppercase tracking-widest">
                  {uc.stats}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-[20px] font-semibold tracking-tight">{uc.title}</h3>
              <p className="text-[16px] text-muted-foreground leading-relaxed">{uc.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
