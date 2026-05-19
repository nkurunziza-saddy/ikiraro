/* ============ App: Tweaks panel + name swap + body classes ============ */

function AriaTweaksApp() {
  const { TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakText, TweakColor, TweakSelect } =
    window;
  const [t, setTweak] = window.useTweaks(window.TWEAK_DEFAULTS);

  // Live-apply: swap brand name everywhere data-brand-name appears.
  React.useEffect(() => {
    const isUpper = (s) => s === s.toUpperCase();
    document.querySelectorAll("[data-brand-name]").forEach((el) => {
      const cur = el.textContent.trim();
      // Preserve trailing punctuation like "_"
      const m = cur.match(/^(.*?)([_.…]*)$/);
      const trail = m ? m[2] : "";
      const base = isUpper(m ? m[1] : cur) ? t.brandName.toUpperCase() : t.brandName;
      el.textContent = base + trail;
    });
    // Update document title and notify the demo widget.
    document.title = `${t.brandName} — Accessibility for the open web`;
    window.currentBrandName = t.brandName;
    window.dispatchEvent(new CustomEvent("brandname-change"));
  }, [t.brandName]);

  // Live-apply hero headline
  React.useEffect(() => {
    // Skip — the editorial hero markup has special structure (swash, em, br)
    // that we don't want to clobber with a flat string.
  }, [t.heroHeadline]);

  // Stripe / density toggles
  React.useEffect(() => {
    document.body.classList.toggle("no-stripe", !t.showStripe);
    document.body.classList.toggle("dense", !!t.dense);
  }, [t.showStripe, t.dense]);

  // Primary color
  React.useEffect(() => {
    document.documentElement.style.setProperty("--primary", t.primary);
    // Pick a deeper tone automatically (10% darker hex)
    document.documentElement.style.setProperty("--link", t.primary);
  }, [t.primary]);

  // Hide hero annotations
  React.useEffect(() => {
    document.querySelectorAll(".hero-anno").forEach((el) => {
      el.style.display = t.showAnnotations ? "" : "none";
    });
  }, [t.showAnnotations]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Brand">
        <TweakSelect
          label="Product name"
          value={t.brandName}
          onChange={(v) => setTweak("brandName", v)}
          options={[
            { value: "Aria", label: "Aria — W3C nod" },
            { value: "Sensa", label: "Sensa — your idea" },
            { value: "Lume", label: "Lume — light/illuminate" },
            { value: "Cove", label: "Cove — shelter" },
            { value: "Mira", label: "Mira — to see" },
            { value: "Reach", label: "Reach — direct" },
          ]}
        />
        <TweakColor
          label="Primary accent"
          value={t.primary}
          onChange={(v) => setTweak("primary", v)}
          options={["#E85D2F", "#0F766E", "#7C3AED", "#1E40AF", "#111111"]}
        />
      </TweakSection>

      <TweakSection label="Hero">
        <TweakText
          label="Headline"
          value={t.heroHeadline}
          onChange={(v) => setTweak("heroHeadline", v)}
        />
        <TweakToggle
          label="Floating annotations"
          value={t.showAnnotations}
          onChange={(v) => setTweak("showAnnotations", v)}
        />
      </TweakSection>

      <TweakSection label="Layout">
        <TweakToggle
          label="Sunset stripe at footer"
          value={t.showStripe}
          onChange={(v) => setTweak("showStripe", v)}
        />
        <TweakRadio
          label="Density"
          value={t.dense ? "dense" : "airy"}
          onChange={(v) => setTweak("dense", v === "dense")}
          options={[
            { value: "airy", label: "Airy" },
            { value: "dense", label: "Dense" },
          ]}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

// Mount demo widget
const demoMount = document.getElementById("demo-mount");
if (demoMount && window.AriaDemo) {
  ReactDOM.createRoot(demoMount).render(<window.AriaDemo />);
}

// Mount tweaks (creates its own portal root)
const tweaksMount = document.createElement("div");
document.body.appendChild(tweaksMount);
ReactDOM.createRoot(tweaksMount).render(<AriaTweaksApp />);
