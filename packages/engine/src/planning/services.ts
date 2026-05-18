import { Context, Effect } from "effect";
import type { SpeechIntake, SttModel, SemanticIntent } from "../types";

// ─── STT Service ─────────────────────────────────────────────────────────────

export interface SttService {
  readonly transcribe: (
    audio: File,
    model: SttModel,
    prompt?: string,
  ) => Effect.Effect<SpeechIntake, Error>;
}

export const SttService = Context.GenericTag<SttService>("@sensa/engine/SttService");

// ─── Gloss Service ────────────────────────────────────────────────────────────

export interface GlossService {
  readonly generate: (text: string, model?: string) => Effect.Effect<SemanticIntent, Error>;
}

export const GlossService = Context.GenericTag<GlossService>("@sensa/engine/GlossService");
