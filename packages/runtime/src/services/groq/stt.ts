import { SttService } from "@ikiraro/engine/planning";
import type { SpeechIntake, SttModel } from "@ikiraro/engine/types";
import { Effect, Layer, Schema } from "effect";
import { Groq } from "./client";
import { STT_RESPONSE_SCHEMA } from "./schemas";

const DEFAULT_GROQ_STT_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

/**
 * Groq implementation of the STT service.
 * Leverages the fast Whisper models on Groq for sub-second transcription.
 */
export const SttGroqLive = Layer.effect(
  SttService,
  Effect.gen(function* (_) {
    const groq = yield* _(Groq);

    return {
      transcribe: (audio: File, model: SttModel, prompt?: string) =>
        Effect.gen(function* (_) {
          const url = groq.baseUrl ? `${groq.baseUrl}/audio/transcriptions` : DEFAULT_GROQ_STT_URL;

          const formData = new FormData();
          formData.append("file", audio);
          formData.append("model", model);
          formData.append("language", "en");
          formData.append("temperature", "0");
          formData.append("response_format", "verbose_json");

          // Request both word and segment level timestamps for better synchronization
          formData.append("timestamp_granularities[]", "word");
          formData.append("timestamp_granularities[]", "segment");

          if (prompt) {
            formData.append("prompt", prompt);
          }

          const response = yield* _(
            Effect.tryPromise({
              try: () =>
                fetch(url, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${groq.apiKey}` },
                  body: formData,
                }),
              catch: (e) => (e instanceof Error ? e : new Error(String(e))),
            }),
          );

          if (!response.ok) {
            const errorText = yield* _(
              Effect.tryPromise({
                try: () => response.text(),
                catch: () => "Unknown error",
              }),
            );
            return yield* _(
              Effect.fail(new Error(errorText || `Groq STT returned ${response.status}`)),
            );
          }

          const rawPayload = yield* _(
            Effect.tryPromise({
              try: () => response.json() as Promise<unknown>,
              catch: (e) => (e instanceof Error ? e : new Error(String(e))),
            }),
          );

          const payload = yield* _(
            Schema.decodeUnknown(STT_RESPONSE_SCHEMA)(rawPayload),
            Effect.mapError((err) => {
              console.error("[Ikiraro:STT] Schema validation failed:", err);
              return new Error("Invalid STT response format");
            }),
          );

          return {
            model,
            text: payload.text?.trim() ?? "",
            language: payload.language ?? null,
            durationSeconds: payload.duration ?? null,
            prompt: prompt ?? "",
            words:
              payload.words?.map((w) => ({
                word: w.word ?? "",
                start: w.start ?? 0,
                end: w.end ?? 0,
                confidence: w.confidence ?? 1.0,
              })) ?? [],
            segments:
              payload.segments?.map((s, i) => ({
                id: s.id ?? i,
                start: s.start ?? 0,
                end: s.end ?? 0,
                text: s.text?.trim() ?? "",
              })) ?? [],
          } satisfies SpeechIntake;
        }).pipe(Effect.mapError((e) => (e instanceof Error ? e : new Error(String(e))))),
    };
  }),
);
