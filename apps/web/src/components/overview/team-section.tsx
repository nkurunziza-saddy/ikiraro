import { motion } from "motion/react";

const team = [
  {
    name: "Alex Rivera",
    role: "Linguistic Engineer",
    image:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop",
    bio: "Focusing on the bridge between LLM outputs and kinematic sign execution.",
  },
  {
    name: "Maya Sun",
    role: "Lead 3D Artist",
    image:
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=800&auto=format&fit=crop",
    bio: "Optimizing skeletal meshes for real-time browser performance.",
  },
  {
    name: "Julian Voss",
    role: "Accessibility Lead",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=800&auto=format&fit=crop",
    bio: "Ensuring every interaction follows WCAG 2.2 and Deque standards.",
  },
];

export function TeamSection() {
  return (
    <section className="bento-container w-full py-24 md:py-32 border-t border-border">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24">
        <div className="lg:col-span-4">
          <h2 className="text-title mb-8">Built by makers.</h2>
          <p className="text-secondary-foreground text-sm leading-relaxed max-w-xs">
            Ikiraro is a collective effort of engineers, designers, and accessibility experts
            dedicated to open-source sign language technology.
          </p>
        </div>
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {team.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="aspect-[3/4] overflow-hidden border border-border grayscale hover:grayscale-0 transition-all duration-700">
                <img src={member.image} alt={member.name} className="size-full object-cover" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px]">{member.name}</h3>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">
                  {member.role}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">{member.bio}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
