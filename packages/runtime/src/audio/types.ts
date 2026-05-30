/**
 * Accessibility mode controls which modalities are active.
 *
 * - standard:     All modalities on (sign avatar + TTS + visuals).
 * - audio-first:  Sign avatar suppressed. TTS is primary output. For blind users.
 * - visual-first: TTS suppressed. Sign avatar + visuals are primary. For deaf users.
 * - visual-first: TTS suppressed. Sign avatar + visuals are primary. For deaf users.
 */
export type AccessibilityMode = "standard" | "audio-first" | "visual-first";

/**
 * Priority levels for the audio queue.
 * Higher priority messages interrupt lower ones.
 *
 * - critical: System alerts — interrupt everything immediately.
 * - high:     Agent responses — interrupt normal/low.
 * - normal:   Navigation announcements — play in order.
 * - low:      Ambient hints — skip if anything else is queued.
 */
export type AudioPriority = "critical" | "high" | "normal" | "low";

/**
 * Named earcon events for synthesized audio cues.
 */
export type EarconType =
  | "focus" // soft blip when navigating to an item
  | "select" // click-like when confirming a selection
  | "success" // ascending tones — action completed
  | "error" // descending tones — action failed
  | "navigate" // short swoosh — list navigation
  | "open" // rising ping — opening content
  | "close"; // falling ping — closing content

export interface QueuedMessage {
  text: string;
  priority: AudioPriority;
  id: string;
  onDone?: () => void;
}

export interface ShortcutSpec {
  /** Lowercase key value from KeyboardEvent.key (e.g. "f", "h", "backspace", "arrowdown"). */
  key: string;
  /** Short human-readable label shown in the shortcuts panel. */
  label: string;
  /** Description shown next to the label. */
  description: string;
  /** Called on single press. */
  action: () => void;
  /** Called when the same key is pressed twice within 400 ms. */
  doubleTapAction?: () => void;
  /** If true, fires even when an INPUT or TEXTAREA has focus. Default false. */
  allowInInput?: boolean;
}

export interface AccessibilityShortcutManagerOptions {
  /** Time window in ms for double-tap detection. Default: 400. */
  doubleTapMs?: number;
}
