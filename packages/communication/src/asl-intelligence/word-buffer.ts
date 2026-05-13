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

  private options: WordBufferOptions;

  constructor(options: Partial<WordBufferOptions> = {}) {
    this.options = {
      pauseThresholdMs: 1000,
      minSignDurationMs: 200,
      ...options,
    };
  }

  update(sign: string | null): string | null {
    const now = Date.now();

    if (sign && sign !== this.lastSign) {
      if (now - this.lastSignTime > this.options.minSignDurationMs) {
        this.currentWord += sign;
        this.lastSign = sign;
        this.lastSignTime = now;
      }

      return null;
    }

    if (sign && sign === this.lastSign) {
      this.lastSignTime = now;
      return null;
    }

    if (this.currentWord && now - this.lastSignTime > this.options.pauseThresholdMs) {
      return this.commitWord();
    }

    return null;
  }

  private commitWord(): string | null {
    if (!this.currentWord) {
      return null;
    }

    const word = this.currentWord;
    this.sentence.push(word);
    this.currentWord = "";
    this.lastSign = null;
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
  }

  clearAll(): void {
    this.currentWord = "";
    this.sentence = [];
    this.lastSign = null;
    this.lastSignTime = 0;
  }
}
