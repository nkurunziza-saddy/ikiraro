import { useState } from "react";
import { Terminal, Copy, Check } from "lucide-react";
import { Button } from "@ikiraro/components/ui/button";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      variant="ghost"
      className="text-background/50 bg-background/5 font-mono h-auto px-2.5 py-1 text-[10px] transition-colors hover:bg-background/10 hover:text-background"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "copied" : "copy"}
    </Button>
  );
}

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="bg-foreground border border-background/10 rounded overflow-hidden text-[12px] font-mono">
      {label && (
        <div className="border-b border-background/10 flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <Terminal size={11} className="text-background/50" />
            <span className="text-background/50 text-[10px]">{label}</span>
          </div>
          <CopyButton text={code} />
        </div>
      )}
      <pre className="text-background/75 px-4 py-4 overflow-x-auto leading-relaxed whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function SectionHead({ id, label }: { id: string; label: string }) {
  return (
    <div id={id} className="scroll-mt-24">
      <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.14em] mb-3">
        {label}
      </p>
    </div>
  );
}

export function RefTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-border rounded divide-y divide-border overflow-hidden">
      {children}
    </div>
  );
}

export function RefTableHead({ cols }: { cols: string[] }) {
  const colCount = cols.length;
  const gridClass = colCount === 2 ? "grid-cols-[1.5fr_3fr]" : "grid-cols-[1.4fr_1.4fr_2fr]";
  return (
    <div
      className={`grid ${gridClass} gap-4 px-5 py-2 bg-secondary text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground`}
    >
      {cols.map((c) => (
        <span key={c}>{c}</span>
      ))}
    </div>
  );
}

export function RefRow({ name, type, desc }: { name: string; type?: string; desc: string }) {
  const has3 = type !== undefined;
  const gridClass = has3 ? "grid-cols-[1.4fr_1.4fr_2fr]" : "grid-cols-[1.5fr_3fr]";
  return (
    <div className={`grid ${gridClass} gap-4 px-5 py-3 text-[12px]`}>
      <code className="text-foreground font-mono font-medium">{name}</code>
      {has3 && <code className="text-muted-foreground font-mono">{type}</code>}
      <span className="text-muted-foreground">{desc}</span>
    </div>
  );
}

export function EventTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-border rounded divide-y divide-border overflow-hidden">
      <div className="grid grid-cols-[1.8fr_3fr] gap-4 px-5 py-2 bg-secondary text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
        <span>Event</span>
        <span>Description</span>
      </div>
      {children}
    </div>
  );
}

export function EventRow({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="grid grid-cols-[1.8fr_3fr] gap-4 px-5 py-3 text-[12px]">
      <code className="text-foreground font-mono font-medium">{name}</code>
      <span className="text-muted-foreground">{desc}</span>
    </div>
  );
}

export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-secondary border border-border rounded p-4 text-[12px] text-muted-foreground leading-relaxed">
      {children}
    </div>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="pb-8 border-b border-border mb-8">
      <h1 className="text-foreground text-[26px] font-semibold tracking-tight leading-tight mb-2">
        {title}
      </h1>
      {subtitle && (
        <p className="text-muted-foreground text-[14px] leading-relaxed max-w-xl">{subtitle}</p>
      )}
    </div>
  );
}
