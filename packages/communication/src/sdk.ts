import { Effect } from "effect";
import {
  makeGroqLayer,
  generateGloss,
  transcribeAudio,
  buildPlanFromGloss,
  createEnvelope,
} from "@sensa/engine/planning";
import type { SttModel } from "@sensa/engine/types";

export interface SensaConfig {
  readonly groqApiKey: string;
  readonly groqBaseUrl?: string;
}

export class SensaSDK {
  static translateText = (text: string) =>
    Effect.gen(function* () {
      const intent = yield* generateGloss(text);
      const plan = buildPlanFromGloss(intent);

      return createEnvelope(plan, {
        mode: "text",
        rawInput: text,
        intent,
      });
    });

  static translateSpeech = (audio: File, model: SttModel = "whisper-large-v3", prompt?: string) =>
    Effect.gen(function* () {
      const intake = yield* transcribeAudio(audio, model, prompt);
      const intent = yield* generateGloss(intake.text);
      const plan = buildPlanFromGloss(intent);

      return createEnvelope(plan, {
        mode: "speech",
        intake,
        rawInput: intake.text,
        intent,
      });
    });

  static makeLayer = (config: SensaConfig) =>
    makeGroqLayer({
      apiKey: config.groqApiKey,
      baseUrl: config.groqBaseUrl,
    });
}
