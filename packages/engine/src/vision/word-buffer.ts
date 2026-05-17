import type { BufferState, WordBufferOptions, WordBufferContext } from "./types";

export const DOUBLE_LETTER_HOLD_MS = 1500;

export class WordBuffer {
  private currentWord = "";
  private sentence: string[] = [];
  private lastSign: string | null = null;
  private lastSignTime = 0;
  private lastInitialSignTime = 0;
  private doubleLetterCommitted = false;
  private options: WordBufferOptions;
  private lastGestureTime = 0;

  constructor(options: Partial<WordBufferOptions> = {}) {
    this.options = {
      pauseThresholdMs: 1000,
      minSignDurationMs: 200,
      ...options,
    };
  }

  /**
   * Updates the buffer with a new sign and its temporal context.
   *
   * @param sign - The currently detected sign (or null if none).
   * @param context - Additional context (transitions, gestures, confidence).
   * @returns The committed word if a pause threshold was met, otherwise null.
   */
  update(sign: string | null, context: WordBufferContext = {}): string | null {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();

    // Ignore signs during active transitions to prevent 'glitch' letters.
    if (context.isTransitioning && sign !== this.lastSign) {
      return null;
    }

    // Detect double letters via explicit gestures (Slide or Bounce)
    if (
      sign &&
      sign === this.lastSign &&
      context.gesture !== "none" &&
      now - this.lastGestureTime > 500 // Debounce gestures
    ) {
      this.currentWord += sign;
      this.lastGestureTime = now;
      this.doubleLetterCommitted = true;
      this.lastSignTime = now;
      return null;
    }

    if (sign && sign !== this.lastSign) {
      // New sign detected: enforce minimum duration to filter out noise.
      if (now - this.lastSignTime > this.options.minSignDurationMs) {
        this.currentWord += sign;
        this.lastSign = sign;
        this.lastSignTime = now;
        this.lastInitialSignTime = now;
        this.doubleLetterCommitted = false;
      }
      return null;
    }

    if (sign && sign === this.lastSign) {
      // Sustaining same sign: handle fallback time-based double letter.
      if (!this.doubleLetterCommitted && now - this.lastInitialSignTime > DOUBLE_LETTER_HOLD_MS) {
        this.currentWord += sign;
        this.doubleLetterCommitted = true;
      }
      this.lastSignTime = now;
      return null;
    }

    // Word boundary: committed after a sufficient pause.
    if (this.currentWord && now - this.lastSignTime > this.options.pauseThresholdMs) {
      return this.commitWord();
    }

    return null;
  }

  forceCommit(): string | null {
    return this.commitWord();
  }

  private commitWord(): string | null {
    if (!this.currentWord) return null;
    const word = this.currentWord;
    this.sentence.push(word);
    this.currentWord = "";
    this.lastSign = null;
    this.doubleLetterCommitted = false;
    return word;
  }

  backspace(): void {
    if (this.currentWord.length > 0) {
      this.currentWord = this.currentWord.slice(0, -1);
    }
  }

  overrideLastSign(sign: string): void {
    if (this.currentWord.length > 0) {
      this.currentWord = this.currentWord.slice(0, -1) + sign;
    } else {
      this.currentWord = sign;
    }
  }

  getState(): BufferState {
    return {
      currentWord: this.currentWord,
      sentence: [...this.sentence],
      sentenceText: [...this.sentence, this.currentWord].filter(Boolean).join(" "),
    };
  }

  getSentenceText(): string {
    return [...this.sentence, this.currentWord].filter(Boolean).join(" ");
  }

  getSentence(): string[] {
    return [...this.sentence];
  }

  getCurrentWord(): string {
    return this.currentWord;
  }

  clear(): void {
    this.currentWord = "";
    this.lastSign = null;
    this.lastSignTime = 0;
    this.doubleLetterCommitted = false;
  }

  clearAll(): void {
    this.currentWord = "";
    this.sentence = [];
    this.lastSign = null;
    this.lastSignTime = 0;
    this.doubleLetterCommitted = false;
  }
}
