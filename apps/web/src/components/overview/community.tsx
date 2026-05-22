import { ArrowUpRight } from "lucide-react";
export function OverviewCommunity() {
  return (
    <section className="relative w-full bg-background py-[120px] md:py-[200px] border-b border-border">
      <div className="bento-container grid grid-cols-1 md:grid-cols-12 gap-24 relative z-10">
        <div className="md:col-span-5 md:col-start-2 flex flex-col justify-center">
          <h2 className="text-title mb-6">
            Built by the Community. <br /> For the Community.
          </h2>
          <p className="text-subhero mb-12">
            Join thousands of developers, researchers, and creators building the future of embodied
            AI interfaces. Open-source at its core.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground font-semibold text-[15px] hover:opacity-90 transition-opacity"
            >
              Join Discord
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 border border-border text-foreground font-semibold text-[15px] hover:bg-secondary transition-colors"
            >
              View GitHub
            </a>
          </div>
        </div>
        <div className="md:col-span-6">
          <div className="grid grid-cols-4 md:grid-cols-5 bento-grid overflow-hidden">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((num) => (
              <div
                key={num}
                className="aspect-square bento-cell bento-cell-hover flex items-center justify-center p-3 group overflow-hidden"
              >
                <img
                  alt={`Contributor ${num}`}
                  src={`https://randomuser.me/api/portraits/${num % 2 === 0 ? "women" : "men"}/${num + 30}.jpg`}
                  loading="lazy"
                  className="w-full h-full object-cover opacity-40 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0 scale-100 duration-300"
                />
              </div>
            ))}
            <div className="aspect-square bg-[#0a0a0a] flex items-center justify-center">
              <span className="text-metadata opacity-60">+1K</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
