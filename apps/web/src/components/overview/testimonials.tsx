const testimonials = [
  {
    name: "Dr. Sarah Chen",
    role: "Accessibility Researcher, MIT",
    content:
      "The latency on Ikiraro is unprecedented. By moving the entire translation pipeline on-device, they've solved the 'lag' in sign language avatars.",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&h=200&auto=format&fit=crop",
  },
  {
    name: "Marcus Thorne",
    role: "Lead Developer, TeleHealth Plus",
    content:
      "Integrating Ikiraro into our video consultation platform was seamless. The SDK approach ensures total privacy for our patients.",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&auto=format&fit=crop",
  },
  {
    name: "Elena Rodriguez",
    role: "Director, SignBridge NGO",
    content:
      "For the first time, we have a tool that can run on low-end tablets. The efficiency of the controller is truly a game-changer.",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&h=200&auto=format&fit=crop",
  },
];

export function TestimonialsSection() {
  return (
    <section className="bento-container w-full py-24 md:py-32">
      <div className="mb-16">
        <h2 className="text-title">
          Built for researchers <br /> and developers alike.
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 bento-grid overflow-hidden">
        {testimonials.map((t, i) => (
          <div
            key={i}
            className="bento-cell bento-cell-hover p-10 relative flex flex-col justify-between group"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="size-12 rounded-full border border-border grayscale group-hover:grayscale-0 transition-all duration-500"
                />
                <div>
                  <h3 className="text-[15px] font-semibold">{t.name}</h3>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em]">
                    {t.role}
                  </p>
                </div>
              </div>
              <p className="text-[16px] text-secondary-foreground leading-relaxed italic">
                "{t.content}"
              </p>
            </div>
            {/* Corner Decorative Element */}
            <div className="absolute top-4 right-4 size-1.5 border-t border-r border-border opacity-40 group-hover:opacity-100 transition-opacity"></div>
          </div>
        ))}
      </div>
    </section>
  );
}
