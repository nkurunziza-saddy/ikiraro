import { AccessibilityModeManager } from "./mode-manager";
import type { EarconType } from "./types";

interface ToneSpec {
  frequency: number;
  duration: number;
  type: OscillatorType;
  gain: number;
}

interface EarconSpec {
  tones: ToneSpec[];
  /** Gap between tones in ms. 0 = play simultaneously. */
  gap?: number;
}

const EARCON_SPECS: Record<EarconType, EarconSpec> = {
  focus: {
    tones: [{ frequency: 880, duration: 60, type: "sine", gain: 0.12 }],
  },
  select: {
    tones: [{ frequency: 1200, duration: 45, type: "square", gain: 0.08 }],
  },
  navigate: {
    tones: [
      { frequency: 660, duration: 40, type: "sine", gain: 0.1 },
      { frequency: 880, duration: 40, type: "sine", gain: 0.1 },
    ],
    gap: 35,
  },
  open: {
    tones: [
      { frequency: 523, duration: 60, type: "sine", gain: 0.12 },
      { frequency: 784, duration: 60, type: "sine", gain: 0.12 },
      { frequency: 1047, duration: 80, type: "sine", gain: 0.12 },
    ],
    gap: 50,
  },
  close: {
    tones: [
      { frequency: 1047, duration: 60, type: "sine", gain: 0.12 },
      { frequency: 784, duration: 60, type: "sine", gain: 0.12 },
      { frequency: 523, duration: 80, type: "sine", gain: 0.12 },
    ],
    gap: 50,
  },
  success: {
    tones: [
      { frequency: 523, duration: 80, type: "sine", gain: 0.14 },
      { frequency: 659, duration: 80, type: "sine", gain: 0.14 },
      { frequency: 784, duration: 100, type: "sine", gain: 0.14 },
    ],
    gap: 55,
  },
  error: {
    tones: [
      { frequency: 440, duration: 80, type: "sawtooth", gain: 0.1 },
      { frequency: 330, duration: 80, type: "sawtooth", gain: 0.1 },
      { frequency: 220, duration: 120, type: "sawtooth", gain: 0.1 },
    ],
    gap: 55,
  },
};

/**
 * Plays synthesized audio cues (earcons) using the Web Audio API.
 * No audio files — all tones are generated on the fly.
 *
 * Earcons are suppressed in visual-first mode (deaf users don't need audio cues).
 */
export class EarconPlayer {
  private static instance: EarconPlayer | null = null;
  private ctx: AudioContext | null = null;

  private constructor() {}

  static getInstance(): EarconPlayer {
    if (!EarconPlayer.instance) {
      EarconPlayer.instance = new EarconPlayer();
    }
    return EarconPlayer.instance;
  }

  /**
   * Play the named earcon. Safe to call at any time — silently no-ops when
   * the Web Audio API is unavailable or in visual-first mode.
   */
  play(type: EarconType): void {
    if (AccessibilityModeManager.getInstance().isTtsSuppressed()) return;
    if (typeof window === "undefined") return;

    this.ensureContext();
    if (!this.ctx) return;

    const spec = EARCON_SPECS[type];
    const ctx = this.ctx;

    if (ctx.state === "suspended") {
      ctx.resume().then(() => this.scheduleTones(ctx, spec));
    } else {
      this.scheduleTones(ctx, spec);
    }
  }

  private ensureContext(): void {
    if (!this.ctx) {
      try {
        this.ctx = new (
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        )();
      } catch {
        // AudioContext unavailable (SSR, old browser)
      }
    }
  }

  private scheduleTones(ctx: AudioContext, spec: EarconSpec): void {
    const gap = spec.gap ?? 0;
    let offset = ctx.currentTime + 0.01;

    for (const tone of spec.tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = tone.type;
      osc.frequency.setValueAtTime(tone.frequency, offset);

      gain.gain.setValueAtTime(0, offset);
      gain.gain.linearRampToValueAtTime(tone.gain, offset + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, offset + tone.duration / 1000);

      osc.start(offset);
      osc.stop(offset + tone.duration / 1000 + 0.01);

      offset += tone.duration / 1000 + gap / 1000;
    }
  }

  static reset(): void {
    EarconPlayer.instance?.ctx?.close().catch(() => {});
    EarconPlayer.instance = null;
  }
}
