import { Effect } from "effect";
import type { SpeechIntake, SttModel } from "../types";
import { Groq } from "./groq-client";

const DEFAULT_GROQ_STT_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

type GroqWhisperResponse = {
  text?: string;
  language?: string;
  duration?: number;
  words?: Array<{ word: string; start: number; end: number; confidence?: number }>;
  segments?: Array<{ id?: number; start?: number; end?: number; text?: string }>;
};

export const transcribeAudio = (audio: File, model: SttModel, prompt?: string) =>
  Effect.gen(function* (_) {
    const { apiKey, baseUrl } = yield* _(Groq);
    const url = baseUrl ? `${baseUrl}/audio/transcriptions` : DEFAULT_GROQ_STT_URL;

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
            headers: { Authorization: `Bearer ${apiKey}` },
            body: formData,
          }),
        catch: () => new Error("STT Fetch failed"),
      }),
    );

    if (!response.ok) {
      const errorText = yield* _(
        Effect.tryPromise({
          try: () => response.text(),
          catch: () => "Unknown error",
        }),
      );
      return yield* _(Effect.fail(new Error(errorText || `Groq STT returned ${response.status}`)));
    }

    const payload = (yield* _(
      Effect.tryPromise({
        try: () => response.json(),
        catch: () => new Error("STT JSON parsing failed"),
      }),
    )) as GroqWhisperResponse;

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
    } as SpeechIntake;
  });
