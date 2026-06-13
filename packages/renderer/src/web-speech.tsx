import { type AudioQueue, EarconPlayer } from "@ikiraro/runtime";
import type React from "react";
import { createContext, useContext, useEffect, useRef } from "react";

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
  voice?: SpeechSynthesisVoice;
  /**
   * If provided, the audio playback speed will be adjusted (playbackRate)
   * to attempt to fit the audio into this duration.
   */
  targetDurationMs?: number;
}

class WebSpeechProvider {
  private static instance: WebSpeechProvider;
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  // Cloud TTS properties
  private config: TTSConfig = { provider: "browser" };
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private cloudSpeaking = false;
  private queueActive = false;

  private constructor() {
    if (typeof window !== "undefined") {
      this.synth = window.speechSynthesis;
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
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
    }
  }

  static isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.synth?.getVoices() ?? [];
  }

  /**
   * Speak text using configured provider (Browser, OpenAI, or ElevenLabs).
   */
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
      const voiceId = this.config.voiceId || "pNInz6obpgDQGcFmaJgB"; // Adam
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
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error(`[Ikiraro:TTS] ElevenLabs ${res.status}:`, errText);
        throw new Error(`ElevenLabs TTS failed (HTTP ${res.status})`);
      }

      const arrayBuffer = await res.arrayBuffer();
      if (!this.cloudSpeaking) return;
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

      const res = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({ model, input: text, voice }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error(`[Ikiraro:TTS] OpenAI ${res.status}:`, errText);
        throw new Error(`OpenAI TTS failed (HTTP ${res.status})`);
      }

      const arrayBuffer = await res.arrayBuffer();
      if (!this.cloudSpeaking) return;
      await this.playAudioBuffer(arrayBuffer, options);
    } catch (err) {
      console.error("[Ikiraro:TTS] OpenAI speech failed:", err);
      throw err;
    } finally {
      this.cloudSpeaking = false;
    }
  }

  cancel() {
    this.queueActive = false;
    this.cloudSpeaking = false;
    this.synth?.cancel();
    this.currentUtterance = null;
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // Source might already be stopped
      }
      this.currentSource = null;
    }
  }

  async playEarcon(type: Parameters<EarconPlayer["play"]>[0]): Promise<void> {
    EarconPlayer.getInstance().play(type);
  }

  /**
   * Experimental: Play pre-rendered audio buffer (e.g. from an API).
   */
  async playBuffer(arrayBuffer: ArrayBuffer, options?: SpeakOptions): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (this.audioContext!.state === "suspended") {
      await this.audioContext!.resume();
    }

    return this.playAudioBuffer(arrayBuffer, options);
  }

  private async playAudioBuffer(arrayBuffer: ArrayBuffer, options?: SpeakOptions): Promise<void> {
    if (!this.audioContext) return;
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    return new Promise((resolve) => {
      const source = this.audioContext!.createBufferSource();
      source.buffer = audioBuffer;

      if (options?.targetDurationMs && options.targetDurationMs > 0) {
        const audioDurationMs = audioBuffer.duration * 1000;
        const playbackRate = audioDurationMs / options.targetDurationMs;
        source.playbackRate.value = playbackRate;
        if ("preservesPitch" in source) {
          (source as any).preservesPitch = true;
        }
      }

      source.connect(this.audioContext!.destination);
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
      } else if (options.voice) {
        utterance.voice = options.voice;
      }

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };
      utterance.onerror = (e) => {
        this.currentUtterance = null;
        reject(e);
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
    WebSpeechProvider.instance = null as any;
  }
}

const WebSpeechContext = createContext<WebSpeechProvider | null>(null);

export const WebSpeechProviderComponent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const provider = WebSpeechProvider.getInstance();
  return <WebSpeechContext.Provider value={provider}>{children}</WebSpeechContext.Provider>;
};

export const useWebSpeech = () => {
  const context = useContext(WebSpeechContext);
  if (!context) {
    throw new Error("useWebSpeech must be used within a WebSpeechProvider");
  }
  return context;
};

/**
 * Hook to bridge the Ikiraro Runtime's AudioQueue with the browser's Speech API.
 */
export const useAudioQueueBridge = (queue: AudioQueue) => {
  const speech = useWebSpeech();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;

    queue.setDriver({
      speak: (text: string) => speech.speak(text),
      cancel: () => speech.cancel(),
    });

    isInitialized.current = true;
  }, [queue, speech]);
};

export { WebSpeechProvider };
