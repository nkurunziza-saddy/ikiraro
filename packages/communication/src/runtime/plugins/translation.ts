import { ManagedRuntime } from "effect";
import type { SensaPlugin, PluginContext, SensaEvent } from "../types";
import { SensaSDK } from "../../sdk";
import { buildPlanFromUnits, createEnvelope } from "@sensa/engine/planning";
import { getAudioFileExtension } from "../../capture/audio-utils";
import type {
  TranslationEnvelope,
  SttModel,
  TranslationContext,
  CommunicationMode,
} from "@sensa/engine/types";

export interface TranslationState {
  lastEnvelope?: TranslationEnvelope;
  isTranslating: boolean;
  error?: string;
}

/**
 * The TranslationPlugin deepens the runtime by owning the local-first
 * translation lifecycle using Effect.
 */
export class TranslationPlugin implements SensaPlugin<TranslationState> {
  name = "translation";
  initialState: TranslationState = { isTranslating: false };
  private effectRuntime?: ManagedRuntime.ManagedRuntime<any, never>;

  setup(ctx: PluginContext<TranslationState>) {
    // We assume the user provides the Groq layer in the global context or via factory
    // For now, we'll initialize it if config is available
    if (ctx.config.sdk) {
      this.effectRuntime = ManagedRuntime.make(SensaSDK.makeLayer(ctx.config.sdk));
    }

    // Listen for translation commands
    ctx.subscribe("translation:cmd:request", async (event) => {
      await this.handleTranslationRequest(event.payload, ctx);
    });
  }

  reducer(state: TranslationState, event: SensaEvent): TranslationState {
    switch (event.type) {
      case "translation:started":
        return { ...state, isTranslating: true, error: undefined };
      case "translation:finished":
        return { ...state, isTranslating: false, lastEnvelope: event.payload };
      case "translation:error":
        return { ...state, isTranslating: false, error: event.payload };
      default:
        return state;
    }
  }

  private async handleTranslationRequest(
    options: {
      mode: CommunicationMode;
      text?: string;
      audio?: Blob;
      units?: string[];
      sttModel?: SttModel;
      context?: TranslationContext;
    },
    ctx: PluginContext<TranslationState>,
  ) {
    if (!this.effectRuntime) {
      ctx.emit({
        type: "translation:error",
        payload: "SDK not configured",
        timestamp: Date.now(),
        source: this.name,
      });
      return;
    }

    ctx.emit({
      type: "translation:started",
      payload: options,
      timestamp: Date.now(),
      source: this.name,
    });

    try {
      let envelope: TranslationEnvelope;

      if (options.mode === "speech" && options.audio) {
        const ext = getAudioFileExtension(options.audio.type);
        const file = new File([options.audio], `speech.${ext}`, { type: options.audio.type });
        envelope = await this.effectRuntime.runPromise(
          SensaSDK.translateSpeech(file, options.sttModel),
        );
      } else if (options.mode === "text" && options.text) {
        envelope = await this.effectRuntime.runPromise(SensaSDK.translateText(options.text));
      } else if (options.mode === "sign-keys" && options.units) {
        // Deterministic local plan
        const plan = buildPlanFromUnits(options.units);
        envelope = createEnvelope(plan, {
          mode: "sign-keys",
          rawInput: options.units.join(" "),
        });
      } else {
        throw new Error(`Unsupported or invalid translation request: ${options.mode}`);
      }

      ctx.emit({
        type: "translation:finished",
        payload: envelope,
        timestamp: Date.now(),
        source: this.name,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Translation failed";
      ctx.emit({
        type: "translation:error",
        payload: message,
        timestamp: Date.now(),
        source: this.name,
      });
    }
  }
}
