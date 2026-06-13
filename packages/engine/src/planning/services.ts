import { Context, type Effect } from "effect";
import type { SemanticIntent, SpeechIntake, SttModel } from "../types";

export interface SttService {
  readonly transcribe: (
    audio: File,
    model: SttModel,
    prompt?: string,
  ) => Effect.Effect<SpeechIntake, Error>;
}
export const SttService = Context.GenericTag<SttService>("@ikiraro/engine/SttService");

export interface GlossService {
  readonly generate: (text: string, model?: string) => Effect.Effect<SemanticIntent, Error>;
}
export const GlossService = Context.GenericTag<GlossService>("@ikiraro/engine/GlossService");
