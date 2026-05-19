import { useState } from "react";
import { Terminal, Copy, Check } from "lucide-react";
import { Button } from "@ikiraro/components/ui/button";

// ─── Syntax highlighting ──────────────────────────────────────────────────────

type TokenKind = "keyword" | "type" | "string" | "comment" | "number" | "op" | "plain";

const KEYWORDS = new Set([
  "import",
  "export",
  "from",
  "as",
  "default",
  "const",
  "let",
  "var",
  "function",
  "return",
  "new",
  "this",
  "if",
  "else",
  "for",
  "while",
  "do",
  "class",
  "extends",
  "implements",
  "static",
  "public",
  "private",
  "protected",
  "readonly",
  "declare",
  "interface",
  "type",
  "enum",
  "keyof",
  "typeof",
  "instanceof",
  "in",
  "of",
  "async",
  "await",
  "try",
  "catch",
  "finally",
  "throw",
  "void",
  "infer",
  "abstract",
  "switch",
  "case",
  "break",
  "continue",
  "null",
  "undefined",
  "true",
  "false",
]);

function tokenize(code: string): [string, TokenKind][] {
  const out: [string, TokenKind][] = [];
  let pos = 0;

  while (pos < code.length) {
    const ch = code[pos];

    // Line comment
    if (ch === "/" && code[pos + 1] === "/") {
      const nl = code.indexOf("\n", pos);
      const end = nl === -1 ? code.length : nl;
      out.push([code.slice(pos, end), "comment"]);
      pos = end;
      continue;
    }

    // Block comment
    if (ch === "/" && code[pos + 1] === "*") {
      const end = code.indexOf("*/", pos + 2);
      const to = end === -1 ? code.length : end + 2;
      out.push([code.slice(pos, to), "comment"]);
      pos = to;
      continue;
    }

    // String or template literal
    if (ch === "`" || ch === '"' || ch === "'") {
      let j = pos + 1;
      while (j < code.length) {
        if (code[j] === "\\") {
          j += 2;
          continue;
        }
        if (code[j] === ch) {
          j++;
          break;
        }
        j++;
      }
      out.push([code.slice(pos, j), "string"]);
      pos = j;
      continue;
    }

    // Number
    if (/\d/.test(ch) && (pos === 0 || !/\w/.test(code[pos - 1]))) {
      let j = pos;
      while (j < code.length && /[\d.]/.test(code[j])) j++;
      out.push([code.slice(pos, j), "number"]);
      pos = j;
      continue;
    }

    // Identifier, keyword, or type
    if (/[a-zA-Z_$]/.test(ch)) {
      let j = pos;
      while (j < code.length && /[\w$]/.test(code[j])) j++;
      const word = code.slice(pos, j);
      const kind: TokenKind = KEYWORDS.has(word)
        ? "keyword"
        : /^[A-Z]/.test(word)
          ? "type"
          : "plain";
      out.push([word, kind]);
      pos = j;
      continue;
    }

    // Operators and structural punctuation
    out.push([ch, /[=<>!|&+\-*/^~?:.;,()[\]{}@#]/.test(ch) ? "op" : "plain"]);
    pos++;
  }

  return out;
}

const TOKEN_COLOR: Record<TokenKind, string> = {
  keyword: "#c084fc",
  type: "#67e8f9",
  string: "#86efac",
  comment: "#6b7280",
  number: "#fb923c",
  op: "#94a3b8",
  plain: "rgba(255,255,255,0.85)",
};

const PLAIN_LABELS = new Set(["terminal", ".env"]);

// ─── Components ───────────────────────────────────────────────────────────────

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
      className="text-background/40 bg-background/5 h-auto px-2.5 py-1 text-[10px] transition-colors hover:bg-background/10 hover:text-background"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "copied" : "copy"}
    </Button>
  );
}

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const isPlain = !label || PLAIN_LABELS.has(label);

  return (
    <div className="bg-foreground border border-background/10 rounded overflow-hidden text-[13px] font-mono">
      {label && (
        <div className="border-b border-background/10 flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Terminal size={11} className="text-background/40" />
            <span className="text-background/40 text-[10px] tracking-wide">{label}</span>
          </div>
          <CopyButton text={code} />
        </div>
      )}
      <pre className="px-5 py-5 overflow-x-auto leading-[1.65] whitespace-pre">
        <code>
          {isPlain ? (
            <span style={{ color: "rgba(255,255,255,0.72)" }}>{code}</span>
          ) : (
            tokenize(code).map(([text, kind], i) => (
              <span key={i} style={{ color: TOKEN_COLOR[kind] }}>
                {text}
              </span>
            ))
          )}
        </code>
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
  const gridClass = cols.length === 2 ? "grid-cols-[1.5fr_3fr]" : "grid-cols-[1.4fr_1.4fr_2fr]";
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
    <div className={`grid ${gridClass} gap-4 px-5 py-3.5 text-[13px]`}>
      <code className="text-foreground font-mono font-medium text-[12px]">{name}</code>
      {has3 && <code className="text-muted-foreground font-mono text-[12px]">{type}</code>}
      <span className="text-muted-foreground leading-relaxed">{desc}</span>
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
    <div className="grid grid-cols-[1.8fr_3fr] gap-4 px-5 py-3.5 text-[13px]">
      <code className="text-foreground font-mono font-medium text-[12px]">{name}</code>
      <span className="text-muted-foreground leading-relaxed">{desc}</span>
    </div>
  );
}

export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-secondary border border-border rounded p-4 text-[13px] text-muted-foreground leading-relaxed">
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
