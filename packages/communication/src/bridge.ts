import { getAudioFileExtension } from "./capture/audio-utils";
import { buildPlanFromUnits, createEnvelope } from "@sensa/engine/planning";
import type {
  CommunicationMode,
  SttModel,
  TranslationContext,
  TranslationEnvelope,
} from "@sensa/engine/types";
import type { CaptureAdapter, CaptureSession, CaptureStatus } from "./capture/types";

export interface TranslateOptions {
  mode: CommunicationMode;
  text?: string;
  audio?: Blob;
  sttModel?: SttModel;
  units?: string[];
  context?: TranslationContext;
}

/**
 * The CommunicationBridge is the high-leverage interface for the product UI.
 * It serves as the single entry point for all communication tracks (speech, text, signs).
 *
 * Key Responsibilities:
 * 1. Orchestrating translation requests to the server.
 * 2. Managing conversation context and turn history.
 * 3. Providing local 'preview' plans for instant UI feedback.
 * 4. Handling the lifecycle of sensory CaptureAdapters.
 *
 * By encapsulating these concerns, it allows the UI to remain distilled and
 * focused on layout and user interaction.
 */
export class CommunicationBridge {
  constructor(private baseUrl: string) {}

  /**
   * Orchestrates a sensory capture session.
   * Deepens the bridge by managing the lifecycle of CaptureAdapters.
   */
  async startCapture(
    adapter: CaptureAdapter,
    context?: TranslationContext,
  ): Promise<CaptureSession> {
    let currentStatus: CaptureStatus = "idle";
    let currentLevel = 0;
    const subscribers = new Set<(state: { status: CaptureStatus; level: number }) => void>();

    const notify = () => {
      subscribers.forEach((cb) => cb({ status: currentStatus, level: currentLevel }));
    };

    adapter.onStatus((s) => {
      currentStatus = s;
      notify();
    });

    if (adapter.onLevel) {
      adapter.onLevel((l) => {
        currentLevel = l;
        notify();
      });
    }

    await adapter.start();

    return {
      stop: async () => {
        const data = await adapter.stop();
        return this.translate({
          mode: adapter.mode,
          audio: adapter.mode === "speech" ? data : undefined,
          text: adapter.mode === "text" ? (typeof data === "string" ? data : undefined) : undefined,
          units:
            adapter.mode === "sign-keys" ? (Array.isArray(data) ? data : undefined) : undefined,
          context,
        });
      },
      cancel: () => {
        adapter.reset();
        subscribers.clear();
      },
      subscribe: (cb) => {
        subscribers.add(cb);
        cb({ status: currentStatus, level: currentLevel });
        return () => subscribers.delete(cb);
      },
      get status() {
        return currentStatus;
      },
      get level() {
        return currentLevel;
      },
    };
  }

  async translate(options: TranslateOptions): Promise<TranslationEnvelope> {
    if (options.mode === "speech") {
      if (!options.audio) throw new Error("Audio is required for speech mode.");
      return this.translateSpeech(
        options.audio,
        options.sttModel ?? "whisper-large-v3",
        options.context,
      );
    }

    if (options.mode === "text") {
      if (!options.text) throw new Error("Text is required for text mode.");
      return this.translateText(options.text, options.context);
    }

    if (options.mode === "sign-keys") {
      if (!options.units) throw new Error("Units are required for sign-keys mode.");
      return this.translateSign(options.units);
    }

    throw new Error(`Unsupported communication mode: ${options.mode}`);
  }

  /**
   * Generates a local preview envelope for a manual sign sequence.
   * This allows the UI to show a pipeline view without committing.
   */
  previewSignPlan(units: string[]): TranslationEnvelope {
    const plan = buildPlanFromUnits(units);
    return createEnvelope(plan, {
      mode: "sign-keys",
      rawInput: units.join(" "),
    });
  }

  /**
   * Helper to build translation context from conversation history.
   * Deepens the bridge by encapsulating the "how" of context windowing.
   */
  buildContext(
    entries: Array<{ track: string; normalized: string }>,
    locale = "en-US",
  ): TranslationContext {
    return {
      locale,
      previousTurns: entries.slice(-4).map((entry) => ({
        role: entry.track === "semantic" ? "hearing" : "signer",
        text: entry.normalized,
      })),
    };
  }

  private async translateText(
    text: string,
    context?: TranslationContext,
  ): Promise<TranslationEnvelope> {
    const response = await fetch(`${this.baseUrl}/api/communication/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "text", text, context }),
    });
    return this.readEnvelope(response);
  }

  private async translateSpeech(
    audio: Blob,
    sttModel: SttModel,
    context?: TranslationContext,
  ): Promise<TranslationEnvelope> {
    const formData = new FormData();
    const extension = getAudioFileExtension(audio.type);

    formData.append("audio", new File([audio], `speech-intake.${extension}`, { type: audio.type }));
    formData.append("mode", "speech");
    formData.append("sttModel", sttModel);
    if (context) formData.append("context", JSON.stringify(context));

    const response = await fetch(`${this.baseUrl}/api/communication/translate`, {
      method: "POST",
      body: formData,
    });
    return this.readEnvelope(response);
  }

  private async translateSign(units: string[]): Promise<TranslationEnvelope> {
    // Deterministic client-side "translation" for manual sign keys
    // In a real app, this might still go to the server for normalization or metadata
    const response = await fetch(`${this.baseUrl}/api/communication/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "sign-keys", text: units.join(" ") }),
    });
    return this.readEnvelope(response);
  }

  private async readEnvelope(response: Response): Promise<TranslationEnvelope> {
    if (response.ok) {
      return (await response.json()) as TranslationEnvelope;
    }
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Request failed with ${response.status}.`);
  }
}
