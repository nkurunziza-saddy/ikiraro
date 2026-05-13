export interface WordBufferOptions {
  pauseThresholdMs: number;
  minSignDurationMs: number;
}

export interface BufferState {
  currentWord: string;
  sentence: string[];
  sentenceText: string;
}

export class WordBuffer {
  private currentWord = "";

  private sentence: string[] = [];

  private lastSign: string | null = null;

  private lastSignTime = 0;

  private lastInitialSignTime = 0;

  private doubleLetterCommitted = false;

  private options: WordBufferOptions;

  constructor(options: Partial<WordBufferOptions> = {}) {
    this.options = {
      pauseThresholdMs: 1000,
      minSignDurationMs: 200,
      ...options,
    };
  }

  update(sign: string | null): string | null {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (sign && sign !== this.lastSign) {
      // Small buffer to avoid jitter
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
      // Double-letter detection: if held for > 1.5s
      if (!this.doubleLetterCommitted && now - this.lastInitialSignTime > 1500) {
        this.currentWord += sign;
        this.doubleLetterCommitted = true;
      }
      this.lastSignTime = now;
      return null;
    }

    if (this.currentWord && now - this.lastSignTime > this.options.pauseThresholdMs) {
      return this.commitWord();
    }

    return null;
  }

  forceCommit(): string | null {
    return this.commitWord();
  }

  private commitWord(): string | null {
    if (!this.currentWord) {
      return null;
    }

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
