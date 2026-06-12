# Accessibility System

Four independent singletons handle multi-modal accessibility: a mode manager that suppresses channels, a priority audio queue for TTS, a synthesized earcon player, and a keyboard shortcut manager with double-tap support. All are exported from `@ikiraro/sdk`.

## useAccessibilityMode

React hook that subscribes to the active accessibility mode. Mode is persisted to `localStorage` under the key `ikiraro:accessibility-mode` and survives page reloads. Use `isAvatarSuppressed` and `isTtsSuppressed` to gate rendering.

```tsx
import { useAccessibilityMode } from "@ikiraro/sdk";

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
)}
```

- **standard**: All modalities active. TTS + sign avatar both play. Default.
- **audio-first**: Sign avatar suppressed. For users who rely entirely on screen readers or TTS.
- **visual-first**: TTS suppressed. For users in environments where audio is unavailable.
- **motor**: Single-key / switch scanning navigation. Pairs with AccessibilityShortcutManager.

## AccessibilityModeManager

The singleton behind `useAccessibilityMode`. Use it outside React for imperative mode control or in vanilla JS contexts.

```ts
import { accessibilityMode } from "@ikiraro/sdk";

const manager = accessibilityMode(); // same as AccessibilityModeManager.getInstance()

manager.getMode();              // "standard" | "audio-first" | "visual-first" | "motor"
manager.setMode("audio-first");
manager.isAvatarSuppressed();   // true when mode === "audio-first"
manager.isTtsSuppressed();      // true when mode === "visual-first"

// Subscribe to changes
const unsub = manager.onModeChange((mode) => {
  console.log("Mode changed:", mode);
});
unsub(); // cleanup
```

## AudioQueue

A priority TTS queue that manages concurrent speech requests. Higher-priority messages preempt lower ones; `critical` interrupts immediately. Initialize once at module level by passing your speak/cancel implementations.

```ts
import { AudioQueue, WebSpeechProvider } from "@ikiraro/sdk";

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
queue.getLastMessage(); // string | null
```

- **low**: Dropped if anything else is queued or currently speaking.
- **normal**: Plays in order, waits its turn.
- **high**: Interrupts normal/low items; skips lower-priority queued items.
- **critical**: Interrupts everything immediately. Use for mode changes and errors.

## EarconPlayer

Synthesized audio cues generated via the Web Audio API — no audio files required. Earcons are automatically suppressed in `visual-first` mode.

```ts
import { EarconPlayer } from "@ikiraro/sdk";

const earcons = EarconPlayer.getInstance();

earcons.play("focus");    // soft blip — navigating to an item
earcons.play("select");   // click — confirming a selection
earcons.play("success");  // ascending tones — action completed
earcons.play("error");    // descending tones — action failed
earcons.play("navigate"); // short swoosh — list navigation
earcons.play("open");     // rising ping — opening content
earcons.play("close");    // falling ping — closing content
```

## AccessibilityShortcutManager

A keyboard shortcut manager with double-tap detection, focus tracking, and an optional help panel toggle. Designed for motor accessibility — pairs with `motor` mode but works in any mode.

```ts
import { AccessibilityShortcutManager, AudioQueue } from "@ikiraro/sdk";

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
shortcuts.onHelpToggle((visible) => setHelpOpen(visible));
```

## Common patterns

Announce mode changes via `AudioQueue` at `critical` priority so screen readers hear the transition even when the mode switches to audio-first.

```tsx
// Announce mode changes to assistive tech
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
}, [mode]);
```
