import { Effect, Layer } from "effect";
import { SttService } from "@ikiraro/engine/planning";
import { Groq } from "./client";
import { Schema } from "effect";
import { STT_RESPONSE_SCHEMA } from "./schemas";
import type { SttModel, SpeechIntake } from "@ikiraro/engine/types";
const DEFAULT_GROQ_STT_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
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
            Effect.mapError(() => new Error("Invalid STT response format")),
          );

          return {
            model,
            text: payload.text?.trim() ?? "",
            language: payload.language ?? null,
            durationSeconds: payload.duration ?? null,
            prompt: prompt ?? "",
            words:
              payload.words?.map((w) => ({
                word: w.word,
                start: w.start,
                end: w.end,
                confidence: w.confidence,
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
