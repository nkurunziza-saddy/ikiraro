"use client";
import { useState } from "react";
import { motion } from "motion/react";

type Feature = { label: string; note?: string; limited?: boolean };

const PLANS = [
  {
    id: "open-source",
    label: "Open Source",
    name: "Free",
    tagline: "Core SDK, forever free.",
    monthlyPrice: null,
    annualPrice: null,
    displayPrice: "Free",
    billingNote: "No API key. No server. Self-hosted.",
    cta: "View on GitHub",
    ctaHref: "https://github.com/nkurunziza-saddy/ikiraro",
    ctaExternal: true,
    highlight: false,
    featured: false,
    callLimit: null,
    features: [
      { label: "On-device ASL translation", note: "WebAssembly + WebGL" },
      { label: "3D avatar renderer", note: "60 FPS, browser-native" },
      { label: "Hand tracking engine", note: "No data leaves device" },
      { label: "React + vanilla JS SDK" },
      { label: "MIT license" },
      { label: "Community support", note: "GitHub Issues", limited: true },
    ] as Feature[],
  },
  {
    id: "api",
    label: "API",
    name: "API",
    tagline: "Cloud-accelerated calls.",
    monthlyPrice: 49,
    annualPrice: 39,
    displayPrice: "$49",
    billingNote: "per month — 100K calls included",
    overage: "$0.0005 / extra call",
    cta: "Start Free Trial",
    ctaHref: "#",
    ctaExternal: false,
    highlight: false,
    featured: false,
    callLimit: 100_000,
    features: [
      { label: "Everything in Open Source" },
      { label: "Managed REST API", note: "HTTPS + JWT auth" },
      { label: "Higher-accuracy cloud models", note: "Updated monthly" },
      { label: "Usage dashboard", note: "Real-time metrics" },
      { label: "100K API calls / mo", note: "$0.0005 per extra" },
      { label: "Email support", note: "48h SLA" },
    ] as Feature[],
  },
  {
    id: "teams",
    label: "Teams",
    name: "Teams",
    tagline: "For growing organisations.",
    monthlyPrice: 299,
    annualPrice: 239,
    displayPrice: "$299",
    billingNote: "per month — 1M calls included",
    overage: "$0.0003 / extra call",
    cta: "Start Free Trial",
    ctaHref: "#",
    ctaExternal: false,
    highlight: true,
    featured: true,
    callLimit: 1_000_000,
    features: [
      { label: "Everything in API" },
      { label: "1M API calls / mo", note: "$0.0003 per extra" },
      { label: "Multiple workspaces", note: "Org-level isolation" },
      { label: "Role-based access controls" },
      { label: "Custom vocabulary sets", note: "Domain-specific signs" },
      { label: "Priority support", note: "12h SLA" },
    ] as Feature[],
  },
  {
    id: "enterprise",
    label: "Enterprise",
    name: "Enterprise",
    tagline: "Unlimited scale. Custom terms.",
    monthlyPrice: null,
    annualPrice: null,
    displayPrice: "Custom",
    billingNote: "Volume discounts + custom contracts",
    cta: "Contact Sales",
    ctaHref: "mailto:wideskillsrw@gmail.com",
    ctaExternal: true,
    highlight: false,
    featured: false,
    callLimit: null,
    features: [
      { label: "Everything in Teams" },
      { label: "Unlimited API calls", note: "No rate limits" },
      { label: "On-premise deployment", note: "Air-gapped environments" },
      { label: "Custom model training", note: "Dialect + domain fine-tuning" },
      { label: "Compliance support", note: "HIPAA, FERPA, SOC 2" },
      { label: "Dedicated success manager" },
    ] as Feature[],
  },
];

function CallMeter({ limit, featured }: { limit: number | null; featured?: boolean }) {
  if (!limit) return null;
  const segments = 20;
  const filled = limit === 100_000 ? 2 : 10;
  return (
    <div className="flex items-end gap-[2px] h-6">
      {Array.from({ length: segments }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[4px] rounded-none"
          style={{
            height: `${40 + Math.sin((i / segments) * Math.PI) * 40}%`,
            background:
              i < filled
                ? featured
                  ? "var(--primary-foreground)"
                  : "var(--primary)"
                : featured
                  ? "rgba(255,255,255,0.2)"
                  : "var(--border)",
          }}
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          transition={{ delay: i * 0.03, duration: 0.3, ease: "easeOut" }}
          viewport={{ once: true }}
        />
      ))}
    </div>
  );
}

function CheckIcon({ featured }: { featured?: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      className="shrink-0 mt-[3px]"
      style={{ color: featured ? "var(--primary-foreground)" : "var(--primary)" }}
    >
      <path d="M1.5 5L3.5 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="w-full py-24 md:py-32 border-t border-border">
      <div className="bento-container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
          <div>
            <p className="text-metadata mb-4">Pricing</p>
            <h2 className="text-title max-w-[520px]">
              Free to build.
              <br />
              Pay for what scales.
            </h2>
          </div>

          {/* Billing toggle */}
          <div className="flex items-center gap-4 pb-1">
            <span
              className={`text-[12px] font-mono uppercase tracking-widest transition-colors duration-200 ${
                !annual ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Monthly
            </span>
            <button
              onClick={() => setAnnual((v) => !v)}
              className="relative w-10 h-5 border border-border bg-background transition-colors duration-200 cursor-pointer"
              aria-label="Toggle annual billing"
            >
              <motion.div
                className="absolute top-[3px] size-3 bg-primary"
                animate={{ left: annual ? "calc(100% - 15px)" : "3px" }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              />
            </button>
            <span
              className={`text-[12px] font-mono uppercase tracking-widest transition-colors duration-200 ${
                annual ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Annual
              <span className="ml-2 text-primary">−20%</span>
            </span>
          </div>
        </div>

        {/* Pricing grid */}
        <div className="bento-grid md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const price = annual ? plan.annualPrice : plan.monthlyPrice;
            const isFeatured = plan.featured;

            return (
              <div
                key={plan.id}
                className={`bento-cell flex flex-col relative overflow-hidden ${
                  isFeatured ? "bg-primary" : "bento-cell-hover"
                }`}
              >
                {/* Featured label */}
                {isFeatured && (
                  <div className="px-8 pt-5 pb-0">
                    <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-primary-foreground/70">
                      Recommended
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div
                  className="px-8 pt-6 pb-8 border-b border-b-[rgba(255,255,255,0.15)]"
                  style={{
                    borderColor: isFeatured ? "rgba(255,255,255,0.15)" : "var(--border)",
                  }}
                >
                  <p
                    className={`text-[10px] font-mono uppercase tracking-[0.25em] mb-3 ${
                      isFeatured ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {plan.label}
                  </p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span
                      className={`text-[48px] font-bold tracking-[-0.04em] leading-none ${
                        isFeatured ? "text-primary-foreground" : "text-foreground"
                      }`}
                    >
                      {price !== null ? `$${price}` : plan.displayPrice}
                    </span>
                    {price !== null && (
                      <span
                        className={`text-[13px] font-mono ${
                          isFeatured ? "text-primary-foreground/60" : "text-muted-foreground"
                        }`}
                      >
                        /mo
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[12px] font-mono leading-relaxed mt-2 ${
                      isFeatured ? "text-primary-foreground/60" : "text-muted-foreground"
                    }`}
                  >
                    {plan.billingNote}
                  </p>

                  {/* Call meter for metered plans */}
                  {plan.callLimit && (
                    <div className="mt-5">
                      <CallMeter limit={plan.callLimit} featured={isFeatured} />
                      <p
                        className={`text-[10px] font-mono mt-2 uppercase tracking-widest ${
                          isFeatured ? "text-primary-foreground/50" : "text-muted-foreground"
                        }`}
                      >
                        {plan.callLimit >= 1_000_000
                          ? `${plan.callLimit / 1_000_000}M`
                          : `${plan.callLimit / 1_000}K`}{" "}
                        calls / mo
                        {plan.overage && <span className="ml-2 opacity-60">· {plan.overage}</span>}
                      </p>
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="flex-1 px-8 py-7 space-y-4">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckIcon featured={isFeatured} />
                      <span>
                        <span
                          className={`text-[13px] leading-snug ${
                            isFeatured ? "text-primary-foreground" : "text-foreground"
                          } ${f.limited ? "opacity-60" : ""}`}
                        >
                          {f.label}
                        </span>
                        {f.note && (
                          <span
                            className={`block text-[11px] font-mono mt-0.5 ${
                              isFeatured ? "text-primary-foreground/50" : "text-muted-foreground"
                            }`}
                          >
                            {f.note}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="px-8 pb-8">
                  <a
                    href={plan.ctaHref}
                    target={plan.ctaExternal ? "_blank" : undefined}
                    rel={plan.ctaExternal ? "noopener noreferrer" : undefined}
                    className={`w-full block text-center py-3 text-[12px] font-mono uppercase tracking-[0.2em] border transition-colors duration-200 ${
                      isFeatured
                        ? "bg-primary-foreground text-primary border-primary-foreground hover:bg-primary-foreground/90"
                        : plan.id === "open-source"
                          ? "bg-background text-foreground border-border hover:bg-secondary"
                          : "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    }`}
                  >
                    {plan.cta}
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fine print */}
        <div className="mt-8 flex flex-col sm:flex-row gap-6 sm:gap-16 opacity-50">
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.2em]">
            All paid plans include a 14-day free trial. No credit card required.
          </p>
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.2em]">
            Enterprise contracts billed annually. Volume discounts from 10M calls/mo.
          </p>
        </div>
      </div>
    </section>
  );
}
