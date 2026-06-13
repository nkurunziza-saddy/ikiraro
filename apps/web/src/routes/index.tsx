import { createFileRoute, Link } from "@tanstack/react-router";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

// ── Palette ────────────────────────────────────────────────────────────────
const BG = "oklch(97.5% 0.012 82)";
const SURF = "oklch(99.2% 0.006 76)";
const INK = "oklch(30% 0.022 64)";
const BODY = "oklch(38% 0.020 64)";
const INK2 = "oklch(48% 0.018 65)";
const META = "oklch(60% 0.016 66)";
const BORD = "oklch(88% 0.018 76)";
const XH = "oklch(79% 0.018 76)"; // crosshair color
const ACC = "oklch(60% 0.110 48)";
const SP = "cubic-bezier(0.22,1,0.36,1)";

// ── Type scale ─────────────────────────────────────────────────────────────
// Inter Variable: use extremes intentionally (200 = hairline, 560 = firm).
// No intermediate novelty weights.
const T = {
  display: {
    fontSize: "clamp(2.6rem, 4.5vw, 3.6rem)",
    fontWeight: 200,
    letterSpacing: "-0.048em",
    lineHeight: 0.96,
    color: INK,
  } as CSSProperties,
  section: {
    fontSize: "0.58rem",
    fontWeight: 500,
    letterSpacing: "0.06em",
    color: META,
    fontVariantNumeric: "tabular-nums",
  } as CSSProperties,
  heading: {
    fontSize: "0.92rem",
    fontWeight: 560,
    letterSpacing: "-0.018em",
    lineHeight: 1.22,
    color: INK,
  } as CSSProperties,
  body: { fontSize: "0.875rem", fontWeight: 350, lineHeight: 1.92, color: BODY } as CSSProperties,
  label: {
    fontSize: "0.57rem",
    fontWeight: 540,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: META,
  } as CSSProperties,
  small: { fontSize: "0.72rem", fontWeight: 400, color: INK2 } as CSSProperties,
  micro: {
    fontSize: "0.6rem",
    fontWeight: 450,
    letterSpacing: "0.02em",
    color: META,
  } as CSSProperties,
};

// ── Crosshair frame ─────────────────────────────────────────────────────────
const XH_SZ = 14; // arm span px — 7px extends in each direction from corner

function Xh({ c }: { c: "tl" | "tr" | "bl" | "br" }) {
  const t = c[0] === "t";
  const l = c[1] === "l";
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        [t ? "top" : "bottom"]: -(XH_SZ / 2),
        [l ? "left" : "right"]: -(XH_SZ / 2),
        width: XH_SZ,
        height: XH_SZ,
        pointerEvents: "none",
        zIndex: 2,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          height: "1px",
          background: XH,
          transform: "translateY(-50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          bottom: 0,
          width: "1px",
          background: XH,
          transform: "translateX(-50%)",
        }}
      />
    </div>
  );
}

function CardFrame({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ position: "relative", ...style }}>
      {(["tl", "tr", "bl", "br"] as const).map((c) => (
        <Xh key={c} c={c} />
      ))}
      {children}
    </div>
  );
}

// ── Section mark ─────────────────────────────────────────────────────────────
function SectionMark({ n }: { n: string }) {
  return <p style={{ ...T.section, margin: "0 0 14px" }}>{n}</p>;
}

// ── Scroll-reveal ───────────────────────────────────────────────────────────
function Reveal({
  delay = 0,
  style,
  children,
}: {
  delay?: number;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVis(true);
          obs.disconnect();
        }
      },
      { threshold: 0.04, rootMargin: "0px 0px -24px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "none" : "translateY(12px)",
        transition: `opacity 0.72s ${SP} ${delay}s, transform 0.72s ${SP} ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Waveform ────────────────────────────────────────────────────────────────
const HEIGHTS = [7, 12, 20, 15, 28, 10, 24, 17, 28, 7, 23, 14, 19, 9, 28, 13, 21, 16, 8, 22];

function Waveform({ active }: { active: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "3.5px",
        alignItems: "flex-end",
        height: "36px",
        justifyContent: "center",
      }}
    >
      {HEIGHTS.map((h, i) => (
        <div
          key={i}
          style={{
            width: "2.5px",
            height: `${h}px`,
            borderRadius: "2px",
            flexShrink: 0,
            background: active ? ACC : BORD,
            transformOrigin: "center bottom",
            transition: "background 0.3s ease",
            animation: active
              ? `ikWave ${(0.42 + (i % 5) * 0.09).toFixed(2)}s ease-in-out ${(i * 0.034).toFixed(2)}s infinite`
              : "none",
          }}
        />
      ))}
    </div>
  );
}

// ── Avatar schematic ─────────────────────────────────────────────────────────
function AvatarSVG({ animating }: { animating: boolean }) {
  return (
    <svg
      viewBox="0 0 160 220"
      width="120"
      height="165"
      style={{ display: "block", margin: "0 auto" }}
    >
      <circle cx={80} cy={27} r={18} fill={INK} />
      <rect x={60} y={48} width={40} height={50} rx={7} fill={INK} />
      <rect
        x={24}
        y={55}
        width={36}
        height={11}
        rx={5}
        fill={INK2}
        style={{
          transformBox: "fill-box",
          transformOrigin: "right center",
          transform: "rotate(10deg)",
        }}
      />
      <g
        style={{
          transformBox: "fill-box",
          transformOrigin: "0% 50%",
          animation: animating ? `ikSign 3.6s ${SP} forwards` : "none",
        }}
      >
        <rect x={100} y={55} width={36} height={11} rx={5} fill={INK2} />
        <rect
          x={119}
          y={61}
          width={25}
          height={9}
          rx={4}
          fill={INK}
          style={{
            transformBox: "fill-box",
            transformOrigin: "left center",
            transform: "rotate(-7deg)",
          }}
        />
      </g>
      <rect x={62} y={96} width={14} height={50} rx={6} fill={INK2} />
      <rect x={84} y={96} width={14} height={50} rx={6} fill={INK2} />
    </svg>
  );
}

// ── Hand tracking SVG ────────────────────────────────────────────────────────
function HandSVG() {
  const s = "oklch(62% 0.11 162)";
  const fingers = [
    { pts: "80,138 74,106 70,78", d: "0s" },
    { pts: "96,132 94,100 92,70", d: "0.11s" },
    { pts: "113,136 115,104 117,74", d: "0.22s" },
    { pts: "124,144 130,116 137,92", d: "0.34s" },
  ];
  return (
    <svg
      viewBox="0 0 200 240"
      preserveAspectRatio="xMidYMid meet"
      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    >
      <ellipse cx={100} cy={162} rx={30} ry={24} fill="none" stroke={s} strokeWidth={1.6} />
      <polyline
        points="72,152 56,130 46,114"
        fill="none"
        stroke={s}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      {fingers.map(({ pts, d }, i) => (
        <polyline
          key={i}
          points={pts}
          fill="none"
          stroke={s}
          strokeWidth={1.6}
          strokeLinecap="round"
          style={{ animation: `ikFinger 1.15s ease-in-out ${d} infinite` }}
        />
      ))}
      {[
        { cx: 80, cy: 138 },
        { cx: 96, cy: 132 },
        { cx: 113, cy: 136 },
        { cx: 124, cy: 144 },
      ].map(({ cx, cy }, i) => (
        <circle key={i} cx={cx} cy={cy} r={2.5} fill={s} />
      ))}
      <line
        x1={18}
        y1={90}
        x2={182}
        y2={90}
        stroke={s}
        strokeWidth={0.6}
        strokeDasharray="4 3"
        opacity={0.35}
        style={{ animation: "ikScan 2.3s ease-in-out infinite" }}
      />
    </svg>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
function LandingPage() {
  const [heroVis, setHeroVis] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHeroVis(true), 60);
    return () => clearTimeout(t);
  }, []);

  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const voiceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [avatarInput, setAvatarInput] = useState("Hello, my name is Ikiraro.");
  const [avatarAnim, setAvatarAnim] = useState(false);

  const [camActive, setCamActive] = useState(false);
  const [detectedSign, setDetectedSign] = useState("");
  const camInt = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const camStop = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      clearTimeout(voiceTimer.current);
      clearInterval(camInt.current);
      clearTimeout(camStop.current);
    },
    [],
  );

  const startVoice = () => {
    if (voiceActive) return;
    const text = "Hello, my name is Ikiraro.";
    setVoiceActive(true);
    setVoiceTranscript("");
    let i = 0;
    const tick = () => {
      if (i <= text.length) {
        setVoiceTranscript(text.slice(0, i++));
        voiceTimer.current = setTimeout(tick, 56 + Math.random() * 34);
      } else {
        voiceTimer.current = setTimeout(() => setVoiceActive(false), 1800);
      }
    };
    voiceTimer.current = setTimeout(tick, 420);
  };

  const triggerSign = () => {
    if (avatarAnim) return;
    setAvatarAnim(true);
    setTimeout(() => setAvatarAnim(false), 3600);
  };

  const startCamera = () => {
    if (camActive) return;
    setCamActive(true);
    setDetectedSign("");
    const signs = [
      "Hello",
      "Thank you",
      "Please",
      "My name",
      "Nice to meet you",
      "Good morning",
      "Yes",
      "Understand",
    ];
    let i = 0;
    setTimeout(() => {
      setDetectedSign(signs[0]);
      i = 1;
      camInt.current = setInterval(() => {
        setDetectedSign(signs[i++ % signs.length]);
      }, 2400);
      camStop.current = setTimeout(() => {
        clearInterval(camInt.current);
        setCamActive(false);
        setDetectedSign("");
      }, 18000);
    }, 1000);
  };

  const ht = (d: number, x?: CSSProperties): CSSProperties => ({
    opacity: heroVis ? 1 : 0,
    transform: heroVis ? "none" : "translateY(11px)",
    transition: `opacity 0.7s ${SP} ${d}s, transform 0.7s ${SP} ${d}s`,
    ...x,
  });

  const primaryBtn = (active: boolean): CSSProperties => ({
    padding: "7px 16px",
    borderRadius: "5px",
    fontSize: "0.75rem",
    fontWeight: 500,
    letterSpacing: "-0.01em",
    fontFamily: "inherit",
    cursor: active ? "default" : "pointer",
    transition: `all 0.2s ${SP}`,
    background: active ? "oklch(60% 0.110 48 / 0.09)" : INK,
    color: active ? ACC : BG,
    border: active ? `1px solid oklch(60% 0.110 48 / 0.25)` : "1px solid transparent",
  });

  return (
    <div
      style={{
        background: BG,
        color: INK,
        minHeight: "100vh",
        fontFamily: "'Inter Variable', system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes ikWave   { 0%,100%{transform:scaleY(0.18)} 50%{transform:scaleY(1)} }
        @keyframes ikSign   { 0%{transform:rotate(0deg)} 14%{transform:rotate(-60deg)} 48%{transform:rotate(-64deg)} 78%{transform:rotate(-18deg)} 100%{transform:rotate(0deg)} }
        @keyframes ikFinger { 0%,100%{transform:rotate(-4deg)} 50%{transform:rotate(4deg)} }
        @keyframes ikScan   { 0%{transform:translateY(0);opacity:.6} 80%{opacity:.4} 100%{transform:translateY(120px);opacity:0} }
        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes ikPulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.93)} }
        :root { --ik-px: 36px; }
        @media (max-width: 640px) { :root { --ik-px: 16px; } }
        .ik-col { max-width: 660px; margin: 0 auto; }
        @media (min-width: 1280px) { .ik-col { max-width: 780px; } }
        .ik-a { color: ${META}; text-decoration: none; transition: color 0.16s ease; }
        .ik-a:hover { color: ${INK}; }
        .ik-cta:hover { opacity: 0.72; }
        .ik-outline:hover { border-color: ${INK2} !important; }
        .ik-input:focus { border-color: ${ACC} !important; outline: none; }
      `}</style>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="ik-col" style={{ padding: "80px var(--ik-px) 88px" }}>
        <p style={ht(0, { ...T.micro, fontStyle: "italic", margin: "0 0 10px" })}>
          /ˌi-ki-ˈra-ro/ &thinsp;·&thinsp; n. &thinsp;·&thinsp; Kinyarwanda
        </p>

        <h1 style={ht(0.06, { ...T.display, margin: "0 0 56px" })}>Ikiraro</h1>

        {/* Definitions — no border, clean numbered list */}
        <div
          style={ht(0.16, {
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            marginBottom: "48px",
          })}
        >
          {[
            {
              n: "1",
              body: "A structure forming a passage between two separate banks.",
              sub: null,
              weight: 350,
            },
            {
              n: "2",
              body: "A connection enabling exchange between parties or systems.",
              sub: "(of communication) bridging the gap between spoken and signed language.",
              weight: 350,
            },
            {
              n: "3",
              body: null,
              sub: "Ikiraro — an accessibility engine that translates text and speech into sign language in real time.",
              weight: 450,
            },
          ].map(({ n, body, sub, weight }) => (
            <div key={n} style={{ display: "flex", gap: "16px" }}>
              <span style={{ ...T.section, paddingTop: "2px", minWidth: "12px", flexShrink: 0 }}>
                {n}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {body && <p style={{ ...T.body, fontWeight: weight, margin: 0 }}>{body}</p>}
                {sub && (
                  <p
                    style={{
                      ...T.body,
                      fontWeight: weight,
                      color: n === "3" ? INK : INK2,
                      margin: 0,
                    }}
                  >
                    {n === "2" && <span style={{ ...T.micro, marginRight: "8px" }}>b</span>}
                    {sub}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Feature badges */}
        <div style={ht(0.26, { display: "flex", flexWrap: "wrap", gap: "5px" })}>
          {["ASL", "Voice", "Hand tracking", "3D avatar", "Offline", "Browser-native", "MIT"].map(
            (l) => (
              <span
                key={l}
                style={{
                  padding: "3px 9px",
                  background: "oklch(95.8% 0.014 82)",
                  border: `1px solid ${BORD}`,
                  borderRadius: "4px",
                  ...T.micro,
                  letterSpacing: "0.01em",
                }}
              >
                {l}
              </span>
            ),
          )}
        </div>
      </section>

      {/* Single divider between hero and content */}
      <div className="ik-col" style={{ padding: "0 var(--ik-px)" }}>
        <div style={{ height: "1px", background: BORD }} />
      </div>

      {/* ── Intro ─────────────────────────────────────────────────────── */}
      <main className="ik-col" style={{ padding: "72px var(--ik-px) 112px" }}>
        <Reveal style={{ marginBottom: "20px" }}>
          <p style={T.body}>
            Sign language accessibility on the web has never been truly native. For years, the
            default was clips — pre-recorded video of someone signing a phrase, indexed by keyword.
            When a phrase wasn't in the library, there was silence. More sophisticated services
            moved to a server: send text up, receive a rendered animation back. This worked. With
            latency. With brittle connectivity requirements. With no way to compose, extend, or run
            offline.
          </p>
        </Reveal>
        <Reveal delay={0.08} style={{ marginBottom: "96px" }}>
          <p style={T.body}>
            Ikiraro moves the entire pipeline into the browser. A rigged 3D avatar driven by
            dual-spring kinematics renders American Sign Language at up to 60 frames per second. No
            server round-trips. No video library. No connection requirement past the initial load.
          </p>
        </Reveal>

        {/* ── 01 Voice ──────────────────────────────────────────────── */}
        <Reveal style={{ marginBottom: "32px" }}>
          <SectionMark n="01" />
          <h2 style={{ ...T.heading, margin: "0 0 20px" }}>Voice recognition</h2>
          <p style={{ ...T.body, marginBottom: "12px" }}>
            Ikiraro listens through the Web Speech API and feeds transcripts directly into a
            phoneme-to-gloss mapper — converting spoken English to ASL glosses, the structural units
            of signed sentences. From there, the physics engine builds the motion. From microphone
            to animation, the pipeline runs entirely in the browser.
          </p>
        </Reveal>

        <Reveal delay={0.06}>
          <CardFrame style={{ marginBottom: "96px" }}>
            <div
              style={{
                border: `1px solid ${BORD}`,
                borderRadius: "6px",
                background: SURF,
                padding: "24px var(--ik-px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "22px",
                }}
              >
                <p style={{ ...T.small, margin: 0 }}>Speak any English phrase.</p>
                <span style={T.label}>voice · demo</span>
              </div>
              <div style={{ marginBottom: "14px" }}>
                <Waveform active={voiceActive} />
              </div>
              <div
                style={{
                  minHeight: "42px",
                  marginBottom: "20px",
                  padding: "10px 12px",
                  background: BG,
                  borderRadius: "4px",
                  border: `1px solid ${BORD}`,
                }}
              >
                <span style={{ ...T.small, color: BODY }}>
                  {voiceTranscript}
                  {voiceActive && (
                    <span style={{ animation: "blink 0.9s step-end infinite", color: ACC }}>|</span>
                  )}
                </span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <button style={primaryBtn(voiceActive)} onClick={startVoice}>
                  {voiceActive ? "Listening…" : "Tap to speak"}
                </button>
                <span style={T.micro}>Web Speech API · 48 kHz</span>
              </div>
            </div>
          </CardFrame>
        </Reveal>

        {/* ── 02 Avatar ─────────────────────────────────────────────── */}
        <Reveal style={{ marginBottom: "32px" }}>
          <SectionMark n="02" />
          <h2 style={{ ...T.heading, margin: "0 0 20px" }}>3D avatar rendering</h2>
          <p style={{ ...T.body, marginBottom: "12px" }}>
            A complete humanoid skeleton with 52 individual joint targets, including every finger
            segment. Spring physics keep motion continuous — each joint has stiffness and damping
            tuned to feel like real human movement. Transitions between signs emerge from the
            physics, not from hand-keyed animation.
          </p>
          <p style={{ ...T.body, marginBottom: "0" }}>
            The translation layer maps English text to ASL grammar: reordering subject-object-verb
            structure, removing unnecessary articles, inserting non-manual markers for questions and
            negation.
          </p>
        </Reveal>

        <Reveal delay={0.06}>
          <CardFrame style={{ marginBottom: "96px" }}>
            <div
              style={{
                border: `1px solid ${BORD}`,
                borderRadius: "6px",
                background: SURF,
                padding: "24px var(--ik-px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "18px",
                }}
              >
                <p style={{ ...T.small, margin: 0 }}>Type any phrase to render.</p>
                <span style={T.label}>avatar · render</span>
              </div>
              <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
                <input
                  value={avatarInput}
                  onChange={(e) => setAvatarInput(e.target.value)}
                  className="ik-input"
                  placeholder="Enter a phrase…"
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    background: BG,
                    border: `1px solid ${BORD}`,
                    borderRadius: "4px",
                    ...T.small,
                    color: INK,
                    transition: "border-color 0.16s ease",
                    fontFamily: "inherit",
                  }}
                />
                <button style={primaryBtn(avatarAnim)} onClick={triggerSign}>
                  {avatarAnim ? "Rendering…" : "Render"}
                </button>
              </div>
              <div
                style={{
                  height: "190px",
                  backgroundColor: "oklch(96.8% 0.010 82)",
                  backgroundImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><line x1='10' y1='8' x2='10' y2='12' stroke='oklch(84%25 0.016 78)' stroke-width='0.5'/><line x1='8' y1='10' x2='12' y2='10' stroke='oklch(84%25 0.016 78)' stroke-width='0.5'/></svg>")`,
                  backgroundSize: "20px 20px",
                  borderRadius: "4px",
                  border: `1px solid ${BORD}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                  overflow: "hidden",
                }}
              >
                <AvatarSVG animating={avatarAnim} />
              </div>
              <span style={T.micro}>
                {avatarAnim
                  ? "60 fps · spring kinematics · GLTF · rendering"
                  : "60 fps · spring kinematics · GLTF · idle"}
              </span>
            </div>
          </CardFrame>
        </Reveal>

        {/* ── 03 Camera ─────────────────────────────────────────────── */}
        <Reveal style={{ marginBottom: "32px" }}>
          <SectionMark n="03" />
          <h2 style={{ ...T.heading, margin: "0 0 20px" }}>Sign recognition</h2>
          <p style={{ ...T.body, marginBottom: "0" }}>
            Camera input passes through a MediaPipe-based hand tracking model — extracting 21
            keypoints per hand inside a Web Worker. Those keypoints feed a classifier that maps pose
            vectors to ASL signs. The same engine that renders signs can recognize them. No images
            leave the device.
          </p>
        </Reveal>

        <Reveal delay={0.06}>
          <CardFrame style={{ marginBottom: "96px" }}>
            <div
              style={{
                border: `1px solid ${BORD}`,
                borderRadius: "6px",
                background: SURF,
                padding: "24px var(--ik-px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "18px",
                }}
              >
                <p style={{ ...T.small, margin: 0 }}>Enable your camera to begin.</p>
                <span style={T.label}>hand · tracking</span>
              </div>
              <div
                style={{
                  height: "206px",
                  background: "oklch(16% 0.012 58)",
                  borderRadius: "4px",
                  overflow: "hidden",
                  position: "relative",
                  marginBottom: "14px",
                }}
              >
                {!camActive ? (
                  <div
                    style={{
                      display: "flex",
                      height: "100%",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "16px",
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
                      <circle
                        cx={18}
                        cy={18}
                        r={10}
                        stroke="oklch(50% 0.010 60)"
                        strokeWidth={1.2}
                      />
                      <circle cx={18} cy={18} r={4} fill="oklch(50% 0.010 60)" />
                      <rect
                        x={12}
                        y={8}
                        width={12}
                        height={2.5}
                        rx={1.2}
                        fill="oklch(50% 0.010 60)"
                      />
                    </svg>
                    <button
                      onClick={startCamera}
                      style={{
                        padding: "6px 16px",
                        background: "oklch(96% 0.010 80)",
                        color: INK,
                        borderRadius: "4px",
                        border: `1px solid ${BORD}`,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        ...T.small,
                        transition: "opacity 0.16s ease",
                      }}
                    >
                      Enable camera
                    </button>
                  </div>
                ) : (
                  <div style={{ position: "relative", width: "100%", height: "100%" }}>
                    <HandSVG />
                  </div>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minHeight: "20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {detectedSign && (
                    <>
                      <span
                        style={{
                          width: "5px",
                          height: "5px",
                          background: "oklch(58% 0.12 162)",
                          borderRadius: "50%",
                          flexShrink: 0,
                          animation: "ikPulse 1.4s ease-in-out infinite",
                        }}
                      />
                      <span style={T.small}>
                        Detected:{" "}
                        <strong style={{ fontWeight: 560, color: INK }}>{detectedSign}</strong>
                      </span>
                    </>
                  )}
                </div>
                <span style={T.micro}>21 kp/hand · MediaPipe · worker</span>
              </div>
            </div>
          </CardFrame>
        </Reveal>

        {/* ── 04 Architecture ───────────────────────────────────────── */}
        <Reveal style={{ marginBottom: "32px" }}>
          <SectionMark n="04" />
          <h2 style={{ ...T.heading, margin: "0 0 20px" }}>A layered system</h2>
          <p style={{ ...T.body, marginBottom: "12px" }}>
            At the bottom sits a WebGL renderer managing the GLTF avatar and its skeleton. Above
            that, a physics tick at 60 Hz. The translation layer resolves text or voice to a
            sequence of timed motion targets, then hands those targets down to the physics engine. A
            plugin system at the top allows extensions to intercept at any layer.
          </p>
          <p style={{ ...T.body }}>
            Once loaded, Ikiraro requires no external requests. The avatar mesh, the translation
            dictionary, the physics engine — all bundled. The SDK tree-shakes to around 142 kB
            gzipped.
          </p>
        </Reveal>

        <Reveal delay={0.06} style={{ marginBottom: "96px" }}>
          {/* Architecture table — clean, no diagram chrome */}
          <div style={{ border: `1px solid ${BORD}`, borderRadius: "6px" }}>
            {[
              {
                layer: "Plugin system",
                detail: "intercept any layer, extend behaviour",
                borderBottom: true,
              },
              {
                layer: "Translation",
                detail: "text / voice → timed gloss sequence",
                borderBottom: true,
              },
              {
                layer: "Physics engine",
                detail: "dual-spring kinematics, 60 Hz fixed tick",
                borderBottom: true,
              },
              {
                layer: "WebGL renderer",
                detail: "GLTF mesh, 52 joint targets",
                borderBottom: false,
              },
            ].map(({ layer, detail, borderBottom }) => (
              <div
                key={layer}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  padding: "14px var(--ik-px)",
                  borderBottom: borderBottom ? `1px solid ${BORD}` : undefined,
                  gap: "12px",
                }}
              >
                <span style={{ ...T.small, color: INK, fontWeight: 500 }}>{layer}</span>
                <span style={{ ...T.small, color: INK2 }}>{detail}</span>
              </div>
            ))}
          </div>
        </Reveal>

        {/* ── Code ──────────────────────────────────────────────────── */}
        <Reveal style={{ marginBottom: "96px" }}>
          <pre
            style={{
              background: "oklch(98.5% 0.010 80)",
              border: `1px solid ${BORD}`,
              borderRadius: "6px",
              padding: "22px var(--ik-px)",
              overflowX: "auto",
              lineHeight: 1.82,
              margin: 0,
            }}
          >
            <code
              style={{
                fontFamily: "'Fira Code','Cascadia Code','Courier New',monospace",
                fontSize: "0.72rem",
                fontWeight: 400,
              }}
            >
              <span style={{ color: "oklch(50% 0.082 300)" }}>import</span>{" "}
              <span style={{ color: BODY }}>{"{ Ikiraro }"}</span>{" "}
              <span style={{ color: "oklch(50% 0.082 300)" }}>from</span>{" "}
              <span style={{ color: "oklch(48% 0.10 162)" }}>'@ikiraro/sdk'</span>
              <span style={{ color: BODY }}>;</span>
              {"\n\n"}
              <span style={{ color: "oklch(50% 0.082 300)" }}>const</span>{" "}
              <span style={{ color: BODY }}>bridge =</span>{" "}
              <span style={{ color: "oklch(50% 0.082 300)" }}>new</span>{" "}
              <span style={{ color: "oklch(50% 0.080 220)" }}>Ikiraro</span>
              <span style={{ color: BODY }}>{"({avatar:"}</span>
              <span style={{ color: "oklch(48% 0.10 162)" }}>'default'</span>
              <span style={{ color: BODY }}>{",fps:"}</span>
              <span style={{ color: "oklch(52% 0.09 38)" }}>60</span>
              <span style={{ color: BODY }}>{",offline:"}</span>
              <span style={{ color: "oklch(52% 0.09 38)" }}>true</span>
              <span style={{ color: BODY }}>{" });"}</span>
              {"\n\n"}
              <span style={{ color: "oklch(50% 0.082 300)" }}>await</span>{" "}
              <span style={{ color: BODY }}>bridge</span>
              <span style={{ color: "oklch(50% 0.080 220)" }}>.translate</span>
              <span style={{ color: BODY }}>{"("}</span>
              <span style={{ color: "oklch(48% 0.10 162)" }}>'Hello, my name is Ikiraro'</span>
              <span style={{ color: BODY }}>{");"}</span>
              {"\n\n"}
              <span style={{ color: "oklch(50% 0.082 300)" }}>const</span>{" "}
              <span style={{ color: BODY }}>session = bridge</span>
              <span style={{ color: "oklch(50% 0.080 220)" }}>.startListening</span>
              <span style={{ color: BODY }}>{"();"}</span>
              {"\n"}
              <span style={{ color: BODY }}>session</span>
              <span style={{ color: "oklch(50% 0.080 220)" }}>.on</span>
              <span style={{ color: BODY }}>{"("}</span>
              <span style={{ color: "oklch(48% 0.10 162)" }}>'sign'</span>
              <span style={{ color: BODY }}>{",g=>console"}</span>
              <span style={{ color: "oklch(50% 0.080 220)" }}>.log</span>
              <span style={{ color: BODY }}>{"(g));"}</span>
            </code>
          </pre>
        </Reveal>

        {/* ── Closing ───────────────────────────────────────────────── */}
        <Reveal style={{ marginBottom: "24px" }}>
          <SectionMark n="05" />
          <h2 style={{ ...T.heading, margin: "0 0 20px" }}>The rest is open</h2>
          <p style={{ ...T.body, marginBottom: "14px" }}>
            Sign language is a full language. It has grammar, regional dialects, and nuance that no
            SDK will fully capture in version one. Ikiraro doesn't attempt to solve all of that. It
            attempts to build a foundation — a primitive that runs in the browser, that developers
            can extend, that deaf users can trust.
          </p>
          <p style={T.body}>
            The codebase is MIT licensed and actively maintained. Contributions are welcome —
            especially around sign language linguistics, regional ASL variation, and accessibility
            testing with deaf communities.
          </p>
        </Reveal>

        <Reveal delay={0.1} style={{ display: "flex", gap: "10px", marginTop: "36px" }}>
          <a
            href="https://github.com/ikiraro"
            target="_blank"
            rel="noopener"
            className="ik-cta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "9px 20px",
              background: INK,
              color: BG,
              borderRadius: "5px",
              fontSize: "0.8rem",
              fontWeight: 500,
              letterSpacing: "-0.01em",
              textDecoration: "none",
              transition: "opacity 0.16s ease",
            }}
          >
            GitHub ↗
          </a>
          <Link
            to="/install"
            className="ik-outline"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "9px 20px",
              background: "transparent",
              color: INK,
              border: `1px solid ${BORD}`,
              borderRadius: "5px",
              fontSize: "0.8rem",
              fontWeight: 500,
              letterSpacing: "-0.01em",
              textDecoration: "none",
              transition: "border-color 0.16s ease",
            }}
          >
            Install
          </Link>
        </Reveal>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer
        className="ik-col"
        style={{ padding: "36px var(--ik-px) 48px", borderTop: `1px solid ${BORD}` }}
      >
        <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 560,
              color: INK,
              letterSpacing: "-0.018em",
              marginRight: "2px",
            }}
          >
            Ikiraro
          </span>
          {[
            { label: "GitHub ↗", href: "https://github.com/ikiraro", external: true },
            { label: "npm ↗", href: "https://npmjs.com/package/@ikiraro/sdk", external: true },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener"
              className="ik-a"
              style={T.small}
            >
              {label}
            </a>
          ))}
          <Link to="/playground" className="ik-a" style={T.small}>
            Playground
          </Link>
          <Link to="/docs" className="ik-a" style={T.small}>
            Docs
          </Link>
          <Link to="/install" className="ik-a" style={{ ...T.small, marginLeft: "auto" }}>
            Install →
          </Link>
        </div>
      </footer>
    </div>
  );
}
