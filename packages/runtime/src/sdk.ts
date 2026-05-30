import { Effect, Layer } from "effect";
import {
  buildPlanFromGloss,
  createEnvelope,
  SttService,
  GlossService,
} from "@ikiraro/engine/planning";
import type { SttModel } from "@ikiraro/engine/types";
import { SttGroqLive } from "./services/groq/stt";
import { GlossGroqLive } from "./services/groq/gloss";

export interface IkiraroConfig {
  readonly groqApiKey: string;
  readonly groqBaseUrl?: string;
}

/** @internal */
export const translateTextEffect = (text: string) =>
  Effect.gen(function* (_) {
    const gloss = yield* _(GlossService);
    const intent = yield* _(gloss.generate(text));
    const plan = buildPlanFromGloss(intent);
    return createEnvelope(plan, {
      mode: "text",
      rawInput: text,
      intent,
    });
  });

/** @internal */
export const translateSpeechEffect = (
  audio: File,
  model: SttModel = "whisper-large-v3",
  prompt?: string,
) =>
  Effect.gen(function* (_) {
    const stt = yield* _(SttService);
    const gloss = yield* _(GlossService);
    const intake = yield* _(stt.transcribe(audio, model, prompt));
    const intent = yield* _(gloss.generate(intake.text));
    const plan = buildPlanFromGloss(intent, intake);
    return createEnvelope(plan, {
      mode: "speech",
      intake,
      rawInput: intake.text,
      intent,
    });
  });

/** @internal */
export const makeGroqLayer = (config: IkiraroConfig) => {
  const groq = makeGroqLayerBase({
    apiKey: config.groqApiKey,
    baseUrl: config.groqBaseUrl,
  });
  return Layer.mergeAll(SttGroqLive, GlossGroqLive).pipe(Layer.provide(groq));
};

// Rename the imported makeGroqLayer to avoid collision
import { makeGroqLayer as makeGroqLayerBase } from "./services/groq/client";
