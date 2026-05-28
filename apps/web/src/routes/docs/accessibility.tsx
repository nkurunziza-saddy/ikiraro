import { createFileRoute } from "@tanstack/react-router";
import {
  CodeBlock,
  PageTitle,
  SectionHead,
  RefTable,
  RefTableHead,
  RefRow,
  Callout,
} from "@/components/docs/primitives";

export const Route = createFileRoute("/docs/accessibility")({
  component: AccessibilityPage,
});

const SNIPPET_USE_MODE = `import { useAccessibilityMode } from "@ikiraro/sdk";

function AccessibilityToggle() {
  const { mode, setMode, isAvatarSuppressed, isTtsSuppressed } = useAccessibilityMode();

  return (
    <select value={mode} onChange={(e) => setMode(e.target.value as any)}>
      <option value="standard">Standard — all modalities</option>
      <option value="audio-first">Audio-first — avatar suppressed</option>
      <option value="visual-first">Visual-first — TTS suppressed</option>
      <option value="motor">Motor — single-key / switch scanning</option>
    </select>
  );
}

// Conditionally hide the avatar based on mode
{!isAvatarSuppressed && (
  <AvatarViewer envelope={snapshot.lastEnvelope} modelUrl="/models/avatar.glb" />
)}`;

const SNIPPET_MODE_MANAGER = `import { accessibilityMode } from "@ikiraro/sdk";

const manager = accessibilityMode(); // same as AccessibilityModeManager.getInstance()

manager.getMode();              // "standard" | "audio-first" | "visual-first" | "motor"
manager.setMode("audio-first");
manager.isAvatarSuppressed();   // true when mode === "audio-first"
manager.isTtsSuppressed();      // true when mode === "visual-first"

// Subscribe to changes
const unsub = manager.onModeChange((mode) => {
  console.log("Mode changed:", mode);
});
unsub(); // cleanup`;

const SNIPPET_AUDIO_QUEUE = `import { AudioQueue, WebSpeechProvider } from "@ikiraro/sdk";

const tts = WebSpeechProvider.getInstance();

// Initialize once — provide speak and cancel implementations
const queue = AudioQueue.getInstance(
  (text) => tts.speak(text),
  () => tts.cancel(),
);

// Fire-and-forget at different priorities
queue.speak("Hello world", "normal");
queue.speak("SYSTEM ALERT", "critical"); // interrupts everything immediately

// Awaitable — resolves when this message finishes speaking
await queue.speakAsync("Processing complete", "high");

// Utilities
queue.stop();           // cancel current + clear queue
queue.repeat();         // repeat last spoken message at "high" priority
queue.isSpeaking();     // boolean
queue.getLastMessage(); // string | null`;

const SNIPPET_EARCONS = `import { EarconPlayer } from "@ikiraro/sdk";

const earcons = EarconPlayer.getInstance();

earcons.play("focus");    // soft blip — navigating to an item
earcons.play("select");   // click — confirming a selection
earcons.play("success");  // ascending tones — action completed
earcons.play("error");    // descending tones — action failed
earcons.play("navigate"); // short swoosh — list navigation
earcons.play("open");     // rising ping — opening content
earcons.play("close");    // falling ping — closing content`;

const SNIPPET_SHORTCUTS = `import { AccessibilityShortcutManager, AudioQueue } from "@ikiraro/sdk";

const shortcuts = new AccessibilityShortcutManager({ doubleTapMs: 400 });

// Register a shortcut with optional double-tap action
shortcuts.register({
  key: "f",
  label: "Read",
  description: "Read current item aloud",
  action: () => queue.speak(currentLabel, "normal"),
  doubleTapAction: () => queue.speak(fullDescription, "normal"),
});

// Register multiple at once
shortcuts.registerMany([
  { key: "h", label: "Home",  description: "Go to home",      action: goHome },
  { key: "s", label: "Sign",  description: "Start signing",   action: startSign },
  { key: "r", label: "Repeat",description: "Repeat last TTS", action: () => queue.repeat() },
]);

shortcuts.mount();   // attach keydown listener to document
shortcuts.unmount(); // remove listener

// Focus tracking for screenreader-style navigation
shortcuts.setFocusedIndex(2);
shortcuts.onFocusChange((idx) => updateHighlight(idx));

// Help panel toggle
shortcuts.setHelpVisible(true);
shortcuts.onHelpToggle((visible) => setHelpOpen(visible));`;

const SNIPPET_ANNOUNCE_MODES = `// Announce mode changes to assistive tech
const isFirstRender = useRef(true);
useEffect(() => {
  if (isFirstRender.current) { isFirstRender.current = false; return; }
  const labels: Record<AccessibilityMode, string> = {
    standard:      "Standard mode. All modalities active.",
    "audio-first": "Audio-first mode. Sign avatar hidden.",
    "visual-first":"Visual-first mode. Text-to-speech disabled.",
    motor:         "Motor mode. Single-key navigation active.",
  };
  queue.speak(labels[mode], "critical");
}, [mode]);`;

function AccessibilityPage() {
  return (
    <div className="space-y-12">
      <PageTitle
        title="Accessibility System"
        subtitle="Four independent singletons handle multi-modal accessibility: a mode manager that suppresses channels, a priority audio queue for TTS, a synthesized earcon player, and a keyboard shortcut manager with double-tap support. All are exported from @ikiraro/sdk."
      />

      <section className="space-y-4">
        <SectionHead id="use-mode" label="useAccessibilityMode" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          React hook that subscribes to the active accessibility mode. Mode is persisted to{" "}
          <code className="font-mono text-foreground">localStorage</code> under the key{" "}
          <code className="font-mono text-foreground">ikiraro:accessibility-mode</code> and survives
          page reloads. Use <code className="font-mono text-foreground">isAvatarSuppressed</code>{" "}
          and <code className="font-mono text-foreground">isTtsSuppressed</code> to gate rendering.
        </p>
        <CodeBlock code={SNIPPET_USE_MODE} label="useAccessibilityMode" />
        <RefTable>
          <RefTableHead cols={["Field", "Type", "Description"]} />
          <RefRow
            name="mode"
            type="AccessibilityMode"
            desc='Current mode: "standard" | "audio-first" | "visual-first" | "motor".'
          />
          <RefRow
            name="setMode"
            type="(mode) => void"
            desc="Change the active mode. Persists to localStorage and triggers onModeChange subscribers."
          />
          <RefRow
            name="isAvatarSuppressed"
            type="boolean"
            desc='True when mode is "audio-first". Use to conditionally render AvatarViewer.'
          />
          <RefRow
            name="isTtsSuppressed"
            type="boolean"
            desc='True when mode is "visual-first". Use to gate AudioQueue.speak() calls.'
          />
        </RefTable>
        <RefTable>
          <RefTableHead cols={["Mode", "Description"]} />
          <RefRow
            name="standard"
            desc="All modalities active. TTS + sign avatar both play. Default."
          />
          <RefRow
            name="audio-first"
            desc="Sign avatar suppressed. For users who rely entirely on screen readers or TTS."
          />
          <RefRow
            name="visual-first"
            desc="TTS suppressed. For users in environments where audio is unavailable."
          />
          <RefRow
            name="motor"
            desc="Single-key / switch scanning navigation. Pairs with AccessibilityShortcutManager."
          />
        </RefTable>
      </section>

      <section className="space-y-4">
        <SectionHead id="mode-manager" label="AccessibilityModeManager" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          The singleton behind{" "}
          <code className="font-mono text-foreground">useAccessibilityMode</code>. Use it outside
          React for imperative mode control or in vanilla JS contexts.
        </p>
        <CodeBlock code={SNIPPET_MODE_MANAGER} label="AccessibilityModeManager" />
      </section>

      <section className="space-y-4">
        <SectionHead id="audio-queue" label="AudioQueue" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          A priority TTS queue that manages concurrent speech requests. Higher-priority messages
          preempt lower ones; <code className="font-mono text-foreground">critical</code> interrupts
          immediately. Initialize once at module level by passing your speak/cancel implementations.
        </p>
        <CodeBlock code={SNIPPET_AUDIO_QUEUE} label="AudioQueue" />
        <RefTable>
          <RefTableHead cols={["Priority", "Description"]} />
          <RefRow name="low" desc="Dropped if anything else is queued or currently speaking." />
          <RefRow name="normal" desc="Plays in order, waits its turn." />
          <RefRow
            name="high"
            desc="Interrupts normal/low items; skips lower-priority queued items."
          />
          <RefRow
            name="critical"
            desc="Interrupts everything immediately. Use for mode changes and errors."
          />
        </RefTable>
        <Callout>
          <code className="font-mono text-foreground">AudioQueue.getInstance()</code> must be called
          with <code className="font-mono text-foreground">speakFn</code> and{" "}
          <code className="font-mono text-foreground">cancelFn</code> on first initialization.
          Subsequent calls with no arguments return the existing instance. Initialize early — before
          any component that calls <code className="font-mono text-foreground">queue.speak()</code>.
        </Callout>
      </section>

      <section className="space-y-4">
        <SectionHead id="earcons" label="EarconPlayer" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          Synthesized audio cues generated via the Web Audio API — no audio files required. Earcons
          are automatically suppressed in{" "}
          <code className="font-mono text-foreground">visual-first</code> mode.
        </p>
        <CodeBlock code={SNIPPET_EARCONS} label="EarconPlayer" />
        <RefTable>
          <RefTableHead cols={["Earcon", "Description"]} />
          <RefRow name="focus" desc="Soft blip — navigating to an item in a list or grid." />
          <RefRow name="select" desc="Click tone — confirming a selection." />
          <RefRow name="success" desc="Ascending tones — action completed successfully." />
          <RefRow name="error" desc="Descending tones — action failed or is invalid." />
          <RefRow name="navigate" desc="Short swoosh — moving between sections." />
          <RefRow name="open" desc="Rising ping — opening a panel, modal, or content." />
          <RefRow name="close" desc="Falling ping — closing a panel or dismissing content." />
        </RefTable>
      </section>

      <section className="space-y-4">
        <SectionHead id="shortcuts" label="AccessibilityShortcutManager" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          A keyboard shortcut manager with double-tap detection, focus tracking, and an optional
          help panel toggle. Designed for motor accessibility — pairs with{" "}
          <code className="font-mono text-foreground">motor</code> mode but works in any mode.
        </p>
        <CodeBlock code={SNIPPET_SHORTCUTS} label="AccessibilityShortcutManager" />
        <RefTable>
          <RefTableHead cols={["Method", "Description"]} />
          <RefRow
            name="register(config)"
            desc="Register a single shortcut. Returns an unsubscribe function."
          />
          <RefRow name="registerMany(configs)" desc="Register multiple shortcuts at once." />
          <RefRow
            name="mount()"
            desc="Attach the keydown listener to document. Call after shortcuts are registered."
          />
          <RefRow name="unmount()" desc="Remove the keydown listener." />
          <RefRow
            name="setFocusedIndex(n)"
            desc="Set the currently focused item index for screenreader-style navigation."
          />
          <RefRow
            name="onFocusChange(cb)"
            desc="Subscribe to focus index changes. Returns an unsubscribe function."
          />
          <RefRow name="setHelpVisible(bool)" desc="Show or hide the shortcuts help panel." />
          <RefRow name="onHelpToggle(cb)" desc="Subscribe to help panel visibility changes." />
        </RefTable>
      </section>

      <section className="space-y-4">
        <SectionHead id="patterns" label="Common patterns" />
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          Announce mode changes via <code className="font-mono text-foreground">AudioQueue</code> at{" "}
          <code className="font-mono text-foreground">critical</code> priority so screen readers
          hear the transition even when the mode switches to audio-first.
        </p>
        <CodeBlock code={SNIPPET_ANNOUNCE_MODES} label="mode change announcement" />
      </section>
    </div>
  );
}
