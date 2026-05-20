export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceName?: string;
  lang?: string;
}

export class WebSpeechProvider {
  private static instance: WebSpeechProvider | null = null;
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof globalThis !== "undefined" && "speechSynthesis" in globalThis) {
      this.synth = globalThis.speechSynthesis;
    }
  }

  static getInstance(): WebSpeechProvider {
    if (!WebSpeechProvider.instance) {
      WebSpeechProvider.instance = new WebSpeechProvider();
    }
    return WebSpeechProvider.instance;
  }

  static isSupported(): boolean {
    return typeof globalThis !== "undefined" && "speechSynthesis" in globalThis;
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.synth?.getVoices() ?? [];
  }

  speak(text: string, options: SpeakOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error("Speech synthesis not supported"));
        return;
      }

      this.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;
      utterance.volume = options.volume ?? 1.0;
      utterance.lang = options.lang ?? "en-US";

      if (options.voiceName) {
        const voice = this.getVoices().find((v) => v.name === options.voiceName);
        if (voice) utterance.voice = voice;
      }

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };
      utterance.onerror = (event) => {
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis failed: ${event.error}`));
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  async speakQueue(texts: string[], options: SpeakOptions = {}): Promise<void> {
    for (const text of texts) await this.speak(text, options);
  }

  cancel(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  isSpeaking(): boolean {
    return this.synth?.speaking ?? false;
  }

  onBoundary(callback: (event: SpeechSynthesisEvent) => void): void {
    if (this.currentUtterance) {
      this.currentUtterance.onboundary = callback;
    }
  }

  dispose(): void {
    this.cancel();
    WebSpeechProvider.instance = null;
  }
}
