import { type AudioQueue, EarconPlayer } from "@ikiraro/runtime";
import type React from "react";
import { createContext, useContext, useEffect, useRef } from "react";

export interface SpeakOptions {
  pitch?: number;
  rate?: number;
  volume?: number;
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
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;

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

  /**
   * Speak text using the browser's native Speech Synthesis API.
   * Note: This is a fallback if no ElevenLabs/OpenAI TTS is configured.
   */
  async speak(text: string, options: SpeakOptions = {}): Promise<void> {
    // If it looks like an ElevenLabs/OpenAI byte stream or URL, we might handle it differently.
    // For now, we assume this provider is only for native SpeechSynthesis.
    return this.speakBrowser(text, options);
  }

  cancel() {
    this.synth?.cancel();
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
  }

  async playEarcon(type: Parameters<EarconPlayer["play"]>[0]): Promise<void> {
    EarconPlayer.getInstance().play(type);
  }

  /**
   * Experimental: Play pre-rendered audio buffer (e.g. from an API).
   * This allows for high-quality TTS like ElevenLabs while still being
   * managed by the Ikiraro AudioQueue.
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
        // Calculate required playback rate to make audio match the target duration
        const playbackRate = audioDurationMs / options.targetDurationMs;
        source.playbackRate.value = playbackRate;
        // Attempt to preserve pitch in modern browsers
        if ("preservesPitch" in source) {
          (source as unknown as { preservesPitch: boolean }).preservesPitch = true;
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
      if (options.pitch) utterance.pitch = options.pitch;
      if (options.rate) utterance.rate = options.rate;
      if (options.volume) utterance.volume = options.volume;
      if (options.voice) utterance.voice = options.voice;

      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);

      this.synth.speak(utterance);
    });
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
 * Should be mounted once at the root of the app.
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
