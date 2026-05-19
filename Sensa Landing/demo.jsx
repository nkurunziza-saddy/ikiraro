/* ============ Aria Live Demo Widget ============ */
/* The interactive toolbar + sample article. Users flip switches in the side
   panel and the demo-stage updates in real time. Also drives the in-stage
   floating toolbar so the two stay in sync. */

const FEATURES = [
  { id: "read", label: "Read aloud", desc: "Neural text-to-speech", icon: "speaker" },
  { id: "voice", label: "Voice control", desc: "Speak to navigate", icon: "mic" },
  { id: "captions", label: "Live captions", desc: "Subtitles for any media", icon: "cc" },
  { id: "magnify", label: "Magnifier", desc: "110 – 400% zoom", icon: "search" },
  { id: "contrast", label: "High contrast", desc: "Dark-on-light reverse", icon: "contrast" },
  { id: "dyslexia", label: "Reading font", desc: "Lexend, wider tracking", icon: "type" },
  { id: "larger", label: "Larger text", desc: "Bumps everything ~20%", icon: "plus" },
  { id: "focus", label: "Line focus", desc: "Spotlight one block", icon: "focus" },
  { id: "simplify", label: "Simplify", desc: "Plain-language rewrite", icon: "leaf" },
];

const ICON_PATHS = {
  speaker: (
    <>
      <polygon
        points="11 5 6 9 2 9 2 15 6 15 11 19"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M19 12a7 7 0 0 0-3-5.8M16 8.2a3.5 3.5 0 0 1 0 7.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </>
  ),
  mic: (
    <>
      <rect
        x="9"
        y="3"
        width="6"
        height="11"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M19 11a7 7 0 0 1-14 0M12 18v3" fill="none" stroke="currentColor" strokeWidth="2" />
    </>
  ),
  cc: (
    <>
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 10a2 2 0 1 0 0 4M16 10a2 2 0 1 0 0 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.5-3.5" fill="none" stroke="currentColor" strokeWidth="2" />
    </>
  ),
  contrast: (
    <>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 3v18a9 9 0 0 0 0-18Z" fill="currentColor" />
    </>
  ),
  type: (
    <>
      <path d="M5 5h14M12 5v14M7 19h10" fill="none" stroke="currentColor" strokeWidth="2" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" />
    </>
  ),
  focus: (
    <>
      <rect
        x="3"
        y="9"
        width="18"
        height="6"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M3 3h4M21 3h-4M3 21h4M21 21h-4" fill="none" stroke="currentColor" strokeWidth="2" />
    </>
  ),
  leaf: (
    <>
      <path
        d="M5 19c0-8 7-14 14-14 0 8-6 14-14 14ZM5 19l5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </>
  ),
};

const Icon = ({ name, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    {ICON_PATHS[name]}
  </svg>
);

const CAPTION_LOOP_TPL = [
  (b) => `${b} reads the page aloud in 38 languages.`,
  () => 'Try saying: "Add to cart" or "Find a cheaper one."',
  () => "Every irreversible action waits for your confirmation.",
  () => "We don't send anything you say back to our servers.",
];

const VOICE_LOOP = ["Listening…", '"Open the product…"', '"Add to cart."', "Confirming purchase…"];

function useBrandName() {
  const [name, setName] = React.useState(window.currentBrandName || "Sensa");
  React.useEffect(() => {
    const handler = () => setName(window.currentBrandName || "Sensa");
    window.addEventListener("brandname-change", handler);
    return () => window.removeEventListener("brandname-change", handler);
  }, []);
  return name;
}

function AriaDemo() {
  const brand = useBrandName();
  const CAPTION_LOOP = CAPTION_LOOP_TPL.map((fn) => fn(brand));
  const [on, setOn] = React.useState({
    read: false,
    voice: false,
    captions: true,
    magnify: false,
    contrast: false,
    dyslexia: true,
    larger: false,
    focus: false,
    simplify: false,
  });
  const [captionIdx, setCaptionIdx] = React.useState(0);
  const [voiceIdx, setVoiceIdx] = React.useState(0);

  const toggle = (id) => setOn((o) => ({ ...o, [id]: !o[id] }));

  React.useEffect(() => {
    if (!on.captions) return;
    const t = setInterval(() => setCaptionIdx((i) => (i + 1) % CAPTION_LOOP.length), 2600);
    return () => clearInterval(t);
  }, [on.captions]);

  React.useEffect(() => {
    if (!on.voice) return;
    const t = setInterval(() => setVoiceIdx((i) => (i + 1) % VOICE_LOOP.length), 1800);
    return () => clearInterval(t);
  }, [on.voice]);

  const stageClasses = ["demo-stage", on.magnify && "f-magnify"].filter(Boolean).join(" ");

  const articleClasses = [
    "demo-article",
    on.dyslexia && "f-dyslexia",
    on.contrast && "f-contrast",
    on.larger && "f-larger",
    on.focus && "f-focus",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="demo">
      <div className="demo-side">
        <h4 className="t-h5">Toolbar</h4>
        <p className="t-caption" style={{ color: "var(--steel)", margin: "0 0 12px" }}>
          The same panel your users see. Flip switches to apply.
        </p>
        {FEATURES.map((f) => (
          <div className="toggle-row" key={f.id}>
            <div className="meta">
              <div className="icon">
                <Icon name={f.icon} />
              </div>
              <div>
                <div className="lbl">{f.label}</div>
                <div className="desc">{f.desc}</div>
              </div>
            </div>
            <button
              className={`switch ${on[f.id] ? "on" : ""}`}
              aria-pressed={on[f.id]}
              aria-label={`Toggle ${f.label}`}
              onClick={() => toggle(f.id)}
            />
          </div>
        ))}
      </div>

      <div className={stageClasses}>
        <div className="demo-toolbar" role="toolbar" aria-label="Aria toolbar">
          {FEATURES.slice(0, 7).map((f) => (
            <button
              key={f.id}
              className={on[f.id] ? "on" : ""}
              aria-pressed={on[f.id]}
              aria-label={f.label}
              title={f.label}
              onClick={() => toggle(f.id)}
            >
              <Icon name={f.icon} size={15} />
            </button>
          ))}
        </div>

        <div className={articleClasses}>
          <div className="t-eyebrow" style={{ marginBottom: 10 }}>
            Product · Halo&nbsp;65" OLED&nbsp;TV
          </div>
          <h3 className="focus-target">
            {on.simplify
              ? "A big TV with great picture and sound."
              : 'A 65" OLED panel that makes everything you watch look hand-painted.'}
          </h3>
          <p className="focus-target">
            {on.simplify
              ? "It comes in two years. You can buy it now. It costs less than before."
              : "Perfect blacks, 144&nbsp;Hz, two-year warranty, and a Dolby Atmos soundbar bundled in. Free shipping by Friday."}
          </p>
          <div className="price-row">
            <div className="price focus-target">$1,399</div>
            <div className="strike">$1,899</div>
            <span className="badge badge-orange">26% off</span>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <button className="btn btn-primary">Add to cart</button>
            <button className="btn btn-secondary">Save for later</button>
          </div>
        </div>

        <div className={`demo-caption-bar ${on.captions ? "on" : ""}`}>
          <span className="cc">CC</span>
          <span className="text">{CAPTION_LOOP[captionIdx]}</span>
        </div>
        <div className={`demo-voice-bar ${on.voice ? "on" : ""}`}>
          <span className="dot"></span>
          <span>{VOICE_LOOP[voiceIdx]}</span>
        </div>
      </div>
    </div>
  );
}

window.AriaDemo = AriaDemo;
