export type TTSProvider = "browser" | "openai" | "elevenlabs";

export interface TTSConfig {
  provider: TTSProvider;
  apiKey?: string;
  voiceId?: string;
  model?: string;
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceName?: string;
  lang?: string;
  targetDurationMs?: number;
}

export class WebSpeechProvider {
  private static instance: WebSpeechProvider | null = null;
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  // Cloud TTS properties
  private config: TTSConfig = { provider: "browser" };
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private cloudSpeaking = false;
  private queueActive = false;

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

  setConfig(config: Partial<TTSConfig>) {
    this.config = { ...this.config, ...config };
    if (this.config.provider !== "browser" && typeof window !== "undefined" && !this.audioContext) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioContextClass();
    }
  }

  static isSupported(): boolean {
    return typeof globalThis !== "undefined" && "speechSynthesis" in globalThis;
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.synth?.getVoices() ?? [];
  }

  async speak(text: string, options: SpeakOptions = {}): Promise<void> {
    this.cancel();

    if (this.config.provider === "elevenlabs" && this.config.apiKey) {
      return this.speakElevenLabs(text, options);
    }
    if (this.config.provider === "openai" && this.config.apiKey) {
      return this.speakOpenAI(text, options);
    }

    return this.speakBrowser(text, options);
  }

  private async speakElevenLabs(text: string, options: SpeakOptions): Promise<void> {
    this.cloudSpeaking = true;
    try {
      // Default to Adam (a free core male voice) if no voiceId provided
      const voiceId = this.config.voiceId || "pNInz6obpgDQGcFmaJgB";
      const modelId = this.config.model || "eleven_multilingual_v2";

      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": this.config.apiKey!,
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error(`[Ikiraro:TTS] ElevenLabs ${res.status}:`, errText);
        throw new Error(`ElevenLabs TTS failed (HTTP ${res.status})`);
      }

      const arrayBuffer = await res.arrayBuffer();
      if (!this.cloudSpeaking) return; // cancelled during fetch
      await this.playAudioBuffer(arrayBuffer, options);
    } catch (err) {
      console.error("[Ikiraro:TTS] ElevenLabs speech failed:", err);
      throw err;
    } finally {
      this.cloudSpeaking = false;
    }
  }

  private async speakOpenAI(text: string, options: SpeakOptions): Promise<void> {
    this.cloudSpeaking = true;
    try {
      const voice = this.config.voiceId || "alloy";
      const model = this.config.model || "tts-1";

      const res = await fetch(`https://api.openai.com/v1/audio/speech`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: text,
          voice,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error(`[Ikiraro:TTS] OpenAI ${res.status}:`, errText);
        throw new Error(`OpenAI TTS failed (HTTP ${res.status})`);
      }

      const arrayBuffer = await res.arrayBuffer();
      if (!this.cloudSpeaking) return; // cancelled during fetch
      await this.playAudioBuffer(arrayBuffer, options);
    } catch (err) {
      console.error("[Ikiraro:TTS] OpenAI speech failed:", err);
      throw err;
    } finally {
      this.cloudSpeaking = false;
    }
  }

  private async playAudioBuffer(arrayBuffer: ArrayBuffer, options?: SpeakOptions): Promise<void> {
    if (!this.audioContext) return;
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    return new Promise((resolve) => {
      const source = this.audioContext?.createBufferSource();
      source.buffer = audioBuffer;

      if (options?.targetDurationMs && options.targetDurationMs > 0) {
        const audioDurationMs = audioBuffer.duration * 1000;
        // Calculate required playback rate to make audio match the target duration
        const playbackRate = audioDurationMs / options.targetDurationMs;
        source.playbackRate.value = playbackRate;
        // Attempt to preserve pitch in modern browsers
        if ("preservesPitch" in source) {
          (source as unknown as { preservesPitch: boolean }).preservesPitch = true;
        }
      }

      source.connect(this.audioContext?.destination);
      source.onended = () => {
        this.currentSource = null;
        resolve();
      };
      this.currentSource = source;
      source.start();
    });
  }

  private speakBrowser(text: string, options: SpeakOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error("Speech synthesis not supported"));
        return;
      }
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
    this.queueActive = true;
    try {
      for (const text of texts) {
        if (!this.queueActive) break;
        await this.speak(text, options);
      }
    } finally {
      this.queueActive = false;
    }
  }

  cancel(): void {
    this.queueActive = false;
    this.cloudSpeaking = false;
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        console.warn("Failed to stop audio source");
      }
      this.currentSource = null;
    }
  }

  isSpeaking(): boolean {
    return this.cloudSpeaking || (this.synth?.speaking ?? false);
  }

  onBoundary(callback: (event: SpeechSynthesisEvent) => void): void {
    if (this.currentUtterance) {
      this.currentUtterance.onboundary = callback;
    }
  }

  dispose(): void {
    this.cancel();
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
    }
    WebSpeechProvider.instance = null;
  }
}
