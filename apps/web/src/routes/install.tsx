import { createFileRoute, Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { useState } from "react";

export const Route = createFileRoute("/install")({
  component: InstallPage,
});

const BG = "oklch(97.5% 0.012 82)";
const SURF = "oklch(99.2% 0.006 76)";
const INK = "oklch(30% 0.022 64)";
const INK2 = "oklch(48% 0.018 65)";
const META = "oklch(60% 0.016 66)";
const BORD = "oklch(88% 0.018 76)";
const ACC = "oklch(60% 0.110 48)";
const SP = "cubic-bezier(0.22,1,0.36,1)";

const PKG = "@ikiraro/sdk";

type Manager = "npm" | "bun" | "pnpm" | "yarn";

const COMMANDS: Record<Manager, string> = {
  npm: `npm install ${PKG}`,
  bun: `bun add ${PKG}`,
  pnpm: `pnpm add ${PKG}`,
  yarn: `yarn add ${PKG}`,
};

const MANAGERS: Manager[] = ["npm", "bun", "pnpm", "yarn"];

function InstallPage() {
  const [active, setActive] = useState<Manager>("npm");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(COMMANDS[active]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const tabStyle = (m: Manager): CSSProperties => ({
    padding: "4px 12px",
    borderRadius: "3px",
    fontSize: "0.68rem",
    fontWeight: active === m ? 530 : 400,
    color: active === m ? INK : META,
    background: active === m ? BG : "transparent",
    border: active === m ? `1px solid ${BORD}` : "1px solid transparent",
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: "-0.005em",
    transition: `all 0.15s ${SP}`,
  });

  return (
    <div
      style={{
        background: BG,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter Variable', system-ui, sans-serif",
        padding: "0 24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "380px" }}>
        {/* Package name */}
        <p
          style={{
            fontFamily: "'Fira Code','Cascadia Code','Courier New',monospace",
            fontSize: "0.78rem",
            fontWeight: 400,
            color: INK2,
            margin: "0 0 40px",
            letterSpacing: "0.01em",
          }}
        >
          {PKG}
        </p>

        {/* Manager tabs */}
        <div
          style={{
            display: "flex",
            gap: "2px",
            background: SURF,
            border: `1px solid ${BORD}`,
            borderRadius: "5px",
            padding: "3px",
            marginBottom: "8px",
            width: "fit-content",
          }}
        >
          {MANAGERS.map((m) => (
            <button key={m} style={tabStyle(m)} onClick={() => setActive(m)}>
              {m}
            </button>
          ))}
        </div>

        {/* Command + copy */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: SURF,
            border: `1px solid ${BORD}`,
            borderRadius: "5px",
            padding: "12px 14px",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <code
            style={{
              flex: 1,
              fontFamily: "'Fira Code','Cascadia Code','Courier New',monospace",
              fontSize: "0.75rem",
              fontWeight: 400,
              color: INK,
              letterSpacing: "0.005em",
              userSelect: "all",
            }}
          >
            {COMMANDS[active]}
          </code>
          <button
            onClick={copy}
            style={{
              flexShrink: 0,
              padding: "4px 10px",
              background: copied ? "oklch(60% 0.110 48 / 0.09)" : "transparent",
              border: `1px solid ${copied ? `oklch(60% 0.110 48 / 0.28)` : BORD}`,
              borderRadius: "4px",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "0.65rem",
              fontWeight: 500,
              color: copied ? ACC : META,
              letterSpacing: "0.01em",
              transition: `all 0.18s ${SP}`,
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {/* Metadata */}
        <p
          style={{
            fontSize: "0.6rem",
            fontWeight: 450,
            color: META,
            letterSpacing: "0.02em",
            margin: "0 0 48px",
          }}
        >
          v0.1.0 &thinsp;·&thinsp; MIT &thinsp;·&thinsp; 142 kB gzipped
        </p>

        {/* Back link */}
        <Link
          to="/"
          style={{
            fontSize: "0.7rem",
            fontWeight: 400,
            color: META,
            textDecoration: "none",
            letterSpacing: "0.01em",
            transition: "color 0.14s ease",
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.color = INK)}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.color = META)}
        >
          ← back
        </Link>
      </div>
    </div>
  );
}
